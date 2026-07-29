import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = {
  tables: {}
};

vi.mock('../config/supabase.js', () => {
  function makeBuilder(table) {
    return {
      select: vi.fn(() => Promise.resolve(resolveTable(table)))
    };
  }

  function resolveTable(table) {
    const value = state.tables[table];
    if (value?.error) return { count: null, error: value.error };
    return { count: value?.count ?? 0, error: null };
  }

  return { supabaseAdmin: { from: vi.fn((table) => makeBuilder(table)) } };
});

import {
  getNuxeraBackendReadiness,
  getNuxeraReadinessDefinitions
} from './nuxeraBackendReadinessService.js';

describe('nuxeraBackendReadinessService', () => {
  beforeEach(() => {
    state.tables = {
      nuxera_workspace_states: { count: 2 },
      nuxera_evidence_links: { count: 3 },
      nuxera_admin_controls: { count: 1 },
      nuxera_notification_outbox: { count: 0 },
      nuxera_notification_approvals: { count: 0 },
      nuxera_case_events: { count: 8 },
      nuxera_case_assignments: { count: 4 }
    };
  });

  it('reports backend readiness when every expected NUXERA table is visible', async () => {
    const readiness = await getNuxeraBackendReadiness();

    expect(readiness).toMatchObject({
      status: 'backend-readiness-visible',
      ready: true,
      summary: { total: 7, available: 7, unavailable: 0, readiness: 100 }
    });
    expect(readiness.signals.map((signal) => signal.table)).toEqual([
      'nuxera_workspace_states',
      'nuxera_evidence_links',
      'nuxera_admin_controls',
      'nuxera_notification_outbox',
      'nuxera_notification_approvals',
      'nuxera_case_events',
      'nuxera_case_assignments'
    ]);
    expect(readiness.guardrails.join(' ')).toContain('no aplica SQL');
  });

  it('marks missing or unavailable NUXERA tables without throwing raw backend failures', async () => {
    state.tables.nuxera_evidence_links = {
      error: { message: 'relation "nuxera_evidence_links" does not exist', code: '42P01' }
    };

    const readiness = await getNuxeraBackendReadiness();

    expect(readiness.ready).toBe(false);
    expect(readiness.summary).toMatchObject({ total: 7, available: 6, unavailable: 1, readiness: 86 });
    expect(readiness.signals.find((signal) => signal.table === 'nuxera_evidence_links')).toMatchObject({
      status: 'unavailable',
      ready: false,
      error: { code: '42P01' }
    });
  });

  it('exposes readonly readiness definitions for documentation and tests', () => {
    expect(getNuxeraReadinessDefinitions().map((definition) => definition.id)).toEqual([
      'workspace-states',
      'evidence-links',
      'admin-controls',
      'notification-outbox',
      'notification-approvals',
      'case-events',
      'case-assignments'
    ]);
  });
});
