import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = { rows: [], nextId: 100 };

vi.mock('../config/supabase.js', () => {
  function makeBuilder() {
    const filters = {};
    let pendingInsert = null;
    let pendingUpdate = null;

    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn((col, val) => { filters[col] = val; return builder; }),
      or: vi.fn(() => builder),
      insert: vi.fn((row) => { pendingInsert = row; return builder; }),
      update: vi.fn((patch) => { pendingUpdate = patch; return builder; }),
      order: vi.fn(() => {
        let data = state.rows;
        for (const [col, val] of Object.entries(filters)) {
          data = data.filter((row) => row[col] === val);
        }
        return Promise.resolve({ data, error: null });
      }),
      single: vi.fn(() => {
        if (pendingInsert) {
          const row = { id: String(state.nextId++), is_active: true, ...pendingInsert };
          state.rows.push(row);
          return Promise.resolve({ data: row, error: null });
        }
        if (pendingUpdate) {
          const idFilter = filters.id;
          const row = state.rows.find((r) => r.id === idFilter);
          if (!row) return Promise.resolve({ data: null, error: { message: 'not found' } });
          Object.assign(row, pendingUpdate);
          return Promise.resolve({ data: row, error: null });
        }
        return Promise.resolve({ data: null, error: { message: 'no pending operation' } });
      })
    };
    return builder;
  }
  return { supabaseAdmin: { from: vi.fn(() => makeBuilder()) } };
});

import { listReferenceSources, createReferenceSource, updateReferenceSource, deactivateReferenceSource } from './referenceSourcesService.js';

describe('listReferenceSources', () => {
  beforeEach(() => {
    state.rows = [
      { id: '1', name: 'OFAC Sanctions List Service', source_type: 'regulatorio', country_code: null, integration_status: 'real_api', is_active: true },
      { id: '2', name: 'NAFIN Financiamiento Empresarial', source_type: 'financiamiento', country_code: 'MX', integration_status: 'named_only', is_active: true },
      { id: '3', name: 'INEGI DENUE', source_type: 'mercado', country_code: 'MX', integration_status: 'real_api', is_active: true }
    ];
    state.nextId = 100;
  });

  it('regresa todas las fuentes activas sin filtros', async () => {
    const result = await listReferenceSources();
    expect(result).toHaveLength(3);
  });

  it('filtra por source_type', async () => {
    const result = await listReferenceSources({ sourceType: 'mercado' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('INEGI DENUE');
  });

  it('filtra por integration_status', async () => {
    const result = await listReferenceSources({ integrationStatus: 'real_api' });
    expect(result).toHaveLength(2);
  });
});

describe('createReferenceSource', () => {
  beforeEach(() => {
    state.rows = [];
    state.nextId = 100;
  });

  it('crea una fuente con los campos normalizados', async () => {
    const source = await createReferenceSource({ name: 'CONDUSEF SIPRES', sourceType: 'regulatorio', countryCode: 'MX' });
    expect(source.name).toBe('CONDUSEF SIPRES');
    expect(source.source_type).toBe('regulatorio');
    expect(source.integration_status).toBe('manual');
  });

  it('rechaza un integrationStatus invalido', async () => {
    await expect(createReferenceSource({ name: 'X', sourceType: 'regulatorio', integrationStatus: 'inventado' }))
      .rejects.toThrow(/integrationStatus inválido/);
  });

  it('rechaza si falta el nombre', async () => {
    await expect(createReferenceSource({ sourceType: 'regulatorio' })).rejects.toThrow(/nombre/);
  });
});

describe('updateReferenceSource / deactivateReferenceSource', () => {
  beforeEach(() => {
    state.rows = [{ id: '1', name: 'OFAC Sanctions List Service', source_type: 'regulatorio', country_code: null, integration_status: 'real_api', is_active: true }];
    state.nextId = 100;
  });

  it('actualiza una fuente existente', async () => {
    const updated = await updateReferenceSource('1', { name: 'OFAC SDN List', sourceType: 'regulatorio' });
    expect(updated.name).toBe('OFAC SDN List');
  });

  it('desactiva una fuente en vez de borrarla', async () => {
    const deactivated = await deactivateReferenceSource('1');
    expect(deactivated.is_active).toBe(false);
  });
});
