import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { scoreExpedient } from '../services/scoringEngine.js';
import { logAuditEvent } from '../utils/audit.js';

const router = express.Router();

const ALLOWED_INTEREST_STATUSES = new Set([
  'interested',
  'under_review',
  'term_sheet',
  'declined',
  'closed'
]);

const ALLOWED_CONTACT_STATUSES = new Set([
  'requested',
  'approved',
  'rejected',
  'cancelled'
]);

function normalizeInterestStatus(status = 'interested') {
  if (!ALLOWED_INTEREST_STATUSES.has(status)) {
    throw new Error('Estado de interes institucional invalido');
  }
  return status;
}

function normalizeContactStatus(status = 'requested') {
  if (!ALLOWED_CONTACT_STATUSES.has(status)) {
    throw new Error('Estado de contacto autorizado invalido');
  }
  return status;
}

async function assertAuthorizedDataRoom(orderId, userId, email) {
  let { data: share, error } = await supabaseAdmin
    .from('data_room_shares')
    .select('id, order_id, recipient_user_id, recipient_email, status')
    .eq('order_id', orderId)
    .or(`recipient_user_id.eq.${userId},recipient_email.ilike.${email}`)
    .in('status', ['accepted', 'shared'])
    .maybeSingle();

  if (error?.message?.includes('recipient_user_id')) {
    const fallback = await supabaseAdmin
      .from('data_room_shares')
      .select('id, order_id, recipient_email, status')
      .eq('order_id', orderId)
      .ilike('recipient_email', email)
      .in('status', ['accepted', 'shared'])
      .maybeSingle();
    share = fallback.data;
    error = fallback.error;
  }

  if (error || !share) {
    throw new Error('Data room no autorizado para este otorgante');
  }

  return share;
}

async function assertOrderOwner(orderId, userId) {
  const { data: order, error } = await supabaseAdmin
    .from('service_orders')
    .select('id, user_id')
    .eq('id', orderId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !order) {
    throw new Error('Expediente no autorizado para este usuario');
  }

  return order;
}

