import { beforeEach, describe, expect, it, vi } from 'vitest';

const tables = {
  billing_accounts: [],
  billing_account_members: [],
  billing_subscriptions: [],
  package_purchases: [],
  offer_entitlements: [],
  case_invitations: [],
  case_sponsorships: [],
  service_orders: []
};

// Ver el comentario en caseSponsorshipService.test.js: los filtros se
// acumulan y se aplican al ejecutar (then/single/maybeSingle), no en el
// orden en que se llaman -- necesario porque el código encadena
// `.update(patch).eq('id', id)`.
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

const { createInvitation, previewInvitation, acceptInvitation, revokeInvitation } =
  await import('./caseInvitationService.js');

function resetTables() {
  for (const key of Object.keys(tables)) tables[key] = [];
}

function givenSponsorWithCapacity({ accountId = 'acct-A', ownerUserId = 'owner-A' } = {}) {
  tables.billing_accounts.push({ id: accountId, owner_user_id: ownerUserId, status: 'active' });
  tables.billing_subscriptions.push({ id: `${accountId}-sub`, billing_account_id: accountId, offer_id: 'offer-1', status: 'active' });
  tables.offer_entitlements.push({ offer_id: 'offer-1', entitlement_key: 'active_cases', limit_value: 20, unit: 'cases', reset_period: 'none' });
}

