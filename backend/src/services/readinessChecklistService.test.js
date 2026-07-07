import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = { documents: [], reviews: [], country: undefined };

vi.mock('../config/supabase.js', () => {
  function makeBuilder(table) {
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      in: vi.fn(() => builder),
      order: vi.fn(() => builder),
      maybeSingle: vi.fn(() => Promise.resolve({ data: { metadata: { country: state.country } }, error: null })),
      then: (resolve, reject) => {
        const data = table === 'documents' ? state.documents : state.reviews;
        return Promise.resolve({ data, error: null }).then(resolve, reject);
      }
    };
    return builder;
  }
  return {
    supabaseAdmin: { from: vi.fn((table) => makeBuilder(table)) }
  };
});

vi.mock('./documentReviewNotesService.js', () => ({
  getLatestNotesByOrder: vi.fn(async () => ({}))
}));

import { getReadinessChecklist } from './readinessChecklistService.js';
import { getLatestNotesByOrder } from './documentReviewNotesService.js';

describe('getReadinessChecklist', () => {
  beforeEach(() => {
    state.documents = [];
    state.reviews = [];
    state.country = undefined;
  });

  it('marca los 13 items como pendiente cuando no hay documentos subidos', async () => {
    const result = await getReadinessChecklist('order-1');
    expect(result.items).toHaveLength(13);
    expect(result.items.every((i) => i.estado === 'pendiente')).toBe(true);
  });

  it('expone el pais del expediente, con MX como default', async () => {
    const sinPais = await getReadinessChecklist('order-1');
    expect(sinPais.country).toBe('MX');

    state.country = 'CO';
    const conPais = await getReadinessChecklist('order-1');
    expect(conPais.country).toBe('CO');
  });

  it('marca listo cuando el review completó con score >= 60', async () => {
    state.documents = [{ id: 'doc-1', document_type: 'READY_MARCO_RIESGOS', filename: 'riesgos.pdf', uploaded_at: '2026-07-01' }];
    state.reviews = [{ document_id: 'doc-1', status: 'green', score: 85, findings: ['ok'], created_at: '2026-07-02' }];

    const result = await getReadinessChecklist('order-1');
    const item = result.items.find((i) => i.id === 'marco_riesgos');

    expect(item.estado).toBe('listo');
    expect(item.reviewScore).toBe(85);
    expect(item.documentoId).toBe('doc-1');
  });

  it('expone la decision humana mas reciente de un analista cuando existe', async () => {
    state.documents = [{ id: 'doc-1', document_type: 'READY_MARCO_RIESGOS', filename: 'riesgos.pdf', uploaded_at: '2026-07-01' }];
    state.reviews = [{ document_id: 'doc-1', status: 'green', score: 85, findings: ['ok'], created_at: '2026-07-02' }];
    getLatestNotesByOrder.mockResolvedValueOnce({
      'doc-1': { decision: 'approved', comment: 'Se revisó manualmente, correcto.', created_at: '2026-07-03T00:00:00Z' }
    });

    const result = await getReadinessChecklist('order-1');
    const item = result.items.find((i) => i.id === 'marco_riesgos');

    expect(item.humanReview.decision).toBe('approved');
    expect(item.humanReview.comment).toContain('revisó manualmente');
  });

  it('humanReview es null cuando no hay ninguna nota de analista', async () => {
    state.documents = [{ id: 'doc-1', document_type: 'READY_MARCO_RIESGOS', filename: 'riesgos.pdf', uploaded_at: '2026-07-01' }];
    state.reviews = [{ document_id: 'doc-1', status: 'green', score: 85, findings: ['ok'], created_at: '2026-07-02' }];

    const result = await getReadinessChecklist('order-1');
    const item = result.items.find((i) => i.id === 'marco_riesgos');

    expect(item.humanReview).toBeNull();
  });

  it('mantiene pendiente y marca en_revision mientras el review sigue procesando', async () => {
    state.documents = [{ id: 'doc-2', document_type: 'READY_ESG', filename: 'esg.pdf', uploaded_at: '2026-07-01' }];
    state.reviews = [{ document_id: 'doc-2', status: 'processing', score: 0, findings: [], created_at: '2026-07-02' }];

    const result = await getReadinessChecklist('order-1');
    const item = result.items.find((i) => i.id === 'esg');

    expect(item.estado).toBe('pendiente');
    expect(item.enRevision).toBe(true);
  });

  it('mantiene pendiente cuando el review completó con score bajo', async () => {
    state.documents = [{ id: 'doc-3', document_type: 'READY_ODS', filename: 'ods.pdf', uploaded_at: '2026-07-01' }];
    state.reviews = [{ document_id: 'doc-3', status: 'red', score: 30, findings: ['falta soporte'], created_at: '2026-07-02' }];

    const result = await getReadinessChecklist('order-1');
    const item = result.items.find((i) => i.id === 'ods');

    expect(item.estado).toBe('pendiente');
    expect(item.enRevision).toBe(false);
    expect(item.reviewScore).toBe(30);
  });

  it('globalScore es 0/no_presentable cuando no hay ningun documento evaluado', async () => {
    const result = await getReadinessChecklist('order-1');
    expect(result.globalScore.score).toBe(0);
    expect(result.globalScore.grade).toBe('no_presentable');
  });

  it('globalScore pondera por modulo, no solo por documentos subidos', async () => {
    // modelo_financiero pesa 15/100; con 100 de score ahi y el resto en 0,
    // el global no puede ser 100 (evita que 1 documento perfecto infle todo).
    state.documents = [{ id: 'doc-1', document_type: 'READY_MODELO_FINANCIERO', filename: 'modelo.xlsx', uploaded_at: '2026-07-01' }];
    state.reviews = [{ document_id: 'doc-1', status: 'green', score: 100, findings: [], created_at: '2026-07-02' }];

    const result = await getReadinessChecklist('order-1');
    expect(result.globalScore.score).toBe(15);
    expect(result.globalScore.score).toBeLessThan(100);
  });

  it('expone recommendation y structureScore desde extracted_data cuando existen', async () => {
    state.documents = [{ id: 'doc-1', document_type: 'READY_PLAN_NEGOCIOS', filename: 'plan.pdf', uploaded_at: '2026-07-01' }];
    state.reviews = [{
      document_id: 'doc-1', status: 'green', score: 80, findings: [], created_at: '2026-07-02',
      extracted_data: [{ key: 'recomendacion', value: 'Agregar anexo de riesgos.' }, { key: 'structure_score', value: 70 }]
    }];

    const result = await getReadinessChecklist('order-1');
    const item = result.items.find((i) => i.id === 'plan_negocios');
    expect(item.recommendation).toBe('Agregar anexo de riesgos.');
    expect(item.structureScore).toBe(70);
  });
});
