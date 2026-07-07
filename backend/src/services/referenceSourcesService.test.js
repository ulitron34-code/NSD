import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = { rows: [] };

vi.mock('../config/supabase.js', () => {
  function makeBuilder() {
    const filters = {};
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn((col, val) => { filters[col] = { op: 'eq', val }; return builder; }),
      or: vi.fn(() => builder),
      order: vi.fn(() => {
        let data = state.rows;
        for (const [col, { val }] of Object.entries(filters)) {
          data = data.filter((row) => row[col] === val);
        }
        return Promise.resolve({ data, error: null });
      })
    };
    return builder;
  }
  return { supabaseAdmin: { from: vi.fn(() => makeBuilder()) } };
});

import { listReferenceSources } from './referenceSourcesService.js';

describe('listReferenceSources', () => {
  beforeEach(() => {
    state.rows = [
      { id: '1', name: 'OFAC Sanctions List Service', source_type: 'regulatorio', country_code: null, integration_status: 'real_api', is_active: true },
      { id: '2', name: 'NAFIN Financiamiento Empresarial', source_type: 'financiamiento', country_code: 'MX', integration_status: 'named_only', is_active: true },
      { id: '3', name: 'INEGI DENUE', source_type: 'mercado', country_code: 'MX', integration_status: 'real_api', is_active: true }
    ];
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
