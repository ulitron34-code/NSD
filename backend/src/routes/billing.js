import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getOrCreateIndividualAccount } from '../services/billingAccountService.js';
import { resolveEntitlements } from '../services/entitlementService.js';
import { createPendingPurchase, attachPaymentIntent } from '../services/packagePurchaseService.js';
import { createPackagePurchaseIntent } from '../services/stripeBillingService.js';
import { logAuditEvent } from '../utils/audit.js';

const router = express.Router();

const BILLING_ACCOUNTS_ENABLED = String(process.env.BILLING_ACCOUNTS_ENABLED || 'false').toLowerCase() === 'true';
const APPLICANT_PACKAGE_PAYMENTS_ENABLED = String(process.env.APPLICANT_PACKAGE_PAYMENTS_ENABLED || 'false').toLowerCase() === 'true';

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

const PURCHASE_ERROR_STATUS_BY_CODE = {
  OFFER_NOT_FOUND: 404,
  OFFER_WRONG_AUDIENCE: 400,
  PRICE_NOT_FOUND: 404,
  CUSTOM_PRICING_REQUIRES_SOW: 409,
  BILLING_ACCOUNT_NOT_FOUND: 404,
  BILLING_ACCOUNT_ACCESS_DENIED: 403
};

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
router.post('/billing/applicant/package-intent', requirePackagePaymentsFlag, authMiddleware, async (req, res) => {
  try {
    const { offerCode, currency } = req.body || {};
    if (!offerCode) {
      return res.status(400).json({ error: 'offerCode es requerido' });
    }

    const billingAccount = await getOrCreateIndividualAccount(req.userId);
    const { purchase, amountCents, currency: resolvedCurrency } = await createPendingPurchase({
      applicantUserId: req.userId,
      billingAccountId: billingAccount.id,
      offerCode,
      currency: currency || 'USD'
    });

    const paymentIntent = await createPackagePurchaseIntent({
      purchaseId: purchase.id,
      amountCents,
      currency: resolvedCurrency,
      userId: req.userId,
      offerCode
    });

    const updatedPurchase = await attachPaymentIntent(purchase.id, paymentIntent.id);

    await logAuditEvent({
      userId: req.userId,
      action: 'package_purchase_intent_created',
      entityType: 'package_purchase',
      entityId: purchase.id,
      req,
      metadata: { offerCode, amountCents, currency: resolvedCurrency, paymentIntentId: paymentIntent.id },
      complianceRelevant: false
    });

    res.status(201).json({
      purchase: updatedPurchase,
      clientSecret: paymentIntent.client_secret,
      amountCents,
      currency: resolvedCurrency
    });
  } catch (error) {
    const status = PURCHASE_ERROR_STATUS_BY_CODE[error.code] || 400;
    res.status(status).json({ error: error.message, code: error.code });
  }
});

export default router;
