import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/audit.js';

const router = express.Router();

const ALLOWED_STATUSES = new Set(['open', 'in_progress', 'resolved', 'waived']);
const ALLOWED_PRIORITIES = new Set(['low', 'medium', 'high']);

async function getOrderForParticipant(orderId, userId, email) {
  const { data: ownerOrder } = await supabaseAdmin
    .from('service_orders')
    .select('id, user_id')
    .eq('id', orderId)
    .eq('user_id', userId)
    .maybeSingle();

  if (ownerOrder) return { order: ownerOrder, role: 'owner' };

  const { data: share, error } = await supabaseAdmin
    .from('data_room_shares')
    .select('id, order_id, recipient_user_id, recipient_email')
    .eq('order_id', orderId)
    .or(`recipient_user_id.eq.${userId},recipient_email.ilike.${email}`)
    .maybeSingle();

  if (error || !share) {
    throw new Error('Sin permisos para este expediente');
  }

  return { order: { id: orderId }, role: 'funder', share };
}

function normalizeRequest(body = {}) {
  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  const priority = body.priority || 'medium';
  const status = body.status || 'open';

  if (!title) throw new Error('Titulo requerido');
  if (!ALLOWED_PRIORITIES.has(priority)) throw new Error('Prioridad invalida');
  if (!ALLOWED_STATUSES.has(status)) throw new Error('Estado invalido');

  return {
    title: title.slice(0, 180),
    description: description.slice(0, 2000),
    priority,
    status,
    due_date: body.dueDate || null,
    document_type: body.documentType || null
  };
}

async function logRequestEvent({ requestId, orderId, userId, action, status, note, metadata = {} }) {
  const { error } = await supabaseAdmin
    .from('information_request_events')
    .insert([{
      request_id: requestId,
      order_id: orderId,
      actor_user_id: userId,
      action,
      status: status || null,
      note: note || null,
      metadata
    }]);

  if (error && !error.message?.includes('information_request_events')) {
    throw error;
  }
}

router.get('/information-requests/:orderId', authMiddleware, requirePermission('information_request:own:read'), async (req, res) => {
  try {
    const email = req.user?.email || '';
    await getOrderForParticipant(req.params.orderId, req.userId, email);

    let { data, error } = await supabaseAdmin
      .from('information_requests')
      .select('*, evidence:documents!information_requests_evidence_document_id_fkey(id, filename, storage_path, uploaded_at, document_type, review_status), events:information_request_events(id, action, status, note, metadata, actor_user_id, created_at)')
      .eq('order_id', req.params.orderId)
      .order('created_at', { ascending: false });

    if (
      error?.message?.includes('relationship') ||
      error?.message?.includes('evidence_document_id') ||
      error?.message?.includes('information_request_events') ||
      error?.message?.includes('schema cache')
    ) {
      const fallback = await supabaseAdmin
        .from('information_requests')
        .select('*')
        .eq('order_id', req.params.orderId)
        .order('created_at', { ascending: false });
      data = fallback.data;
      error = fallback.error;
    }

    if (error?.message?.includes('information_requests')) {
      return res.json([]);
    }

    if (error) throw error;

    data = (data || []).map((request) => ({
      ...request,
      events: (request.events || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }));

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/information-requests', authMiddleware, requirePermission('information_request:create'), async (req, res) => {
  try {
    const { orderId } = req.body || {};
    const email = req.user?.email || '';

    if (!orderId) return res.status(400).json({ error: 'orderId requerido' });

    const access = await getOrderForParticipant(orderId, req.userId, email);

    if (access.role !== 'funder') {
      return res.status(403).json({ error: 'Solo un otorgante autorizado puede solicitar informacion' });
    }

    const payload = {
      order_id: orderId,
      requester_user_id: req.userId,
      requester_email: email,
      ...normalizeRequest(req.body)
    };

    const { data, error } = await supabaseAdmin
      .from('information_requests')
      .insert([payload])
      .select()
      .single();

    if (error?.message?.includes('information_requests')) {
      throw new Error('La tabla information_requests no existe. Ejecuta la expansion SQL local en Supabase.');
    }

    if (error) throw error;

    await logRequestEvent({
      requestId: data.id,
      orderId,
      userId: req.userId,
      action: 'created',
      status: data.status,
      note: data.description,
      metadata: {
        title: data.title,
        priority: data.priority,
        documentType: data.document_type
      }
    });

    await logAuditEvent({
      userId: req.userId,
      action: 'information_request_created',
      entityType: 'information_request',
      entityId: data.id,
      orderId,
      req,
      metadata: { title: data.title, priority: data.priority }
    });

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/information-requests/:requestId', authMiddleware, requirePermission('information_request:own:update'), async (req, res) => {
  try {
    const patch = {};

    if (req.body.status !== undefined) {
      if (!ALLOWED_STATUSES.has(req.body.status)) throw new Error('Estado invalido');
      patch.status = req.body.status;
    }
    if (req.body.response !== undefined) patch.response = String(req.body.response || '').slice(0, 2000);
    if (req.body.resolvedAt !== undefined) patch.resolved_at = req.body.resolvedAt || null;
    if (req.body.documentId !== undefined) patch.evidence_document_id = req.body.documentId || null;

    const { data: current, error: currentError } = await supabaseAdmin
      .from('information_requests')
      .select('id, order_id')
      .eq('id', req.params.requestId)
      .single();

    if (currentError) throw currentError;

    const email = req.user?.email || '';
    await getOrderForParticipant(current.order_id, req.userId, email);

    const { data, error } = await supabaseAdmin
      .from('information_requests')
      .update(patch)
      .eq('id', req.params.requestId)
      .select()
      .single();

    if (error) throw error;

    await logRequestEvent({
      requestId: data.id,
      orderId: data.order_id,
      userId: req.userId,
      action: 'updated',
      status: data.status,
      note: data.response,
      metadata: {
        evidenceDocumentId: data.evidence_document_id || null
      }
    });

    await logAuditEvent({
      userId: req.userId,
      action: 'information_request_updated',
      entityType: 'information_request',
      entityId: data.id,
      orderId: data.order_id,
      req,
      metadata: { status: data.status }
    });

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/information-requests/:requestId/evidence-url', authMiddleware, requirePermission('information_request:own:read'), async (req, res) => {
  try {
    const { data: request, error: requestError } = await supabaseAdmin
      .from('information_requests')
      .select('id, order_id, evidence_document_id')
      .eq('id', req.params.requestId)
      .single();

    if (requestError) throw requestError;
    if (!request.evidence_document_id) {
      return res.status(404).json({ error: 'Requerimiento sin evidencia vinculada' });
    }

    const email = req.user?.email || '';
    await getOrderForParticipant(request.order_id, req.userId, email);

    const { data: document, error: documentError } = await supabaseAdmin
      .from('documents')
      .select('id, filename, storage_path')
      .eq('id', request.evidence_document_id)
      .eq('order_id', request.order_id)
      .single();

    if (documentError) throw documentError;

    const { data, error } = await supabaseAdmin.storage
      .from('documents')
      .createSignedUrl(document.storage_path, 60 * 10);

    if (error) throw error;

    await logAuditEvent({
      userId: req.userId,
      action: 'information_request_evidence_viewed',
      entityType: 'information_request',
      entityId: request.id,
      orderId: request.order_id,
      req,
      metadata: { documentId: document.id, filename: document.filename }
    });

    res.json({ url: data.signedUrl, document });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
