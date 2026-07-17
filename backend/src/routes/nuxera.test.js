import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const serviceCalls = {
  get: [],
  upsert: [],
  evidence: [],
  adminControls: [],
  readiness: []
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



vi.mock('../services/nuxeraBackendReadinessService.js', () => ({
  getNuxeraBackendReadiness: vi.fn(async () => {
    serviceCalls.readiness.push({ called: true });
    return {
      status: 'blocked-by-backend-readiness',
      ready: false,
      summary: { total: 3, available: 2, unavailable: 1, readiness: 67 },
      signals: [
        { id: 'workspace-states', table: 'nuxera_workspace_states', status: 'available', ready: true },
        { id: 'evidence-links', table: 'nuxera_evidence_links', status: 'unavailable', ready: false },
        { id: 'admin-controls', table: 'nuxera_admin_controls', status: 'available', ready: true }
      ],
      guardrails: ['Read-only backend readiness.']
    };
  })
}));
vi.mock('../services/nuxeraAdminControlService.js', () => ({
  getAdminControls: vi.fn(async () => {
    serviceCalls.adminControls.push({ called: true });
    return {
      persisted: false,
      controls: [],
      guardrails: ['No persisted admin controls.']
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
const workspaceStateService = await import('../services/nuxeraWorkspaceStateService.js');
const adminControlService = await import('../services/nuxeraAdminControlService.js');
const backendReadinessService = await import('../services/nuxeraBackendReadinessService.js');
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
    serviceCalls.adminControls = [];
    serviceCalls.readiness = [];
    const listening = await listen(createApp());
    server = listening.server;
    baseUrl = listening.baseUrl;
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
  });


  it('requires nuxera:admin:read before reading backend readiness', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/admin/readiness`, {
      headers: { 'x-test-user-id': 'admin-1', 'x-test-permissions': 'case:own:read' }
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ requiredPermission: 'nuxera:admin:read' });
    expect(serviceCalls.readiness).toHaveLength(0);
  });

  it('returns backend readiness with SQL/RLS guardrails', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/admin/readiness`, {
      headers: { 'x-test-user-id': 'admin-1', 'x-test-permissions': 'nuxera:admin:read' }
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      workspaceRole: 'admin',
      readiness: {
        ready: false,
        summary: { total: 3, available: 2, unavailable: 1, readiness: 67 }
      }
    });
    expect(body.guardrails).toEqual(
      expect.arrayContaining([expect.stringContaining('does not apply SQL')])
    );
    expect(serviceCalls.readiness).toEqual([{ called: true }]);
  });

  it('returns controlled backend-unavailable errors for readiness service failures', async () => {
    backendReadinessService.getNuxeraBackendReadiness.mockRejectedValueOnce(
      new Error('unexpected readiness backend failure')
    );

    const response = await fetch(`${baseUrl}/api/nuxera/admin/readiness`, {
      headers: { 'x-test-user-id': 'admin-1', 'x-test-permissions': 'nuxera:admin:read' }
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: 'Servicio NUXERA no disponible',
      code: 'NUXERA_BACKEND_UNAVAILABLE'
    });
  });
  it('requires nuxera:admin:read before reading admin controls', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/admin/controls`, {
      headers: { 'x-test-user-id': 'admin-1', 'x-test-permissions': 'case:own:read' }
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ requiredPermission: 'nuxera:admin:read' });
    expect(serviceCalls.adminControls).toHaveLength(0);
  });

  it('returns controlled backend-unavailable errors for admin controls service failures', async () => {
    adminControlService.getAdminControls.mockRejectedValueOnce(
      new Error('relation "nuxera_admin_controls" does not exist')
    );

    const response = await fetch(`${baseUrl}/api/nuxera/admin/controls`, {
      headers: { 'x-test-user-id': 'admin-1', 'x-test-permissions': 'nuxera:admin:read' }
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: 'Servicio NUXERA no disponible',
      code: 'NUXERA_BACKEND_UNAVAILABLE'
    });
  });

  it('returns read-only admin controls with no-automation guardrails', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/admin/controls`, {
      headers: { 'x-test-user-id': 'admin-1', 'x-test-permissions': 'nuxera:admin:read' }
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      workspaceRole: 'admin',
      controls: { persisted: false, controls: [] }
    });
    expect(body.guardrails).toEqual(
      expect.arrayContaining([
        expect.stringContaining('read-only mode'),
        expect.stringContaining('do not activate automation')
      ])
    );
    expect(serviceCalls.adminControls).toEqual([{ called: true }]);
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

  it('returns a controlled 404 when applicant state access is unavailable', async () => {
    workspaceStateService.getApplicantChecklistState.mockRejectedValueOnce(
      new Error('Expediente no encontrado o sin permisos para NUXERA')
    );

    const response = await fetch(`${baseUrl}/api/nuxera/orders/order-1/state`, {
      headers: { 'x-test-user-id': 'user-1', 'x-test-permissions': 'case:own:read' }
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: 'Recurso NUXERA no disponible',
      code: 'NUXERA_RESOURCE_UNAVAILABLE'
    });
    expect(workspaceStateService.getApplicantChecklistState).toHaveBeenCalledWith({
      orderId: 'order-1',
      userId: 'user-1'
    });
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
    expect(workspaceStateService.getApplicantChecklistState).toHaveBeenCalledWith({
      orderId: 'order-1',
      userId: 'user-1'
    });
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

  it('returns controlled invalid-data errors for rejected checklist payloads', async () => {
    workspaceStateService.upsertApplicantChecklistState.mockRejectedValueOnce(
      new Error('Estado NUXERA checklist invalido')
    );

    const response = await fetch(`${baseUrl}/api/nuxera/orders/order-1/state/checklist`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-test-user-id': 'user-1',
        'x-test-permissions': 'case:own:update'
      },
      body: JSON.stringify({ status: 'approved_credit', payload: {} })
    });

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      error: 'Datos NUXERA invalidos',
      code: 'NUXERA_INVALID_DATA'
    });
    expect(workspaceStateService.upsertApplicantChecklistState).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-1',
        userId: 'user-1',
        status: 'approved_credit',
        payload: {}
      })
    );
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
