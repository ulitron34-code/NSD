// Agregado de actividad del usuario cruzando todos sus expedientes — para
// ControlCenter.jsx (antes sumaba client-side sobre datos falsos de
// IndexedDB). Se calcula server-side en una sola vuelta de queries en vez
// de que el frontend haga N+1 llamadas por cada orden.
import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { getAccessibleOrderIds, getUnreadCount } from '../services/messagingService.js';

const router = express.Router();

router.get('/me/activity-summary', authMiddleware, async (req, res) => {
  try {
    const email = req.user?.email || '';
    const orderIds = await getAccessibleOrderIds(req.userId, email);

    if (orderIds.length === 0) {
      return res.json({
        totalOrders: 0,
        totalDocuments: 0,
        openRequirements: 0,
        unreadMessages: 0,
        recentActivity: []
      });
    }

    const [
      { count: totalDocuments, error: docsError },
      { count: openRequirements, error: reqError },
      { data: recentActivity, error: auditError },
      unreadMessages
    ] = await Promise.all([
      supabaseAdmin.from('documents').select('id', { count: 'exact', head: true }).in('order_id', orderIds),
      supabaseAdmin.from('information_requests').select('id', { count: 'exact', head: true }).in('order_id', orderIds).in('status', ['open', 'in_progress']),
      supabaseAdmin.from('audit_logs').select().in('order_id', orderIds).order('created_at', { ascending: false }).limit(20),
      getUnreadCount(req.userId, email)
    ]);

    if (docsError) throw docsError;
    if (reqError && !reqError.message?.includes('information_requests')) throw reqError;
    if (auditError) throw auditError;

    res.json({
      totalOrders: orderIds.length,
      totalDocuments: totalDocuments || 0,
      openRequirements: openRequirements || 0,
      unreadMessages,
      recentActivity: recentActivity || []
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
