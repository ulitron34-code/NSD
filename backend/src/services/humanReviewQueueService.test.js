import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = { documents: [], reviews: [], orders: [] };

vi.mock('../config/supabase.js', () => {
  function makeBuilder(table) {
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      like: vi.fn(() => builder),
      in: vi.fn(() => builder),
      order: vi.fn(() => builder),
      then: (resolve, reject) => {
        const data = table === 'documents' ? state.documents : table === 'document_reviews' ? state.reviews : state.orders;
        return Promise.resolve({ data, error: null }).then(resolve, reject);
      }
    };
    return builder;
  }
  return { supabaseAdmin: { from: vi.fn((table) => makeBuilder(table)) } };
});

import { getHumanReviewQueue } from './humanReviewQueueService.js';

describe('getHumanReviewQueue', () => {
  beforeEach(() => {
    state.documents = [];
    state.reviews = [];
    state.orders = [];
  });

  it('regresa vacio cuando no hay documentos READY_*', async () => {
    const result = await getHumanReviewQueue();
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('incluye solo documentos cuya ULTIMA revision tiene human_review_required=true', async () => {
    state.documents = [
      { id: 'doc-1', order_id: 'order-1', document_type: 'READY_PLAN_NEGOCIOS', filename: 'plan.pdf', uploaded_at: '2026-07-01' },
      { id: 'doc-2', order_id: 'order-2', document_type: 'READY_MODELO_FINANCIERO', filename: 'modelo.xlsx', uploaded_at: '2026-07-01' }
    ];
    state.reviews = [
      { document_id: 'doc-1', score: 45, status: 'red', created_at: '2026-07-02T10:00:00Z', extracted_data: [{ key: 'human_review_required', value: true }, { key: 'confidence', value: 0.4 }, { key: 'costo_estimado_usd', value: 0.01 }] },
      { document_id: 'doc-2', score: 90, status: 'green', created_at: '2026-07-02T10:00:00Z', extracted_data: [{ key: 'human_review_required', value: false }] }
    ];
    state.orders = [
      { id: 'order-1', case_number: 'NSD-0001', project_name: 'Proyecto A' }
    ];

    const result = await getHumanReviewQueue();

    expect(result.total).toBe(1);
    expect(result.items[0].documentId).toBe('doc-1');
    expect(result.items[0].caseNumber).toBe('NSD-0001');
    expect(result.items[0].confidence).toBe(0.4);
    expect(result.items[0].costUsd).toBe(0.01);
  });

  it('no incluye un documento si la revision MAS RECIENTE ya no requiere revision humana', async () => {
    state.documents = [{ id: 'doc-1', order_id: 'order-1', document_type: 'READY_PLAN_NEGOCIOS', filename: 'plan.pdf', uploaded_at: '2026-07-01' }];
    state.reviews = [
      // La mas reciente (created_at mas tardio) ya no requiere revision -- el
      // mock respeta el orden en que se listan las filas (simula .order desc).
      { document_id: 'doc-1', score: 85, status: 'green', created_at: '2026-07-03T10:00:00Z', extracted_data: [{ key: 'human_review_required', value: false }] },
      { document_id: 'doc-1', score: 40, status: 'red', created_at: '2026-07-02T10:00:00Z', extracted_data: [{ key: 'human_review_required', value: true }] }
    ];

    const result = await getHumanReviewQueue();
    expect(result.total).toBe(0);
  });

  it('respeta limit/offset para paginacion', async () => {
    state.documents = [
      { id: 'doc-1', order_id: 'order-1', document_type: 'READY_PLAN_NEGOCIOS', filename: 'a.pdf', uploaded_at: '2026-07-01' },
      { id: 'doc-2', order_id: 'order-2', document_type: 'READY_PLAN_NEGOCIOS', filename: 'b.pdf', uploaded_at: '2026-07-01' },
      { id: 'doc-3', order_id: 'order-3', document_type: 'READY_PLAN_NEGOCIOS', filename: 'c.pdf', uploaded_at: '2026-07-01' }
    ];
    state.reviews = ['doc-1', 'doc-2', 'doc-3'].map((id, i) => ({
      document_id: id, score: 30, status: 'red', created_at: `2026-07-0${i + 1}T10:00:00Z`,
      extracted_data: [{ key: 'human_review_required', value: true }]
    }));

    const result = await getHumanReviewQueue({ limit: 2, offset: 0 });
    expect(result.total).toBe(3);
    expect(result.items).toHaveLength(2);
  });
});
