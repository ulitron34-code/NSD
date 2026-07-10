import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = { documents: [], reviews: [], orders: [], crossRefs: [], auditLogs: [], users: [] };

const TABLE_STATE = {
  documents: () => state.documents,
  document_reviews: () => state.reviews,
  service_orders: () => state.orders,
  cross_references: () => state.crossRefs,
  audit_logs: () => state.auditLogs,
  users: () => state.users
};

vi.mock('../config/supabase.js', () => {
  function makeBuilder(table) {
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      like: vi.fn(() => builder),
      in: vi.fn(() => builder),
      order: vi.fn(() => builder),
      then: (resolve, reject) => Promise.resolve({ data: TABLE_STATE[table](), error: null }).then(resolve, reject)
    };
    return builder;
  }
  return { supabaseAdmin: { from: vi.fn((table) => makeBuilder(table)) } };
});

import { getReadinessMetrics } from './readinessMetricsService.js';

describe('getReadinessMetrics', () => {
  beforeEach(() => {
    state.documents = [];
    state.reviews = [];
    state.orders = [];
    state.crossRefs = [];
    state.auditLogs = [];
    state.users = [];
  });

  it('regresa métricas vacías cuando no hay documentos READY_*', async () => {
    const result = await getReadinessMetrics();
    expect(result.totalOrders).toBe(0);
    expect(result.avgGlobalScore).toBeNull();
    expect(result.topRedFlags).toEqual([]);
  });

  it('calcula score promedio, faltantes promedio y % de expedientes listos a través de varios expedientes', async () => {
    // Orden 1: un solo documento del checklist (READY_PLAN_NEGOCIOS) con
    // score 90 -- score global bajo porque faltan los otros 12 items.
    // Orden 2: mismo documento con score 90 -- mismo score global bajo.
    state.documents = [
      { id: 'doc-1', order_id: 'order-1', document_type: 'READY_PLAN_NEGOCIOS', version_number: 1, uploaded_at: '2026-07-01T10:00:00Z' },
      { id: 'doc-2', order_id: 'order-2', document_type: 'READY_PLAN_NEGOCIOS', version_number: 1, uploaded_at: '2026-07-01T10:00:00Z' }
    ];
    state.reviews = [
      { document_id: 'doc-1', score: 90, findings: [], extracted_data: [], created_at: '2026-07-01T11:00:00Z' },
      { document_id: 'doc-2', score: 90, findings: [], extracted_data: [], created_at: '2026-07-01T11:00:00Z' }
    ];
    state.orders = [
      { id: 'order-1', metadata: {} },
      { id: 'order-2', metadata: {} }
    ];

    const result = await getReadinessMetrics();

    expect(result.totalOrders).toBe(2);
    // Con solo 1 de 13 items presente y los demás en 0, el score global
    // ponderado queda muy por debajo del umbral de "listo" (75).
    expect(result.avgGlobalScore).toBeLessThan(75);
    expect(result.readyOrdersPercentage).toBe(0);
    expect(result.avgMissingDocuments).toBeGreaterThan(10);
  });

  it('categoriza banderas rojas por palabra clave y cuenta las más comunes', async () => {
    state.documents = [
      { id: 'doc-1', order_id: 'order-1', document_type: 'READY_DOC_KYC', version_number: 1, uploaded_at: '2026-07-01T10:00:00Z' },
      { id: 'doc-2', order_id: 'order-2', document_type: 'READY_DOC_KYC', version_number: 1, uploaded_at: '2026-07-01T10:00:00Z' }
    ];
    state.reviews = [
      { document_id: 'doc-1', score: 40, findings: ['Bandera roja crítica: coincidencia OFAC/PEP sin aclarar'], extracted_data: [], created_at: '2026-07-01T11:00:00Z' },
      { document_id: 'doc-2', score: 45, findings: ['Bandera roja: coincidencia OFAC sin aclarar'], extracted_data: [], created_at: '2026-07-01T11:00:00Z' }
    ];
    state.orders = [{ id: 'order-1', metadata: {} }, { id: 'order-2', metadata: {} }];

    const result = await getReadinessMetrics();

    expect(result.topRedFlags[0]).toEqual({ label: 'Screening OFAC/PEP', count: 2 });
  });

  it('calcula tasa de documentos ilegibles solo entre los que tienen ocr_status', async () => {
    state.documents = [
      { id: 'doc-1', order_id: 'order-1', document_type: 'READY_MODELO_FINANCIERO', version_number: 1, uploaded_at: '2026-07-01T10:00:00Z' },
      { id: 'doc-2', order_id: 'order-1', document_type: 'READY_PLAN_NEGOCIOS', version_number: 1, uploaded_at: '2026-07-01T10:00:00Z' }
    ];
    state.reviews = [
      { document_id: 'doc-1', score: 50, findings: [], extracted_data: [{ key: 'ocr_status', value: 'low_quality' }], created_at: '2026-07-01T11:00:00Z' },
      { document_id: 'doc-2', score: 70, findings: [], extracted_data: [{ key: 'ocr_status', value: 'completed' }], created_at: '2026-07-01T11:00:00Z' }
    ];
    state.orders = [{ id: 'order-1', metadata: {} }];

    const result = await getReadinessMetrics();

    expect(result.illegibleDocumentSample).toBe(2);
    expect(result.illegibleDocumentRate).toBe(50);
  });

  it('cuenta correcciones por versión usando la versión máxima por (orden, tipo de documento)', async () => {
    state.documents = [
      { id: 'doc-1', order_id: 'order-1', document_type: 'READY_PLAN_NEGOCIOS', version_number: 1, uploaded_at: '2026-07-01T10:00:00Z' },
      { id: 'doc-2', order_id: 'order-1', document_type: 'READY_PLAN_NEGOCIOS', version_number: 3, uploaded_at: '2026-07-03T10:00:00Z' }
    ];
    state.reviews = [
      { document_id: 'doc-2', score: 80, findings: [], extracted_data: [], created_at: '2026-07-03T11:00:00Z' }
    ];
    state.orders = [{ id: 'order-1', metadata: {} }];

    const result = await getReadinessMetrics();

    // Un solo grupo (order-1, READY_PLAN_NEGOCIOS) con versión máxima 3 -> 2 correcciones.
    expect(result.avgCorrectionsPerDocument).toBe(2);
  });

  it('cuenta reportes descargados por otorgantes filtrando por profile_type', async () => {
    state.documents = [{ id: 'doc-1', order_id: 'order-1', document_type: 'READY_PLAN_NEGOCIOS', version_number: 1, uploaded_at: '2026-07-01T10:00:00Z' }];
    state.reviews = [{ document_id: 'doc-1', score: 80, findings: [], extracted_data: [], created_at: '2026-07-01T11:00:00Z' }];
    state.orders = [{ id: 'order-1', metadata: {} }];
    state.auditLogs = [
      { user_id: 'user-grantee', action: 'readiness_memo_pdf_downloaded' },
      { user_id: 'user-owner', action: 'readiness_memo_downloaded' }
    ];
    state.users = [
      { id: 'user-grantee', profile_type: 'otorgante' },
      { id: 'user-owner', profile_type: 'solicitante' }
    ];

    const result = await getReadinessMetrics();

    expect(result.totalReportDownloads).toBe(2);
    expect(result.granteeReportDownloads).toBe(1);
  });
});
