import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = {
  orders: [],
  workspaceStates: [],
  auditEvents: []
};

vi.mock('../utils/audit.js', () => ({
  logAuditEvent: vi.fn(async (event) => {
    state.auditEvents.push(event);
  })
}));

vi.mock('../config/supabase.js', () => {
  function makeBuilder(table) {
    const filters = [];
    const builder = {
      __inserted: null,
      __updated: null,
      select: vi.fn(() => builder),
      eq: vi.fn((field, value) => {
        filters.push({ type: 'eq', field, value });
        return builder;
      }),
      is: vi.fn((field, value) => {
        filters.push({ type: 'is', field, value });
        return builder;
      }),
      insert: vi.fn((rows) => {
        builder.__inserted = rows[0];
        return builder;
      }),
      update: vi.fn((row) => {
        builder.__updated = row;
        return builder;
      }),
      maybeSingle: vi.fn(() => Promise.resolve(resolveMaybeSingle(table, filters))),
      single: vi.fn(() => Promise.resolve(resolveSingle(table, filters, builder)))
    };
    return builder;
  }

  function matches(row, filters) {
    return filters.every((filter) => {
      if (filter.type === 'eq') return row[filter.field] === filter.value;
      if (filter.type === 'is') return row[filter.field] === filter.value;
      return true;
    });
  }

  function resolveMaybeSingle(table, filters) {
    if (table === 'service_orders') {
      return { data: state.orders.find((row) => matches(row, filters)) || null, error: null };
    }
    if (table === 'nuxera_workspace_states') {
      return { data: state.workspaceStates.find((row) => matches(row, filters)) || null, error: null };
    }
    return { data: null, error: null };
  }

  function resolveSingle(table, filters, builder) {
    if (table !== 'nuxera_workspace_states') return { data: null, error: null };

    if (builder.__inserted) {
      const row = {
        id: `state-${state.workspaceStates.length + 1}`,
        created_at: '2026-07-16T10:00:00.000Z',
        archived_at: null,
        ...builder.__inserted
      };
      state.workspaceStates.push(row);
      return { data: row, error: null };
    }

    if (builder.__updated) {
      const index = state.workspaceStates.findIndex((row) => matches(row, filters));
      const row = { ...state.workspaceStates[index], ...builder.__updated };
      state.workspaceStates[index] = row;
      return { data: row, error: null };
    }

    return { data: state.workspaceStates.find((row) => matches(row, filters)) || null, error: null };
  }

  return { supabaseAdmin: { from: vi.fn((table) => makeBuilder(table)) } };
});

import {
  buildDefaultApplicantChecklistState,
  getApplicantChecklistState,
  upsertApplicantChecklistState
} from './nuxeraWorkspaceStateService.js';

describe('nuxeraWorkspaceStateService', () => {
  beforeEach(() => {
    state.orders = [{ id: 'order-1', user_id: 'user-1' }];
    state.workspaceStates = [];
    state.auditEvents = [];
  });

  it('returns a guarded default applicant checklist state when none is persisted', async () => {
    const result = await getApplicantChecklistState({ orderId: 'order-1', userId: 'user-1' });

    expect(result).toEqual(buildDefaultApplicantChecklistState('order-1'));
    expect(result.persisted).toBe(false);
    expect(result.guardrails).toEqual(expect.arrayContaining([expect.stringContaining('No cambia documentos')]));
  });

  it('rejects reads when the user does not own the order', async () => {
    await expect(getApplicantChecklistState({ orderId: 'order-1', userId: 'other-user' }))
      .rejects.toThrow('Expediente no encontrado');
  });

  it('creates applicant checklist state with audit metadata', async () => {
    const result = await upsertApplicantChecklistState({
      orderId: 'order-1',
      userId: 'user-1',
      status: 'in_progress',
      payload: { completedItemIds: ['doc_kyc'] }
    });

    expect(result.persisted).toBe(true);
    expect(result.version).toBe(1);
    expect(result.payload.completedItemIds).toEqual(['doc_kyc']);
    expect(state.auditEvents[0]).toMatchObject({
      action: 'nuxera_state_created',
      entityType: 'nuxera_workspace_state',
      orderId: 'order-1',
      metadata: {
        surface: 'checklist',
        workspaceRole: 'applicant',
        nextStatus: 'in_progress',
        humanReviewRequired: true,
        guardrailsApplied: true
      }
    });
  });

  it('updates applicant checklist state by incrementing version', async () => {
    await upsertApplicantChecklistState({
      orderId: 'order-1',
      userId: 'user-1',
      status: 'in_progress',
      payload: { completedItemIds: [] }
    });

    const result = await upsertApplicantChecklistState({
      orderId: 'order-1',
      userId: 'user-1',
      status: 'ready_for_review',
      payload: { completedItemIds: ['doc_kyc', 'plan_negocios'] }
    });

    expect(result.version).toBe(2);
    expect(result.status).toBe('ready_for_review');
    expect(state.auditEvents[1]).toMatchObject({
      action: 'nuxera_state_updated',
      metadata: {
        previousStatus: 'in_progress',
        nextStatus: 'ready_for_review',
        version: 2
      }
    });
  });

  it('rejects unsupported checklist statuses', async () => {
    await expect(upsertApplicantChecklistState({
      orderId: 'order-1',
      userId: 'user-1',
      status: 'approved_credit',
      payload: {}
    })).rejects.toThrow('Estado NUXERA checklist invalido');
  });
});
