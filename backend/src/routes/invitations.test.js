import express from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../middleware/auth.js', () => ({
  authMiddleware: (req, res, next) => {
    req.userId = 'user-1';
    req.userProfile = { email: 'applicant@example.com' };
    next();
  }
}));

vi.mock('../utils/audit.js', () => ({
  logAuditEvent: vi.fn(async () => {})
}));

vi.mock('../services/caseInvitationService.js', () => ({
  createInvitation: vi.fn(async ({ recipientEmail }) => ({
    invitation: { id: 'inv-1', status: 'pending', recipientEmail, orderId: null },
    token: 'raw-token-value'
  })),
  previewInvitation: vi.fn(async (token) => {
    if (token === 'missing') return null;
    return { status: 'pending', recipientEmail: 'applicant@example.com', expiresAt: '2026-08-15T00:00:00.000Z' };
  }),
  acceptInvitation: vi.fn(async () => ({
    invitation: { id: 'inv-1', status: 'accepted', orderId: 'order-1' },
    order: { id: 'order-1' },
    sponsorship: { id: 'sponsorship-1', sponsorBillingAccountId: 'acct-A' }
  })),
  revokeInvitation: vi.fn(async () => ({ id: 'inv-1', status: 'revoked', orderId: null, sponsorBillingAccountId: 'acct-A' }))
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

describe('invitations routes', () => {
  let server;
  let baseUrl;
  const originalEnv = process.env.CASE_INVITATIONS_ENABLED;

  afterEach(() => {
    server?.close();
    process.env.CASE_INVITATIONS_ENABLED = originalEnv;
  });

  async function bootRouter() {
    vi.resetModules();
    const { default: router } = await import('./invitations.js');
    ({ server, baseUrl } = await listen(createApp(router)));
  }

  it('is fail-closed: every route returns 404 when the flag is unset', async () => {
    delete process.env.CASE_INVITATIONS_ENABLED;
    await bootRouter();

    const responses = await Promise.all([
      fetch(`${baseUrl}/api/invitations/cases`, { method: 'POST' }),
      fetch(`${baseUrl}/api/invitations/cases/some-token/preview`),
      fetch(`${baseUrl}/api/invitations/cases/some-token/accept`, { method: 'POST' }),
      fetch(`${baseUrl}/api/invitations/cases/inv-1/revoke`, { method: 'POST' })
    ]);

    for (const response of responses) {
      expect(response.status).toBe(404);
    }
  });

  it('creates an invitation and returns the raw token once', async () => {
    process.env.CASE_INVITATIONS_ENABLED = 'true';
    await bootRouter();

    const response = await fetch(`${baseUrl}/api/invitations/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sponsorBillingAccountId: 'acct-A', recipientEmail: 'applicant@example.com' })
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.token).toBe('raw-token-value');
    expect(body.invitation.status).toBe('pending');
  });

  it('rejects invitation creation without sponsorBillingAccountId', async () => {
    process.env.CASE_INVITATIONS_ENABLED = 'true';
    await bootRouter();

    const response = await fetch(`${baseUrl}/api/invitations/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientEmail: 'applicant@example.com' })
    });

    expect(response.status).toBe(400);
  });

  it('serves the invitation preview without requiring authentication', async () => {
    process.env.CASE_INVITATIONS_ENABLED = 'true';
    await bootRouter();

    const response = await fetch(`${baseUrl}/api/invitations/cases/some-token/preview`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.invitation).toEqual({
      status: 'pending',
      recipientEmail: 'applicant@example.com',
      expiresAt: '2026-08-15T00:00:00.000Z'
    });
  });

  it('returns 404 from preview for an unknown token', async () => {
    process.env.CASE_INVITATIONS_ENABLED = 'true';
    await bootRouter();

    const response = await fetch(`${baseUrl}/api/invitations/cases/missing/preview`);
    expect(response.status).toBe(404);
  });

  it('accepts an invitation for the authenticated user', async () => {
    process.env.CASE_INVITATIONS_ENABLED = 'true';
    await bootRouter();

    const response = await fetch(`${baseUrl}/api/invitations/cases/some-token/accept`, { method: 'POST' });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.sponsorship.id).toBe('sponsorship-1');
  });

  it('maps a known service error code to its HTTP status', async () => {
    process.env.CASE_INVITATIONS_ENABLED = 'true';
    await bootRouter();
    const service = await import('../services/caseInvitationService.js');
    const err = new Error('La invitación fue enviada a otro correo');
    err.code = 'INVITATION_EMAIL_MISMATCH';
    service.acceptInvitation.mockRejectedValueOnce(err);

    const response = await fetch(`${baseUrl}/api/invitations/cases/some-token/accept`, { method: 'POST' });
    expect(response.status).toBe(403);
  });

  it('revokes an invitation for the authenticated sponsor', async () => {
    process.env.CASE_INVITATIONS_ENABLED = 'true';
    await bootRouter();

    const response = await fetch(`${baseUrl}/api/invitations/cases/inv-1/revoke`, { method: 'POST' });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.invitation.status).toBe('revoked');
  });
});
