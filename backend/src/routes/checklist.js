import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authMiddleware, requirePermission, requireAdmin } from '../middleware/auth.js';
import { generateChecklist, crossCheckWithUploads } from '../services/dynamicChecklistService.js';

const router = express.Router();

// GET /orders/:orderId/checklist
// Genera el checklist dinámico para el expediente y lo cruza con los docs subidos.
router.get('/orders/:orderId/checklist', authMiddleware, requirePermission('case:own:read'), async (req, res) => {
  try {
    const { data: order, error: orderError } = await supabaseAdmin
      .from('service_orders')
      .select('id, user_id, service_type, metadata')
      .eq('id', req.params.orderId)
      .eq('user_id', req.userId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Expediente no encontrado o sin permisos' });
    }

    const { data: documents } = await supabaseAdmin
      .from('documents')
      .select('id, filename, document_type, review_status, created_at')
      .eq('order_id', req.params.orderId);

    const country = order.metadata?.country || 'MX';
    const sector = order.metadata?.sector || null;
    const serviceType = order.service_type || null;
    const monto = Number(order.metadata?.requestedAmount || order.metadata?.monto || 0);

    const checklist = generateChecklist({ country, sector, serviceType, monto });
    const result = crossCheckWithUploads(checklist, documents || []);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /orders/:orderId/checklist/trigger-alert
// Endpoint de admin/testing para disparar el cron manualmente.
// Antes comparaba req.userRole contra el string 'admin', pero
// normalizeRole() en middleware/auth.js siempre lo normaliza a
// 'administrador' -- esa comparación nunca era verdadera para ningún usuario
// real. Se reemplaza por requireAdmin, el mismo guard ya definido en
// auth.js pero que hasta ahora ningún router usaba.
router.post('/orders/trigger-compliance-alerts', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { runComplianceAlertJob } = await import('../services/complianceAlertCron.js');
    await runComplianceAlertJob();
    res.json({ ok: true, message: 'Job ejecutado manualmente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
