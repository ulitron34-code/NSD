import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/audit.js';
import {
  generateDocumentAlerts,
  generateReviewAlerts,
  evaluateCovenants,
  computeComplianceScore,
  normalizeCovenants,
  normalizeReviewSchedule
} from '../services/complianceMonitorService.js';

const router = express.Router();

async function loadOwnedOrder(orderId, userId) {
  const { data: order, error } = await supabaseAdmin
    .from('service_orders')
    .select()
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();
  if (error || !order) throw new Error('Expediente no encontrado o sin permisos');
  return order;
}

// GET /orders/:orderId/compliance-monitor
// Devuelve alertas de vencimiento, covenants evaluados, schedule y score general.
router.get('/orders/:orderId/compliance-monitor', authMiddleware, requirePermission('case:own:read'), async (req, res) => {
  try {
    const order = await loadOwnedOrder(req.params.orderId, req.userId);

    const { data: documents, error: docsError } = await supabaseAdmin
      .from('documents')
      .select('id, filename, expires_at, document_type, review_status')
      .eq('order_id', req.params.orderId)
      .order('expires_at', { ascending: true, nullsFirst: false });

    if (docsError) throw docsError;

    const covenants = order.metadata?.covenants || [];
    const reviewSchedule = order.metadata?.reviewSchedule || null;

    const documentAlerts = generateDocumentAlerts(documents || []);
    const reviewAlerts = generateReviewAlerts(reviewSchedule);
    const allAlerts = [...documentAlerts, ...reviewAlerts];

    const evaluatedCovenants = evaluateCovenants(covenants);
    const summary = computeComplianceScore(allAlerts, evaluatedCovenants);

    res.json({
      orderId: req.params.orderId,
      summary,
      alerts: allAlerts,
      covenants: evaluatedCovenants,
      reviewSchedule,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /orders/:orderId/compliance-covenants
// Guarda la lista completa de covenants en service_orders.metadata.covenants
router.patch('/orders/:orderId/compliance-covenants', authMiddleware, requirePermission('case:own:update'), async (req, res) => {
  try {
    const order = await loadOwnedOrder(req.params.orderId, req.userId);

    const covenants = normalizeCovenants(req.body?.covenants);
    const nextMetadata = {
      ...(order.metadata || {}),
      covenants,
      covenantsUpdatedAt: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('service_orders')
      .update({ metadata: nextMetadata })
      .eq('id', req.params.orderId)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) throw error;

    await logAuditEvent({
      userId: req.userId,
      action: 'case_institutional_updated',
      entityType: 'service_order',
      entityId: req.params.orderId,
      orderId: req.params.orderId,
      req,
      metadata: { covenantsCount: covenants.length }
    });

    res.json({ covenants: normalizeCovenants(data.metadata?.covenants || []) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /orders/:orderId/compliance-schedule
// Guarda el calendario de revisión periódica en service_orders.metadata.reviewSchedule
router.patch('/orders/:orderId/compliance-schedule', authMiddleware, requirePermission('case:own:update'), async (req, res) => {
  try {
    const order = await loadOwnedOrder(req.params.orderId, req.userId);

    const reviewSchedule = normalizeReviewSchedule(req.body);
    const nextMetadata = {
      ...(order.metadata || {}),
      reviewSchedule
    };

    const { data, error } = await supabaseAdmin
      .from('service_orders')
      .update({ metadata: nextMetadata })
      .eq('id', req.params.orderId)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) throw error;

    await logAuditEvent({
      userId: req.userId,
      action: 'case_institutional_updated',
      entityType: 'service_order',
      entityId: req.params.orderId,
      orderId: req.params.orderId,
      req,
      metadata: { reviewScheduleNextDate: reviewSchedule.nextReviewDate }
    });

    res.json({ reviewSchedule: data.metadata?.reviewSchedule });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
