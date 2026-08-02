import express from 'express';
import { authMiddleware, requirePaymentAdmin } from '../middleware/auth.js';
import { getOrCreateIndividualAccount, attachStripeCustomer } from '../services/billingAccountService.js';
import { resolveEntitlements } from '../services/entitlementService.js';
import {
  createPendingPurchase,
  attachPaymentIntent,
  linkPurchaseToOrder,
  loadRefundablePurchase,
  markPurchaseRefunded
} from '../services/packagePurchaseService.js';
import { resolveGrantorOfferForCheckout } from '../services/grantorSubscriptionService.js';
import {
  createPackagePurchaseIntent,
  refundPackagePurchase,
  createStripeCustomer,
  createGrantorCheckoutSession
} from '../services/stripeBillingService.js';
import { logAuditEvent } from '../utils/audit.js';

const router = express.Router();

const BILLING_ACCOUNTS_ENABLED = String(process.env.BILLING_ACCOUNTS_ENABLED || 'false').toLowerCase() === 'true';
const APPLICANT_PACKAGE_PAYMENTS_ENABLED = String(process.env.APPLICANT_PACKAGE_PAYMENTS_ENABLED || 'false').toLowerCase() === 'true';
const GRANTOR_SUBSCRIPTIONS_ENABLED = String(process.env.GRANTOR_SUBSCRIPTIONS_ENABLED || 'false').toLowerCase() === 'true';