describe('caseInvitationService', () => {
  beforeEach(() => {
    resetTables();
  });

  describe('createInvitation', () => {
    it('rejects an invalid recipient email', async () => {
      tables.billing_accounts = [{ id: 'acct-A', owner_user_id: 'owner-A', status: 'active' }];
      await expect(
        createInvitation({ sponsorBillingAccountId: 'acct-A', sponsorUserId: 'owner-A', recipientEmail: 'not-an-email' })
      ).rejects.toThrow(/recipientEmail inválido/);
    });

    it('rejects a sponsorUserId that does not belong to the sponsor account', async () => {
      tables.billing_accounts = [{ id: 'acct-A', owner_user_id: 'owner-A', status: 'active' }];
      await expect(
        createInvitation({ sponsorBillingAccountId: 'acct-A', sponsorUserId: 'stranger', recipientEmail: 'a@b.com' })
      ).rejects.toThrow(/Acceso denegado/);
    });

    it('creates a pending invitation and returns the raw token only once', async () => {
      tables.billing_accounts = [{ id: 'acct-A', owner_user_id: 'owner-A', status: 'active' }];

      const { invitation, token } = await createInvitation({
        sponsorBillingAccountId: 'acct-A',
        sponsorUserId: 'owner-A',
        recipientEmail: '  Applicant@Example.com  '
      });

      expect(invitation.status).toBe('pending');
      expect(invitation.recipientEmail).toBe('applicant@example.com');
      expect(token).toMatch(/^[a-f0-9]{64}$/);
      expect(tables.case_invitations).toHaveLength(1);
      expect(tables.case_invitations[0].token_hash).not.toBe(token);
      expect(tables.case_invitations[0]).not.toHaveProperty('token');
    });
  });

  describe('previewInvitation', () => {
    it('returns null for an unknown token', async () => {
      await expect(previewInvitation('bogus-token')).resolves.toBeNull();
    });

    it('returns minimal data without revealing the sponsor or the case', async () => {
      tables.billing_accounts = [{ id: 'acct-A', owner_user_id: 'owner-A', status: 'active' }];
      const { token } = await createInvitation({
        sponsorBillingAccountId: 'acct-A',
        sponsorUserId: 'owner-A',
        recipientEmail: 'applicant@example.com'
      });

      const preview = await previewInvitation(token);
      expect(preview).toEqual({
        status: 'pending',
        recipientEmail: 'applicant@example.com',
        expiresAt: expect.any(String)
      });
    });

    it('reports an expired invitation without mutating stored state', async () => {
      tables.billing_accounts = [{ id: 'acct-A', owner_user_id: 'owner-A', status: 'active' }];
      const { token } = await createInvitation({
        sponsorBillingAccountId: 'acct-A',
        sponsorUserId: 'owner-A',
        recipientEmail: 'applicant@example.com',
        expiresInDays: -1
      });

      const preview = await previewInvitation(token);
      expect(preview.status).toBe('expired');
      expect(tables.case_invitations[0].status).toBe('pending');
    });
  });

  describe('acceptInvitation', () => {
    it('accepts once: creates the sponsored case and marks the invitation accepted', async () => {
      givenSponsorWithCapacity();
      const { token } = await createInvitation({
        sponsorBillingAccountId: 'acct-A',
        sponsorUserId: 'owner-A',
        recipientEmail: 'applicant@example.com'
      });

      const { invitation, order, sponsorship } = await acceptInvitation({
        token,
        userId: 'applicant-1',
        userEmail: 'Applicant@Example.com'
      });

      expect(invitation.status).toBe('accepted');
      expect(invitation.acceptedByUserId).toBe('applicant-1');
      expect(order.amount).toBe(0);
      expect(sponsorship.applicantUserId).toBe('applicant-1');
      expect(sponsorship.sponsorBillingAccountId).toBe('acct-A');
      // El solicitante nunca se agrega como miembro interno del otorgante.
      expect(tables.billing_account_members).toHaveLength(0);
    });

    it('rejects when the accepting email does not match the invitation', async () => {
      givenSponsorWithCapacity();
      const { token } = await createInvitation({
        sponsorBillingAccountId: 'acct-A',
        sponsorUserId: 'owner-A',
        recipientEmail: 'applicant@example.com'
      });

      await expect(
        acceptInvitation({ token, userId: 'applicant-1', userEmail: 'someone-else@example.com' })
      ).rejects.toThrow(/otro correo/);
    });

    it('rejects a second acceptance of the same invitation', async () => {
      givenSponsorWithCapacity();
      const { token } = await createInvitation({
        sponsorBillingAccountId: 'acct-A',
        sponsorUserId: 'owner-A',
        recipientEmail: 'applicant@example.com'
      });

      await acceptInvitation({ token, userId: 'applicant-1', userEmail: 'applicant@example.com' });

      await expect(
        acceptInvitation({ token, userId: 'applicant-2', userEmail: 'applicant@example.com' })
      ).rejects.toThrow(/ya fue aceptada/);
    });

    it('rejects a revoked invitation', async () => {
      givenSponsorWithCapacity();
      const { invitation, token } = await createInvitation({
        sponsorBillingAccountId: 'acct-A',
        sponsorUserId: 'owner-A',
        recipientEmail: 'applicant@example.com'
      });
      await revokeInvitation({ invitationId: invitation.id, actingUserId: 'owner-A' });

      await expect(
        acceptInvitation({ token, userId: 'applicant-1', userEmail: 'applicant@example.com' })
      ).rejects.toThrow(/revocada/);
    });

    it('rejects and marks an expired invitation as expired', async () => {
      givenSponsorWithCapacity();
      const { invitation, token } = await createInvitation({
        sponsorBillingAccountId: 'acct-A',
        sponsorUserId: 'owner-A',
        recipientEmail: 'applicant@example.com',
        expiresInDays: -1
      });

      await expect(
        acceptInvitation({ token, userId: 'applicant-1', userEmail: 'applicant@example.com' })
      ).rejects.toThrow(/expiró/);

      expect(tables.case_invitations.find((row) => row.id === invitation.id).status).toBe('expired');
    });

    it('rejects when the sponsor has no active plan capacity', async () => {
      tables.billing_accounts = [{ id: 'acct-A', owner_user_id: 'owner-A', status: 'active' }];
      const { token } = await createInvitation({
        sponsorBillingAccountId: 'acct-A',
        sponsorUserId: 'owner-A',
        recipientEmail: 'applicant@example.com'
      });

      await expect(
        acceptInvitation({ token, userId: 'applicant-1', userEmail: 'applicant@example.com' })
      ).rejects.toThrow(/no tiene un plan activo/);
    });
  });

  describe('revokeInvitation', () => {
    it('revokes a pending invitation for a sponsor member', async () => {
      tables.billing_accounts = [{ id: 'acct-A', owner_user_id: 'owner-A', status: 'active' }];
      const { invitation } = await createInvitation({
        sponsorBillingAccountId: 'acct-A',
        sponsorUserId: 'owner-A',
        recipientEmail: 'applicant@example.com'
      });

      const revoked = await revokeInvitation({ invitationId: invitation.id, actingUserId: 'owner-A' });
      expect(revoked.status).toBe('revoked');
    });

    it('rejects revocation by someone outside the sponsor account', async () => {
      tables.billing_accounts = [{ id: 'acct-A', owner_user_id: 'owner-A', status: 'active' }];
      const { invitation } = await createInvitation({
        sponsorBillingAccountId: 'acct-A',
        sponsorUserId: 'owner-A',
        recipientEmail: 'applicant@example.com'
      });

      await expect(revokeInvitation({ invitationId: invitation.id, actingUserId: 'stranger' })).rejects.toThrow(/Acceso denegado/);
    });

    it('rejects revoking an invitation that is no longer pending', async () => {
      tables.billing_accounts = [{ id: 'acct-A', owner_user_id: 'owner-A', status: 'active' }];
      const { invitation } = await createInvitation({
        sponsorBillingAccountId: 'acct-A',
        sponsorUserId: 'owner-A',
        recipientEmail: 'applicant@example.com'
      });
      await revokeInvitation({ invitationId: invitation.id, actingUserId: 'owner-A' });

      await expect(revokeInvitation({ invitationId: invitation.id, actingUserId: 'owner-A' })).rejects.toThrow(/pendiente/);
    });
  });
});
