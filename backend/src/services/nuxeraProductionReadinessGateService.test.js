import { describe, expect, it, vi } from 'vitest';

vi.mock('../config/supabase.js', () => ({
  supabaseAdmin: { from: vi.fn() },
}));
vi.mock('../utils/audit.js', () => ({
  logAuditEvent: vi.fn(() => Promise.resolve()),
}));

import { getNuxeraProductionReadinessGate } from './nuxeraProductionReadinessGateService.js';

const readySignals = [
  'workspace-states',
  'evidence-links',
  'admin-controls',
  'notification-outbox',
  'notification-approvals',
  'case-events',
  'case-assignments'
].map((id) => ({ id, table: `nuxera_${id.replace(/-/g, '_')}`, ready: true, status: 'available' }));

function buildReadyInput() {
  return {
    backendReadiness: {
      ready: true,
      status: 'backend-readiness-visible',
      summary: { total: 7, available: 7, unavailable: 0, readiness: 100 },
      signals: readySignals
    },
    notificationOutboxReadiness: {
      status: 'outbox-contract-ready-delivery-enabled',
      deliveryWorkerEnabled: true,
      emailDeliveryEnabled: true
    },
    notificationHealth: {
      status: 'notification-health-ready',
      summary: { failed: 0, queued: 0, suppressed: 0 }
    },
    aiProviderPolicy: {
      status: 'primary-provider-ready',
      sensitiveRuntimeReady: true,
      summary: { configuredPrimary: 1 }
    },
    conversationAgent: {
      status: 'conversation-runtime-ready',
      runtimeEnabled: true,
      summary: { blockedActions: 8 }
    },
    executionBacklog: {
      status: 'ready-for-final-review',
      summary: { criticalBlocked: 0 }
    }
  };
}

describe('nuxeraProductionReadinessGateService', () => {
  it('blocks production review when critical evidence is missing', async () => {
    const gate = await getNuxeraProductionReadinessGate({
      ...buildReadyInput(),
      backendReadiness: {
        ready: false,
        status: 'blocked-by-backend-readiness',
        summary: { total: 7, available: 5, unavailable: 2, readiness: 71 },
        signals: readySignals.filter((signal) => !['case-events', 'notification-approvals'].includes(signal.id))
      },
      notificationOutboxReadiness: {
        status: 'outbox-contract-ready-delivery-disabled',
        deliveryWorkerEnabled: false,
        emailDeliveryEnabled: false
      },
      notificationHealth: {
        status: 'notification-health-watch',
        summary: { failed: 0, queued: 2, suppressed: 0 }
      },
      conversationAgent: {
        status: 'agent-contract-ready-no-chat-delivery',
        runtimeEnabled: false,
        summary: { blockedActions: 8 }
      },
      executionBacklog: {
        status: 'blocked-by-critical-path',
        summary: { criticalBlocked: 2 }
      }
    });

    expect(gate.status).toBe('production-readiness-blocked');
    expect(gate.readyForProductionReview).toBe(false);
    expect(gate.readyForAutomaticProduction).toBe(false);
    expect(gate.summary.blocked).toBe(4);
    expect(gate.domains.find((domain) => domain.id === 'sql-rls-backend').blockers).toEqual(expect.arrayContaining([
      'Readiness definition missing: notification-approvals.',
      'Readiness definition missing: case-events.'
    ]));
    expect(gate.nextDecision).toContain('Do not deploy production');
  });

  it('allows only human production review when all domains are ready', async () => {
    const gate = await getNuxeraProductionReadinessGate(buildReadyInput());

    expect(gate).toMatchObject({
      status: 'ready-for-human-production-review',
      readyForProductionReview: true,
      readyForAutomaticProduction: false,
      readinessPercent: 100,
      summary: { domains: 4, ready: 4, blocked: 0 }
    });
    expect(gate.domains.every((domain) => domain.ready)).toBe(true);
    expect(gate.guardrails.join(' ')).toContain('never applies SQL');
  });
});