function requireFlag(req, res, next) {
  if (!BILLING_ACCOUNTS_ENABLED) {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
}

function requirePackagePaymentsFlag(req, res, next) {
  if (!APPLICANT_PACKAGE_PAYMENTS_ENABLED) {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
}

function requireGrantorSubscriptionsFlag(req, res, next) {
  if (!GRANTOR_SUBSCRIPTIONS_ENABLED) {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
}

// Mismo origen que ya usa CORS (server.js) -- reutilizado acá para no
// permitir que success_url/cancel_url de Checkout apunten a un dominio
// arbitrario que el cliente elija (Stripe redirige ahí después del pago).
function isAllowedRedirectUrl(url) {
  if (!url) return false;
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://127.0.0.1:5173,http://localhost:5173,https://nsd-pi.vercel.app')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  try {
    return allowedOrigins.includes(new URL(url).origin);
  } catch {
    return false;
  }
}

const PURCHASE_ERROR_STATUS_BY_CODE = {
  OFFER_NOT_FOUND: 404,
  OFFER_WRONG_AUDIENCE: 400,
  PRICE_NOT_FOUND: 404,
  CUSTOM_PRICING_REQUIRES_SOW: 409,
  BILLING_ACCOUNT_NOT_FOUND: 404,
  BILLING_ACCOUNT_ACCESS_DENIED: 403,
  ADDON_TARGET_REQUIRED: 400,
  ADDON_TARGET_NOT_FOUND: 404,
  ADDON_TARGET_NOT_ACTIVE: 409,
  PURCHASE_NOT_FOUND: 404,
  PURCHASE_ACCESS_DENIED: 403,
  PURCHASE_NOT_ACTIVE: 409,
  PURCHASE_ALREADY_LINKED: 409,
  PURCHASE_NOT_REFUNDABLE: 409,
  PURCHASE_NO_PAYMENT_INTENT: 409,
  ORDER_NOT_FOUND: 404,
  ORDER_ACCESS_DENIED: 403,
  STRIPE_PRICE_NOT_CONFIGURED: 409
};

function respondPurchaseError(res, error) {
  const status = PURCHASE_ERROR_STATUS_BY_CODE[error.code] || 400;
  res.status(status).json({ error: error.message, code: error.code });
}

// Fase 2 del plan comercial ("Cuentas y entitlements", modo lectura, sin
// cobrar). Cada usuario autenticado tiene como máximo una cuenta individual,
// creada perezosamente en su primera lectura -- no hay cobro ni asignación
// de suscripción/paquete real todavía (eso llega en Fase 4/5).
router.get('/billing/me', requireFlag, authMiddleware, async (req, res) => {
  try {
    const billingAccount = await getOrCreateIndividualAccount(req.userId);
    res.json({ billingAccount });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Devuelve los derechos resueltos de la cuenta del usuario autenticado.
// Sin usage_ledger todavía (Fase 6), `remaining` siempre iguala `limit` --
// no hay descuento de consumo que reportar hasta que exista esa pieza.
router.get('/billing/entitlements', requireFlag, authMiddleware, async (req, res) => {
  try {
    const billingAccount = await getOrCreateIndividualAccount(req.userId);
    const { entitlements } = await resolveEntitlements(billingAccount.id);
    res.json({ billingAccount, entitlements });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Fase 4 del plan comercial ("Paquetes del solicitante"). El precio nunca
// llega desde el cliente -- solo `offerCode`, que packagePurchaseService
// resuelve contra el catálogo. El PaymentIntent se crea aquí, pero la
// compra solo se activa (y acredita UA/vigencia) cuando llega el webhook de
// Stripe (payments.js), nunca por esta respuesta.
// `targetPurchaseId` (paso 6, Fase 4): presente solo para ofertas `addon_*`
// -- packagePurchaseService valida que sea una compra activa de la misma
// cuenta antes de cobrar nada, y su efecto (UA/vigencia) se aplica a esa
// compra en la activación, no a un grant independiente.
router.post('/billing/applicant/package-intent', requirePackagePaymentsFlag, authMiddleware, async (req, res) => {
  try {
    const { offerCode, currency, targetPurchaseId } = req.body || {};
    if (!offerCode) {
      return res.status(400).json({ error: 'offerCode es requerido' });
    }

    const billingAccount = await getOrCreateIndividualAccount(req.userId);
    const {
      purchase,
      amountCents,
      currency: resolvedCurrency,
      targetPurchaseId: resolvedTargetPurchaseId
    } = await createPendingPurchase({
      applicantUserId: req.userId,
      billingAccountId: billingAccount.id,
      offerCode,
      currency: currency || 'USD',
      targetPurchaseId: targetPurchaseId || null
    });

    const paymentIntent = await createPackagePurchaseIntent({
      purchaseId: purchase.id,
      amountCents,
      currency: resolvedCurrency,
      userId: req.userId,
      offerCode,
      targetPurchaseId: resolvedTargetPurchaseId
    });

    const updatedPurchase = await attachPaymentIntent(purchase.id, paymentIntent.id);

    await logAuditEvent({
      userId: req.userId,
      action: 'package_purchase_intent_created',
      entityType: 'package_purchase',
      entityId: purchase.id,
      req,
      metadata: {
        offerCode,
        amountCents,
        currency: resolvedCurrency,
        paymentIntentId: paymentIntent.id,
        targetPurchaseId: resolvedTargetPurchaseId
      },
      complianceRelevant: false
    });

    res.status(201).json({
      purchase: updatedPurchase,
      clientSecret: paymentIntent.client_secret,
      amountCents,
      currency: resolvedCurrency
    });
  } catch (error) {
    respondPurchaseError(res, error);
  }
});

// Paso 5, Fase 4: vincula una compra ya activa a un único expediente propio
// del comprador. No crea el expediente -- ese flujo vive en orders.js
// (fuera de alcance de esta fase); esta ruta solo conecta una compra
// existente con un service_order existente.
router.post('/billing/applicant/purchases/:purchaseId/link-order', requirePackagePaymentsFlag, authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.body || {};
    if (!orderId) {
      return res.status(400).json({ error: 'orderId es requerido' });
    }

    const purchase = await linkPurchaseToOrder({
      purchaseId: req.params.purchaseId,
      orderId,
      userId: req.userId
    });

    await logAuditEvent({
      userId: req.userId,
      action: 'package_purchase_linked_to_order',
      entityType: 'package_purchase',
      entityId: purchase.id,
      orderId: purchase.orderId,
      req,
      metadata: {},
      complianceRelevant: false
    });

    res.json({ purchase });
  } catch (error) {
    respondPurchaseError(res, error);
  }
});

// Paso 7, Fase 4: reembolso administrativo -- reversión usando el
// PaymentIntent persistido, nunca un monto reingresado a mano (sección 9.2).
// Solo administradores de pagos (mismo guard que backend/src/routes/payments.js).
router.post('/billing/admin/purchases/:purchaseId/refund', requirePackagePaymentsFlag, authMiddleware, requirePaymentAdmin, async (req, res) => {
  try {
    const purchase = await loadRefundablePurchase(req.params.purchaseId);
    const refund = await refundPackagePurchase(purchase.stripePaymentIntentId);
    const updatedPurchase = await markPurchaseRefunded(purchase.id);

    await logAuditEvent({
      userId: req.userId,
      action: 'package_purchase_refunded',
      entityType: 'package_purchase',
      entityId: purchase.id,
      orderId: purchase.orderId,
      req,
      metadata: { refundId: refund.id, paymentIntentId: purchase.stripePaymentIntentId },
      complianceRelevant: true
    });

    res.json({ purchase: updatedPurchase, refundId: refund.id });
  } catch (error) {
    respondPurchaseError(res, error);
  }
});

// Fase 5 del plan comercial ("Suscripciones del otorgante"), pasos 1-2. El
// Price ID se resuelve en servidor desde el catálogo -- nunca desde el
// cliente. La suscripción real solo se crea/actualiza cuando llega el
// webhook de Stripe (payments.js), nunca por esta respuesta: acá solo se
// abre la Checkout Session.
router.post('/billing/grantor/checkout-session', requireGrantorSubscriptionsFlag, authMiddleware, async (req, res) => {
  try {
    const { offerCode, currency, successUrl, cancelUrl } = req.body || {};
    if (!offerCode) {
      return res.status(400).json({ error: 'offerCode es requerido' });
    }
    if (!isAllowedRedirectUrl(successUrl) || !isAllowedRedirectUrl(cancelUrl)) {
      return res.status(400).json({ error: 'successUrl y cancelUrl deben apuntar a un origen permitido' });
    }

    let billingAccount = await getOrCreateIndividualAccount(req.userId);
    const resolved = await resolveGrantorOfferForCheckout(offerCode, currency || 'USD');

    let stripeCustomerId = billingAccount.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await createStripeCustomer({
        email: req.userProfile?.email || req.user?.email,
        billingAccountId: billingAccount.id
      });
      stripeCustomerId = customer.id;
      billingAccount = await attachStripeCustomer(billingAccount.id, stripeCustomerId);
    }

    const session = await createGrantorCheckoutSession({
      customerId: stripeCustomerId,
      priceId: resolved.stripePriceId,
      billingAccountId: billingAccount.id,
      offerId: resolved.offerId,
      offerCode,
      successUrl,
      cancelUrl
    });

    await logAuditEvent({
      userId: req.userId,
      action: 'grantor_checkout_session_created',
      entityType: 'billing_account',
      entityId: billingAccount.id,
      req,
      metadata: { offerCode, sessionId: session.id },
      complianceRelevant: false
    });

    res.status(201).json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (error) {
    respondPurchaseError(res, error);
  }
});

export default router;
