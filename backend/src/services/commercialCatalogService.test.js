import { beforeEach, describe, expect, it, vi } from 'vitest';

const tables = {
  commercial_offers: [],
  commercial_prices: [],
  offer_entitlements: []
};

function applyOr(rows, expr) {
  // Only supports the single shape this service emits:
  // "effective_to.is.null,effective_to.gte.<iso>"
  const gteMatch = expr.match(/effective_to\.gte\.(.+)$/);
  const threshold = gteMatch ? gteMatch[1] : null;
  return rows.filter((row) => row.effective_to == null || (threshold && row.effective_to >= threshold));
}

function makeBuilder(table) {
  let rows = [...tables[table]];
  const builder = {
    select: () => builder,
    eq: (col, val) => {
      rows = rows.filter((row) => row[col] === val);
      return builder;
    },
    in: (col, vals) => {
      rows = rows.filter((row) => vals.includes(row[col]));
      return builder;
    },
    lte: (col, val) => {
      rows = rows.filter((row) => row[col] <= val);
      return builder;
    },
    or: (expr) => {
      rows = applyOr(rows, expr);
      return builder;
    },
    order: () => builder,
    limit: (n) => {
      rows = rows.slice(0, n);
      return builder;
    },
    maybeSingle: () => Promise.resolve({ data: rows[0] || null, error: null }),
    then: (resolve) => resolve({ data: rows, error: null })
  };
  return builder;
}

vi.mock('../config/supabase.js', () => ({
  supabaseAdmin: { from: vi.fn((table) => makeBuilder(table)) }
}));

const { listCommercialOffers, resolveOfferByCode } = await import('./commercialCatalogService.js');

function offerRow(overrides = {}) {
  return {
    id: overrides.id || 'offer-1',
    code: 'applicant_essential',
    audience: 'applicant',
    billing_model: 'one_time',
    name_es: 'Expediente Esencial',
    name_en: 'Essential Case File',
    description_es: null,
    description_en: null,
    active: true,
    publicly_visible: true,
    sort_order: 10,
    ...overrides
  };
}

function priceRow(overrides = {}) {
  return {
    id: overrides.id || 'price-1',
    offer_id: 'offer-1',
    currency: 'USD',
    amount_cents: 49500,
    is_custom_pricing: false,
    billing_interval: null,
    active: true,
    effective_from: '2026-01-01T00:00:00.000Z',
    effective_to: null,
    metadata: {},
    ...overrides
  };
}

describe('commercialCatalogService', () => {
  beforeEach(() => {
    tables.commercial_offers = [];
    tables.commercial_prices = [];
    tables.offer_entitlements = [];
  });

  it('rejects an invalid audience', async () => {
    await expect(listCommercialOffers({ audience: 'bogus' })).rejects.toThrow(/audience inválida/);
  });

  it('only returns active and publicly visible offers', async () => {
    tables.commercial_offers = [
      offerRow({ id: 'offer-1', active: true, publicly_visible: true }),
      offerRow({ id: 'offer-2', code: 'hidden_offer', active: false, publicly_visible: true }),
      offerRow({ id: 'offer-3', code: 'draft_offer', active: true, publicly_visible: false })
    ];
    tables.commercial_prices = [priceRow({ offer_id: 'offer-1' })];

    const offers = await listCommercialOffers();
    expect(offers.map((o) => o.code)).toEqual(['applicant_essential']);
  });

  it('filters by audience', async () => {
    tables.commercial_offers = [
      offerRow({ id: 'offer-1', audience: 'applicant' }),
      offerRow({ id: 'offer-2', code: 'grantor_business', audience: 'grantor' })
    ];
    tables.commercial_prices = [
      priceRow({ offer_id: 'offer-1' }),
      priceRow({ id: 'price-2', offer_id: 'offer-2' })
    ];

    const grantorOffers = await listCommercialOffers({ audience: 'grantor' });
    expect(grantorOffers.map((o) => o.code)).toEqual(['grantor_business']);
  });

  it('excludes an offer with no active price in the requested currency', async () => {
    tables.commercial_offers = [offerRow({ id: 'offer-1' })];
    tables.commercial_prices = [priceRow({ offer_id: 'offer-1', currency: 'MXN' })];

    const offers = await listCommercialOffers({ currency: 'USD' });
    expect(offers).toEqual([]);
  });

  it('excludes an offer whose price has expired', async () => {
    tables.commercial_offers = [offerRow({ id: 'offer-1' })];
    tables.commercial_prices = [
      priceRow({ offer_id: 'offer-1', effective_to: '2020-01-01T00:00:00.000Z' })
    ];

    const offers = await listCommercialOffers();
    expect(offers).toEqual([]);
  });

  it('attaches entitlements to the mapped offer', async () => {
    tables.commercial_offers = [offerRow({ id: 'offer-1' })];
    tables.commercial_prices = [priceRow({ offer_id: 'offer-1' })];
    tables.offer_entitlements = [
      { offer_id: 'offer-1', entitlement_key: 'analysis_units', limit_value: 10, unit: 'ua', reset_period: 'none' },
      { offer_id: 'offer-1', entitlement_key: 'package_validity_days', limit_value: 45, unit: 'days', reset_period: 'none' }
    ];

    const [offer] = await listCommercialOffers();
    expect(offer.entitlements).toEqual([
      { key: 'analysis_units', limitValue: 10, unit: 'ua', resetPeriod: 'none' },
      { key: 'package_validity_days', limitValue: 45, unit: 'days', resetPeriod: 'none' }
    ]);
    expect(offer.price).toEqual({
      currency: 'USD',
      amountCents: 49500,
      isCustomPricing: false,
      billingInterval: null,
      metadata: {}
    });
  });

  describe('resolveOfferByCode', () => {
    it('returns null for an unknown code', async () => {
      const offer = await resolveOfferByCode('does_not_exist');
      expect(offer).toBeNull();
    });

    it('returns null for an inactive offer even if the code matches', async () => {
      tables.commercial_offers = [offerRow({ id: 'offer-1', active: false })];
      const offer = await resolveOfferByCode('applicant_essential');
      expect(offer).toBeNull();
    });

    it('never trusts a client-supplied amount -- resolves price from the catalog only', async () => {
      tables.commercial_offers = [offerRow({ id: 'offer-1' })];
      tables.commercial_prices = [priceRow({ offer_id: 'offer-1', amount_cents: 49500 })];

      const offer = await resolveOfferByCode('applicant_essential');
      expect(offer.price.amountCents).toBe(49500);
    });
  });
});
