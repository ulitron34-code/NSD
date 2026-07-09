import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = { documents: [], reviews: [] };
const savedRows = { last: null };

vi.mock('../config/supabase.js', () => {
  function makeBuilder(table) {
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      like: vi.fn(() => builder),
      in: vi.fn(() => builder),
      order: vi.fn(() => builder),
      then: (resolve, reject) => {
        const data = table === 'documents' ? state.documents : state.reviews;
        return Promise.resolve({ data, error: null }).then(resolve, reject);
      }
    };
    return builder;
  }
  return { supabaseAdmin: { from: vi.fn((table) => makeBuilder(table)) } };
});

vi.mock('../services/documentIntelligenceService.js', () => ({
  saveCrossReferences: vi.fn(async (orderId, rows) => {
    savedRows.last = rows;
    return rows;
  })
}));

import { runReadinessCrossReferences } from './readinessCrossRefAgent.js';

describe('runReadinessCrossReferences', () => {
  beforeEach(() => {
    state.documents = [];
    state.reviews = [];
    savedRows.last = null;
  });

  it('no compara nada con menos de 2 documentos READY_*', async () => {
    state.documents = [{ id: 'doc-1', filename: 'plan.pdf', document_type: 'READY_PLAN_NEGOCIOS' }];
    const result = await runReadinessCrossReferences('order-1');
    expect(result.comparedDocuments).toBe(1);
    expect(result.inconsistencies).toEqual([]);
  });

  it('detecta inconsistencia cuando el mismo campo trae valores distintos', async () => {
    state.documents = [
      { id: 'doc-1', filename: 'plan_negocios.pdf', document_type: 'READY_PLAN_NEGOCIOS' },
      { id: 'doc-2', filename: 'modelo_financiero.pdf', document_type: 'READY_MODELO_FINANCIERO' }
    ];
    state.reviews = [
      { document_id: 'doc-1', extracted_data: [{ key: 'monto_solicitado', value: '$500,000' }], created_at: '2026-07-05T10:00:00Z' },
      { document_id: 'doc-2', extracted_data: [{ key: 'monto_solicitado', value: '$650,000' }], created_at: '2026-07-05T11:00:00Z' }
    ];

    const result = await runReadinessCrossReferences('order-1');

    expect(result.comparedDocuments).toBe(2);
    expect(result.inconsistencies).toHaveLength(1);
    expect(result.inconsistencies[0].field).toBe('monto_solicitado');
    expect(savedRows.last).toHaveLength(1);
    expect(savedRows.last[0].status).toBe('fail');
  });

  it('detecta inconsistencia de RFC entre documentos (campo agregado en la seccion 15.3 del plan)', async () => {
    state.documents = [
      { id: 'doc-1', filename: 'doc_corporativa.pdf', document_type: 'READY_DOC_CORPORATIVA' },
      { id: 'doc-2', filename: 'plan_negocios.pdf', document_type: 'READY_PLAN_NEGOCIOS' }
    ];
    state.reviews = [
      { document_id: 'doc-1', extracted_data: [{ key: 'rfc', value: 'CAZ010101AAA' }], created_at: '2026-07-05T10:00:00Z' },
      { document_id: 'doc-2', extracted_data: [{ key: 'rfc', value: 'CAZ010101BBB' }], created_at: '2026-07-05T11:00:00Z' }
    ];

    const result = await runReadinessCrossReferences('order-1');

    expect(result.inconsistencies).toHaveLength(1);
    expect(result.inconsistencies[0].field).toBe('rfc');
  });

  it('no marca inconsistencia cuando los valores coinciden salvo formato', async () => {
    state.documents = [
      { id: 'doc-1', filename: 'plan_negocios.pdf', document_type: 'READY_PLAN_NEGOCIOS' },
      { id: 'doc-2', filename: 'corporativa.pdf', document_type: 'READY_DOC_CORPORATIVA' }
    ];
    state.reviews = [
      { document_id: 'doc-1', extracted_data: [{ key: 'razon_social', value: 'Comercializadora Azteca, S.A. de C.V.' }], created_at: '2026-07-05T10:00:00Z' },
      { document_id: 'doc-2', extracted_data: [{ key: 'razon_social', value: 'COMERCIALIZADORA AZTECA SA DE CV' }], created_at: '2026-07-05T11:00:00Z' }
    ];

    const result = await runReadinessCrossReferences('order-1');
    expect(result.inconsistencies).toEqual([]);
  });
});
