import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./nuxeraNotificationOutboxService.js', () => ({
  buildNuxeraNotificationApprovalPlan: vi.fn((timeline = {}) => ({
    id: `approval-plan:${timeline.orderId || 'unknown'}`,
    orderId: timeline.orderId || null,
    approvalItems: [
      {
        id: 'approval-1',
        orderId: timeline.orderId || null,
        eventId: 'applicant-missing-evidence',
        audience: 'applicant',
        recipientRole: 'applicant',
        channels: ['email', 'in_app'],
        priority: 'normal',
        dedupeKey: `${timeline.orderId || 'missing'}:applicant-missing-evidence`,
        duplicate: false,
        template: { templateId: 'missing-evidence-v1' }
      }
    ]
  })),
  getNuxeraNotificationApprovalPersistenceReadiness: vi.fn(() => ({
    table: 'nuxera_notification_approvals',
    requiredBackendSteps: ['Verify notification approval RLS.'],
    guardrails: ['Notification approval persistence is draft-only.']
  }))
}));

let buildNuxeraOperationalPersistencePlan;

beforeEach(async () => {
  ({ buildNuxeraOperationalPersistencePlan } = await import('./nuxeraOperationalPersistenceService.js'));
});

describe('buildNuxeraOperationalPersistencePlan', () => {
  it('combines case events, notification approvals and evidence provenance as dry-run ledgers', () => {
    const plan = buildNuxeraOperationalPersistencePlan({
      orderId: 'order-1',
      workspaceRole: 'admin',
      events: [
        { id: 'audit-1', type: 'audit', phase: 'notifications-audit', title: 'Audit ready', timestamp: '2026-07-29T12:00:00.000Z', sensitiveContentExcluded: true },
        { id: 'evidence-1', type: 'evidence', phase: 'document-review', title: 'Evidence linked', timestamp: '2026-07-29T12:05:00.000Z', sensitiveContentExcluded: true }
      ],
      summary: { phases: ['notifications-audit', 'document-review'], typeFilters: ['audit', 'evidence'] }
    }, { actorUserId: 'admin-1' });

    expect(plan).toMatchObject({ status: 'operational-persistence-dry-run-ready', mode: 'dry-run-only', writeEnabled: false });
    expect(plan.ledgers.map((ledger) => ledger.table)).toEqual(['nuxera_case_events', 'nuxera_notification_approvals', 'nuxera_evidence_links']);
    expect(plan.summary.ledgers).toBe(3);
    expect(plan.summary.caseEventCandidates).toBeGreaterThan(0);
    expect(plan.summary.notificationApprovalCandidates).toBeGreaterThan(0);
    expect(plan.summary.evidenceProvenanceCandidates).toBeGreaterThan(0);
    expect(plan.writeGate).toMatchObject({ status: 'write-gate-blocked', writeEnabled: false, dryRunOnly: true });
    expect(plan.writeGate.workerContract.auditActions).toContain('nuxera_operational_persistence_batch_completed');
    expect(plan.writeGate.summary.insertCandidates).toBeGreaterThan(0);
    expect(plan.guardrails.join(' ')).toContain('read-only');
  });

  it('keeps write posture disabled when timeline has no real order id', () => {
    const plan = buildNuxeraOperationalPersistencePlan({ events: [] });

    expect(plan.writeEnabled).toBe(false);
    expect(plan.mode).toBe('dry-run-only');
    expect(plan.summary.caseEventCandidates).toBe(0);
    expect(plan.summary.evidenceProvenanceCandidates).toBe(0);
    expect(plan.writeGate.blockers).toContain('Missing order id for controlled persistence');
  });
});
