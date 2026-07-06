import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = { documents: [], reviews: [] };

vi.mock('../config/supabase.js', () => {
  function makeBuilder(table) {
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      in: vi.fn(() => builder),
      order: vi.fn(() => builder),
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

import { getReadinessChecklist } from './readinessChecklistService.js';

describe('getReadinessChecklist', () => {
  beforeEach(() => {
    state.documents = [];
    state.reviews = [];
  });

  it('marca los 13 items como pendiente cuando no hay documentos subidos', async () => {
    const result = await getReadinessChecklist('order-1');
    expect(result.items).toHaveLength(13);
    expect(result.items.every((i) => i.estado === 'pendiente')).toBe(true);
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
});
