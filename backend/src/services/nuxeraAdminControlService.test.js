import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = {
  controls: []
};

vi.mock('../config/supabase.js', () => {
  function makeBuilder(table) {
    const filters = [];
    const builder = {
      select: vi.fn(() => builder),
      is: vi.fn((field, value) => {
        filters.push({ type: 'is', field, value });
        return builder;
      }),
      then: (resolve, reject) => Promise.resolve(resolveList(table, filters)).then(resolve, reject)
    };
    return builder;
  }

  function matches(row, filters) {
    return filters.every((filter) => {
      if (filter.type === 'is') return row[filter.field] === filter.value;
      return true;
    });
  }

  function resolveList(table, filters) {
    if (table === 'nuxera_admin_controls') {
      return { data: state.controls.filter((row) => matches(row, filters)), error: null };
    }
    return { data: [], error: null };
  }

  return { supabaseAdmin: { from: vi.fn((table) => makeBuilder(table)) } };
});

import {
  buildDefaultAdminControls,
  getAdminControls
} from './nuxeraAdminControlService.js';

describe('nuxeraAdminControlService', () => {
  beforeEach(() => {
    state.controls = [];
  });

  it('returns guarded default controls when no persisted admin controls exist', async () => {
    const result = await getAdminControls();

    expect(result).toEqual(buildDefaultAdminControls());
    expect(result.persisted).toBe(false);
    expect(result.controls.map((control) => control.controlType)).toEqual(
      expect.arrayContaining(['release_gate', 'incident', 'readiness'])
    );
    expect(result.guardrails).toEqual(expect.arrayContaining([expect.stringContaining('No existe ruta PATCH/POST')]));
  });

  it('maps persisted controls without enabling writes or automation', async () => {
    state.controls = [
      {
        id: 'control-1',
        control_type: 'incident',
        scope: 'global',
        status: 'open',
        severity: 'high',
        payload: { label: 'Browser launch blocker' },
        created_by: 'admin-1',
        updated_by: 'admin-2',
        created_at: '2026-07-17T10:00:00.000Z',
        updated_at: '2026-07-17T11:00:00.000Z',
        archived_at: null
      },
      {
        id: 'control-archived',
        control_type: 'policy',
        scope: 'admin',
        status: 'archived',
        severity: 'low',
        payload: {},
        archived_at: '2026-07-17T12:00:00.000Z'
      }
    ];

    const result = await getAdminControls();

    expect(result.persisted).toBe(true);
    expect(result.summary).toMatchObject({ total: 1, byType: { incident: 1 }, severities: ['high'] });
    expect(result.controls[0]).toMatchObject({
      id: 'control-1',
      controlType: 'incident',
      scope: 'global',
      severity: 'high',
      payload: { label: 'Browser launch blocker' }
    });
    expect(result.controls[0].guardrails).toEqual(
      expect.arrayContaining([expect.stringContaining('No activa automatizaciones')])
    );
  });

  it('rejects unsupported control types from persisted rows', async () => {
    state.controls = [
      {
        id: 'control-1',
        control_type: 'enable_trading',
        scope: 'global',
        status: 'open',
        severity: 'critical',
        payload: {},
        archived_at: null
      }
    ];

    await expect(getAdminControls()).rejects.toThrow('Tipo NUXERA admin control invalido');
  });

  it('rejects unsupported severity values from persisted rows', async () => {
    state.controls = [
      {
        id: 'control-1',
        control_type: 'incident',
        scope: 'global',
        status: 'open',
        severity: 'emergency',
        payload: {},
        archived_at: null
      }
    ];

    await expect(getAdminControls()).rejects.toThrow('Severidad NUXERA admin control invalida');
  });
});