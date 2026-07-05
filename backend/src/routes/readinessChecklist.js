import express from 'express';
import { authMiddleware, requireAnyPermission } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { getReadinessChecklist } from '../services/readinessChecklistService.js';
import { buildReadinessMemo } from '../services/readinessMemoService.js';
import { runReadinessCrossReferences } from '../agents/readinessCrossRefAgent.js';
import { logAuditEvent } from '../utils/audit.js';

const router = express.Router();

// El expediente es visible para su dueño (solicitante) o para un otorgante
// con acceso autorizado vía data_room_shares — mismo criterio que ya usa
// GET /otorgante/pipeline en otorgante.js.
async function assertReadinessAccess(orderId, req) {
  const { data: order } = await supabaseAdmin
    .from('service_orders')
    .select('id, user_id')
    .eq('id', orderId)
    .single();

  if (order?.user_id === req.userId) return true;

  const email = req.user?.email;
  const { data: shares } = await supabaseAdmin
    .from('data_room_shares')
    .select('id')
    .eq('order_id', orderId)
    .or(`recipient_user_id.eq.${req.userId}${email ? `,recipient_email.ilike.${email}` : ''}`)
    .in('status', ['accepted', 'shared'])
    .limit(1);

  return Boolean(shares && shares.length > 0);
}

router.get(
  '/orders/:orderId/readiness-checklist',
  authMiddleware,
  requireAnyPermission(['case:own:read', 'data_room:authorized:read']),
  async (req, res) => {
    try {
      const hasAccess = await assertReadinessAccess(req.params.orderId, req);
      if (!hasAccess) {
        return res.status(404).json({ error: 'Expediente no encontrado o sin permisos' });
      }

      const result = await getReadinessChecklist(req.params.orderId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get(
  '/orders/:orderId/readiness-checklist/memo.md',
  authMiddleware,
  requireAnyPermission(['case:own:read', 'data_room:authorized:read']),
  async (req, res) => {
    try {
      const hasAccess = await assertReadinessAccess(req.params.orderId, req);
      if (!hasAccess) {
        return res.status(404).json({ error: 'Expediente no encontrado o sin permisos' });
      }

      const { data: order } = await supabaseAdmin
        .from('service_orders')
        .select('id, case_number, project_name, metadata')
        .eq('id', req.params.orderId)
        .single();

      const checklistResult = await getReadinessChecklist(req.params.orderId);
      const report = buildReadinessMemo(checklistResult, order || {});
      const caseNumber = order?.case_number || `NSD-${String(req.params.orderId).slice(0, 8).toUpperCase()}`;
      const filename = `${caseNumber}-reporte-readiness.md`.replace(/[^a-zA-Z0-9._-]/g, '-');

      await logAuditEvent({
        userId: req.userId,
        action: 'readiness_memo_downloaded',
        entityType: 'service_order',
        entityId: req.params.orderId,
        orderId: req.params.orderId,
        req,
        metadata: { globalProgress: report.globalProgress, readyToSubmit: report.readyToSubmit }
      });

      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(report.memo.content);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.post(
  '/orders/:orderId/readiness-checklist/cross-check',
  authMiddleware,
  requireAnyPermission(['case:own:read', 'data_room:authorized:read']),
  async (req, res) => {
    try {
      const hasAccess = await assertReadinessAccess(req.params.orderId, req);
      if (!hasAccess) {
        return res.status(404).json({ error: 'Expediente no encontrado o sin permisos' });
      }

      const result = await runReadinessCrossReferences(req.params.orderId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
