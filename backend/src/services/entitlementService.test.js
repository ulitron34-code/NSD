import { beforeEach, describe, expect, it, vi } from 'vitest';

const tables = {
  billing_accounts: [],
  billing_account_members: [],
  billing_subscriptions: [],
  package_purchases: [],
  offer_entitlements: []
};

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
    maybeSingle: () => Promise.resolve({ data: rows[0] || null, error: null }),
    then: (resolve) => resolve({ data: rows, error: null })
  };
  return builder;
}

vi.mock('../config/supabase.js', () => ({
  supabaseAdmin: { from: vi.fn((table) => makeBuilder(table)) }
}));

const { resolveEntitlements, resolveEntitlementsForUser } = await import('./entitlementService.js');

describe('entitlementService', () => {
  beforeEach(() => {
    tables.billing_accounts = [];
    tables.billing_account_members = [];
    tables.billing_subscriptions = [];
    tables.package_purchases = [];
    tables.offer_entitlements = [];
  });

  describe('resolveEntitlements', () => {
    it('returns no entitlements when the account has no active subscription or purchase', async () => {
      const { entitlements } = await resolveEntitlements('acct-1');
      expect(entitlements).toEqual([]);
    });

    it('resolves entitlements from an active subscription with remaining equal to limit', async () => {
      tables.billing_subscriptions = [
        { id: 'sub-1', billing_account_id: 'acct-1', offer_id: 'offer-1', status: 'active' }
      ];
      tables.offer_entitlements = [
        { offer_id: 'offer-1', entitlement_key: 'analysis_units', limit_value: 65, unit: 'ua', reset_period: 'billing_cycle' }
      ];

      const { entitlements } = await resolveEntitlements('acct-1');
      expect(entitlements).toEqual([
        {
          key: 'analysis_units',
          limit: 65,
          remaining: 65,
          unit: 'ua',
          resetPeriod: 'billing_cycle',
          allowed: true,
          source: { type: 'subscription', id: 'sub-1', offerId: 'offer-1' },
          reasonCode: 'active_subscription'
        }
      ]);
    });

    it('ignores a canceled subscription', async () => {
      tables.billing_subscriptions = [
        { id: 'sub-1', billing_account_id: 'acct-1', offer_id: 'offer-1', status: 'canceled' }
      ];
      tables.offer_entitlements = [
        { offer_id: 'offer-1', entitlement_key: 'analysis_units', limit_value: 65, unit: 'ua', reset_period: 'billing_cycle' }
      ];

      const { entitlements } = await resolveEntitlements('acct-1');
      expect(entitlements).toEqual([]);
    });

    it('marks a past_due subscription entitlement as not allowed, suspending new operations (Fase 5, paso 6)', async () => {
      tables.billing_subscriptions = [
        { id: 'sub-1', billing_account_id: 'acct-1', offer_id: 'offer-1', status: 'past_due' }
      ];
      tables.offer_entitlements = [
        { offer_id: 'offer-1', entitlement_key: 'active_cases', limit_value: 20, unit: 'cases', reset_period: 'none' }
      ];

      const { entitlements } = await resolveEntitlements('acct-1');
      expect(entitlements).toEqual([
        {
          key: 'active_cases',
          limit: 20,
          remaining: null,
          unit: 'cases',
          resetPeriod: 'none',
          allowed: false,
          source: { type: 'subscription', id: 'sub-1', offerId: 'offer-1' },
          reasonCode: 'subscription_past_due'
        }
      ]);
    });

    it('resolves entitlements from an active, unexpired package purchase', async () => {
      tables.package_purchases = [
        {
          id: 'purchase-1',
          billing_account_id: 'acct-1',
          offer_id: 'offer-essential',
          status: 'active',
          expires_at: '2099-01-01T00:00:00.000Z'
        }
      ];
      tables.offer_entitlements = [
        { offer_id: 'offer-essential', entitlement_key: 'analysis_units', limit_value: 10, unit: 'ua', reset_period: 'none' }
      ];

      const { entitlements } = await resolveEntitlements('acct-1');
      expect(entitlements).toEqual([
        {
          key: 'analysis_units',
          limit: 10,
          remaining: 10,
          unit: 'ua',
          resetPeriod: 'none',
          allowed: true,
          source: { type: 'package_purchase', id: 'purchase-1', offerId: 'offer-essential' },
          reasonCode: 'active_package'
        }
      ]);
    });

    it('marks an expired package purchase as not allowed with no remaining balance', async () => {
      tables.package_purchases = [
        {
          id: 'purchase-1',
          billing_account_id: 'acct-1',
          offer_id: 'offer-essential',
          status: 'active',
          expires_at: '2020-01-01T00:00:00.000Z'
        }
      ];
      tables.offer_entitlements = [
        { offer_id: 'offer-essential', entitlement_key: 'analysis_units', limit_value: 10, unit: 'ua', reset_period: 'none' }
      ];

      const { entitlements } = await resolveEntitlements('acct-1');
      expect(entitlements[0]).toMatchObject({
        allowed: false,
        remaining: null,
        reasonCode: 'package_expired'
      });
    });
  });

  describe('resolveEntitlementsForUser', () => {
    it('returns a null billing account and no entitlements when the user has none', async () => {
      const result = await resolveEntitlementsForUser('user-1');
      expect(result).toEqual({ billingAccount: null, entitlements: [] });
    });

    it('resolves entitlements for the user\'s billing account', async () => {
      tables.billing_accounts = [
        { id: 'acct-1', account_type: 'individual', organization_name: null, owner_user_id: 'user-1', status: 'active', created_at: '2026-08-01T00:00:00.000Z' }
      ];
      tables.billing_subscriptions = [
        { id: 'sub-1', billing_account_id: 'acct-1', offer_id: 'offer-1', status: 'active' }
      ];
      tables.offer_entitlements = [
        { offer_id: 'offer-1', entitlement_key: 'active_cases', limit_value: 20, unit: 'cases', reset_period: 'none' }
      ];

      const result = await resolveEntitlementsForUser('user-1');
      expect(result.billingAccount.id).toBe('acct-1');
      expect(result.entitlements).toHaveLength(1);
      expect(result.entitlements[0].key).toBe('active_cases');
    });
  });
});
