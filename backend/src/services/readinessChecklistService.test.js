import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = { documents: [], reviews: [], country: undefined, sector: undefined };

vi.mock('../config/supabase.js', () => {
  function makeBuilder(table) {
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      in: vi.fn(() => builder),
      order: vi.fn(() => builder),
      maybeSingle: vi.fn(() => Promise.resolve({ data: { metadata: { country: state.country, sector: state.sector } }, error: null })),
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
    state.sector = undefined;
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

  it('expone confidence, structureStrengths y humanReviewRequired desde extracted_data', async () => {
    state.documents = [{ id: 'doc-1', document_type: 'READY_PLAN_NEGOCIOS', filename: 'plan.pdf', uploaded_at: '2026-07-01' }];
    state.reviews = [{
      document_id: 'doc-1', status: 'red', score: 45, findings: [], created_at: '2026-07-02',
      extracted_data: [
        { key: 'confidence', value: 0.4 },
        { key: 'fortalezas_estructura', value: 'Resumen ejecutivo claro' },
        { key: 'human_review_required', value: true }
      ]
    }];

    const result = await getReadinessChecklist('order-1');
    const item = result.items.find((i) => i.id === 'plan_negocios');
    expect(item.confidence).toBe(0.4);
    expect(item.structureStrengths).toBe('Resumen ejecutivo claro');
    expect(item.humanReviewRequired).toBe(true);
  });

  it('expone agentName/aiProvider/costUsd por documento y totalCostUsd agregado del expediente', async () => {
    state.documents = [
      { id: 'doc-1', document_type: 'READY_PLAN_NEGOCIOS', filename: 'plan.pdf', uploaded_at: '2026-07-01' },
      { id: 'doc-2', document_type: 'READY_MODELO_FINANCIERO', filename: 'modelo.xlsx', uploaded_at: '2026-07-01' }
    ];
    state.reviews = [
      {
        document_id: 'doc-1', status: 'green', score: 90, findings: [], created_at: '2026-07-02',
        extracted_data: [
          { key: 'agent_name', value: 'readinessRubricAgent' },
          { key: 'ai_provider', value: 'deepseek' },
          { key: 'costo_estimado_usd', value: 0.002 }
        ]
      },
      {
        document_id: 'doc-2', status: 'green', score: 95, findings: [], created_at: '2026-07-02',
        extracted_data: [
          { key: 'agent_name', value: 'readinessRubricAgent' },
          { key: 'ai_provider', value: 'anthropic' },
          { key: 'costo_estimado_usd', value: 0.01 }
        ]
      }
    ];

    const result = await getReadinessChecklist('order-1');
    const item = result.items.find((i) => i.id === 'plan_negocios');
    expect(item.agentName).toBe('readinessRubricAgent');
    expect(item.aiProvider).toBe('deepseek');
    expect(item.costUsd).toBe(0.002);
    expect(result.totalCostUsd).toBeCloseTo(0.012, 6);
  });

  it('humanReviewRequired es false cuando no hay bandera explicita en extracted_data', async () => {
    state.documents = [{ id: 'doc-1', document_type: 'READY_PLAN_NEGOCIOS', filename: 'plan.pdf', uploaded_at: '2026-07-01' }];
    state.reviews = [{ document_id: 'doc-1', status: 'green', score: 90, findings: [], created_at: '2026-07-02', extracted_data: [] }];

    const result = await getReadinessChecklist('order-1');
    const item = result.items.find((i) => i.id === 'plan_negocios');
    expect(item.humanReviewRequired).toBe(false);
  });

  it('agrega el item permisos_sectoriales cuando el sector declarado es sensible (seccion 19.1)', async () => {
    state.sector = 'Inmobiliario';

    const result = await getReadinessChecklist('order-1');

    expect(result.sector).toBe('Inmobiliario');
    expect(result.items.some((i) => i.id === 'permisos_sectoriales')).toBe(true);
    expect(result.items).toHaveLength(14);
  });

  it('NO agrega permisos_sectoriales para un sector sin reglas especificas', async () => {
    state.sector = 'Tecnología';

    const result = await getReadinessChecklist('order-1');

    expect(result.items.some((i) => i.id === 'permisos_sectoriales')).toBe(false);
    expect(result.items).toHaveLength(13);
  });

  it('sin sector declarado, el checklist sigue siendo de 13 items (sin regresion)', async () => {
    const result = await getReadinessChecklist('order-1');
    expect(result.items).toHaveLength(13);
    expect(result.sector).toBeNull();
  });

  it('expone ocrStatus/ocrNote desde extracted_data (secciones 20.2/20.3)', async () => {
    state.documents = [{ id: 'doc-1', document_type: 'READY_PLAN_NEGOCIOS', filename: 'plan.pdf', uploaded_at: '2026-07-01' }];
    state.reviews = [{
      document_id: 'doc-1', status: 'yellow', score: 70, findings: [], created_at: '2026-07-02',
      extracted_data: [
        { key: 'ocr_status', value: 'low_quality' },
        { key: 'ocr_note', value: 'Posible escaneo sin procesar.' }
      ]
    }];

    const result = await getReadinessChecklist('order-1');
    const item = result.items.find((i) => i.id === 'plan_negocios');
    expect(item.ocrStatus).toBe('low_quality');
    expect(item.ocrNote).toBe('Posible escaneo sin procesar.');
  });
});
