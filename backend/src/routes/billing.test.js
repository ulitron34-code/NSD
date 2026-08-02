import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../middleware/auth.js', () => ({
  authMiddleware: (req, res, next) => {
    req.userId = 'user-1';
    next();
  },
  requirePaymentAdmin: (req, res, next) => next()
}));

vi.mock('../services/billingAccountService.js', () => ({
  getOrCreateIndividualAccount: vi.fn(async (userId) => ({
    id: 'acct-1',
    accountType: 'individual',
    organizationName: null,
    ownerUserId: userId,
    stripeCustomerId: null,
    status: 'active'
  })),
  attachStripeCustomer: vi.fn(async (billingAccountId, stripeCustomerId) => ({
    id: billingAccountId,
    accountType: 'individual',
    organizationName: null,
    ownerUserId: 'user-1',
    stripeCustomerId,
    status: 'active'
  }))
}));

vi.mock('../services/grantorSubscriptionService.js', () => ({
  resolveGrantorOfferForCheckout: vi.fn(async (offerCode) => ({
    offerId: 'offer-professional',
    priceId: 'price-row-1',
    stripePriceId: 'price_test_123',
    amountCents: 49500,
    currency: 'USD',
    billingInterval: 'month'
  }))
}));

vi.mock('../services/entitlementService.js', () => ({
  resolveEntitlements: vi.fn(async () => ({
    entitlements: [{ key: 'analysis_units', limit: 10, remaining: 10, allowed: true, reasonCode: 'active_subscription' }]
  }))
}));

vi.mock('../services/packagePurchaseService.js', () => ({
  createPendingPurchase: vi.fn(async ({ offerCode, targetPurchaseId }) => ({
    purchase: { id: 'purchase-1', status: 'pending', offerId: 'offer-1' },
    amountCents: 49500,
    currency: 'USD',
    validityDays: 45,
    isAddon: Boolean(targetPurchaseId),
    targetPurchaseId: targetPurchaseId || null
  })),
  attachPaymentIntent: vi.fn(async (purchaseId, paymentIntentId) => ({
    id: purchaseId,
    status: 'pending',
    stripePaymentIntentId: paymentIntentId
  })),
  linkPurchaseToOrder: vi.fn(async ({ purchaseId, orderId }) => ({
    id: purchaseId,
    status: 'active',
    orderId
  })),
  loadRefundablePurchase: vi.fn(async (purchaseId) => ({
    id: purchaseId,
    status: 'active',
    orderId: null,
    stripePaymentIntentId: 'pi_test_123'
  })),
  markPurchaseRefunded: vi.fn(async (purchaseId) => ({
    id: purchaseId,
    status: 'refunded',
    orderId: null
  }))
}));

vi.mock('../services/stripeBillingService.js', () => ({
  createPackagePurchaseIntent: vi.fn(async ({ purchaseId }) => ({
    id: 'pi_test_123',
    client_secret: 'pi_test_123_secret'
  })),
  refundPackagePurchase: vi.fn(async (paymentIntentId) => ({
    id: 're_test_123',
    payment_intent: paymentIntentId,
    status: 'succeeded'
  })),
  createStripeCustomer: vi.fn(async ({ billingAccountId }) => ({
    id: 'cus_test_123',
    metadata: { billingAccountId }
  })),
  createGrantorCheckoutSession: vi.fn(async () => ({
    id: 'cs_test_123',
    url: 'https://checkout.stripe.com/c/pay/cs_test_123'
  }))
}));

vi.mock('../utils/audit.js', () => ({
  logAuditEvent: vi.fn(async () => {})
}));

