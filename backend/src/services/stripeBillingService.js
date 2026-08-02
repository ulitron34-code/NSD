import Stripe from 'stripe';

const STRIPE_API_VERSION = '2024-11-20.acacia';

// Init perezoso (a diferencia de backend/src/routes/payments.js, que crea el
// cliente Stripe al importar el módulo y revienta si falta la env var): eso
// hace que este servicio se pueda importar y testear sin STRIPE_SECRET_KEY
// presente -- el error solo ocurre si de verdad se intenta crear un
// PaymentIntent con el flag encendido y sin la clave configurada.
let stripeClient = null;

function getStripeClient() {
  if (stripeClient) return stripeClient;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }

  stripeClient = new Stripe(key, { apiVersion: STRIPE_API_VERSION, typescript: false });
  return stripeClient;
}

// Idempotencia por purchaseId (sección 12, Fase 4, paso 3): un reintento del
// mismo checkout para la misma compra pendiente no crea un segundo cargo --
// Stripe devuelve el PaymentIntent original para la misma idempotencyKey.
// metadata.type distingue este flujo del legacy de service_orders en
// payments.js sin tocar su código. `targetPurchaseId` (paso 6) marca que
// esta compra es un adicional -- packagePurchaseService lo usa en la
// activación para sumar UA/vigencia a esa compra en vez de crear un grant
// independiente.
export async function createPackagePurchaseIntent({ purchaseId, amountCents, currency, userId, offerCode, targetPurchaseId = null }) {
  if (!purchaseId) throw new Error('purchaseId es requerido');
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw new Error('amountCents debe ser un monto positivo resuelto en servidor');
  }

  const stripe = getStripeClient();

  return stripe.paymentIntents.create(
    {
      amount: amountCents,
      currency: String(currency || 'usd').toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: 'package_purchase',
        purchaseId,
        userId,
        offerCode,
        ...(targetPurchaseId ? { targetPurchaseId } : {})
      },
      description: `NUXERA package purchase ${purchaseId}`
    },
    { idempotencyKey: `package_purchase_${purchaseId}` }
  );
}

// Paso 7, Fase 4: reembolso administrativo usando el PaymentIntent
// persistido (sección 9.2 del plan: "implementar reembolso usando el
// PaymentIntent persistido"), nunca un monto reingresado a mano.
export async function refundPackagePurchase(paymentIntentId) {
  if (!paymentIntentId) throw new Error('paymentIntentId es requerido');

  const stripe = getStripeClient();
  return stripe.refunds.create({ payment_intent: paymentIntentId });
}

// Fase 5, paso 1: un Stripe Customer por cuenta de facturación, creado una
// sola vez (billingAccountService.attachStripeCustomer persiste el id para
// que las próximas suscripciones reutilicen el mismo customer).
export async function createStripeCustomer({ email, billingAccountId }) {
  if (!billingAccountId) throw new Error('billingAccountId es requerido');

  const stripe = getStripeClient();
  return stripe.customers.create({
    email: email || undefined,
    metadata: { billingAccountId }
  });
}

// Fase 5, paso 2: Checkout Session en modo suscripción, con el Price ID
// resuelto en servidor (grantorSubscriptionService.resolveGrantorOfferForCheckout)
// -- nunca un precio que llegue del cliente. La metadata va tanto en la
// Session como en subscription_data.metadata: Stripe no copia la metadata
// de la Session al objeto Subscription automáticamente, y los webhooks de
// ciclo (customer.subscription.*) necesitan encontrar billingAccountId/offerId
// ahí para saber a qué cuenta acreditar.
export async function createGrantorCheckoutSession({
  customerId,
  priceId,
  billingAccountId,
  offerId,
  offerCode,
  successUrl,
  cancelUrl
}) {
  if (!customerId) throw new Error('customerId es requerido');
  if (!priceId) throw new Error('priceId es requerido');
  if (!successUrl || !cancelUrl) throw new Error('successUrl y cancelUrl son requeridos');

  const stripe = getStripeClient();
  const metadata = { type: 'grantor_subscription', billingAccountId, offerId, offerCode };

  return stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata,
    subscription_data: { metadata },
    success_url: successUrl,
    cancel_url: cancelUrl
  });
}
