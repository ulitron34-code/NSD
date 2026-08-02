import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const tables = {
  service_orders: [],
  commissions: []
};

// Mismo builder perezoso usado en los tests de Fase 3/4: los filtros se
// acumulan y se aplican al ejecutar, para que `.update(patch).eq(...)`
// funcione igual que el query builder real de supabase-js.
function makeBuilder(table) {
  const filters = [];
  let pendingUpdate = null;
  let pendingInsert = null;

  function computeRows() {
    if (pendingInsert) {
      const arr = Array.isArray(pendingInsert) ? pendingInsert : [pendingInsert];
      const inserted = arr.map((obj, i) => ({ id: obj.id || `${table}-${tables[table].length + i + 1}`, ...obj }));
      tables[table].push(...inserted);
      return inserted;
    }

    let rows = tables[table].filter((row) =>
      filters.every(([col, val, op]) => (op === 'in' ? val.includes(row[col]) : row[col] === val))
    );
    if (pendingUpdate) {
      rows.forEach((row) => Object.assign(row, pendingUpdate));
    }
    return rows;
  }

  const builder = {
    select: () => builder,
    eq: (col, val) => {
      filters.push([col, val, 'eq']);
      return builder;
    },
    limit: () => builder,
    insert: (obj) => {
      pendingInsert = obj;
      return builder;
    },
    update: (patch) => {
      pendingUpdate = patch;
      return builder;
    },
    single: () => Promise.resolve({ data: computeRows()[0] || null, error: null, count: null }),
    then: (resolve) => resolve({ data: computeRows(), error: null })
  };
  return builder;
}

vi.mock('../config/supabase.js', () => ({
  supabaseAdmin: { from: vi.fn((table) => makeBuilder(table)) }
}));

vi.mock('../utils/audit.js', () => ({
  logAuditEvent: vi.fn(async () => {})
}));

vi.mock('../services/packagePurchaseService.js', () => ({
  activatePackagePurchaseFromPaymentIntent: vi.fn(async () => null)
}));

vi.mock('../services/grantorSubscriptionService.js', () => ({
  upsertSubscriptionFromStripeEvent: vi.fn(async () => null),
  markSubscriptionCanceled: vi.fn(async () => null),
  syncSubscriptionPeriodFromInvoice: vi.fn(async () => null)
}));

const constructEventMock = vi.fn((body) => JSON.parse(body.toString()));

vi.mock('stripe', () => ({
  default: vi.fn(function StripeMock() {
    return {
      webhooks: { constructEvent: constructEventMock },
      paymentIntents: { retrieve: vi.fn(), create: vi.fn(), cancel: vi.fn() }
    };
  })
}));

process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_dummy';

const { default: router } = await import('./payments.js');
const { logAuditEvent } = await import('../utils/audit.js');
const { activatePackagePurchaseFromPaymentIntent } = await import('../services/packagePurchaseService.js');
const { upsertSubscriptionFromStripeEvent, markSubscriptionCanceled, syncSubscriptionPeriodFromInvoice } =
  await import('../services/grantorSubscriptionService.js');

