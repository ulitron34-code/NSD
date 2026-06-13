import express from 'express';
import Stripe from 'stripe';
import { supabaseAdmin } from '../config/supabase.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/audit.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

async function loadOwnedOrder(orderId, userId) {
  const { data: order, error } = await supabaseAdmin
    .from('service_orders')
    .select('id, user_id, amount, status')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();

  if (error || !order) {
    throw new Error('Orden no encontrada o sin permisos');
  }

  return order;
}

async function createCommissionIfNeeded(orderId, amount) {
  const commissionAmount = Number(amount) * 0.02;

  const { data: existing } = await supabaseAdmin
    .from('commissions')
    .select('id')
    .eq('order_id', orderId)
    .limit(1);

  if (existing?.length) return;

  await supabaseAdmin
    .from('commissions')
    .insert([{
      order_id: orderId,
      amount: commissionAmount,
      status: 'pending'
    }]);
}

// CREAR PAYMENT INTENT
router.post('/create-payment-intent', authMiddleware, requirePermission('payment:own:create'), async (req, res) => {
  const { orderId } = req.body;

  try {
    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    const order = await loadOwnedOrder(orderId, req.userId);

    if (order.status === 'paid' || order.status === 'completed') {
      return res.status(400).json({ error: 'La orden ya fue pagada' });
    }

    const amountCents = Math.round(Number(order.amount) * 100);

    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return res.status(400).json({ error: 'La orden no tiene un monto valido' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { orderId, userId: req.userId }
    });

    await logAuditEvent({
      userId: req.userId,
      action: 'payment_intent_created',
      entityType: 'service_order',
      entityId: orderId,
      orderId,
      req,
      metadata: {
        amountCents,
        currency: 'usd',
        provider: 'stripe'
      },
      complianceRelevant: false
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// WEBHOOK STRIPE
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata?.orderId;

      if (orderId) {
        await supabaseAdmin
          .from('service_orders')
          .update({ status: 'paid' })
          .eq('id', orderId);

        await createCommissionIfNeeded(orderId, Number(paymentIntent.amount) / 100);
      }
    }

    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// CONFIRMAR PAGO DESDE FRONTEND PARA MVP
router.post('/confirm-payment', authMiddleware, requirePermission('payment:own:confirm'), async (req, res) => {
  const { orderId, paymentIntentId } = req.body;

  try {
    if (!orderId || !paymentIntentId) {
      return res.status(400).json({ error: 'orderId and paymentIntentId are required' });
    }

    const order = await loadOwnedOrder(orderId, req.userId);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: `Payment status is ${paymentIntent.status}` });
    }

    if (paymentIntent.metadata?.orderId !== orderId) {
      return res.status(400).json({ error: 'Payment does not match order' });
    }

    const expectedAmountCents = Math.round(Number(order.amount) * 100);

    if (paymentIntent.amount !== expectedAmountCents) {
      return res.status(400).json({ error: 'Payment amount does not match order amount' });
    }

    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('service_orders')
      .update({ status: 'paid' })
      .eq('id', orderId)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (updateError) throw updateError;

    await createCommissionIfNeeded(orderId, Number(paymentIntent.amount) / 100);

    await logAuditEvent({
      userId: req.userId,
      action: 'payment_confirmed',
      entityType: 'service_order',
      entityId: orderId,
      orderId,
      req,
      metadata: {
        paymentIntentId,
        paymentStatus: paymentIntent.status,
        amount: Number(paymentIntent.amount) / 100,
        provider: 'stripe'
      },
      complianceRelevant: false
    });

    res.json({ order: updatedOrder, paymentStatus: paymentIntent.status });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