function createApp(router) {
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  return app;
}

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${address.port}` });
    });
  });
}

describe('billing routes', () => {
  let server;
  let baseUrl;
  const originalEnv = process.env.BILLING_ACCOUNTS_ENABLED;
  const originalPackageFlag = process.env.APPLICANT_PACKAGE_PAYMENTS_ENABLED;
  const originalGrantorFlag = process.env.GRANTOR_SUBSCRIPTIONS_ENABLED;
  const originalCorsOrigin = process.env.CORS_ORIGIN;

  beforeEach(() => {
    // Los mocks de vi.mock() persisten entre tests dentro del mismo archivo
    // (vi.resetModules() no los reemplaza) -- sin esto, .mock.calls y los
    // asserts de "no llamado"/"llamado N veces" se contaminan entre tests.
    vi.clearAllMocks();
  });

  afterEach(() => {
    server?.close();
    process.env.BILLING_ACCOUNTS_ENABLED = originalEnv;
    process.env.APPLICANT_PACKAGE_PAYMENTS_ENABLED = originalPackageFlag;
    process.env.GRANTOR_SUBSCRIPTIONS_ENABLED = originalGrantorFlag;
    process.env.CORS_ORIGIN = originalCorsOrigin;
  });

  it('is fail-closed: GET /billing/me returns 404 when the flag is unset', async () => {
    delete process.env.BILLING_ACCOUNTS_ENABLED;
    vi.resetModules();
    const { default: router } = await import('./billing.js');
    ({ server, baseUrl } = await listen(createApp(router)));

    const response = await fetch(`${baseUrl}/api/billing/me`);
    expect(response.status).toBe(404);
  });

  it('is fail-closed: GET /billing/entitlements returns 404 when the flag is unset', async () => {
    delete process.env.BILLING_ACCOUNTS_ENABLED;
    vi.resetModules();
    const { default: router } = await import('./billing.js');
    ({ server, baseUrl } = await listen(createApp(router)));

    const response = await fetch(`${baseUrl}/api/billing/entitlements`);
    expect(response.status).toBe(404);
  });

  it('returns the caller\'s billing account once enabled', async () => {
    process.env.BILLING_ACCOUNTS_ENABLED = 'true';
    vi.resetModules();
    const { default: router } = await import('./billing.js');
    ({ server, baseUrl } = await listen(createApp(router)));

    const response = await fetch(`${baseUrl}/api/billing/me`);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.billingAccount).toEqual({
      id: 'acct-1',
      accountType: 'individual',
      organizationName: null,
      ownerUserId: 'user-1',
      stripeCustomerId: null,
      status: 'active'
    });
  });

  it('returns the resolved entitlements once enabled', async () => {
    process.env.BILLING_ACCOUNTS_ENABLED = 'true';
    vi.resetModules();
    const { default: router } = await import('./billing.js');
    ({ server, baseUrl } = await listen(createApp(router)));

    const response = await fetch(`${baseUrl}/api/billing/entitlements`);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.billingAccount.id).toBe('acct-1');
    expect(body.entitlements).toEqual([
      { key: 'analysis_units', limit: 10, remaining: 10, allowed: true, reasonCode: 'active_subscription' }
    ]);
  });

  it('responds 400 when the service throws', async () => {
    process.env.BILLING_ACCOUNTS_ENABLED = 'true';
    vi.resetModules();
    const billingAccountService = await import('../services/billingAccountService.js');
    billingAccountService.getOrCreateIndividualAccount.mockRejectedValueOnce(new Error('boom'));
    const { default: router } = await import('./billing.js');
    ({ server, baseUrl } = await listen(createApp(router)));

    const response = await fetch(`${baseUrl}/api/billing/me`);
    expect(response.status).toBe(400);
  });

  it('is fail-closed: POST /billing/applicant/package-intent returns 404 when its flag is unset', async () => {
    delete process.env.APPLICANT_PACKAGE_PAYMENTS_ENABLED;
    vi.resetModules();
    const { default: router } = await import('./billing.js');
    ({ server, baseUrl } = await listen(createApp(router)));

    const response = await fetch(`${baseUrl}/api/billing/applicant/package-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerCode: 'applicant_essential' })
    });
    expect(response.status).toBe(404);
  });

  it('creates a package purchase intent once enabled, never trusting a client-supplied amount', async () => {
    process.env.APPLICANT_PACKAGE_PAYMENTS_ENABLED = 'true';
    vi.resetModules();
    const { default: router } = await import('./billing.js');
    ({ server, baseUrl } = await listen(createApp(router)));

    const response = await fetch(`${baseUrl}/api/billing/applicant/package-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerCode: 'applicant_essential', amountCents: 1 })
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.clientSecret).toBe('pi_test_123_secret');
    expect(body.amountCents).toBe(49500);
    expect(body.purchase.stripePaymentIntentId).toBe('pi_test_123');
  });

  it('rejects package-intent creation without offerCode', async () => {
    process.env.APPLICANT_PACKAGE_PAYMENTS_ENABLED = 'true';
    vi.resetModules();
    const { default: router } = await import('./billing.js');
    ({ server, baseUrl } = await listen(createApp(router)));

    const response = await fetch(`${baseUrl}/api/billing/applicant/package-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    expect(response.status).toBe(400);
  });

  it('maps a known purchase error code to its HTTP status', async () => {
    process.env.APPLICANT_PACKAGE_PAYMENTS_ENABLED = 'true';
    vi.resetModules();
    const packagePurchaseService = await import('../services/packagePurchaseService.js');
    const err = new Error('Oferta no encontrada o inactiva');
    err.code = 'OFFER_NOT_FOUND';
    packagePurchaseService.createPendingPurchase.mockRejectedValueOnce(err);
    const { default: router } = await import('./billing.js');
    ({ server, baseUrl } = await listen(createApp(router)));

    const response = await fetch(`${baseUrl}/api/billing/applicant/package-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerCode: 'bogus' })
    });
    expect(response.status).toBe(404);
  });

  it('passes targetPurchaseId through for an addon package-intent', async () => {
    process.env.APPLICANT_PACKAGE_PAYMENTS_ENABLED = 'true';
    vi.resetModules();
    const { default: router } = await import('./billing.js');
    ({ server, baseUrl } = await listen(createApp(router)));

    const response = await fetch(`${baseUrl}/api/billing/applicant/package-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerCode: 'addon_ua_5', targetPurchaseId: 'base-purchase-1' })
    });

    expect(response.status).toBe(201);
    const stripeBillingService = await import('../services/stripeBillingService.js');
    const calls = stripeBillingService.createPackagePurchaseIntent.mock.calls;
    const [callArgs] = calls[calls.length - 1];
    expect(callArgs.targetPurchaseId).toBe('base-purchase-1');
  });

  describe('POST /billing/applicant/purchases/:purchaseId/link-order', () => {
    it('is fail-closed when the package payments flag is unset', async () => {
      delete process.env.APPLICANT_PACKAGE_PAYMENTS_ENABLED;
      vi.resetModules();
      const { default: router } = await import('./billing.js');
      ({ server, baseUrl } = await listen(createApp(router)));

      const response = await fetch(`${baseUrl}/api/billing/applicant/purchases/purchase-1/link-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'order-1' })
      });
      expect(response.status).toBe(404);
    });

    it('links a purchase to an order once enabled', async () => {
      process.env.APPLICANT_PACKAGE_PAYMENTS_ENABLED = 'true';
      vi.resetModules();
      const { default: router } = await import('./billing.js');
      ({ server, baseUrl } = await listen(createApp(router)));

      const response = await fetch(`${baseUrl}/api/billing/applicant/purchases/purchase-1/link-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'order-1' })
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.purchase.orderId).toBe('order-1');
    });

    it('rejects without orderId', async () => {
      process.env.APPLICANT_PACKAGE_PAYMENTS_ENABLED = 'true';
      vi.resetModules();
      const { default: router } = await import('./billing.js');
      ({ server, baseUrl } = await listen(createApp(router)));

      const response = await fetch(`${baseUrl}/api/billing/applicant/purchases/purchase-1/link-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      expect(response.status).toBe(400);
    });

    it('maps a known link error code to its HTTP status', async () => {
      process.env.APPLICANT_PACKAGE_PAYMENTS_ENABLED = 'true';
      vi.resetModules();
      const packagePurchaseService = await import('../services/packagePurchaseService.js');
      const err = new Error('Esta compra ya está vinculada a un expediente');
      err.code = 'PURCHASE_ALREADY_LINKED';
      packagePurchaseService.linkPurchaseToOrder.mockRejectedValueOnce(err);
      const { default: router } = await import('./billing.js');
      ({ server, baseUrl } = await listen(createApp(router)));

      const response = await fetch(`${baseUrl}/api/billing/applicant/purchases/purchase-1/link-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'order-2' })
      });
      expect(response.status).toBe(409);
    });
  });

  describe('POST /billing/admin/purchases/:purchaseId/refund', () => {
    it('is fail-closed when the package payments flag is unset', async () => {
      delete process.env.APPLICANT_PACKAGE_PAYMENTS_ENABLED;
      vi.resetModules();
      const { default: router } = await import('./billing.js');
      ({ server, baseUrl } = await listen(createApp(router)));

      const response = await fetch(`${baseUrl}/api/billing/admin/purchases/purchase-1/refund`, { method: 'POST' });
      expect(response.status).toBe(404);
    });

    it('refunds an active purchase once enabled', async () => {
      process.env.APPLICANT_PACKAGE_PAYMENTS_ENABLED = 'true';
      vi.resetModules();
      const { default: router } = await import('./billing.js');
      ({ server, baseUrl } = await listen(createApp(router)));

      const response = await fetch(`${baseUrl}/api/billing/admin/purchases/purchase-1/refund`, { method: 'POST' });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.purchase.status).toBe('refunded');
      expect(body.refundId).toBe('re_test_123');
    });

    it('maps a known refund error code to its HTTP status', async () => {
      process.env.APPLICANT_PACKAGE_PAYMENTS_ENABLED = 'true';
      vi.resetModules();
      const packagePurchaseService = await import('../services/packagePurchaseService.js');
      const err = new Error('Solo una compra activa puede reembolsarse');
      err.code = 'PURCHASE_NOT_REFUNDABLE';
      packagePurchaseService.loadRefundablePurchase.mockRejectedValueOnce(err);
      const { default: router } = await import('./billing.js');
      ({ server, baseUrl } = await listen(createApp(router)));

      const response = await fetch(`${baseUrl}/api/billing/admin/purchases/purchase-1/refund`, { method: 'POST' });
      expect(response.status).toBe(409);
    });
  });

  describe('POST /billing/grantor/checkout-session', () => {
    const validBody = {
      offerCode: 'grantor_professional',
      successUrl: 'https://nsd-pi.vercel.app/success',
      cancelUrl: 'https://nsd-pi.vercel.app/cancel'
    };

    it('is fail-closed when the grantor subscriptions flag is unset', async () => {
      delete process.env.GRANTOR_SUBSCRIPTIONS_ENABLED;
      vi.resetModules();
      const { default: router } = await import('./billing.js');
      ({ server, baseUrl } = await listen(createApp(router)));

      const response = await fetch(`${baseUrl}/api/billing/grantor/checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody)
      });
      expect(response.status).toBe(404);
    });

    it('rejects without offerCode', async () => {
      process.env.GRANTOR_SUBSCRIPTIONS_ENABLED = 'true';
      vi.resetModules();
      const { default: router } = await import('./billing.js');
      ({ server, baseUrl } = await listen(createApp(router)));

      const response = await fetch(`${baseUrl}/api/billing/grantor/checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ successUrl: validBody.successUrl, cancelUrl: validBody.cancelUrl })
      });
      expect(response.status).toBe(400);
    });

    it('rejects a successUrl/cancelUrl pointing outside the allowed origins', async () => {
      process.env.GRANTOR_SUBSCRIPTIONS_ENABLED = 'true';
      process.env.CORS_ORIGIN = 'https://nsd-pi.vercel.app';
      vi.resetModules();
      const { default: router } = await import('./billing.js');
      ({ server, baseUrl } = await listen(createApp(router)));

      const response = await fetch(`${baseUrl}/api/billing/grantor/checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validBody, successUrl: 'https://evil.example.com/success' })
      });
      expect(response.status).toBe(400);
    });

    it('creates a Stripe customer and a checkout session when the account has none yet', async () => {
      process.env.GRANTOR_SUBSCRIPTIONS_ENABLED = 'true';
      process.env.CORS_ORIGIN = 'https://nsd-pi.vercel.app';
      vi.resetModules();
      const { default: router } = await import('./billing.js');
      ({ server, baseUrl } = await listen(createApp(router)));

      const response = await fetch(`${baseUrl}/api/billing/grantor/checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody)
      });
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.checkoutUrl).toBe('https://checkout.stripe.com/c/pay/cs_test_123');

      const stripeBillingService = await import('../services/stripeBillingService.js');
      expect(stripeBillingService.createStripeCustomer).toHaveBeenCalledTimes(1);
    });

    it('reuses an existing Stripe customer instead of creating a new one', async () => {
      process.env.GRANTOR_SUBSCRIPTIONS_ENABLED = 'true';
      process.env.CORS_ORIGIN = 'https://nsd-pi.vercel.app';
      vi.resetModules();
      const billingAccountService = await import('../services/billingAccountService.js');
      billingAccountService.getOrCreateIndividualAccount.mockResolvedValueOnce({
        id: 'acct-1',
        accountType: 'individual',
        organizationName: null,
        ownerUserId: 'user-1',
        stripeCustomerId: 'cus_existing_1',
        status: 'active'
      });
      const { default: router } = await import('./billing.js');
      ({ server, baseUrl } = await listen(createApp(router)));

      const response = await fetch(`${baseUrl}/api/billing/grantor/checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody)
      });

      expect(response.status).toBe(201);
      const stripeBillingService = await import('../services/stripeBillingService.js');
      expect(stripeBillingService.createStripeCustomer).not.toHaveBeenCalled();
    });

    it('maps a known checkout error code to its HTTP status', async () => {
      process.env.GRANTOR_SUBSCRIPTIONS_ENABLED = 'true';
      process.env.CORS_ORIGIN = 'https://nsd-pi.vercel.app';
      vi.resetModules();
      const grantorSubscriptionService = await import('../services/grantorSubscriptionService.js');
      const err = new Error('El precio todavía no tiene un Stripe Price ID configurado');
      err.code = 'STRIPE_PRICE_NOT_CONFIGURED';
      grantorSubscriptionService.resolveGrantorOfferForCheckout.mockRejectedValueOnce(err);
      const { default: router } = await import('./billing.js');
      ({ server, baseUrl } = await listen(createApp(router)));

      const response = await fetch(`${baseUrl}/api/billing/grantor/checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody)
      });
      expect(response.status).toBe(409);
    });
  });
});
