import { beforeEach, describe, expect, it, vi } from 'vitest';

const tables = {
  billing_accounts: [],
  billing_account_members: [],
  commercial_offers: [],
  commercial_prices: [],
  offer_entitlements: [],
  package_purchases: [],
  service_orders: []
};

// Ver el comentario en caseSponsorshipService.test.js: filtros perezosos que
// se aplican al ejecutar, para que `.update(patch).eq('id', id)` funcione
// igual que en el query builder real de supabase-js.
function makeBuilder(table) {
  const filters = [];
  let pendingUpdate = null;
  let pendingInsert = null;

  function computeRows() {
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
  createPendingPurchase,
  attachPaymentIntent,
  activatePackagePurchaseFromPaymentIntent,
  linkPurchaseToOrder,
  loadRefundablePurchase,
  markPurchaseRefunded
} = await import('./packagePurchaseService.js');

function resetTables() {
  for (const key of Object.keys(tables)) tables[key] = [];
}

function givenApplicantOffer({
  offerId = 'offer-essential',
  code = 'applicant_essential',
  audience = 'applicant',
  amountCents = 49500,
  currency = 'USD',
  isCustomPricing = false,
  ua = 10,
  validityDays = 45
} = {}) {
  tables.commercial_offers.push({ id: offerId, code, audience, active: true });
  tables.commercial_prices.push({
    id: `${offerId}-price`,
    offer_id: offerId,
    currency,
    amount_cents: amountCents,
    is_custom_pricing: isCustomPricing,
    active: true,
    effective_from: '2026-01-01T00:00:00.000Z',
    effective_to: null
  });
  if (ua !== null) {
    tables.offer_entitlements.push({ offer_id: offerId, entitlement_key: 'analysis_units', limit_value: ua });
  }
  if (validityDays !== null) {
    tables.offer_entitlements.push({ offer_id: offerId, entitlement_key: 'package_validity_days', limit_value: validityDays });
  }
}

describe('packagePurchaseService', () => {
  beforeEach(() => {
    resetTables();
    tables.billing_accounts = [{ id: 'acct-1', owner_user_id: 'user-1', status: 'active' }];
  });

  describe('createPendingPurchase', () => {
    it('rejects a requester who is not a member of the billing account', async () => {
      givenApplicantOffer();
      await expect(
        createPendingPurchase({ applicantUserId: 'stranger', billingAccountId: 'acct-1', offerCode: 'applicant_essential' })
      ).rejects.toThrow(/Acceso denegado/);
    });

    it('rejects an unknown or inactive offer code', async () => {
      await expect(
        createPendingPurchase({ applicantUserId: 'user-1', billingAccountId: 'acct-1', offerCode: 'does_not_exist' })
      ).rejects.toThrow(/no encontrada o inactiva/);
    });

    it('rejects a grantor-audience offer', async () => {
      givenApplicantOffer({ offerId: 'offer-biz', code: 'grantor_business', audience: 'grantor' });
      await expect(
        createPendingPurchase({ applicantUserId: 'user-1', billingAccountId: 'acct-1', offerCode: 'grantor_business' })
      ).rejects.toThrow(/no es un paquete de solicitante/);
    });

    it('rejects when there is no active price in the requested currency', async () => {
      givenApplicantOffer({ currency: 'MXN' });
      await expect(
        createPendingPurchase({ applicantUserId: 'user-1', billingAccountId: 'acct-1', offerCode: 'applicant_essential', currency: 'USD' })
      ).rejects.toThrow(/no hay un precio activo/i);
    });

    it('rejects custom-priced (SOW) offers -- no self-serve PaymentIntent', async () => {
      givenApplicantOffer({ offerId: 'offer-managed', code: 'applicant_managed', isCustomPricing: true, ua: null, validityDays: null });
      await expect(
        createPendingPurchase({ applicantUserId: 'user-1', billingAccountId: 'acct-1', offerCode: 'applicant_managed' })
      ).rejects.toThrow(/propuesta administrada/);
    });

    it('creates a pending purchase with the price resolved from the catalog, never from the caller', async () => {
      givenApplicantOffer();

      const { purchase, amountCents, currency, validityDays } = await createPendingPurchase({
        applicantUserId: 'user-1',
        billingAccountId: 'acct-1',
        offerCode: 'applicant_essential'
      });

      expect(purchase.status).toBe('pending');
      expect(purchase.purchasedUa).toBe(10);
      expect(amountCents).toBe(49500);
      expect(currency).toBe('USD');
      expect(validityDays).toBe(45);
      expect(tables.package_purchases).toHaveLength(1);
    });
  });

  describe('attachPaymentIntent', () => {
    it('persists the Stripe PaymentIntent id on the purchase', async () => {
      givenApplicantOffer();
      const { purchase } = await createPendingPurchase({
        applicantUserId: 'user-1',
        billingAccountId: 'acct-1',
        offerCode: 'applicant_essential'
      });

      const updated = await attachPaymentIntent(purchase.id, 'pi_123');
      expect(updated.stripePaymentIntentId).toBe('pi_123');
    });
  });

  describe('activatePackagePurchaseFromPaymentIntent', () => {
    it('returns null when the PaymentIntent has no purchaseId metadata', async () => {
      await expect(activatePackagePurchaseFromPaymentIntent({ id: 'pi_1', metadata: {} })).resolves.toBeNull();
    });

    it('returns null when the referenced purchase does not exist', async () => {
      await expect(
        activatePackagePurchaseFromPaymentIntent({ id: 'pi_1', metadata: { purchaseId: 'missing' } })
      ).resolves.toBeNull();
    });

    it('activates a pending purchase, setting starts_at and expires_at from package_validity_days', async () => {
      givenApplicantOffer();
      const { purchase } = await createPendingPurchase({
        applicantUserId: 'user-1',
        billingAccountId: 'acct-1',
        offerCode: 'applicant_essential'
      });

      const activated = await activatePackagePurchaseFromPaymentIntent({
        id: 'pi_123',
        metadata: { purchaseId: purchase.id }
      });

      expect(activated.status).toBe('active');
      expect(activated.stripePaymentIntentId).toBe('pi_123');
      expect(activated.startsAt).toBeTruthy();
      expect(activated.expiresAt).toBeTruthy();
      expect(new Date(activated.expiresAt).getTime() - new Date(activated.startsAt).getTime()).toBeCloseTo(
        45 * 24 * 60 * 60 * 1000,
        -3
      );
    });

    it('sets expiresAt to null when the offer has no package_validity_days entitlement', async () => {
      givenApplicantOffer({ validityDays: null });
      const { purchase } = await createPendingPurchase({
        applicantUserId: 'user-1',
        billingAccountId: 'acct-1',
        offerCode: 'applicant_essential'
      });

      const activated = await activatePackagePurchaseFromPaymentIntent({
        id: 'pi_123',
        metadata: { purchaseId: purchase.id }
      });

      expect(activated.expiresAt).toBeNull();
    });

    it('is idempotent: a second webhook delivery for an already-active purchase is a no-op', async () => {
      givenApplicantOffer();
      const { purchase } = await createPendingPurchase({
        applicantUserId: 'user-1',
        billingAccountId: 'acct-1',
        offerCode: 'applicant_essential'
      });

      const first = await activatePackagePurchaseFromPaymentIntent({ id: 'pi_123', metadata: { purchaseId: purchase.id } });
      const second = await activatePackagePurchaseFromPaymentIntent({ id: 'pi_123', metadata: { purchaseId: purchase.id } });

      expect(second.startsAt).toBe(first.startsAt);
      expect(second.expiresAt).toBe(first.expiresAt);
    });
  });

  describe('add-ons extend an existing purchase instead of granting independently (paso 6)', () => {
    it('rejects an addon offer without a targetPurchaseId', async () => {
      givenApplicantOffer({ offerId: 'offer-addon', code: 'addon_ua_5', ua: 5, validityDays: null });

      await expect(
        createPendingPurchase({ applicantUserId: 'user-1', billingAccountId: 'acct-1', offerCode: 'addon_ua_5' })
      ).rejects.toThrow(/requiere targetPurchaseId/);
    });

    it('rejects an addon whose target purchase does not belong to the same billing account', async () => {
      givenApplicantOffer({ offerId: 'offer-addon', code: 'addon_ua_5', ua: 5, validityDays: null });
      tables.package_purchases.push({ id: 'other-purchase', billing_account_id: 'acct-2', status: 'active' });

      await expect(
        createPendingPurchase({
          applicantUserId: 'user-1',
          billingAccountId: 'acct-1',
          offerCode: 'addon_ua_5',
          targetPurchaseId: 'other-purchase'
        })
      ).rejects.toThrow(/no existe o no pertenece/);
    });

    it('rejects an addon targeting a purchase that is not active', async () => {
      givenApplicantOffer({ offerId: 'offer-addon', code: 'addon_ua_5', ua: 5, validityDays: null });
      tables.package_purchases.push({ id: 'target-1', billing_account_id: 'acct-1', status: 'pending' });

      await expect(
        createPendingPurchase({
          applicantUserId: 'user-1',
          billingAccountId: 'acct-1',
          offerCode: 'addon_ua_5',
          targetPurchaseId: 'target-1'
        })
      ).rejects.toThrow(/solo se puede extender/i);
    });

    it('adds UA to the target purchase and marks the addon as consumed, not independently active', async () => {
      givenApplicantOffer();
      const base = await createPendingPurchase({ applicantUserId: 'user-1', billingAccountId: 'acct-1', offerCode: 'applicant_essential' });
      const activeBase = await activatePackagePurchaseFromPaymentIntent({ id: 'pi_base', metadata: { purchaseId: base.purchase.id } });
      expect(activeBase.purchasedUa).toBe(10);

      givenApplicantOffer({ offerId: 'offer-addon-ua', code: 'addon_ua_5', ua: 5, validityDays: null });
      const addon = await createPendingPurchase({
        applicantUserId: 'user-1',
        billingAccountId: 'acct-1',
        offerCode: 'addon_ua_5',
        targetPurchaseId: activeBase.id
      });
      expect(addon.isAddon).toBe(true);
      expect(addon.targetPurchaseId).toBe(activeBase.id);

      const activatedAddon = await activatePackagePurchaseFromPaymentIntent({
        id: 'pi_addon',
        metadata: { purchaseId: addon.purchase.id, targetPurchaseId: activeBase.id }
      });

      expect(activatedAddon.status).toBe('consumed');
      const reloadedTarget = tables.package_purchases.find((row) => row.id === activeBase.id);
      expect(Number(reloadedTarget.purchased_ua)).toBe(15);
    });

    it('extends expires_at on the target purchase for an extension addon', async () => {
      givenApplicantOffer();
      const base = await createPendingPurchase({ applicantUserId: 'user-1', billingAccountId: 'acct-1', offerCode: 'applicant_essential' });
      const activeBase = await activatePackagePurchaseFromPaymentIntent({ id: 'pi_base', metadata: { purchaseId: base.purchase.id } });
      const originalExpiry = new Date(activeBase.expiresAt).getTime();

      givenApplicantOffer({ offerId: 'offer-addon-ext', code: 'addon_extension_30_essential', ua: null, validityDays: 30 });
      const addon = await createPendingPurchase({
        applicantUserId: 'user-1',
        billingAccountId: 'acct-1',
        offerCode: 'addon_extension_30_essential',
        targetPurchaseId: activeBase.id
      });

      await activatePackagePurchaseFromPaymentIntent({
        id: 'pi_ext',
        metadata: { purchaseId: addon.purchase.id, targetPurchaseId: activeBase.id }
      });

      const reloadedTarget = tables.package_purchases.find((row) => row.id === activeBase.id);
      expect(new Date(reloadedTarget.expires_at).getTime() - originalExpiry).toBeCloseTo(30 * 24 * 60 * 60 * 1000, -3);
    });

    it('is idempotent: a second webhook delivery for a consumed addon does not double-credit the target', async () => {
      givenApplicantOffer();
      const base = await createPendingPurchase({ applicantUserId: 'user-1', billingAccountId: 'acct-1', offerCode: 'applicant_essential' });
      const activeBase = await activatePackagePurchaseFromPaymentIntent({ id: 'pi_base', metadata: { purchaseId: base.purchase.id } });

      givenApplicantOffer({ offerId: 'offer-addon-ua2', code: 'addon_ua_5', ua: 5, validityDays: null });
      const addon = await createPendingPurchase({
        applicantUserId: 'user-1',
        billingAccountId: 'acct-1',
        offerCode: 'addon_ua_5',
        targetPurchaseId: activeBase.id
      });

      const event = { id: 'pi_addon_dup', metadata: { purchaseId: addon.purchase.id, targetPurchaseId: activeBase.id } };
      await activatePackagePurchaseFromPaymentIntent(event);
      await activatePackagePurchaseFromPaymentIntent(event);

      const reloadedTarget = tables.package_purchases.find((row) => row.id === activeBase.id);
      expect(Number(reloadedTarget.purchased_ua)).toBe(15);
    });
  });

  describe('linkPurchaseToOrder (paso 5)', () => {
    async function givenActivePurchase() {
      givenApplicantOffer();
      const { purchase } = await createPendingPurchase({ applicantUserId: 'user-1', billingAccountId: 'acct-1', offerCode: 'applicant_essential' });
      return activatePackagePurchaseFromPaymentIntent({ id: 'pi_link', metadata: { purchaseId: purchase.id } });
    }

    it('links an active purchase to an expediente owned by the same user', async () => {
      const active = await givenActivePurchase();
      tables.service_orders = [{ id: 'order-1', user_id: 'user-1' }];

      const linked = await linkPurchaseToOrder({ purchaseId: active.id, orderId: 'order-1', userId: 'user-1' });
      expect(linked.orderId).toBe('order-1');
    });

    it('rejects linking a purchase that does not belong to the caller', async () => {
      const active = await givenActivePurchase();
      tables.service_orders = [{ id: 'order-1', user_id: 'user-1' }];

      await expect(
        linkPurchaseToOrder({ purchaseId: active.id, orderId: 'order-1', userId: 'stranger' })
      ).rejects.toThrow(/Acceso denegado a esta compra/);
    });

    it('rejects linking a pending (not yet active) purchase', async () => {
      givenApplicantOffer();
      const { purchase } = await createPendingPurchase({ applicantUserId: 'user-1', billingAccountId: 'acct-1', offerCode: 'applicant_essential' });
      tables.service_orders = [{ id: 'order-1', user_id: 'user-1' }];

      await expect(
        linkPurchaseToOrder({ purchaseId: purchase.id, orderId: 'order-1', userId: 'user-1' })
      ).rejects.toThrow(/Solo una compra activa/);
    });

    it('rejects linking to an expediente owned by a different user', async () => {
      const active = await givenActivePurchase();
      tables.service_orders = [{ id: 'order-1', user_id: 'someone-else' }];

      await expect(
        linkPurchaseToOrder({ purchaseId: active.id, orderId: 'order-1', userId: 'user-1' })
      ).rejects.toThrow(/Acceso denegado a este expediente/);
    });

    it('rejects re-linking a purchase that is already linked -- one package, one expediente', async () => {
      const active = await givenActivePurchase();
      tables.service_orders = [
        { id: 'order-1', user_id: 'user-1' },
        { id: 'order-2', user_id: 'user-1' }
      ];

      await linkPurchaseToOrder({ purchaseId: active.id, orderId: 'order-1', userId: 'user-1' });

      await expect(
        linkPurchaseToOrder({ purchaseId: active.id, orderId: 'order-2', userId: 'user-1' })
      ).rejects.toThrow(/ya está vinculada/);
    });
  });

  describe('refund (paso 7)', () => {
    it('loadRefundablePurchase rejects a purchase that is not active', async () => {
      givenApplicantOffer();
      const { purchase } = await createPendingPurchase({ applicantUserId: 'user-1', billingAccountId: 'acct-1', offerCode: 'applicant_essential' });

      await expect(loadRefundablePurchase(purchase.id)).rejects.toThrow(/Solo una compra activa puede reembolsarse/);
    });

    it('loadRefundablePurchase rejects an active purchase with no PaymentIntent on record', async () => {
      tables.package_purchases.push({ id: 'no-pi', billing_account_id: 'acct-1', status: 'active', stripe_payment_intent_id: null });

      await expect(loadRefundablePurchase('no-pi')).rejects.toThrow(/no tiene un cobro de Stripe/);
    });

    it('markPurchaseRefunded reverts status and cuts expires_at without deleting history', async () => {
      givenApplicantOffer();
      const { purchase } = await createPendingPurchase({ applicantUserId: 'user-1', billingAccountId: 'acct-1', offerCode: 'applicant_essential' });
      const active = await activatePackagePurchaseFromPaymentIntent({ id: 'pi_refund', metadata: { purchaseId: purchase.id } });

      const refunded = await markPurchaseRefunded(active.id);

      expect(refunded.status).toBe('refunded');
      expect(new Date(refunded.expiresAt).getTime()).toBeLessThanOrEqual(Date.now());
      expect(tables.package_purchases.find((row) => row.id === active.id)).toBeTruthy();
    });
  });
});
