import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const tableRows = {
  data_room_shares: [],
  service_orders: {},
  documents: [],
  document_reviews: [],
  information_requests: [],
  nuxera_case_assignments: []
};

vi.mock('../middleware/auth.js', () => ({
  authMiddleware: (req, res, next) => {
    const userId = req.headers['x-test-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
    }
    req.userId = String(userId);
    req.userRole = String(req.headers['x-test-role'] || 'otorgante');
    req.user = { id: req.userId, email: req.headers['x-test-email'] || 'grantor@example.com' };
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

vi.mock('../services/scoringEngine.js', () => ({
  scoreExpedient: vi.fn(() => ({
    finalScore: 80,
    readinessGrade: 'committee-ready',
    recommendation: 'proceed',
    summary: 'Scoring summary',
    regulatoryValidation: { status: 'clear' }
  }))
}));

vi.mock('../utils/audit.js', () => ({
  logAuditEvent: vi.fn(async () => {})
}));

vi.mock('../config/supabase.js', () => {
  function makeBuilder(table) {
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      or: vi.fn(() => builder),
      in: vi.fn(() => builder),
      ilike: vi.fn(() => builder),
      order: vi.fn(() => builder),
      limit: vi.fn(() => builder),
      maybeSingle: vi.fn(() => {
        const rows = tableRows[table];
        if (Array.isArray(rows)) return Promise.resolve({ data: rows[0] || null, error: null });
        return Promise.resolve({ data: rows || null, error: null });
      }),
      single: vi.fn(() => Promise.resolve({ data: tableRows[table], error: null })),
      then: (resolve) => resolve({ data: tableRows[table] || [], error: null })
    };
    return builder;
  }

  return { supabaseAdmin: { from: vi.fn((table) => makeBuilder(table)) } };
});

const { default: otorganteRoutes } = await import('./otorgante.js');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', otorganteRoutes);
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

describe('otorgante pipeline route', () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    tableRows.data_room_shares = [{
      id: 'share-1',
      order_id: 'order-1',
      recipient_user_id: 'grantor-1',
      recipient_name: 'Grantor',
      recipient_email: 'grantor@example.com',
      status: 'accepted',
      created_at: '2026-07-20T10:00:00.000Z',
      accepted_at: '2026-07-20T10:05:00.000Z',
      expires_at: null,
      last_viewed_at: null
    }];
    tableRows.service_orders = {
      id: 'order-1',
      user_id: 'applicant-1',
      service_type: 'combo-complete',
      status: 'in_progress',
      amount: 500000,
      created_at: '2026-07-01T00:00:00.000Z',
      metadata: {},
      case_number: 'C-1',
      project_name: 'Proyecto Prueba',
      applicant_type: 'empresa',
      requested_amount: 500000,
      funding_purpose: 'capital',
      stage: 'review',
      risk_level: 'medium',
      readiness_grade: 'fixable',
      compliance_status: 'in_review'
    };
    tableRows.documents = [{ id: 'doc-1', filename: 'plan.pdf', uploaded_at: '2026-07-02T00:00:00.000Z' }];
    tableRows.document_reviews = [];
    tableRows.nuxera_case_assignments = [];
    tableRows.information_requests = [
      { id: 'req-1', order_id: 'order-1', title: 'Estados financieros actualizados', status: 'open', priority: 'high', due_date: '2026-07-25', document_type: 'financial' }
    ];

    const app = createApp();
    ({ server, baseUrl } = await listen(app));
  });

  afterEach(() => {
    server?.close();
  });

  it('requires data_room:authorized:read to read the grantor pipeline', async () => {
    const response = await fetch(`${baseUrl}/api/otorgante/pipeline`, {
      headers: { 'x-test-user-id': 'grantor-1', 'x-test-permissions': 'case:own:read' }
    });

    expect(response.status).toBe(403);
  });

  it('joins real information_requests rows into each pipeline item instead of relying on order metadata', async () => {
    const response = await fetch(`${baseUrl}/api/otorgante/pipeline`, {
      headers: { 'x-test-user-id': 'grantor-1', 'x-test-permissions': 'data_room:authorized:read' }
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].informationRequests).toEqual([
      { id: 'req-1', title: 'Estados financieros actualizados', status: 'open', priority: 'high', dueDate: '2026-07-25', documentType: 'financial' }
    ]);
  });

  it('returns an empty information request list when the table is unavailable instead of failing the pipeline', async () => {
    tableRows.information_requests = [];
    const response = await fetch(`${baseUrl}/api/otorgante/pipeline`, {
      headers: { 'x-test-user-id': 'grantor-1', 'x-test-permissions': 'data_room:authorized:read' }
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body[0].informationRequests).toEqual([]);
  });
  it('includes the active real assignment when nuxera_case_assignments is available', async () => {
    tableRows.nuxera_case_assignments = [{
      id: 'assignment-1',
      order_id: 'order-1',
      assigned_reviewer_id: 'reviewer-1',
      assigned_reviewer_role: 'analista',
      sla_tier: 'needs-information-48h',
      sla_due_at: '2026-07-25T18:00:00.000Z',
      status: 'open',
      reason: 'Validar estados financieros',
      updated_at: '2026-07-23T12:00:00.000Z'
    }];

    const response = await fetch(`${baseUrl}/api/otorgante/pipeline`, {
      headers: { 'x-test-user-id': 'grantor-1', 'x-test-permissions': 'data_room:authorized:read' }
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body[0].assignment).toMatchObject({
      id: 'assignment-1',
      assignedReviewerId: 'reviewer-1',
      assignedReviewerRole: 'analista',
      slaTier: 'needs-information-48h',
      status: 'open',
      source: 'nuxera_case_assignments'
    });
  });
  it('requires nuxera:admin:update before previewing or writing a case assignment', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/admin/case-assignments`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-test-user-id': 'admin-1', 'x-test-permissions': 'nuxera:admin:read' },
      body: JSON.stringify({ orderId: 'order-1', slaTier: 'needs-information-48h', slaDueAt: '2026-07-25T18:00:00.000Z' })
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ requiredPermission: 'nuxera:admin:update' });
  });

  it('returns a no-write assignment preview while the backend write flag is disabled', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/admin/case-assignments`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-test-user-id': 'admin-1', 'x-test-permissions': 'nuxera:admin:update' },
      body: JSON.stringify({
        orderId: 'order-1',
        assignedReviewerId: 'reviewer-1',
        assignedReviewerRole: 'analista',
        slaTier: 'needs-information-48h',
        slaDueAt: '2026-07-25T18:00:00.000Z',
        reason: 'Validar estados financieros'
      })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.writeEnabled).toBe(false);
    expect(body.assignment).toMatchObject({
      status: 'case-assignment-preview',
      persisted: false,
      assignment: {
        orderId: 'order-1',
        assignedReviewerId: 'reviewer-1',
        assignedReviewerRole: 'analista',
        slaTier: 'needs-information-48h',
        reason: 'Validar estados financieros',
        source: 'preview-no-write'
      }
    });
    expect(body.guardrails.join(' ')).toContain('preview/no-write');
  });
});

