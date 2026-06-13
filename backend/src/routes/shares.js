import crypto from 'crypto';
import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { evaluateInstitutionalPublishability, scoreExpedient } from '../services/scoringEngine.js';
import { logAuditEvent } from '../utils/audit.js';

const router = express.Router();

async function assertOrderOwner(orderId, userId) {
  const { data, error } = await supabaseAdmin
    .from('service_orders')
    .select()
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error('Expediente no encontrado o sin permisos');
  }

  return data;
}

async function buildShareReadiness(order, matrixKey) {
  const [{ data: documents, error: documentsError }, { data: reviews, error: reviewsError }] = await Promise.all([
    supabaseAdmin
      .from('documents')
      .select()
      .eq('order_id', order.id)
      .order('uploaded_at', { ascending: false }),
    supabaseAdmin
      .from('document_reviews')
      .select()
      .eq('order_id', order.id)
      .order('created_at', { ascending: false })
  ]);

  if (documentsError) throw documentsError;
  if (reviewsError) throw reviewsError;

  const scoring = scoreExpedient({
    order,
    documents: documents || [],
    reviews: reviews || [],
    matrixKey
  });

  return {
    scoring,
    publishability: evaluateInstitutionalPublishability(scoring, order)
  };
}

router.get('/data-room-share-readiness/:orderId', authMiddleware, requirePermission('data_room:own:read'), async (req, res) => {
  try {
    const order = await assertOrderOwner(req.params.orderId, req.userId);
    const readiness = await buildShareReadiness(order, req.query?.matrixKey);
    res.json(readiness);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/data-room-shares', authMiddleware, requirePermission('data_room:own:share'), async (req, res) => {
  const { orderId, recipientName, recipientEmail } = req.body;

  try {
    if (!orderId || !recipientName) {
      return res.status(400).json({ error: 'orderId y recipientName son requeridos' });
    }

    const order = await assertOrderOwner(orderId, req.userId);
    const { publishability } = await buildShareReadiness(order, req.body?.matrixKey);

    if (!publishability.canPublish) {
      return res.status(409).json({
        error: 'El expediente aun no esta listo para compartirse con otorgantes',
        publishability
      });
    }

    const accessToken = crypto.randomBytes(24).toString('hex');

    const payload = {
      order_id: orderId,
      owner_user_id: req.userId,
      recipient_name: recipientName,
      recipient_email: recipientEmail || null,
      status: 'invited',
      access_token: accessToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    let { data, error } = await supabaseAdmin
      .from('data_room_shares')
      .insert([payload])
      .select()
      .single();

    if (error?.message?.includes('expires_at')) {
      const { expires_at, ...compatiblePayload } = payload;
      const fallback = await supabaseAdmin
        .from('data_room_shares')
        .insert([{ ...compatiblePayload, status: 'shared' }])
        .select()
        .single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;

    await logAuditEvent({
      userId: req.userId,
      action: 'data_room_shared',
      entityType: 'data_room_share',
      entityId: data.id,
      orderId,
      req,
      metadata: {
        recipientName,
        recipientEmail: recipientEmail || null,
        status: data.status,
        publishability
      }
    });

    res.json({
      ...data,
      shareUrl: `/shared-data-room/${accessToken}`
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/data-room-shares/:token/accept', authMiddleware, requirePermission('data_room:authorized:read'), async (req, res) => {
  try {
    let { data: share, error: shareError } = await supabaseAdmin
      .from('data_room_shares')
      .select('id, order_id, recipient_email, status, expires_at')
      .eq('access_token', req.params.token)
      .single();

    if (shareError?.message?.includes('expires_at')) {
      const fallback = await supabaseAdmin
        .from('data_room_shares')
        .select('id, order_id, recipient_email, status')
        .eq('access_token', req.params.token)
        .single();
      share = fallback.data;
      shareError = fallback.error;
    }

    if (shareError || !share) {
      return res.status(404).json({ error: 'Invitacion no encontrada' });
    }

    if (share.expires_at && new Date(share.expires_at).getTime() < Date.now()) {
      return res.status(410).json({ error: 'Invitacion expirada' });
    }

    const authenticatedEmail = String(req.user?.email || '').toLowerCase();
    const recipientEmail = String(share.recipient_email || '').toLowerCase();

    if (recipientEmail && authenticatedEmail !== recipientEmail) {
      return res.status(403).json({ error: 'Esta invitacion pertenece a otro correo' });
    }

    let { data: updatedShare, error: updateError } = await supabaseAdmin
      .from('data_room_shares')
      .update({
        recipient_user_id: req.userId,
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', share.id)
      .select('id, order_id, recipient_name, recipient_email, status, accepted_at')
      .single();

    if (updateError?.message?.includes('recipient_user_id') || updateError?.message?.includes('accepted_at')) {
      const fallback = await supabaseAdmin
        .from('data_room_shares')
        .update({ status: 'shared' })
        .eq('id', share.id)
        .select('id, order_id, recipient_name, recipient_email, status')
        .single();
      updatedShare = fallback.data;
      updateError = fallback.error;
    }

    if (updateError) throw updateError;

    await logAuditEvent({
      userId: req.userId,
      action: 'data_room_invitation_accepted',
      entityType: 'data_room_share',
      entityId: share.id,
      orderId: share.order_id,
      req,
      metadata: {
        recipientEmail: share.recipient_email,
        status: updatedShare.status
      }
    });

    res.json(updatedShare);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/data-room-shares/:orderId', authMiddleware, requirePermission('data_room:own:read'), async (req, res) => {
  try {
    await assertOrderOwner(req.params.orderId, req.userId);

    const { data, error } = await supabaseAdmin
      .from('data_room_shares')
      .select()
      .eq('order_id', req.params.orderId)
      .eq('owner_user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/shared-data-room/:token', async (req, res) => {
  try {
    const { data: share, error: shareError } = await supabaseAdmin
      .from('data_room_shares')
      .select('id, order_id, owner_user_id, recipient_user_id, recipient_name, recipient_email, status, created_at, accepted_at, expires_at, last_viewed_at')
      .eq('access_token', req.params.token)
      .single();

    if (shareError || !share) {
      return res.status(404).json({ error: 'Data room no encontrado' });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('service_orders')
      .select('id, service_type, status, amount, created_at, metadata, case_number, project_name, applicant_type, requested_amount, funding_purpose, stage, risk_level, readiness_grade, compliance_status')
      .eq('id', share.order_id)
      .single();

    if (orderError) throw orderError;

    let { data: documents, error: documentsError } = await supabaseAdmin
      .from('documents')
      .select('id, filename, storage_path, uploaded_at, document_type, review_status, version_number, is_blocking, expires_at, metadata')
      .eq('order_id', share.order_id)
      .order('uploaded_at', { ascending: false });

    if (documentsError?.message?.includes('document_type') || documentsError?.message?.includes('review_status')) {
      const fallback = await supabaseAdmin
        .from('documents')
        .select('id, filename, storage_path, uploaded_at')
        .eq('order_id', share.order_id)
        .order('uploaded_at', { ascending: false });
      documents = fallback.data;
      documentsError = fallback.error;
    }

    if (documentsError) throw documentsError;

    const documentsWithUrls = await Promise.all((documents || []).map(async (document) => {
      const { data } = await supabaseAdmin.storage
        .from('documents')
        .createSignedUrl(document.storage_path, 60 * 10);

      return {
        id: document.id,
        filename: document.filename,
        uploaded_at: document.uploaded_at,
        document_type: document.document_type || 'otro',
        review_status: document.review_status || 'uploaded',
        version_number: document.version_number || 1,
        is_blocking: Boolean(document.is_blocking),
        expires_at: document.expires_at || null,
        metadata: document.metadata || {},
        url: data?.signedUrl || null
      };
    }));

    const { data: reviews, error: reviewsError } = await supabaseAdmin
      .from('document_reviews')
      .select('*, documents(filename)')
      .eq('order_id', share.order_id)
      .order('created_at', { ascending: false });

    if (reviewsError) throw reviewsError;

    const scoring = scoreExpedient({
      order,
      documents: documents || [],
      reviews: reviews || []
    });
    const publishability = evaluateInstitutionalPublishability(scoring, order);

    await supabaseAdmin
      .from('data_room_shares')
      .update({ last_viewed_at: new Date().toISOString() })
      .eq('id', share.id);

    await logAuditEvent({
      userId: share.owner_user_id || null,
      action: 'shared_data_room_viewed',
      entityType: 'data_room_share',
      entityId: share.id,
      orderId: share.order_id,
      req,
      metadata: {
        recipientName: share.recipient_name,
        documentCount: documentsWithUrls.length,
        reviewCount: reviews?.length || 0,
        readinessGrade: scoring.readinessGrade?.grade,
        finalScore: scoring.finalScore
      }
    });

    res.json({
      share,
      order,
      documents: documentsWithUrls,
      reviews: reviews || [],
      scoring,
      publishability
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
