// Mensajeria real por expediente (reemplaza el chat falso de IndexedDB en
// src/services/messagingServiceV2.js, que nunca llegaba al backend).
import { supabaseAdmin } from '../config/supabase.js';

export async function sendMessage({ orderId, senderUserId, senderEmail, body }) {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .insert([{ order_id: orderId, sender_user_id: senderUserId, sender_email: senderEmail || null, body }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listConversation(orderId) {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .select()
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function markConversationRead(orderId, userId) {
  const { error } = await supabaseAdmin
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('order_id', orderId)
    .neq('sender_user_id', userId)
    .is('read_at', null);

  if (error) throw error;
}

// Ordenes donde el usuario es dueño o tiene un data_room_share aceptado —
// mismo criterio que getOrderForParticipant en informationRequests.js.
async function getAccessibleOrderIds(userId, email) {
  const [{ data: ownedOrders, error: ownedError }, { data: shares, error: sharesError }] = await Promise.all([
    supabaseAdmin.from('service_orders').select('id').eq('user_id', userId),
    supabaseAdmin
      .from('data_room_shares')
      .select('order_id')
      .in('status', ['accepted', 'shared'])
      .or(`recipient_user_id.eq.${userId}${email ? `,recipient_email.ilike.${email}` : ''}`)
  ]);

  if (ownedError) throw ownedError;
  if (sharesError) throw sharesError;

  const ids = new Set([
    ...(ownedOrders || []).map((o) => o.id),
    ...(shares || []).map((s) => s.order_id)
  ]);
  return Array.from(ids);
}

export async function getUnreadCount(userId, email) {
  const orderIds = await getAccessibleOrderIds(userId, email);
  if (orderIds.length === 0) return 0;

  const { count, error } = await supabaseAdmin
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .in('order_id', orderIds)
    .neq('sender_user_id', userId)
    .is('read_at', null);

  if (error) throw error;
  return count || 0;
}

export { getAccessibleOrderIds };