async function getInterestForShare(share) {
  let { data, error } = await supabaseAdmin
    .from('funder_interests')
    .select('id, order_id, funder_user_id, status, notes, created_at')
    .eq('order_id', share.order_id)
    .eq('funder_user_id', share.recipient_user_id || '00000000-0000-0000-0000-000000000000')
    .maybeSingle();

  if (error?.message?.includes('funder_interests') || error?.message?.includes('funder_user_id')) {
    return null;
  }

  if (!data && share.recipient_email) {
    const fallback = await supabaseAdmin
      .from('funder_interests')
      .select('id, order_id, funder_user_id, status, notes, created_at')
      .eq('order_id', share.order_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    data = fallback.data;
  }

  return data || null;
}

async function getContactRequestForShare(share) {
  let { data, error } = await supabaseAdmin
    .from('funder_contact_requests')
    .select('id, order_id, funder_user_id, funder_email, share_id, status, reason, notes, created_at, updated_at')
    .eq('order_id', share.order_id)
    .eq('funder_user_id', share.recipient_user_id || '00000000-0000-0000-0000-000000000000')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error?.message?.includes('funder_contact_requests') || error?.message?.includes('funder_user_id')) {
    return null;
  }

  if (!data && share.recipient_email) {
    const fallback = await supabaseAdmin
      .from('funder_contact_requests')
      .select('id, order_id, funder_user_id, funder_email, share_id, status, reason, notes, created_at, updated_at')
      .eq('order_id', share.order_id)
      .ilike('funder_email', share.recipient_email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    data = fallback.data;
  }

  return data || null;
}

async function getInformationRequestsForOrder(orderId) {
  const { data, error } = await supabaseAdmin
    .from('information_requests')
    .select('id, order_id, title, status, priority, due_date, document_type, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });

  if (error?.message?.includes('information_requests')) {
    return [];
  }
  if (error) throw error;

  return data || [];
}

async function buildPipelineItem(share) {
  const [{ data: order, error: orderError }, { data: documents, error: documentsError }, { data: reviews, error: reviewsError }, interest, contactRequest, informationRequests] = await Promise.all([
    supabaseAdmin
      .from('service_orders')
      .select('id, user_id, service_type, status, amount, created_at, completed_at, metadata, case_number, project_name, applicant_type, requested_amount, funding_purpose, stage, risk_level, readiness_grade, compliance_status')
      .eq('id', share.order_id)
      .single(),
    supabaseAdmin
      .from('documents')
      .select('id, filename, uploaded_at')
      .eq('order_id', share.order_id)
      .order('uploaded_at', { ascending: false }),
    supabaseAdmin
      .from('document_reviews')
      .select('id, document_id, order_id, status, score, summary, findings, missing_items, created_at')
      .eq('order_id', share.order_id)
      .order('created_at', { ascending: false }),
    getInterestForShare(share),
    getContactRequestForShare(share),
    getInformationRequestsForOrder(share.order_id)
  ]);

  if (orderError) throw orderError;
  if (documentsError) throw documentsError;
  if (reviewsError) throw reviewsError;

  const scoring = scoreExpedient({
    order,
    documents: documents || [],
    reviews: reviews || []
  });

  return {
    share: {
      id: share.id,
      status: share.status,
      recipientName: share.recipient_name,
      recipientEmail: share.recipient_email,
      recipientUserId: share.recipient_user_id,
      createdAt: share.created_at,
      acceptedAt: share.accepted_at,
      expiresAt: share.expires_at,
      lastViewedAt: share.last_viewed_at
    },
    order,
    documentsCount: documents?.length || 0,
    latestReview: reviews?.[0] || null,
    informationRequests: (informationRequests || []).map((request) => ({
      id: request.id,
      title: request.title,
      status: request.status,
      priority: request.priority,
      dueDate: request.due_date || null,
      documentType: request.document_type || null
    })),
    scoring: {
      finalScore: scoring.finalScore,
      readinessGrade: scoring.readinessGrade,
      recommendation: scoring.recommendation,
      summary: scoring.summary,
      regulatoryValidation: scoring.regulatoryValidation
    },
    interest,
    contactRequest
  };
}

router.get('/otorgante/pipeline', authMiddleware, requirePermission('data_room:authorized:read'), async (req, res) => {
  try {
    const email = req.user?.email;

    if (!email) {
      return res.status(400).json({ error: 'Usuario autenticado sin email' });
    }

    let { data: shares, error: sharesError } = await supabaseAdmin
      .from('data_room_shares')
      .select('id, order_id, recipient_user_id, recipient_name, recipient_email, status, created_at, accepted_at, expires_at, last_viewed_at')
      .or(`recipient_user_id.eq.${req.userId},recipient_email.ilike.${email}`)
      .in('status', ['accepted', 'shared'])
      .order('created_at', { ascending: false });

    if (sharesError?.message?.includes('recipient_user_id') || sharesError?.message?.includes('accepted_at') || sharesError?.message?.includes('expires_at')) {
      const fallback = await supabaseAdmin
        .from('data_room_shares')
        .select('id, order_id, recipient_name, recipient_email, status, created_at, last_viewed_at')
        .ilike('recipient_email', email)
        .in('status', ['accepted', 'shared'])
        .order('created_at', { ascending: false });
      shares = fallback.data;
      sharesError = fallback.error;
    }

    if (sharesError) throw sharesError;

    const pipeline = await Promise.all((shares || []).map((share) => buildPipelineItem({
      ...share,
      recipient_user_id: share.recipient_user_id || req.userId
    })));

    res.json(pipeline);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin-wide view across every accepted/shared data room, not just the requester's own
// shares. Reuses buildPipelineItem so the shape matches /otorgante/pipeline exactly --
// admin already has unrestricted read access to users/audit-logs/orders elsewhere in this
// permission model (ROLE_PERMISSIONS.administrador = ['*']), so this does not introduce a
// new visibility tier, only a real endpoint for a view operationsConsole.js previously had
// to fake with local demo data.
router.get('/nuxera/admin/grantor-cases', authMiddleware, requirePermission('nuxera:admin:read'), async (req, res) => {
  try {
    const { data: shares, error: sharesError } = await supabaseAdmin
      .from('data_room_shares')
      .select('id, order_id, recipient_user_id, recipient_name, recipient_email, status, created_at, accepted_at, expires_at, last_viewed_at')
      .in('status', ['accepted', 'shared'])
      .order('created_at', { ascending: false });

    if (sharesError) throw sharesError;

    const pipeline = await Promise.all((shares || []).map((share) => buildPipelineItem(share)));

    res.json({
      workspaceRole: 'admin',
      pipeline,
      guardrails: [
        'Admin-wide pipeline view reuses the same real fields exposed to an authorized grantor; it does not add new columns or bypass data-room shares.',
        'It does not approve financing, issue term sheets or change data-room permissions.'
      ]
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/otorgante/interests', authMiddleware, requirePermission('funder:interest:create'), async (req, res) => {
  try {
    const { orderId, status = 'interested', notes = '' } = req.body || {};
    const email = req.user?.email;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId es requerido' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Usuario autenticado sin email' });
    }

    await assertAuthorizedDataRoom(orderId, req.userId, email);

    const cleanStatus = normalizeInterestStatus(status);
    const payload = {
      order_id: orderId,
      funder_user_id: req.userId,
      status: cleanStatus,
      notes: String(notes || '').slice(0, 2000)
    };

    let { data: existing, error: existingError } = await supabaseAdmin
      .from('funder_interests')
      .select('id')
      .eq('order_id', orderId)
      .eq('funder_user_id', req.userId)
      .maybeSingle();

    if (existingError?.message?.includes('funder_interests')) {
      throw new Error('La tabla funder_interests no existe. Ejecuta la expansion institucional en Supabase.');
    }

    let data;
    let error;

    if (existing?.id) {
      const updated = await supabaseAdmin
        .from('funder_interests')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
      data = updated.data;
      error = updated.error;
    } else {
      const inserted = await supabaseAdmin
        .from('funder_interests')
        .insert([payload])
        .select()
        .single();
      data = inserted.data;
      error = inserted.error;
    }

    if (error) throw error;

    await logAuditEvent({
      userId: req.userId,
      action: 'funder_interest_recorded',
      entityType: 'funder_interest',
      entityId: data.id,
      orderId,
      req,
      metadata: {
        status: cleanStatus,
        notesLength: payload.notes.length
      }
    });

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/otorgante/contact-requests', authMiddleware, requirePermission('funder:contact:create'), async (req, res) => {
  try {
    const { orderId, status = 'requested', reason = '', notes = '' } = req.body || {};
    const email = req.user?.email;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId es requerido' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Usuario autenticado sin email' });
    }

    const share = await assertAuthorizedDataRoom(orderId, req.userId, email);
    const cleanStatus = normalizeContactStatus(status);
    const payload = {
      order_id: orderId,
      funder_user_id: req.userId,
      funder_email: email,
      share_id: share.id,
      status: cleanStatus,
      reason: String(reason || '').slice(0, 1200),
      notes: String(notes || '').slice(0, 2000),
      updated_at: new Date().toISOString()
    };

    let { data: existing, error: existingError } = await supabaseAdmin
      .from('funder_contact_requests')
      .select('id')
      .eq('order_id', orderId)
      .eq('funder_user_id', req.userId)
      .maybeSingle();

    if (existingError?.message?.includes('funder_contact_requests')) {
      throw new Error('La tabla funder_contact_requests no existe. Ejecuta la expansion institucional en Supabase.');
    }

    let data;
    let error;

    if (existing?.id) {
      const updated = await supabaseAdmin
        .from('funder_contact_requests')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
      data = updated.data;
      error = updated.error;
    } else {
      const inserted = await supabaseAdmin
        .from('funder_contact_requests')
        .insert([payload])
        .select()
        .single();
      data = inserted.data;
      error = inserted.error;
    }

    if (error) throw error;

    await logAuditEvent({
      userId: req.userId,
      action: 'funder_contact_requested',
      entityType: 'funder_contact_request',
      entityId: data.id,
      orderId,
      req,
      metadata: {
        status: cleanStatus,
        reasonLength: payload.reason.length
      }
    });

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/otorgante/contact-requests/:orderId', authMiddleware, requirePermission('contact_request:own:decide'), async (req, res) => {
  try {
    await assertOrderOwner(req.params.orderId, req.userId);

    let { data, error } = await supabaseAdmin
      .from('funder_contact_requests')
      .select('id, order_id, funder_user_id, funder_email, share_id, status, reason, notes, created_at, updated_at')
      .eq('order_id', req.params.orderId)
      .order('created_at', { ascending: false });

    if (error?.message?.includes('funder_contact_requests')) {
      return res.json([]);
    }

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/otorgante/contact-requests/:requestId', authMiddleware, requirePermission('contact_request:own:decide'), async (req, res) => {
  try {
    const cleanStatus = normalizeContactStatus(req.body?.status || 'requested');
    const notes = String(req.body?.notes || '').slice(0, 2000);

    const { data: current, error: currentError } = await supabaseAdmin
      .from('funder_contact_requests')
      .select('id, order_id')
      .eq('id', req.params.requestId)
      .single();

    if (currentError) throw currentError;

    await assertOrderOwner(current.order_id, req.userId);

    const { data, error } = await supabaseAdmin
      .from('funder_contact_requests')
      .update({
        status: cleanStatus,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.requestId)
      .select()
      .single();

    if (error) throw error;

    await logAuditEvent({
      userId: req.userId,
      action: 'funder_contact_request_decided',
      entityType: 'funder_contact_request',
      entityId: data.id,
      orderId: data.order_id,
      req,
      metadata: {
        status: cleanStatus,
        notesLength: notes.length
      }
    });

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
