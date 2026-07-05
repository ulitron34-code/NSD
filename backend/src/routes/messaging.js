// Mensajeria real por expediente. Reemplaza messagingServiceV2.js (IndexedDB
// del navegador) que usaba MessagingTab.jsx.
import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authMiddleware, requireAnyPermission } from '../middleware/auth.js';
import { sendMessage, listConversation, markConversationRead, getUnreadCount } from '../services/messagingService.js';
import { logAuditEvent } from '../utils/audit.js';

const router = express.Router();

// Mismo criterio que getOrderForParticipant en informationRequests.js: dueño
// del expediente, o otorgante con data_room_shares aceptado.
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
    .in('status', ['accepted', 'shared'])
    .or(`recipient_user_id.eq.${userId},recipient_email.ilike.${email}`)
    .maybeSingle();

  if (error || !share) {
    throw new Error('Sin permisos para este expediente');
  }

  return { order: { id: orderId }, role: 'funder', share };
}

router.get(
  '/orders/:orderId/messages',
  authMiddleware,
  requireAnyPermission(['message:own:read']),
  async (req, res) => {
    try {
      const email = req.user?.email || '';
      await getOrderForParticipant(req.params.orderId, req.userId, email);

      const messages = await listConversation(req.params.orderId);
      res.json(messages);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.post(
  '/orders/:orderId/messages',
  authMiddleware,
  requireAnyPermission(['message:own:create']),
  async (req, res) => {
    try {
      const email = req.user?.email || '';
      await getOrderForParticipant(req.params.orderId, req.userId, email);

      const body = String(req.body?.body || '').trim();
      if (!body) return res.status(400).json({ error: 'El mensaje no puede estar vacio' });

      const message = await sendMessage({
        orderId: req.params.orderId,
        senderUserId: req.userId,
        senderEmail: email,
        body: body.slice(0, 4000)
      });

      await logAuditEvent({
        userId: req.userId,
        action: 'message_sent',
        entityType: 'message',
        entityId: message.id,
        orderId: req.params.orderId,
        req,
        metadata: {}
      });

      res.json(message);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.patch(
  '/orders/:orderId/messages/read',
  authMiddleware,
  requireAnyPermission(['message:own:read']),
  async (req, res) => {
    try {
      const email = req.user?.email || '';
      await getOrderForParticipant(req.params.orderId, req.userId, email);

      await markConversationRead(req.params.orderId, req.userId);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.get(
  '/messages/unread-count',
  authMiddleware,
  requireAnyPermission(['message:own:read']),
  async (req, res) => {
    try {
      const email = req.user?.email || '';
      const count = await getUnreadCount(req.userId, email);
      res.json({ count });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;
