import { beforeEach, describe, expect, it, vi } from 'vitest';

const tables = {
  billing_accounts: [],
  billing_account_members: [],
  billing_subscriptions: [],
  package_purchases: [],
  offer_entitlements: [],
  case_sponsorships: [],
  service_orders: []
};

// Constructor de queries perezoso: los filtros (`eq`/`in`) se acumulan sin
// importar en qué orden se encadenan respecto a `update`/`insert`, igual que
// el query builder real de supabase-js (que arma la query y solo ejecuta al
// await-earla). Es necesario porque el código de producción encadena
// `.update(patch).eq('id', id)` -- si el mock aplicara `update` de forma
// inmediata, mutaría toda la tabla antes de que `eq` la acotara.
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
  countActiveSponsorships,
  assertSponsorshipCapacity,
  createSponsoredCase,
  resolveCaseFundingSource,
  assertCaseCommercialAccess
} = await import('./caseSponsorshipService.js');

function resetTables() {
  for (const key of Object.keys(tables)) tables[key] = [];
}

describe('caseSponsorshipService', () => {
  beforeEach(() => {
    resetTables();
  });

  describe('countActiveSponsorships', () => {
    it('counts only active sponsorships for the given sponsor', async () => {
      tables.case_sponsorships = [
        { id: 's1', sponsor_billing_account_id: 'acct-A', status: 'active' },
        { id: 's2', sponsor_billing_account_id: 'acct-A', status: 'closed' },
        { id: 's3', sponsor_billing_account_id: 'acct-B', status: 'active' }
      ];

      await expect(countActiveSponsorships('acct-A')).resolves.toBe(1);
    });
  });

  describe('assertSponsorshipCapacity', () => {
    it('rejects a sponsor account with no active plan', async () => {
      await expect(assertSponsorshipCapacity('acct-A')).rejects.toThrow(/no tiene un plan activo/);
    });

    it('allows sponsoring when under the active_cases limit', async () => {
      tables.billing_subscriptions = [{ id: 'sub-1', billing_account_id: 'acct-A', offer_id: 'offer-1', status: 'active' }];
      tables.offer_entitlements = [{ offer_id: 'offer-1', entitlement_key: 'active_cases', limit_value: 20, unit: 'cases', reset_period: 'none' }];
      tables.case_sponsorships = [{ id: 's1', sponsor_billing_account_id: 'acct-A', status: 'active' }];

      await expect(assertSponsorshipCapacity('acct-A')).resolves.toEqual({ current: 1, limit: 20 });
    });

    it('rejects once the active_cases limit is reached', async () => {
      tables.billing_subscriptions = [{ id: 'sub-1', billing_account_id: 'acct-A', offer_id: 'offer-1', status: 'active' }];
      tables.offer_entitlements = [{ offer_id: 'offer-1', entitlement_key: 'active_cases', limit_value: 1, unit: 'cases', reset_period: 'none' }];
      tables.case_sponsorships = [{ id: 's1', sponsor_billing_account_id: 'acct-A', status: 'active' }];

      await expect(assertSponsorshipCapacity('acct-A')).rejects.toThrow(/límite de expedientes activos/);
    });
  });

  describe('createSponsoredCase', () => {
    it('creates a new zero-amount service order and links a sponsorship when no orderId is given', async () => {
      const { order, sponsorship } = await createSponsoredCase({
        applicantUserId: 'user-1',
        sponsorBillingAccountId: 'acct-A',
        sourceInvitationId: 'inv-1'
      });

      expect(order.amount).toBe(0);
      expect(order.status).toBe('in_progress');
      expect(order.user_id).toBe('user-1');
      expect(sponsorship.orderId).toBe(order.id);
      expect(sponsorship.sponsorBillingAccountId).toBe('acct-A');
      expect(sponsorship.applicantUserId).toBe('user-1');
      expect(sponsorship.status).toBe('active');
      expect(tables.service_orders).toHaveLength(1);
    });

    it('links the existing order instead of creating a new one when orderId is given', async () => {
      tables.service_orders = [{ id: 'order-existing', user_id: 'user-1', amount: 0, status: 'in_progress' }];

      const { order } = await createSponsoredCase({
        applicantUserId: 'user-1',
        sponsorBillingAccountId: 'acct-A',
        orderId: 'order-existing'
      });

      expect(order.id).toBe('order-existing');
      expect(tables.service_orders).toHaveLength(1);
    });
  });

  describe('resolveCaseFundingSource', () => {
    it('returns null for an order with no active sponsorship', async () => {
      await expect(resolveCaseFundingSource('order-1')).resolves.toBeNull();
    });

    it('returns the sponsorship for a sponsored order', async () => {
      tables.case_sponsorships = [{ id: 's1', order_id: 'order-1', sponsor_billing_account_id: 'acct-A', applicant_user_id: 'user-1', status: 'active' }];

      const source = await resolveCaseFundingSource('order-1');
      expect(source.type).toBe('sponsored');
      expect(source.sponsorship.sponsorBillingAccountId).toBe('acct-A');
    });
  });

  describe('assertCaseCommercialAccess', () => {
    beforeEach(() => {
      tables.billing_accounts = [{ id: 'acct-A', owner_user_id: 'owner-A', status: 'active' }];
      tables.case_sponsorships = [{ id: 's1', order_id: 'order-1', sponsor_billing_account_id: 'acct-A', applicant_user_id: 'applicant-1', status: 'active' }];
    });

    it('allows the sponsored applicant', async () => {
      await expect(assertCaseCommercialAccess('applicant-1', 'order-1')).resolves.toBeTruthy();
    });

    it('allows the sponsor account owner', async () => {
      await expect(assertCaseCommercialAccess('owner-A', 'order-1')).resolves.toBeTruthy();
    });

    it('allows an active member of the sponsor account', async () => {
      tables.billing_account_members = [{ billing_account_id: 'acct-A', user_id: 'member-A', status: 'active' }];
      await expect(assertCaseCommercialAccess('member-A', 'order-1')).resolves.toBeTruthy();
    });

    it('rejects a stranger', async () => {
      await expect(assertCaseCommercialAccess('stranger', 'order-1')).rejects.toThrow(/Acceso denegado/);
    });

    it('rejects for an order with no active sponsorship', async () => {
      await expect(assertCaseCommercialAccess('anyone', 'order-unsponsored')).rejects.toThrow(/no tiene patrocinio activo/);
    });

    it('isolates sponsors: a member of grantor B has no access to a case sponsored by grantor A', async () => {
      tables.billing_accounts.push({ id: 'acct-B', owner_user_id: 'owner-B', status: 'active' });
      tables.billing_account_members = [{ billing_account_id: 'acct-B', user_id: 'member-B', status: 'active' }];

      await expect(assertCaseCommercialAccess('member-B', 'order-1')).rejects.toThrow(/Acceso denegado/);
      await expect(assertCaseCommercialAccess('owner-B', 'order-1')).rejects.toThrow(/Acceso denegado/);
    });
  });
});
