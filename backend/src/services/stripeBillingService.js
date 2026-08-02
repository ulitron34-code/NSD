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
