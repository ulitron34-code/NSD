import express from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../middleware/auth.js', () => ({
  authMiddleware: (req, res, next) => {
    req.userId = 'user-1';
    next();
  }
}));

vi.mock('../services/billingAccountService.js', () => ({
  getOrCreateIndividualAccount: vi.fn(async (userId) => ({
    id: 'acct-1',
    accountType: 'individual',
    organizationName: null,
    ownerUserId: userId,
    status: 'active'
  }))
}));

vi.mock('../services/entitlementService.js', () => ({
  resolveEntitlements: vi.fn(async () => ({
    entitlements: [{ key: 'analysis_units', limit: 10, remaining: 10, allowed: true, reasonCode: 'active_subscription' }]
  }))
}));

vi.mock('../services/packagePurchaseService.js', () => ({
  createPendingPurchase: vi.fn(async ({ offerCode }) => ({
    purchase: { id: 'purchase-1', status: 'pending', offerId: 'offer-1' },
    amountCents: 49500,
    currency: 'USD',
    validityDays: 45
  })),
  attachPaymentIntent: vi.fn(async (purchaseId, paymentIntentId) => ({
    id: purchaseId,
    status: 'pending',
    stripePaymentIntentId: paymentIntentId
  }))
}));

vi.mock('../services/stripeBillingService.js', () => ({
  createPackagePurchaseIntent: vi.fn(async ({ purchaseId }) => ({
    id: 'pi_test_123',
    client_secret: 'pi_test_123_secret'
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

  afterEach(() => {
    server?.close();
    process.env.BILLING_ACCOUNTS_ENABLED = originalEnv;
    process.env.APPLICANT_PACKAGE_PAYMENTS_ENABLED = originalPackageFlag;
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
});