describe('admin-wide grantor cases route', () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    tableRows.data_room_shares = [
      { id: 'share-1', order_id: 'order-1', recipient_user_id: 'grantor-1', recipient_name: 'Grantor A', recipient_email: 'grantor-a@example.com', status: 'accepted', created_at: '2026-07-20T10:00:00.000Z', accepted_at: '2026-07-20T10:05:00.000Z', expires_at: null, last_viewed_at: null },
      { id: 'share-2', order_id: 'order-2', recipient_user_id: 'grantor-2', recipient_name: 'Grantor B', recipient_email: 'grantor-b@example.com', status: 'shared', created_at: '2026-07-19T10:00:00.000Z', accepted_at: null, expires_at: null, last_viewed_at: null }
    ];
    tableRows.service_orders = {
      id: 'order-1', user_id: 'applicant-1', service_type: 'combo-complete', status: 'in_progress', amount: 500000,
      created_at: '2026-07-01T00:00:00.000Z', metadata: {}, case_number: 'C-1', project_name: 'Proyecto Prueba',
      applicant_type: 'empresa', requested_amount: 500000, funding_purpose: 'capital', stage: 'review',
      risk_level: 'medium', readiness_grade: 'fixable', compliance_status: 'in_review'
    };
    tableRows.documents = [];
    tableRows.document_reviews = [];
    tableRows.nuxera_case_assignments = [];
    tableRows.information_requests = [];

    const app = createApp();
    ({ server, baseUrl } = await listen(app));
  });

  afterEach(() => {
    server?.close();
  });

  it('requires nuxera:admin:read to read the admin-wide grantor cases view', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/admin/grantor-cases`, {
      headers: { 'x-test-user-id': 'admin-1', 'x-test-permissions': 'data_room:authorized:read' }
    });

    expect(response.status).toBe(403);
  });

  it('aggregates every accepted/shared data room, not only the requesting grantor own shares', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/admin/grantor-cases`, {
      headers: { 'x-test-user-id': 'admin-1', 'x-test-permissions': 'nuxera:admin:read' }
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.workspaceRole).toBe('admin');
    expect(body.pipeline).toHaveLength(2);
    expect(body.pipeline.map((item) => item.share.id)).toEqual(['share-1', 'share-2']);
  });
});
