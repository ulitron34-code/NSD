import { beforeEach, describe, expect, it, vi } from 'vitest';

const tables = {
  commercial_offers: [],
  commercial_prices: [],
  billing_subscriptions: []
};

// Mismo builder perezoso usado en los tests de Fase 3/4, con `upsert`
// agregado: busca una fila existente por la columna `onConflict` y la
// actualiza in place, o inserta una nueva -- igual que el upsert real de
// supabase-js.
function makeBuilder(table) {
  const filters = [];
  let pendingUpdate = null;
  let pendingInsert = null;
  let pendingUpsert = null;

  function computeRows() {
    if (pendingUpsert) {
      const { payload, onConflict } = pendingUpsert;
      const existing = tables[table].find((row) => row[onConflict] === payload[onConflict]);
      if (existing) {
        Object.assign(existing, payload);
        return [existing];
      }
      const inserted = {
        id: `${table}-${tables[table].length + 1}`,
        created_at: '2026-08-01T00:00:00.000Z',
        updated_at: '2026-08-01T00:00:00.000Z',
        ...payload
      };
      tables[table].push(inserted);
      return [inserted];
    }

    if (pendingInsert) {
      const arr = Array.isArray(pendingInsert) ? pendingInsert : [pendingInsert];
      const inserted = arr.map((obj, i) => ({
        id: obj.id || `${table}-${tables[table].length + i + 1}`,
        created_at: '2026-08-01T00:00:00.000Z',
        updated_at: '2026-08-01T00:00:00.000Z',
        ...obj
      }));
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
    in: (col, vals) => {
      filters.push([col, vals, 'in']);
      return builder;
    },
    lte: () => builder,
    or: () => builder,
    order: () => builder,
    limit: () => builder,
    insert: (obj) => {
      pendingInsert = obj;
      return builder;
    },
    update: (patch) => {
      pendingUpdate = patch;
      return builder;
    },
    upsert: (payload, options) => {
      pendingUpsert = { payload, onConflict: options?.onConflict || 'id' };
      return builder;
    },
    maybeSingle: () => Promise.resolve({ data: computeRows()[0] || null, error: null }),
    single: () => Promise.resolve({ data: computeRows()[0] || null, error: null }),
    then: (resolve) => resolve({ data: computeRows(), error: null })
  };
  return builder;
}

vi.mock('../config/supabase.js', () => ({
  supabaseAdmin: { from: vi.fn((table) => makeBuilder(table)) }
}));

const {
  resolveGrantorOfferForCheckout,
  upsertSubscriptionFromStripeEvent,
  markSubscriptionCanceled,
  syncSubscriptionPeriodFromInvoice
} = await import('./grantorSubscriptionService.js');

function resetTables() {
  for (const key of Object.keys(tables)) tables[key] = [];
}

function givenGrantorOffer({
  offerId = 'offer-professional',
  code = 'grantor_professional',
  audience = 'grantor',
  amountCents = 49500,
  currency = 'USD',
  isCustomPricing = false,
  stripePriceId = 'price_test_123'
} = {}) {
  tables.commercial_offers.push({ id: offerId, code, audience, active: true });
  tables.commercial_prices.push({
    id: `${offerId}-price`,
    offer_id: offerId,
    currency,
    amount_cents: amountCents,
    is_custom_pricing: isCustomPricing,
    billing_interval: 'month',
    stripe_price_id: stripePriceId,
    active: true,
    effective_from: '2026-01-01T00:00:00.000Z',
    effective_to: null
  });
}

describe('grantorSubscriptionService', () => {
  beforeEach(() => {
    resetTables();
  });

  describe('resolveGrantorOfferForCheckout', () => {
    it('rejects an unknown or inactive offer code', async () => {
      await expect(resolveGrantorOfferForCheckout('does_not_exist')).rejects.toThrow(/no encontrada o inactiva/);
    });

    it('rejects an applicant-audience offer', async () => {
      givenGrantorOffer({ offerId: 'offer-essential', code: 'applicant_essential', audience: 'applicant' });
      await expect(resolveGrantorOfferForCheckout('applicant_essential')).rejects.toThrow(/no es un plan de otorgante/);
    });

    it('rejects custom-priced (SOW/contract) plans -- no self-serve checkout', async () => {
      givenGrantorOffer({ offerId: 'offer-institutional', code: 'grantor_institutional', isCustomPricing: true, stripePriceId: null });
      await expect(resolveGrantorOfferForCheckout('grantor_institutional')).rejects.toThrow(/propuesta comercial/);
    });

    it('rejects a plan whose price has no Stripe Price ID configured yet', async () => {
      givenGrantorOffer({ stripePriceId: null });
      await expect(resolveGrantorOfferForCheckout('grantor_professional')).rejects.toThrow(/Stripe Price ID/);
    });

    it('resolves the offer, price and Stripe Price ID from the catalog', async () => {
      givenGrantorOffer();
      const resolved = await resolveGrantorOfferForCheckout('grantor_professional');
      expect(resolved.stripePriceId).toBe('price_test_123');
      expect(resolved.amountCents).toBe(49500);
      expect(resolved.billingInterval).toBe('month');
    });
  });

  describe('upsertSubscriptionFromStripeEvent', () => {
    it('ignores a subscription with no billingAccountId/offerId metadata', async () => {
      await expect(
        upsertSubscriptionFromStripeEvent({ id: 'sub_1', status: 'active', metadata: {} })
      ).resolves.toBeNull();
    });

    it('inserts a new subscription row on first activation', async () => {
      const subscription = {
        id: 'sub_1',
        status: 'active',
        current_period_start: 1735689600,
        current_period_end: 1738368000,
        cancel_at_period_end: false,
        items: { data: [{ price: { id: 'price_test_123' }, quantity: 1 }] },
        metadata: { billingAccountId: 'acct-1', offerId: 'offer-professional' }
      };

      const upserted = await upsertSubscriptionFromStripeEvent(subscription);
      expect(upserted.billingAccountId).toBe('acct-1');
      expect(upserted.status).toBe('active');
      expect(upserted.stripeSubscriptionId).toBe('sub_1');
      expect(tables.billing_subscriptions).toHaveLength(1);
    });

    it('is idempotent: a repeat delivery for the same subscription updates the row instead of duplicating it', async () => {
      const subscription = {
        id: 'sub_1',
        status: 'active',
        current_period_start: 1735689600,
        current_period_end: 1738368000,
        cancel_at_period_end: false,
        items: { data: [{ price: { id: 'price_test_123' }, quantity: 1 }] },
        metadata: { billingAccountId: 'acct-1', offerId: 'offer-professional' }
      };

      await upsertSubscriptionFromStripeEvent(subscription);
      const updated = await upsertSubscriptionFromStripeEvent({ ...subscription, status: 'past_due' });

      expect(tables.billing_subscriptions).toHaveLength(1);
      expect(updated.status).toBe('past_due');
    });
  });

  describe('markSubscriptionCanceled', () => {
    it('sets status to canceled without deleting the row', async () => {
      tables.billing_subscriptions = [{ id: 'row-1', stripe_subscription_id: 'sub_1', status: 'active', cancel_at_period_end: true }];

      const canceled = await markSubscriptionCanceled({ id: 'sub_1' });
      expect(canceled.status).toBe('canceled');
      expect(canceled.cancelAtPeriodEnd).toBe(false);
      expect(tables.billing_subscriptions).toHaveLength(1);
    });
  });

  describe('syncSubscriptionPeriodFromInvoice', () => {
    it('returns null when the invoice has no subscription', async () => {
      await expect(syncSubscriptionPeriodFromInvoice({ subscription: null })).resolves.toBeNull();
    });

    it('returns null when the invoice carries no period information', async () => {
      await expect(syncSubscriptionPeriodFromInvoice({ subscription: 'sub_1', lines: { data: [] } })).resolves.toBeNull();
    });

    it('updates the current period from the invoice line period', async () => {
      tables.billing_subscriptions = [{ id: 'row-1', stripe_subscription_id: 'sub_1', status: 'active' }];

      const updated = await syncSubscriptionPeriodFromInvoice({
        subscription: 'sub_1',
        lines: { data: [{ period: { start: 1735689600, end: 1738368000 } }] }
      });

      expect(updated.currentPeriodStart).toBe(new Date(1735689600 * 1000).toISOString());
      expect(updated.currentPeriodEnd).toBe(new Date(1738368000 * 1000).toISOString());
    });
  });
});
