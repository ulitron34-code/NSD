import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const tables = {};

function applyFilters(rows, filters) {
  return rows.filter((row) => filters.every((filter) => {
    if (filter.type === 'eq') return row[filter.column] === filter.value;
    if (filter.type === 'is') return row[filter.column] === filter.value;
    if (filter.type === 'in') return filter.values.includes(row[filter.column]);
    return true;
  }));
}

function resolveTable(table, state) {
  const value = tables[table];
  if (value instanceof Error) return { data: null, error: value };
  let rows = applyFilters(Array.isArray(value) ? value : [], state.filters);
  if (state.limit) rows = rows.slice(0, state.limit);
  return { data: state.single ? rows[0] || null : rows, error: null };
}

function createQuery(table) {
  const state = { filters: [], limit: null, single: false };
  const api = {
    select() { return api; },
    eq(column, value) { state.filters.push({ type: 'eq', column, value }); return api; },
    is(column, value) { state.filters.push({ type: 'is', column, value }); return api; },
    in(column, values) { state.filters.push({ type: 'in', column, values }); return api; },
    order() { return api; },
    limit(value) { state.limit = value; return api; },
    maybeSingle() {
      state.single = true;
      return Promise.resolve(resolveTable(table, state));
    },
    then(resolve, reject) {
      return Promise.resolve(resolveTable(table, state)).then(resolve, reject);
    }
  };
  return api;
}

vi.mock('../config/supabase.js', () => ({
  supabaseAdmin: {
    from: vi.fn((table) => createQuery(table))
  }
}));

vi.mock('./nuxeraWorkspaceStateService.js', () => ({
  assertApplicantOrderOwner: vi.fn(async () => ({ id: 'order-1' }))
}));

vi.mock('./nuxeraEvidenceLinkService.js', () => ({
  assertEvidenceGrantorAuthorized: vi.fn(async () => ({ id: 'share-1' }))
}));

const {
  getApplicantCaseTimeline,
  getAdminCaseTimeline
} = await import('./nuxeraCaseTimelineService.js');

describe('nuxeraCaseTimelineService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-23T12:00:00.000Z'));
    Object.keys(tables).forEach((key) => delete tables[key]);
    tables.service_orders = [{
      id: 'order-1',
      user_id: 'user-1',
      status: 'in_review',
      created_at: '2026-07-20T09:00:00.000Z',
      project_name: 'Planta Solar Norte',
      case_number: 'NUX-001',
      compliance_status: 'pending',
      readiness_grade: 'B',
      risk_level: 'medium'
    }];
    tables.nuxera_workspace_states = [{ id: 'state-1', order_id: 'order-1', status: 'ready_for_review', version: 2, payload: { fiscal: true }, created_at: '2026-07-21T09:00:00.000Z', updated_at: '2026-07-21T10:00:00.000Z', archived_at: null }];
    tables.nuxera_evidence_links = [{ id: 'ev-1', order_id: 'order-1', visibility: 'owner', engine: 'intelligence', label: 'Fiscal pack', created_at: '2026-07-21T11:00:00.000Z', archived_at: null }];
    tables.information_requests = [{ id: 'req-1', order_id: 'order-1', title: 'Estados financieros', status: 'open', priority: 'high', due_date: '2026-07-24', created_at: '2026-07-22T09:00:00.000Z' }];
    tables.nuxera_case_assignments = [{ id: 'asn-1', order_id: 'order-1', assigned_reviewer_role: 'analyst', sla_tier: '24h', sla_due_at: '2026-07-23T08:00:00.000Z', status: 'open', reason: 'revision', created_at: '2026-07-22T08:00:00.000Z', updated_at: '2026-07-22T10:00:00.000Z' }];
    tables.nuxera_notification_outbox = [{ id: 'not-1', order_id: 'order-1', event_id: 'case.assignment.created', audience: 'grantor', channels: ['email'], priority: 'high', status: 'failed', attempts: 2, subject: 'Asignacion vencida', created_at: '2026-07-22T11:00:00.000Z', updated_at: '2026-07-22T12:00:00.000Z' }];
    tables.audit_logs = [
      { id: 'audit-1', order_id: 'order-1', action: 'nuxera_timeline_read', entity_type: 'service_order', entity_id: 'order-1', compliance_relevant: true, created_at: '2026-07-22T13:00:00.000Z' },
      { id: 'audit-2', order_id: 'order-1', action: 'nuxera_conversation_turn_output_blocked', entity_type: 'nuxera_conversation_turn', entity_id: 'order-1:grantor', metadata: { role: 'grantor', provider: 'anthropic', model: 'claude-safe', messageLength: 92, answerLength: 0, message: 'contenido-no-debe-salir' }, compliance_relevant: true, created_at: '2026-07-22T14:00:00.000Z' }
    ];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('aggregates phases, filters and health signals from operational sources', async () => {
    const timeline = await getApplicantCaseTimeline({ orderId: 'order-1', userId: 'user-1' });

    expect(timeline.status).toBe('timeline-ready');
    expect(timeline.summary.health).toMatchObject({ status: 'notification-risk', label: 'Riesgo de notificacion' });
    expect(timeline.summary).toMatchObject({
      failedNotifications: 1,
      openInformationRequests: 1,
      slaOverdue: 1,
      evidence: 1,
      notifications: 1
    });
    expect(timeline.summary.typeFilters).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'notification', count: 1, active: true }),
      expect.objectContaining({ id: 'information-request', count: 1, active: true })
    ]));
    expect(timeline.summary.phases).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'evidence', count: 3, blockers: 1 }),
      expect.objectContaining({ id: 'notifications-audit', count: 3, blockers: 2 })
    ]));
    expect(timeline.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'conversation', status: 'output-blocked', actorRole: 'grantor', metadata: expect.objectContaining({ persistedText: false, provider: 'anthropic', messageLength: 92 }) })
    ]));
    expect(timeline.events.find((event) => event.type === 'conversation').metadata.message).toBeUndefined();
    expect(timeline.events.every((event) => event.sensitiveContentExcluded)).toBe(true);
  });

  it('degrades optional missing sources without failing the timeline', async () => {
    tables.nuxera_evidence_links = new Error('relation "nuxera_evidence_links" does not exist');

    const timeline = await getAdminCaseTimeline({ orderId: 'order-1' });

    expect(timeline.status).toBe('timeline-ready');
    expect(timeline.summary.unavailableSources).toBe(1);
    expect(timeline.sources).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'evidence-links', status: 'unavailable' })
    ]));
    expect(timeline.summary.health.signals).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'sources', status: 'degraded' })
    ]));
  });
});
