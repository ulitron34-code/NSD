import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const serviceCalls = {
  get: [],
  upsert: [],
  evidence: [],
  grantorEvidence: [],
  adminControls: [],
  readiness: [],
  verificationPlan: [],
  evidenceScaffold: [],
  runbook: [],
  evidenceReview: [],
  approvalPackage: [],
  writeGate: [],
  changeRequest: [],
  releaseDossier: [],
  continuationPack: []
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
vi.mock('../services/nuxeraControlledContinuationPackService.js', () => ({
  getNuxeraControlledContinuationPack: vi.fn((input = {}) => {
    serviceCalls.continuationPack.push(input);
    return {
      id: 'nuxera-controlled-continuation-pack',
      status: 'ready-for-night-continuation',
      progress: { percent: Number.isFinite(input.progressPercent) ? input.progressPercent : 83, label: '83% complete' },
      resumeContext: { branch: input.branch || 'nuxera-controlled-migration', resumeFromCommit: input.resumeFromCommit || '42c4ba7' },
      recentCommits: [{ hash: '42c4ba7', title: 'Add NUXERA controlled release dossier' }],
      completedChain: [{ id: 'release-dossier', label: 'Release readiness dossier', status: 'implemented-read-only' }],
      validationSnapshot: ['Backend full suite passed: 49 files / 456 tests.'],
      nextResumeSteps: ['Start from latest clean commit and confirm git status is empty.'],
      guardrails: ['Continuation pack is read-only; it does not persist handoff metadata.'],
      markdown: '# NUXERA Controlled Migration Continuation Pack'
    };
  })
}));vi.mock('../services/nuxeraControlledEvidenceScaffoldService.js', () => ({
  getNuxeraControlledEvidenceScaffold: vi.fn((input = {}) => {
    serviceCalls.evidenceScaffold.push(input);
    return {
      id: 'nuxera-controlled-evidence-scaffold',
      status: 'scaffold-ready-for-controlled-run',
      sourcePlanId: 'nuxera-controlled-rls-endpoint-evidence',
      metadata: { environment: input.environment || 'TODO', repoCommit: input.repoCommit || 'TODO' },
      summary: { identities: 4, endpointRows: 8, noGoCriteria: 8, rollbackChecks: 5, sqlDrafts: 3 },
      markdown: '# NUXERA Controlled RLS and Endpoint Evidence - Scaffold\n\n## Required endpoint evidence',
      guardrails: ['Scaffold only; no endpoint execution.']
    };
  })
}));
vi.mock('../services/nuxeraControlledWriteGateService.js', () => ({
  getNuxeraControlledWriteGate: vi.fn((input = {}) => {
    serviceCalls.writeGate.push(input);
    const ready = Boolean(input.backendReadiness?.ready && input.approvalPackage?.readyForReleaseDecision && input.requestedEnvironment && input.changeTicket);
    return {
      id: 'nuxera-controlled-write-gate',
      status: ready ? 'ready-for-controlled-write-change' : 'blocked-by-write-gates',
      readyForControlledWriteChange: ready,
      requestedScope: input.requestedScope || 'applicant-checklist-controlled-write',
      requestedEnvironment: input.requestedEnvironment || 'TODO',
      changeTicket: input.changeTicket || 'TODO',
      sourceApprovalPackageId: 'nuxera-controlled-approval-package',
      summary: { backendReady: Boolean(input.backendReadiness?.ready), backendReadiness: 100, approvalReady: Boolean(input.approvalPackage?.readyForReleaseDecision), blockers: ready ? 0 : 1, releaseChecklist: 6 },
      blockers: ready ? [] : ['Backend readiness is not fully visible.'],
      releaseChecklist: ['Write enablement requires a separate deploy/change-control action.'],
      nextDecision: ready ? 'Prepare a separate controlled change request; do not enable writes automatically.' : 'Resolve write gate blockers before any controlled write change request.',
      guardrails: ['Write gate is read-only; it does not execute endpoints.']
    };
  })
}));vi.mock('../services/nuxeraControlledChangeRequestService.js', () => ({
  getNuxeraControlledChangeRequest: vi.fn((input = {}) => {
    serviceCalls.changeRequest.push(input);
    const ready = Boolean(input.writeGate?.readyForControlledWriteChange && input.deploymentWindow && input.rollbackOwner && input.releaseReviewer);
    return {
      id: 'nuxera-controlled-change-request',
      status: ready ? 'ready-for-separate-change-review' : 'blocked-by-change-request-gates',
      readyForChangeReview: ready,
      sourceWriteGateId: 'nuxera-controlled-write-gate',
      changeMetadata: {
        changeTicket: input.changeTicket || input.writeGate?.changeTicket || 'CHG-NUXERA-001',
        requestedScope: input.requestedScope || input.writeGate?.requestedScope || 'applicant-checklist-controlled-write',
        requestedEnvironment: input.requestedEnvironment || input.writeGate?.requestedEnvironment || 'controlled-non-production',
        deploymentWindow: input.deploymentWindow || 'TODO',
        rollbackOwner: input.rollbackOwner || 'TODO',
        releaseReviewer: input.releaseReviewer || 'TODO'
      },
      missingChangeMetadata: ready ? [] : [{ id: 'deploymentWindow' }],
      summary: { writeGateReady: Boolean(input.writeGate?.readyForControlledWriteChange), changeMetadataMissing: ready ? 0 : 1, blockers: ready ? 0 : 1, reviewChecklist: 7, rollbackSteps: 5 },
      blockers: ready ? [] : ['Missing change metadata: Deployment Window.'],
      reviewChecklist: ['Change ticket references completed evidence review, approval package and write gate output.'],
      rollbackPlan: ['Disable NUXERA experience flag if UI behavior degrades.'],
      nextDecision: ready ? 'Submit this package to separate change-control review; do not enable writes from this endpoint.' : 'Resolve change-request blockers before submitting to change control.',
      guardrails: ['Change request package is read-only; it does not persist tickets.'],
      markdown: '# NUXERA Controlled Change Request Package'
    };
  })
}));vi.mock('../services/nuxeraControlledReleaseDossierService.js', () => ({
  getNuxeraControlledReleaseDossier: vi.fn((input = {}) => {
    serviceCalls.releaseDossier.push(input);
    const ready = Boolean(input.changeRequest?.readyForChangeReview && input.dossierOwner && input.dossierDate && input.finalReviewer);
    return {
      id: 'nuxera-controlled-release-dossier',
      status: ready ? 'ready-for-release-readiness-review' : 'blocked-by-release-dossier-gates',
      readyForReleaseReview: ready,
      sourceChangeRequestId: 'nuxera-controlled-change-request',
      dossierMetadata: {
        dossierOwner: input.dossierOwner || 'TODO',
        dossierDate: input.dossierDate || 'TODO',
        finalReviewer: input.finalReviewer || 'TODO',
        changeTicket: input.changeTicket || input.changeRequest?.changeMetadata?.changeTicket || 'CHG-NUXERA-001',
        requestedEnvironment: input.requestedEnvironment || input.changeRequest?.changeMetadata?.requestedEnvironment || 'controlled-non-production'
      },
      missingDossierMetadata: ready ? [] : [{ id: 'dossierOwner' }],
      summary: { changeRequestReady: Boolean(input.changeRequest?.readyForChangeReview), dossierMetadataMissing: ready ? 0 : 1, blockers: ready ? 0 : 1, evidenceChain: 6, finalReviewChecklist: 8 },
      evidenceChain: [{ id: 'change-request', label: 'Change request package', status: input.changeRequest?.status || 'unverified' }],
      blockers: ready ? [] : ['Missing dossier metadata: Dossier Owner.'],
      finalReviewChecklist: ['Final reviewer understands this dossier is not deployment approval.'],
      nextDecision: ready ? 'Route dossier to final release-readiness review; deployment remains a separate change-control action.' : 'Resolve release dossier blockers before final release-readiness review.',
      guardrails: ['Release dossier is read-only; it does not persist approvals, tickets or deployment windows.'],
      markdown: '# NUXERA Controlled Release Readiness Dossier'
    };
  })
}));vi.mock('../services/nuxeraControlledApprovalPackageService.js', () => ({
  getNuxeraControlledApprovalPackage: vi.fn((input = {}) => {
    serviceCalls.approvalPackage.push(input);
    const ready = Boolean(input.approver && input.approvalDate && input.approvalScope && input.evidenceHash && input.decision);
    return {
      id: 'nuxera-controlled-approval-package',
      status: ready ? 'ready-for-human-release-decision' : 'blocked-by-approval-gates',
      readyForReleaseDecision: ready,
      sourceReviewId: 'nuxera-controlled-evidence-review',
      sourcePlanId: 'nuxera-controlled-rls-endpoint-evidence',
      approvalMetadata: { approver: input.approver || 'TODO' },
      missingApprovalMetadata: ready ? [] : [{ id: 'approver' }],
      summary: { evidenceReady: true, evidenceBlockers: 0, approvalMetadataMissing: ready ? 0 : 1, decisionAccepted: ready, blockers: ready ? 0 : 1 },
      blockers: ready ? [] : ['Missing approval metadata: Approver.'],
      releaseChecklist: ['Human approver reviewed completed controlled evidence.'],
      nextDecision: ready ? 'Route to human release decision; do not enable writes automatically.' : 'Resolve approval blockers before any release decision.',
      guardrails: ['Approval package is read-only; it does not persist approvals.']
    };
  })
}));vi.mock('../services/nuxeraControlledEvidenceReviewService.js', () => ({
  reviewNuxeraControlledEvidence: vi.fn((input = {}) => {
    serviceCalls.evidenceReview.push(input);
    const hasMarkdown = Boolean(input.markdown);
    return {
      id: 'nuxera-controlled-evidence-review',
      status: hasMarkdown ? 'ready-for-human-approval-review' : 'missing-evidence-markdown',
      readyForHumanReview: hasMarkdown,
      sourcePlanId: 'nuxera-controlled-rls-endpoint-evidence',
      summary: { requiredSections: 7, missingSections: hasMarkdown ? 0 : 7, todoMarkers: 0, missingDecisions: hasMarkdown ? 0 : 4, noGoIndicators: 0 },
      missingSections: [],
      missingDecisions: [],
      blockers: hasMarkdown ? [] : ['Evidence Markdown payload is required before review.'],
      nextDecision: hasMarkdown ? 'Route completed evidence to human approval review.' : 'Submit completed controlled evidence Markdown.',
      guardrails: ['Review is read-only; it does not execute endpoints.']
    };
  })
}));vi.mock('../services/nuxeraControlledRunbookService.js', () => ({
  getNuxeraControlledRunbook: vi.fn((input = {}) => {
    serviceCalls.runbook.push(input);
    return {
      id: 'nuxera-controlled-runbook',
      status: input.repoCommit ? 'ready-for-controlled-supabase-run' : 'blocked-by-run-metadata',
      readyForRun: Boolean(input.repoCommit),
      sourceScaffoldId: 'nuxera-controlled-evidence-scaffold',
      sourcePlanId: 'nuxera-controlled-rls-endpoint-evidence',
      missingMetadata: input.repoCommit ? [] : [{ id: 'repoCommit' }],
      summary: { identities: 4, endpointRows: 8, noGoCriteria: 8, rollbackChecks: 5, sqlDrafts: 3, missingMetadata: input.repoCommit ? 0 : 1 },
      commands: [{ id: 'generate-scaffold-markdown' }, { id: 'verify-local-guards' }],
      acceptanceGates: ['All four RLS identities have observed pass/fail evidence.'],
      nextDecision: input.repoCommit ? 'Run controlled non-production Supabase verification.' : 'Fill missing run metadata.',
      guardrails: ['Runbook is read-only; it does not execute endpoints.']
    };
  })
}));vi.mock('../services/nuxeraControlledVerificationService.js', () => ({
  getNuxeraControlledVerificationPlan: vi.fn(() => {
    serviceCalls.verificationPlan.push({ called: true });
    return {
      id: 'nuxera-controlled-rls-endpoint-evidence',
      status: 'template-required-before-controlled-run',
      evidenceTemplate: { path: 'docs/nuxera-migration/docs/migration/NUXERA_CONTROLLED_RLS_ENDPOINT_EVIDENCE_TEMPLATE.md' },
      requiredIdentities: [
        { id: 'applicant-owner' },
        { id: 'different-applicant' },
        { id: 'authorized-grantor' },
        { id: 'admin-internal' }
      ],
      endpointChecks: [
        { id: 'get-state-owner', path: '/api/nuxera/orders/:orderId/state' },
        { id: 'patch-checklist-owner', path: '/api/nuxera/orders/:orderId/state/checklist' },
        { id: 'get-evidence-owner', path: '/api/nuxera/orders/:orderId/evidence' },
        { id: 'get-admin-controls', path: '/api/nuxera/admin/controls' },
        { id: 'get-admin-readiness', path: '/api/nuxera/admin/readiness' }
      ],
      deniedChecks: [{ id: 'state-foreign-denied' }],
      noGoCriteria: ['No row existence leaks.'],
      rollbackChecks: ['Prior known-good commit recorded.'],
      summary: { identities: 4, endpoints: 5, deniedChecks: 1, noGoCriteria: 1, rollbackChecks: 1 },
      guardrails: ['Read-only verification plan.']
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
vi.mock('../services/ragService.js', () => ({
  searchReferenceSources: vi.fn(async () => [])
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
  }),
  getAuthorizedGrantorEvidenceLinks: vi.fn(async (input) => {
    serviceCalls.grantorEvidence.push(input);
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
    serviceCalls.grantorEvidence = [];
    serviceCalls.adminControls = [];
    serviceCalls.readiness = [];
    serviceCalls.verificationPlan = [];
    serviceCalls.evidenceScaffold = [];
    serviceCalls.runbook = [];
    serviceCalls.evidenceReview = [];
    serviceCalls.approvalPackage = [];
    serviceCalls.writeGate = [];
    serviceCalls.changeRequest = [];
    serviceCalls.releaseDossier = [];
    serviceCalls.continuationPack = [];
    const listening = await listen(createApp());
    server = listening.server;
    baseUrl = listening.baseUrl;
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
  });



  it('requires nuxera:admin:read before reading verification plan', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/admin/verification-plan`, {
      headers: { 'x-test-user-id': 'admin-1', 'x-test-permissions': 'case:own:read' }
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ requiredPermission: 'nuxera:admin:read' });
    expect(serviceCalls.verificationPlan).toHaveLength(0);
  });

  it('returns controlled verification plan without executing checks', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/admin/verification-plan`, {
      headers: { 'x-test-user-id': 'admin-1', 'x-test-permissions': 'nuxera:admin:read' }
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      workspaceRole: 'admin',
      verificationPlan: {
        id: 'nuxera-controlled-rls-endpoint-evidence',
        summary: { identities: 4, endpoints: 5 }
      }
    });
    expect(body.verificationPlan.evidenceTemplate.path).toContain('NUXERA_CONTROLLED_RLS_ENDPOINT_EVIDENCE_TEMPLATE.md');
    expect(body.guardrails).toEqual(
      expect.arrayContaining([expect.stringContaining('does not execute endpoints')])
    );
    expect(serviceCalls.verificationPlan).toEqual([{ called: true }]);
  });
  it('requires nuxera:admin:read before reading continuation pack', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/admin/verification-continuation-pack`, {
      headers: { 'x-test-user-id': 'admin-1', 'x-test-permissions': 'case:own:read' }
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ requiredPermission: 'nuxera:admin:read' });
    expect(serviceCalls.continuationPack).toHaveLength(0);
  });

  it('returns controlled continuation pack for night handoff', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/admin/verification-continuation-pack?progress=84&resumeFrom=42c4ba7`, {
      headers: { 'x-test-user-id': 'admin-1', 'x-test-permissions': 'nuxera:admin:read' }
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      workspaceRole: 'admin',
      continuationPack: {
        id: 'nuxera-controlled-continuation-pack',
        status: 'ready-for-night-continuation',
        progress: { percent: 84 }
      }
    });
    expect(body.guardrails).toEqual(
      expect.arrayContaining([expect.stringContaining('does not persist handoff metadata')])
    );
    expect(serviceCalls.continuationPack).toEqual([
      expect.objectContaining({ progressPercent: 84, resumeFromCommit: '42c4ba7' })
    ]);
  });
  it('requires nuxera:admin:read before generating evidence scaffold', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/admin/verification-evidence-scaffold`, {
      headers: { 'x-test-user-id': 'admin-1', 'x-test-permissions': 'case:own:read' }
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ requiredPermission: 'nuxera:admin:read' });
    expect(serviceCalls.evidenceScaffold).toHaveLength(0);
  });

  it('returns controlled evidence scaffold without executing checks', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/admin/verification-evidence-scaffold?commit=abc1234&environment=non-production-supabase`, {
      headers: { 'x-test-user-id': 'admin-1', 'x-test-permissions': 'nuxera:admin:read' }
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      workspaceRole: 'admin',
      evidenceScaffold: {
        id: 'nuxera-controlled-evidence-scaffold',
        sourcePlanId: 'nuxera-controlled-rls-endpoint-evidence',
        summary: { identities: 4, endpointRows: 8 }
      }
    });
    expect(body.evidenceScaffold.markdown).toContain('Required endpoint evidence');
    expect(body.guardrails).toEqual(
      expect.arrayContaining([expect.stringContaining('does not execute endpoint checks')])
    );
    expect(serviceCalls.evidenceScaffold).toEqual([
      expect.objectContaining({ repoCommit: 'abc1234', environment: 'non-production-supabase' })
    ]);
  });

  it('requires nuxera:admin:read before evaluating write gate', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/admin/verification-write-gate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-test-user-id': 'admin-1', 'x-test-permissions': 'case:own:read' },
      body: JSON.stringify({ changeTicket: 'CHG-1' })
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ requiredPermission: 'nuxera:admin:read' });
    expect(serviceCalls.writeGate).toHaveLength(0);
  });

  it('returns controlled write gate without enabling writes', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/admin/verification-write-gate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-test-user-id': 'admin-1', 'x-test-permissions': 'nuxera:admin:read' },
      body: JSON.stringify({
        backendReadiness: { ready: true },
        approvalPackage: { readyForReleaseDecision: true },
        requestedEnvironment: 'controlled-non-production',
        changeTicket: 'CHG-NUXERA-001'
      })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      workspaceRole: 'admin',
      writeGate: {
        id: 'nuxera-controlled-write-gate',
        readyForControlledWriteChange: true,
        summary: { blockers: 0 }
      }
    });
    expect(body.guardrails).toEqual(
      expect.arrayContaining([expect.stringContaining('does not execute endpoint checks')])
    );
    expect(serviceCalls.writeGate).toEqual([
      expect.objectContaining({ requestedEnvironment: 'controlled-non-production', changeTicket: 'CHG-NUXERA-001' })
    ]);
  });

  it('requires nuxera:admin:read before building change request package', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/admin/verification-change-request`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-test-user-id': 'admin-1', 'x-test-permissions': 'case:own:read' },
      body: JSON.stringify({ deploymentWindow: '2026-07-20T03:00Z/2026-07-20T04:00Z' })
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ requiredPermission: 'nuxera:admin:read' });
    expect(serviceCalls.changeRequest).toHaveLength(0);
  });

  it('returns controlled change request package without enabling writes', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/admin/verification-change-request`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-test-user-id': 'admin-1', 'x-test-permissions': 'nuxera:admin:read' },
      body: JSON.stringify({
        writeGate: {
          id: 'nuxera-controlled-write-gate',
          readyForControlledWriteChange: true,
          requestedScope: 'applicant-checklist-controlled-write',
          requestedEnvironment: 'controlled-non-production',
          changeTicket: 'CHG-NUXERA-001',
          blockers: []
        },
        deploymentWindow: '2026-07-20T03:00Z/2026-07-20T04:00Z',
        rollbackOwner: 'Platform lead',
        releaseReviewer: 'Compliance reviewer'
      })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      workspaceRole: 'admin',
      changeRequest: {
        id: 'nuxera-controlled-change-request',
        readyForChangeReview: true,
        summary: { blockers: 0 }
      }
    });
    expect(body.guardrails).toEqual(
      expect.arrayContaining([expect.stringContaining('does not persist tickets')])
    );
    expect(serviceCalls.changeRequest).toEqual([
      expect.objectContaining({ deploymentWindow: '2026-07-20T03:00Z/2026-07-20T04:00Z', rollbackOwner: 'Platform lead' })
    ]);
  });
  it('requires nuxera:admin:read before building release dossier', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/admin/verification-release-dossier`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-test-user-id': 'admin-1', 'x-test-permissions': 'case:own:read' },
      body: JSON.stringify({ dossierOwner: 'Compliance PMO' })
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ requiredPermission: 'nuxera:admin:read' });
    expect(serviceCalls.releaseDossier).toHaveLength(0);
  });

  it('returns controlled release dossier without deployment approval', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/admin/verification-release-dossier`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-test-user-id': 'admin-1', 'x-test-permissions': 'nuxera:admin:read' },
      body: JSON.stringify({
        changeRequest: {
          id: 'nuxera-controlled-change-request',
          status: 'ready-for-separate-change-review',
          readyForChangeReview: true,
          changeMetadata: { changeTicket: 'CHG-NUXERA-001', requestedEnvironment: 'controlled-non-production' },
          blockers: []
        },
        dossierOwner: 'Compliance PMO',
        dossierDate: '2026-07-17',
        finalReviewer: 'Release board'
      })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      workspaceRole: 'admin',
      releaseDossier: {
        id: 'nuxera-controlled-release-dossier',
        readyForReleaseReview: true,
        summary: { blockers: 0 }
      }
    });
    expect(body.guardrails).toEqual(
      expect.arrayContaining([expect.stringContaining('is not deployment approval')])
    );
    expect(serviceCalls.releaseDossier).toEqual([
      expect.objectContaining({ dossierOwner: 'Compliance PMO', finalReviewer: 'Release board' })
    ]);
  });
  it('requires nuxera:admin:read before building approval package', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/admin/verification-approval-package`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-test-user-id': 'admin-1', 'x-test-permissions': 'case:own:read' },
      body: JSON.stringify({ approver: 'Compliance lead' })
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ requiredPermission: 'nuxera:admin:read' });
    expect(serviceCalls.approvalPackage).toHaveLength(0);
  });

  it('returns controlled approval package without persisting approvals', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/admin/verification-approval-package`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-test-user-id': 'admin-1', 'x-test-permissions': 'nuxera:admin:read' },
      body: JSON.stringify({
        evidenceReview: { id: 'nuxera-controlled-evidence-review', readyForHumanReview: true, blockers: [] },
        approver: 'Compliance lead',
        approvalDate: '2026-07-17',
        approvalScope: 'controlled applicant checklist write review',
        evidenceHash: 'sha256-test',
        decision: 'approve'
      })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      workspaceRole: 'admin',
      approvalPackage: {
        id: 'nuxera-controlled-approval-package',
        readyForReleaseDecision: true,
        summary: { approvalMetadataMissing: 0 }
      }
    });
    expect(body.guardrails).toEqual(
      expect.arrayContaining([expect.stringContaining('does not persist approvals')])
    );
    expect(serviceCalls.approvalPackage).toEqual([
      expect.objectContaining({ approver: 'Compliance lead', decision: 'approve' })
    ]);
  });

  it('requires nuxera:admin:read before reviewing controlled evidence', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/admin/verification-evidence-review`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-test-user-id': 'admin-1', 'x-test-permissions': 'case:own:read' },
      body: JSON.stringify({ markdown: '# evidence' })
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ requiredPermission: 'nuxera:admin:read' });
    expect(serviceCalls.evidenceReview).toHaveLength(0);
  });

  it('returns controlled evidence review without persisting submitted markdown', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/admin/verification-evidence-review`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-test-user-id': 'admin-1', 'x-test-permissions': 'nuxera:admin:read' },
      body: JSON.stringify({ markdown: '# completed evidence' })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      workspaceRole: 'admin',
      evidenceReview: {
        id: 'nuxera-controlled-evidence-review',
        readyForHumanReview: true,
        summary: { missingSections: 0 }
      }
    });
    expect(body.guardrails).toEqual(
      expect.arrayContaining([expect.stringContaining('does not persist submitted Markdown')])
    );
    expect(serviceCalls.evidenceReview).toEqual([{ markdown: '# completed evidence' }]);
  });

  it('requires nuxera:admin:read before reading verification runbook', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/admin/verification-runbook`, {
      headers: { 'x-test-user-id': 'admin-1', 'x-test-permissions': 'case:own:read' }
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ requiredPermission: 'nuxera:admin:read' });
    expect(serviceCalls.runbook).toHaveLength(0);
  });

  it('returns controlled runbook without executing checks', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/admin/verification-runbook?commit=8e3899b&environment=non-production-supabase`, {
      headers: { 'x-test-user-id': 'admin-1', 'x-test-permissions': 'nuxera:admin:read' }
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      workspaceRole: 'admin',
      runbook: {
        id: 'nuxera-controlled-runbook',
        readyForRun: true,
        summary: { identities: 4, endpointRows: 8 }
      }
    });
    expect(body.runbook.commands.map((item) => item.id)).toEqual(
      expect.arrayContaining(['generate-scaffold-markdown', 'verify-local-guards'])
    );
    expect(body.guardrails).toEqual(
      expect.arrayContaining([expect.stringContaining('does not execute endpoint checks')])
    );
    expect(serviceCalls.runbook).toEqual([
      expect.objectContaining({ repoCommit: '8e3899b', environment: 'non-production-supabase' })
    ]);
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

  it('requires data_room:authorized:read before reading grantor evidence links', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/orders/order-1/grantor-evidence`, {
      headers: { 'x-test-user-id': 'grantor-1', 'x-test-permissions': 'funder:interest:create' }
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ requiredPermission: 'data_room:authorized:read' });
    expect(serviceCalls.grantorEvidence).toHaveLength(0);
  });

  it('returns authorized-grantor evidence links with no-access guardrails', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/orders/order-1/grantor-evidence`, {
      headers: {
        'x-test-user-id': 'grantor-1',
        'x-test-permissions': 'data_room:authorized:read',
        'x-test-email': 'grantor@example.com'
      }
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      orderId: 'order-1',
      workspaceRole: 'grantor',
      evidence: { persisted: false, links: [] }
    });
    expect(body.guardrails).toEqual(
      expect.arrayContaining([expect.stringContaining('data_room_shares')])
    );
    expect(serviceCalls.grantorEvidence[0]).toEqual({
      orderId: 'order-1',
      userId: 'grantor-1',
      email: 'grantor@example.com'
    });
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

  it('requires case:own:create before drafting a project', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/applicant/project-builder/draft`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-test-user-id': 'user-1',
        'x-test-permissions': 'case:own:read'
      },
      body: JSON.stringify({ answers: {} })
    });

    expect(response.status).toBe(403);
  });

  it('drafts a local project per section when no AI provider is configured, matched to the right entity', async () => {
    const response = await fetch(`${baseUrl}/api/nuxera/applicant/project-builder/draft`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-test-user-id': 'user-1',
        'x-test-permissions': 'case:own:create'
      },
      body: JSON.stringify({
        answers: { sector: 'Tecnologia / Startup', goal: 'Capital de trabajo', amount: '$500,000', useOfFunds: 'Nomina', market: 'PYMEs locales' },
        language: 'es'
      })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.workspaceRole).toBe('applicant');
    expect(body.entityMatch.matrixKey).toBe('MX_FO_STARTUP');
    expect(body.entityMatch.requiredDocuments.length).toBeGreaterThan(0);
    expect(body.sections).toHaveLength(5);
    expect(body.sections.every((section) => section.source === 'local-template')).toBe(true);
    expect(body.scope.humanMustReview.length).toBeGreaterThan(0);
    expect(body.guardrails).toEqual(
      expect.arrayContaining([expect.stringContaining('NU-APP-PROJECTBUILDER-001')])
    );
  });
});
