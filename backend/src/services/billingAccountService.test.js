import { beforeEach, describe, expect, it, vi } from 'vitest';

const tables = {
  billing_accounts: [],
  billing_account_members: []
};

function makeBuilder(table) {
  let rows = [...tables[table]];
  let insertedRow = null;
  const builder = {
    select: () => builder,
    eq: (col, val) => {
      rows = rows.filter((row) => row[col] === val);
      return builder;
    },
    insert: (obj) => {
      insertedRow = {
        id: obj.id || `${table}-${tables[table].length + 1}`,
        created_at: '2026-08-01T00:00:00.000Z',
        updated_at: '2026-08-01T00:00:00.000Z',
        organization_name: null,
        ...obj
      };
      tables[table].push(insertedRow);
      rows = [insertedRow];
      return builder;
    },
    maybeSingle: () => Promise.resolve({ data: rows[0] || null, error: null }),
    single: () => Promise.resolve({ data: insertedRow || rows[0] || null, error: null }),
    then: (resolve) => resolve({ data: rows, error: null })
  };
  return builder;
}

vi.mock('../config/supabase.js', () => ({
  supabaseAdmin: { from: vi.fn((table) => makeBuilder(table)) }
}));

const { getBillingAccountForUser, getOrCreateIndividualAccount, assertBillingAccountMember } =
  await import('./billingAccountService.js');

function accountRow(overrides = {}) {
  return {
    id: 'acct-1',
    account_type: 'individual',
    organization_name: null,
    owner_user_id: 'user-1',
    status: 'active',
    created_at: '2026-08-01T00:00:00.000Z',
    ...overrides
  };
}

describe('billingAccountService', () => {
  beforeEach(() => {
    tables.billing_accounts = [];
    tables.billing_account_members = [];
  });

  describe('getBillingAccountForUser', () => {
    it('returns null when the user has no account and no membership', async () => {
      const account = await getBillingAccountForUser('user-1');
      expect(account).toBeNull();
    });

    it('returns the account owned by the user', async () => {
      tables.billing_accounts = [accountRow({ id: 'acct-1', owner_user_id: 'user-1' })];
      const account = await getBillingAccountForUser('user-1');
      expect(account.id).toBe('acct-1');
      expect(account.ownerUserId).toBe('user-1');
    });

    it('returns the account via an active membership when the user does not own one', async () => {
      tables.billing_accounts = [accountRow({ id: 'acct-org', account_type: 'organization', owner_user_id: 'owner-1' })];
      tables.billing_account_members = [{ billing_account_id: 'acct-org', user_id: 'user-2', status: 'active' }];

      const account = await getBillingAccountForUser('user-2');
      expect(account.id).toBe('acct-org');
    });

    it('ignores a removed membership', async () => {
      tables.billing_accounts = [accountRow({ id: 'acct-org', owner_user_id: 'owner-1' })];
      tables.billing_account_members = [{ billing_account_id: 'acct-org', user_id: 'user-2', status: 'removed' }];

      const account = await getBillingAccountForUser('user-2');
      expect(account).toBeNull();
    });
  });

  describe('getOrCreateIndividualAccount', () => {
    it('creates an individual account when none exists', async () => {
      const account = await getOrCreateIndividualAccount('user-1');
      expect(account.accountType).toBe('individual');
      expect(account.ownerUserId).toBe('user-1');
      expect(tables.billing_accounts).toHaveLength(1);
    });

    it('returns the existing account instead of creating a duplicate', async () => {
      tables.billing_accounts = [accountRow({ id: 'acct-1', owner_user_id: 'user-1' })];

      const account = await getOrCreateIndividualAccount('user-1');
      expect(account.id).toBe('acct-1');
      expect(tables.billing_accounts).toHaveLength(1);
    });
  });

  describe('assertBillingAccountMember', () => {
    it('allows the account owner', async () => {
      tables.billing_accounts = [accountRow({ id: 'acct-1', owner_user_id: 'user-1' })];
      await expect(assertBillingAccountMember('user-1', 'acct-1')).resolves.toBe(true);
    });

    it('allows an active member who is not the owner', async () => {
      tables.billing_accounts = [accountRow({ id: 'acct-1', owner_user_id: 'owner-1' })];
      tables.billing_account_members = [{ billing_account_id: 'acct-1', user_id: 'user-2', status: 'active' }];

      await expect(assertBillingAccountMember('user-2', 'acct-1')).resolves.toBe(true);
    });

    it('rejects a user with no relationship to the account', async () => {
      tables.billing_accounts = [accountRow({ id: 'acct-1', owner_user_id: 'owner-1' })];

      await expect(assertBillingAccountMember('stranger', 'acct-1')).rejects.toThrow(/Acceso denegado/);
    });

    it('rejects an unknown billing account', async () => {
      await expect(assertBillingAccountMember('user-1', 'missing')).rejects.toThrow(/no encontrada/);
    });
  });
});