function createApp() {
  const app = express();
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

function postWebhook(baseUrl, event) {
  return fetch(`${baseUrl}/api/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': 'test-signature' },
    body: JSON.stringify(event)
  });
}

describe('POST /api/webhook', () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    tables.service_orders = [];
    tables.commissions = [];
    logAuditEvent.mockClear();
    activatePackagePurchaseFromPaymentIntent.mockClear();
    activatePackagePurchaseFromPaymentIntent.mockResolvedValue(null);
    upsertSubscriptionFromStripeEvent.mockClear();
    upsertSubscriptionFromStripeEvent.mockResolvedValue(null);
    markSubscriptionCanceled.mockClear();
    markSubscriptionCanceled.mockResolvedValue(null);
    syncSubscriptionPeriodFromInvoice.mockClear();
    syncSubscriptionPeriodFromInvoice.mockResolvedValue(null);
    ({ server, baseUrl } = await listen(createApp()));
  });

  afterEach(() => {
    server?.close();
  });

  it('still marks a legacy service_order as paid (package purchase branch does not run)', async () => {
    tables.service_orders = [{ id: 'order-1', status: 'pending', user_id: 'user-1', amount: 495 }];

    const response = await postWebhook(baseUrl, {
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_legacy', amount: 49500, currency: 'usd', metadata: { orderId: 'order-1', userId: 'user-1' } } }
    });

    expect(response.status).toBe(200);
    expect(tables.service_orders.find((o) => o.id === 'order-1').status).toBe('paid');
    expect(activatePackagePurchaseFromPaymentIntent).not.toHaveBeenCalled();

  });

  it('routes a package_purchase PaymentIntent to activatePackagePurchaseFromPaymentIntent instead of the legacy order flow', async () => {
    activatePackagePurchaseFromPaymentIntent.mockResolvedValueOnce({
      id: 'purchase-1',
      purchaserUserId: 'user-1',
      offerId: 'offer-1',
      status: 'active'
    });

    const response = await postWebhook(baseUrl, {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_package_1',
          amount: 49500,
          currency: 'usd',
          metadata: { type: 'package_purchase', purchaseId: 'purchase-1', userId: 'user-1' }
        }
      }
    });

    expect(response.status).toBe(200);
    expect(activatePackagePurchaseFromPaymentIntent).toHaveBeenCalledTimes(1);
    expect(tables.service_orders).toHaveLength(0);

    const auditActions = logAuditEvent.mock.calls.map(([call]) => call.action);
    expect(auditActions).toContain('package_purchase_activated');

  });

  it('is a no-op when the package purchase cannot be resolved (e.g. duplicate or unknown webhook)', async () => {
    activatePackagePurchaseFromPaymentIntent.mockResolvedValueOnce(null);

    const response = await postWebhook(baseUrl, {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_package_2',
          amount: 49500,
          currency: 'usd',
          metadata: { type: 'package_purchase', purchaseId: 'unknown' }
        }
      }
    });

    expect(response.status).toBe(200);
    const auditActions = logAuditEvent.mock.calls.map(([call]) => call.action);
    expect(auditActions).not.toContain('package_purchase_activated');

  });

  it('logs checkout.session.completed only for a grantor_subscription session', async () => {
    const response = await postWebhook(baseUrl, {
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_1', metadata: { type: 'grantor_subscription', billingAccountId: 'acct-1', offerCode: 'grantor_professional' } } }
    });

    expect(response.status).toBe(200);
    const auditActions = logAuditEvent.mock.calls.map(([call]) => call.action);
    expect(auditActions).toContain('grantor_checkout_completed');
  });

  it('ignores checkout.session.completed for a non-subscription session', async () => {
    const response = await postWebhook(baseUrl, {
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_2', metadata: {} } }
    });

    expect(response.status).toBe(200);
    const auditActions = logAuditEvent.mock.calls.map(([call]) => call.action);
    expect(auditActions).not.toContain('grantor_checkout_completed');
  });

  it('upserts a grantor subscription on customer.subscription.created', async () => {
    upsertSubscriptionFromStripeEvent.mockResolvedValueOnce({ id: 'sub-row-1', status: 'active' });

    const response = await postWebhook(baseUrl, {
      type: 'customer.subscription.created',
      data: { object: { id: 'sub_1', status: 'active', metadata: { type: 'grantor_subscription', billingAccountId: 'acct-1', offerId: 'offer-1' } } }
    });

    expect(response.status).toBe(200);
    expect(upsertSubscriptionFromStripeEvent).toHaveBeenCalledTimes(1);
    const auditActions = logAuditEvent.mock.calls.map(([call]) => call.action);
    expect(auditActions).toContain('grantor_subscription_upserted');
  });

  it('upserts a grantor subscription on customer.subscription.updated (e.g. transition to past_due)', async () => {
    upsertSubscriptionFromStripeEvent.mockResolvedValueOnce({ id: 'sub-row-1', status: 'past_due' });

    const response = await postWebhook(baseUrl, {
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_1', status: 'past_due', metadata: { type: 'grantor_subscription', billingAccountId: 'acct-1', offerId: 'offer-1' } } }
    });

    expect(response.status).toBe(200);
    expect(upsertSubscriptionFromStripeEvent).toHaveBeenCalledTimes(1);
  });

  it('ignores subscription events with no grantor_subscription metadata', async () => {
    const response = await postWebhook(baseUrl, {
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_1', status: 'active', metadata: {} } }
    });

    expect(response.status).toBe(200);
    expect(upsertSubscriptionFromStripeEvent).not.toHaveBeenCalled();
  });

  it('marks a grantor subscription canceled on customer.subscription.deleted', async () => {
    markSubscriptionCanceled.mockResolvedValueOnce({ id: 'sub-row-1', status: 'canceled' });

    const response = await postWebhook(baseUrl, {
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_1', metadata: { type: 'grantor_subscription', billingAccountId: 'acct-1', offerId: 'offer-1' } } }
    });

    expect(response.status).toBe(200);
    expect(markSubscriptionCanceled).toHaveBeenCalledTimes(1);
    const auditActions = logAuditEvent.mock.calls.map(([call]) => call.action);
    expect(auditActions).toContain('grantor_subscription_canceled');
  });

  it('syncs the subscription period on invoice.paid', async () => {
    const response = await postWebhook(baseUrl, {
      type: 'invoice.paid',
      data: { object: { id: 'in_1', subscription: 'sub_1', lines: { data: [{ period: { start: 1, end: 2 } }] } } }
    });

    expect(response.status).toBe(200);
    expect(syncSubscriptionPeriodFromInvoice).toHaveBeenCalledTimes(1);
  });

  it('does not sync when invoice.paid has no subscription', async () => {
    const response = await postWebhook(baseUrl, {
      type: 'invoice.paid',
      data: { object: { id: 'in_1', subscription: null } }
    });

    expect(response.status).toBe(200);
    expect(syncSubscriptionPeriodFromInvoice).not.toHaveBeenCalled();
  });

  it('logs invoice.payment_failed for a subscription invoice', async () => {
    const response = await postWebhook(baseUrl, {
      type: 'invoice.payment_failed',
      data: { object: { id: 'in_2', subscription: 'sub_1' } }
    });

    expect(response.status).toBe(200);
    const auditActions = logAuditEvent.mock.calls.map(([call]) => call.action);
    expect(auditActions).toContain('grantor_invoice_payment_failed');
  });
});
