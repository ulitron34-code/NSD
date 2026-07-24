import { describe, expect, it } from 'vitest';
import { buildNuxeraCaseEventsPersistencePlan, buildNuxeraCaseEventsProjection } from './nuxeraCaseEventsProjectionService.js';

describe('nuxeraCaseEventsProjectionService', () => {
  it('builds dry-run insert candidates without enabling writes', () => {
    const projection = buildNuxeraCaseEventsProjection({
      orderId: 'order-1',
      workspaceRole: 'admin',
      summary: { phases: [], typeFilters: [] },
      events: [
        {
          id: 'notification:not-1',
          type: 'notification',
          phase: 'notifications-audit',
          status: 'failed',
          severity: 'critical',
          actorRole: 'system',
          source: 'nuxera_notification_outbox',
          timestamp: '2026-07-23T12:00:00.000Z',
          title: 'Notification failed',
          description: 'Failure metadata only.',
          requiresHumanReview: false,
          sensitiveContentExcluded: true
        }
      ]
    });

    const plan = buildNuxeraCaseEventsPersistencePlan(projection);

    expect(plan).toMatchObject({
      status: 'case-events-persistence-plan-ready',
      mode: 'dry-run-only',
      table: 'nuxera_case_events',
      summary: { totalProjected: 1, insertReady: 1, blocked: 0, critical: 1 }
    });
    expect(plan.candidates[0]).toMatchObject({
      insertReady: true,
      blockers: [],
      insertPayload: {
        order_id: 'order-1',
        event_type: 'notification',
        phase: 'notifications-audit',
        severity: 'critical',
        source_table: 'nuxera_notification_outbox',
        sensitive_content_excluded: true,
        requires_human_review: false
      }
    });
    expect(plan.candidates[0].insertPayload.metadata).toMatchObject({
      dedupeKey: plan.candidates[0].dedupeKey,
      persistencePlan: 'dry-run-only'
    });
  });

  it('blocks incomplete insert candidates before any SQL write path', () => {
    const plan = buildNuxeraCaseEventsPersistencePlan({
      orderId: 'order-1',
      workspaceRole: 'admin',
      events: [{ id: 'event-without-date', eventType: 'audit', phase: 'notifications-audit', severity: 'info', metadata: { sensitiveContentExcluded: true } }]
    });

    expect(plan.status).toBe('case-events-persistence-plan-blocked');
    expect(plan.summary).toMatchObject({ insertReady: 0, blocked: 1 });
    expect(plan.candidates[0]).toMatchObject({ status: 'blocked-by-contract', blockers: ['missing-occurred-at'] });
  });
});