import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { REQUIREMENTS_MATRIX } from '../config/requirementsMatrix.js';
import { buildExecutiveReport, buildInstitutionalMemo, scoreExpedient } from '../services/scoringEngine.js';
import { logAuditEvent } from '../utils/audit.js';

const router = express.Router();

async function loadOwnedOrder(orderId, userId) {
  const { data: order, error } = await supabaseAdmin
    .from('service_orders')
    .select()
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();

  if (error || !order) {
    throw new Error('Expediente no encontrado o sin permisos');
  }

  return order;
}

async function loadOrderEvidence(orderId) {
  const [{ data: documents, error: documentsError }, { data: reviews, error: reviewsError }] = await Promise.all([
    supabaseAdmin
      .from('documents')
      .select()
      .eq('order_id', orderId)
      .order('uploaded_at', { ascending: false }),
    supabaseAdmin
      .from('document_reviews')
      .select()
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
  ]);

  if (documentsError) throw documentsError;
  if (reviewsError) throw reviewsError;

  return {
    documents: documents || [],
    reviews: reviews || []
  };
}

router.get('/scoring/matrices', authMiddleware, requirePermission('score:own:read'), async (req, res) => {
  const matrices = Object.entries(REQUIREMENTS_MATRIX).map(([key, matrix]) => ({
    key,
    entity: matrix.entity,
    sector: matrix.sector,
    minDscr: matrix.min_dscr,
    approvalThreshold: matrix.approval_threshold,
    requirements: matrix.requirements
  }));

  res.json({ matrices });
});

router.get('/orders/:orderId/scoring', authMiddleware, requirePermission('score:own:read'), async (req, res) => {
  try {
    const order = await loadOwnedOrder(req.params.orderId, req.userId);
    const { documents, reviews } = await loadOrderEvidence(order.id);

    const result = scoreExpedient({
      order,
      documents,
      reviews,
      matrixKey: req.query.matrixKey
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/orders/:orderId/scoring/executive-report', authMiddleware, requirePermission('report:own:create'), async (req, res) => {
  try {
    const order = await loadOwnedOrder(req.params.orderId, req.userId);
    const { documents, reviews } = await loadOrderEvidence(order.id);
    const scoringResult = scoreExpedient({
      order,
      documents,
      reviews,
      matrixKey: req.query.matrixKey
    });

    res.json(buildExecutiveReport(scoringResult));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/orders/:orderId/scoring/institutional-memo', authMiddleware, requirePermission('report:own:create'), async (req, res) => {
  try {
    const order = await loadOwnedOrder(req.params.orderId, req.userId);
    const { documents, reviews } = await loadOrderEvidence(order.id);
    const scoringResult = scoreExpedient({
      order,
      documents,
      reviews,
      matrixKey: req.query.matrixKey
    });

    res.json(buildInstitutionalMemo(scoringResult, order));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/orders/:orderId/scoring/institutional-memo.md', authMiddleware, requirePermission('report:own:create'), async (req, res) => {
  try {
    const order = await loadOwnedOrder(req.params.orderId, req.userId);
    const { documents, reviews } = await loadOrderEvidence(order.id);
    const scoringResult = scoreExpedient({
      order,
      documents,
      reviews,
      matrixKey: req.query.matrixKey
    });
    const memo = buildInstitutionalMemo(scoringResult, order);
    const caseNumber = order.case_number || `NSD-${String(order.id || '').slice(0, 8).toUpperCase()}`;
    const filename = `${caseNumber}-memo-institucional.md`.replace(/[^a-zA-Z0-9._-]/g, '-');

    await logAuditEvent({
      userId: req.userId,
      action: 'institutional_memo_downloaded',
      entityType: 'service_order',
      entityId: order.id,
      orderId: order.id,
      req,
      metadata: {
        matrixKey: scoringResult.matrixKey,
        finalScore: scoringResult.finalScore,
        readinessGrade: scoringResult.readinessGrade?.grade,
        format: 'markdown'
      }
    });

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(memo.memo.content);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
