import express from 'express';
import Stripe from 'stripe';
import { supabaseAdmin } from '../config/supabase.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/audit.js';

// Initialize Stripe with error handling for missing key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-11-20.acacia', // Use latest stable API version
  typescript: false,
});

const router = express.Router();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load order and verify user ownership
 */
async function loadOwnedOrder(orderId, userId) {
  const { data: order, error } = await supabaseAdmin
    .from('service_orders')
    .select('id, user_id, amount, status, created_at')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();

  if (error || !order) {
    throw Object.assign(new Error('Orden no encontrada o sin permisos'), { status: 404 });
  }

  return order;
}

/**
 * Verify payment intent belongs to this order and user
 */
async function verifyPaymentIntent(paymentIntentId, orderId, userId) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  
  // Verify metadata matches
  if (paymentIntent.metadata?.orderId !== orderId) {
    throw Object.assign(new Error('Payment does not belong to this order'), { status: 400 });
  }
  
  if (paymentIntent.metadata?.userId !== userId) {
    throw Object.assign(new Error('Payment does not belong to this user'), { status: 403 });
  }
  
  return paymentIntent;
}

/**
 * Create commission record for NSD (2%)
 */
async function createCommissionIfNeeded(orderId, amount) {
  const commissionAmount = Number(amount) * 0.02;

  // Check if commission already exists (idempotency)
  const { data: existing } = await supabaseAdmin
    .from('commissions')
    .select('id, status')
    .eq('order_id', orderId)
    .limit(1);

  if (existing?.length) {
    // Update status if it was pending and payment is confirmed
    if (existing[0].status === 'pending') {
      await supabaseAdmin
        .from('commissions')
        .update({ status: 'confirmed' })
        .eq('id', existing[0].id);
    }
    return existing[0];
  }

  // Create new commission
  const { data: commission, error } = await supabaseAdmin
    .from('commissions')
    .insert([{
      order_id: orderId,
      amount: commissionAmount,
      status: 'confirmed',
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('Failed to create commission:', error);
    // Don't throw - commission creation is not critical
  }

  return commission;
}

/**
 * Update order status with optimistic locking
 */
async function updateOrderStatus(orderId, newStatus, currentExpectedStatus) {
  const { data: updatedOrder, error, count } = await supabaseAdmin
    .from('service_orders')
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .eq('status', currentExpectedStatus) // Optimistic lock
    .select()
    .single();

  if (error) {
    throw Object.assign(new Error('Failed to update order status'), { originalError: error });
  }

  if (count === 0) {
    throw Object.assign(new Error('Order status was already modified'), { status: 409 });
  }

  return updatedOrder;
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /api/payments/status/:orderId
 * Check payment status for an order (public for webhook verification)
 */
router.get('/status/:orderId', async (req, res) => {
  const { orderId } = req.params;
  
  try {
    const { data: order, error } = await supabaseAdmin
      .from('service_orders')
      .select('id, status, amount, paid_at')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      paidAt: order.paid_at,
      isPaid: order.status === 'paid' || order.status === 'completed'
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

/**
 * POST /api/create-payment-intent
 * Create a Stripe PaymentIntent for an order
 */
router.post('/create-payment-intent', authMiddleware, requirePermission('payment:own:create'), async (req, res) => {
  const { orderId } = req.body;
  const userId = req.userId;

  try {
    // Validate input
    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    // Load and verify ownership
    const order = await loadOwnedOrder(orderId, userId);

    // Check if already paid
    if (order.status === 'paid' || order.status === 'completed') {
      return res.status(400).json({ 
        error: 'La orden ya fue pagada',
        code: 'ALREADY_PAID',
        status: order.status
      });
    }

    // Validate amount
    const amountCents = Math.round(Number(order.amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0 || amountCents > 99999999) {
      return res.status(400).json({ 
        error: 'La orden no tiene un monto válido',
        code: 'INVALID_AMOUNT'
      });
    }

    // Create idempotency key based on order and user
    const idempotencyKey = `pi_${orderId}_${userId}_${Date.now()}`;

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { 
        orderId,
        userId,
        createdAt: new Date().toISOString()
      },
      description: `NSD Service Order ${orderId}`,
      receipt_email: req.user?.email, // If available
    }, {
      idempotencyKey
    });

    // Log the action
    await logAuditEvent({
      userId,
      action: 'payment_intent_created',
      entityType: 'service_order',
      entityId: orderId,
      orderId,
      req,
      metadata: {
        paymentIntentId: paymentIntent.id,
        amountCents,
        currency: 'usd',
        provider: 'stripe'
      },
      complianceRelevant: false
    });

    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amountCents,
      currency: 'usd'
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    // Handle Stripe-specific errors
    if (error.type === 'StripeCardError') {
      return res.status(400).json({ error: error.message, code: 'CARD_ERROR' });
    }
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ error: 'Invalid request to payment provider', code: 'INVALID_REQUEST' });
    }
    
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

/**
 * POST /api/payments/cancel-payment-intent
 * Cancel a PaymentIntent if user abandons checkout
 */
router.post('/cancel-payment-intent', authMiddleware, requirePermission('payment:own:create'), async (req, res) => {
  const { paymentIntentId } = req.body;
  const userId = req.userId;

  try {
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'paymentIntentId is required' });
    }

    // Verify ownership before canceling
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.metadata?.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to cancel this payment' });
    }

    if (paymentIntent.status !== 'requires_payment_method' && 
        paymentIntent.status !== 'requires_confirmation' &&
        paymentIntent.status !== 'requires_action') {
      return res.status(400).json({ 
        error: `Cannot cancel payment in status: ${paymentIntent.status}`,
        code: 'CANNOT_CANCEL'
      });
    }

    const canceledIntent = await stripe.paymentIntents.cancel(paymentIntentId);

    await logAuditEvent({
      userId,
      action: 'payment_intent_canceled',
      entityType: 'stripe_payment_intent',
      entityId: paymentIntentId,
      req,
      metadata: {
        previousStatus: paymentIntent.status,
        newStatus: canceledIntent.status
      },
      complianceRelevant: false
    });

    res.json({ 
      success: true,
      paymentIntentId: canceledIntent.id,
      status: canceledIntent.status
    });
  } catch (error) {
    console.error('Error canceling payment intent:', error);
    res.status(500).json({ error: 'Failed to cancel payment intent' });
  }
});

/**
 * POST /api/webhook
 * Stripe webhook handler - handles payment events
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`Processing webhook event: ${event.type}`);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata?.orderId;

        if (orderId) {
          // Verify order exists and get current status
          const { data: existingOrder, error: orderError } = await supabaseAdmin
            .from('service_orders')
            .select('id, status, user_id, amount')
            .eq('id', orderId)
            .single();

          if (orderError || !existingOrder) {
            console.error(`Webhook: Order ${orderId} not found`);
            break;
          }

          // Idempotency check - only process if not already paid
          if (existingOrder.status !== 'paid' && existingOrder.status !== 'completed') {
            // Update order status with optimistic locking
            const updatedOrder = await updateOrderStatus(orderId, 'paid', existingOrder.status);

            // Create commission
            const amount = Number(paymentIntent.amount) / 100;
            await createCommissionIfNeeded(orderId, amount);

            // Log audit event
            await logAuditEvent({
              userId: existingOrder.user_id,
              action: 'payment_webhook_succeeded',
              entityType: 'service_order',
              entityId: orderId,
              orderId,
              req,
              metadata: {
                paymentIntentId: paymentIntent.id,
                amount,
                currency: paymentIntent.currency,
                provider: 'stripe'
              },
              complianceRelevant: true // Payment is compliance-relevant
            });

            console.log(`Webhook: Order ${orderId} marked as paid`);
          } else {
            console.log(`Webhook: Order ${orderId} already in status ${existingOrder.status}, skipping`);
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata?.orderId;

        if (orderId) {
          await logAuditEvent({
            userId: paymentIntent.metadata?.userId || 'unknown',
            action: 'payment_webhook_failed',
            entityType: 'service_order',
            entityId: orderId,
            orderId,
            req,
            metadata: {
              paymentIntentId: paymentIntent.id,
              failureMessage: paymentIntent.last_payment_error?.message,
              provider: 'stripe'
            },
            complianceRelevant: false
          });
        }
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata?.orderId;

        if (orderId) {
          await logAuditEvent({
            userId: paymentIntent.metadata?.userId || 'unknown',
            action: 'payment_webhook_canceled',
            entityType: 'service_order',
            entityId: orderId,
            orderId,
            req,
            metadata: {
              paymentIntentId: paymentIntent.id,
              provider: 'stripe'
            },
            complianceRelevant: false
          });
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        const orderId = charge.payment_intent;

        if (orderId) {
          // Find order by payment intent
          const { data: order } = await supabaseAdmin
            .from('service_orders')
            .select('id, user_id')
            .eq('id', orderId)
            .single();

          if (order) {
            await updateOrderStatus(orderId, 'refunded', 'paid');

            await logAuditEvent({
              userId: order.user_id,
              action: 'payment_refunded',
              entityType: 'service_order',
              entityId: orderId,
              orderId,
              req,
              metadata: {
                chargeId: charge.id,
                refundAmount: charge.amount_refunded,
                provider: 'stripe'
              },
              complianceRelevant: true
            });
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true, eventType: event.type });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 to prevent Stripe from retrying (we've logged the error)
    res.json({ received: true, error: 'Processing error logged' });
  }
});

/**
 * POST /api/confirm-payment
 * Confirm payment from frontend (for redirects and express checkout)
 */
router.post('/confirm-payment', authMiddleware, requirePermission('payment:own:confirm'), async (req, res) => {
  const { orderId, paymentIntentId } = req.body;
  const userId = req.userId;

  try {
    if (!orderId || !paymentIntentId) {
      return res.status(400).json({ 
        error: 'orderId and paymentIntentId are required',
        code: 'MISSING_PARAMS'
      });
    }

    // Load order and verify ownership
    const order = await loadOwnedOrder(orderId, userId);

    // Check if already paid
    if (order.status === 'paid' || order.status === 'completed') {
      return res.json({ 
        success: true,
        order,
        status: order.status,
        message: 'Order already paid'
      });
    }

    // Verify payment intent belongs to this order and user
    const paymentIntent = await verifyPaymentIntent(paymentIntentId, orderId, userId);

    // Verify payment succeeded
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        error: `Payment not completed. Status: ${paymentIntent.status}`,
        code: 'PAYMENT_NOT_COMPLETE',
        status: paymentIntent.status
      });
    }

    // Verify amount matches
    const expectedAmountCents = Math.round(Number(order.amount) * 100);
    if (paymentIntent.amount !== expectedAmountCents) {
      return res.status(400).json({ 
        error: 'Payment amount does not match order amount',
        code: 'AMOUNT_MISMATCH'
      });
    }

    // Update order status
    const updatedOrder = await updateOrderStatus(orderId, 'paid', order.status);

    // Create commission
    const amount = Number(paymentIntent.amount) / 100;
    await createCommissionIfNeeded(orderId, amount);

    // Log audit event
    await logAuditEvent({
      userId,
      action: 'payment_confirmed',
      entityType: 'service_order',
      entityId: orderId,
      orderId,
      req,
      metadata: {
        paymentIntentId,
        paymentStatus: paymentIntent.status,
        amount,
        provider: 'stripe'
      },
      complianceRelevant: true
    });

    res.json({ 
      success: true,
      order: updatedOrder,
      paymentStatus: paymentIntent.status
    });
  } catch (error) {
    console.error('Error confirming payment:', error);

    if (error.status === 404) {
      return res.status(404).json({ error: error.message, code: 'ORDER_NOT_FOUND' });
    }
    if (error.status === 403) {
      return res.status(403).json({ error: error.message, code: 'FORBIDDEN' });
    }
    if (error.status === 409) {
      return res.status(409).json({ error: error.message, code: 'CONFLICT' });
    }

    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

/**
 * POST /api/refund-payment
 * Issue a refund for a paid order (admin only)
 */
router.post('/refund-payment', authMiddleware, requirePermission('admin:payments:refund'), async (req, res) => {
  const { orderId, reason } = req.body;
  const userId = req.userId;

  try {
    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    // Load order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('service_orders')
      .select('id, user_id, status, amount')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'paid') {
      return res.status(400).json({ 
        error: 'Cannot refund an order that is not paid',
        code: 'NOT_PAID'
      });
    }

    // Find the payment intent for this order (we'd need to store this in the order)
    // For now, return an error indicating we need payment tracking
    return res.status(501).json({ 
      error: 'Refund requires payment intent ID tracking - not yet implemented',
      code: 'NOT_IMPLEMENTED'
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

/**
 * GET /api/payment-methods
 * List saved payment methods for the user
 */
router.get('/payment-methods', authMiddleware, async (req, res) => {
  const userId = req.userId;

  try {
    // Get customer's payment methods from Stripe
    // Note: You need to store Stripe customer ID in your users table
    // This is a placeholder implementation
    res.json({
      paymentMethods: [],
      message: 'Stripe Customer integration required'
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

export default router;
