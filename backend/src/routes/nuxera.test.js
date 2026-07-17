import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const serviceCalls = {
  get: [],
  upsert: [],
  evidence: []
};

vi.mock('../middleware/auth.js', () => ({
  authMiddleware: (req, res, next) => {
    const userId = req.headers['x-test-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
    }
    req.userId = String(userId);
    req.userRole = String(req.headers['x-test-role'] || 'solicitante');
    req.user = { id: req.userId, email: req.headers['x-test-email'] || 'demo@nuxera.local' };
    next();
  },
  requirePermission: (permission) => (req, res, next) => {
    const permissions = String(req.headers['x-test-permissions'] || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (!permissions.includes(permission) && !permissions.includes('*')) {
      return res.status(403).json({
        error: 'Permiso insuficiente',
        code: 'PERMISSION_DENIED',
        requiredPermission: permission
      });
    }

    next();
  }
}));

vi.mock('../services/nuxeraWorkspaceStateService.js', () => ({
  getApplicantChecklistState: vi.fn(async (input) => {
    serviceCalls.get.push(input);
    return {
      id: null,
      orderId: input.orderId,
      workspaceRole: 'applicant',
      surface: 'checklist',
      status: 'draft',
      payload: {},
      version: 0,
      persisted: false
    };
  }),
  upsertApplicantChecklistState: vi.fn(async (input) => {
    serviceCalls.upsert.push(input);
    return {
      id: 'state-1',
      orderId: input.orderId,
      workspaceRole: 'applicant',
      surface: 'checklist',
      status: input.status,
      payload: input.payload,
      version: 1,
      persisted: true
    };
  })
}));


vi.mock('../services/nuxeraEvidenceLinkService.js', () => ({
  getOwnerEvidenceLinks: vi.fn(async (input) => {
    serviceCalls.evidence.push(input);
    return {
      orderId: input.orderId,
      persisted: false,
      links: [],
      guardrails: ['No persisted evidence links.']
    };
  })
}));
const { default: nuxeraRoutes } = await import('./nuxera.js');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', nuxeraRoutes);
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

describe('nuxera routes', () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    serviceCalls.get = [];
    serviceCalls.upsert = [];
    serviceCalls.evidence = [];
    const listening = await listen(createApp());
    server = listening.server;
    baseUrl = listening.baseUrl;
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('requires authentication before reading NUXERA state', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/orders/order-1/state`);

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ code: 'AUTH_REQUIRED' });
    expect(serviceCalls.get).toHaveLength(0);
  });

  it('requires case:own:read before reading applicant checklist state', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/orders/order-1/state`, {
      headers: { 'x-test-user-id': 'user-1', 'x-test-permissions': 'case:own:update' }
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ requiredPermission: 'case:own:read' });
    expect(serviceCalls.get).toHaveLength(0);
  });

  it('returns applicant checklist state with route guardrails', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/orders/order-1/state`, {
      headers: { 'x-test-user-id': 'user-1', 'x-test-permissions': 'case:own:read' }
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      orderId: 'order-1',
      workspaceRole: 'applicant',
      states: { checklist: { surface: 'checklist', persisted: false } }
    });
    expect(body.guardrails).toEqual(
      expect.arrayContaining([expect.stringContaining('applicant checklist state only')])
    );
    expect(serviceCalls.get[0]).toEqual({ orderId: 'order-1', userId: 'user-1' });
  });


  it('requires case:own:read before reading owner evidence links', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/orders/order-1/evidence`, {
      headers: { 'x-test-user-id': 'user-1', 'x-test-permissions': 'case:own:update' }
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ requiredPermission: 'case:own:read' });
    expect(serviceCalls.evidence).toHaveLength(0);
  });

  it('returns owner evidence links with no-access guardrails', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/orders/order-1/evidence`, {
      headers: { 'x-test-user-id': 'user-1', 'x-test-permissions': 'case:own:read' }
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      orderId: 'order-1',
      workspaceRole: 'applicant',
      evidence: { persisted: false, links: [] }
    });
    expect(body.guardrails).toEqual(
      expect.arrayContaining([expect.stringContaining('do not grant document access')])
    );
    expect(serviceCalls.evidence[0]).toEqual({ orderId: 'order-1', userId: 'user-1' });
  });
  it('requires case:own:update before patching checklist state', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/orders/order-1/state/checklist`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-test-user-id': 'user-1',
        'x-test-permissions': 'case:own:read'
      },
      body: JSON.stringify({ status: 'in_progress', payload: {} })
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ requiredPermission: 'case:own:update' });
    expect(serviceCalls.upsert).toHaveLength(0);
  });

  it('blocks non-checklist surfaces before calling persistence service', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/orders/order-1/state/memo`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-test-user-id': 'user-1',
        'x-test-permissions': 'case:own:update'
      },
      body: JSON.stringify({ status: 'draft', payload: {} })
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: 'NUXERA surface no habilitada para persistencia' });
    expect(serviceCalls.upsert).toHaveLength(0);
  });

  it('patches applicant checklist state through the service only for the allowed surface', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/orders/order-1/state/checklist`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-test-user-id': 'user-1',
        'x-test-permissions': 'case:own:update'
      },
      body: JSON.stringify({ status: 'in_progress', payload: { completedItemIds: ['doc_kyc'] } })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      orderId: 'order-1',
      workspaceRole: 'applicant',
      state: {
        surface: 'checklist',
        status: 'in_progress',
        payload: { completedItemIds: ['doc_kyc'] }
      }
    });
    expect(serviceCalls.upsert[0]).toMatchObject({
      orderId: 'order-1',
      userId: 'user-1',
      status: 'in_progress',
      payload: { completedItemIds: ['doc_kyc'] }
    });
    expect(serviceCalls.upsert[0].req).toBeTruthy();
  });
});
