import { describe, it, expect } from 'vitest';
import { computeReadinessLifecycle } from './readinessLifecycleService.js';

const ITEMS = [
  { id: 'doc_corporativa', code: 'READY_DOC_CORPORATIVA' },
  { id: 'marco_riesgos', code: 'READY_MARCO_RIESGOS' }
];

function baseArgs(overrides = {}) {
  return {
    items: ITEMS,
    documents: [],
    latestByCode: {},
    latestReviewByDocId: {},
    latestNoteByDocumentId: {},
    archivedAt: null,
    ...overrides
  };
}

describe('computeReadinessLifecycle', () => {
  it('archivado cuando hay archivedAt, sin importar el resto', () => {
    const result = computeReadinessLifecycle(baseArgs({ archivedAt: '2026-07-01T00:00:00Z' }));
    expect(result.status).toBe('archivado');
  });

  it('draft cuando no hay ningun documento', () => {
    const result = computeReadinessLifecycle(baseArgs());
    expect(result.status).toBe('draft');
  });

  it('intake_incompleto cuando falta al menos un item requerido', () => {
    const docA = { id: 'a', document_type: 'READY_DOC_CORPORATIVA' };
    const result = computeReadinessLifecycle(baseArgs({
      documents: [docA],
      latestByCode: { READY_DOC_CORPORATIVA: docA }
    }));
    expect(result.status).toBe('intake_incompleto');
  });

  it('en_evaluacion_ia cuando algun documento no tiene review o sigue en processing', () => {
    const docA = { id: 'a', document_type: 'READY_DOC_CORPORATIVA' };
    const docB = { id: 'b', document_type: 'READY_MARCO_RIESGOS' };
    const result = computeReadinessLifecycle(baseArgs({
      documents: [docA, docB],
      latestByCode: { READY_DOC_CORPORATIVA: docA, READY_MARCO_RIESGOS: docB },
      latestReviewByDocId: { a: { status: 'green', score: 90 }, b: { status: 'processing', score: 0 } }
    }));
    expect(result.status).toBe('en_evaluacion_ia');
  });

  it('rechazado_documentalmente cuando un analista rechazo algun documento', () => {
    const docA = { id: 'a', document_type: 'READY_DOC_CORPORATIVA' };
    const docB = { id: 'b', document_type: 'READY_MARCO_RIESGOS' };
    const result = computeReadinessLifecycle(baseArgs({
      documents: [docA, docB],
      latestByCode: { READY_DOC_CORPORATIVA: docA, READY_MARCO_RIESGOS: docB },
      latestReviewByDocId: { a: { status: 'green', score: 90 }, b: { status: 'green', score: 90 } },
      latestNoteByDocumentId: { a: { decision: 'rejected' } }
    }));
    expect(result.status).toBe('rechazado_documentalmente');
  });

  it('precalificado_documentalmente cuando todos los items tienen nota approved', () => {
    const docA = { id: 'a', document_type: 'READY_DOC_CORPORATIVA' };
    const docB = { id: 'b', document_type: 'READY_MARCO_RIESGOS' };
    const result = computeReadinessLifecycle(baseArgs({
      documents: [docA, docB],
      latestByCode: { READY_DOC_CORPORATIVA: docA, READY_MARCO_RIESGOS: docB },
      latestReviewByDocId: { a: { status: 'green', score: 90 }, b: { status: 'green', score: 90 } },
      latestNoteByDocumentId: { a: { decision: 'approved' }, b: { decision: 'approved' } }
    }));
    expect(result.status).toBe('precalificado_documentalmente');
  });

  it('en_correccion cuando una version anterior fue observada y la nueva version aun no tiene nota', () => {
    const oldDocA = { id: 'a-v1', document_type: 'READY_DOC_CORPORATIVA' };
    const newDocA = { id: 'a-v2', document_type: 'READY_DOC_CORPORATIVA' };
    const docB = { id: 'b', document_type: 'READY_MARCO_RIESGOS' };
    const result = computeReadinessLifecycle(baseArgs({
      documents: [oldDocA, newDocA, docB],
      latestByCode: { READY_DOC_CORPORATIVA: newDocA, READY_MARCO_RIESGOS: docB },
      latestReviewByDocId: { 'a-v2': { status: 'green', score: 90 }, b: { status: 'green', score: 90 } },
      latestNoteByDocumentId: { 'a-v1': { decision: 'needs_more_info' } }
    }));
    expect(result.status).toBe('en_correccion');
  });

  it('observado cuando hay un review rojo sin nota humana', () => {
    const docA = { id: 'a', document_type: 'READY_DOC_CORPORATIVA' };
    const docB = { id: 'b', document_type: 'READY_MARCO_RIESGOS' };
    const result = computeReadinessLifecycle(baseArgs({
      documents: [docA, docB],
      latestByCode: { READY_DOC_CORPORATIVA: docA, READY_MARCO_RIESGOS: docB },
      latestReviewByDocId: { a: { status: 'red', score: 20 }, b: { status: 'green', score: 90 } }
    }));
    expect(result.status).toBe('observado');
  });

  it('observado cuando hay una nota needs_more_info sin resubida', () => {
    const docA = { id: 'a', document_type: 'READY_DOC_CORPORATIVA' };
    const docB = { id: 'b', document_type: 'READY_MARCO_RIESGOS' };
    const result = computeReadinessLifecycle(baseArgs({
      documents: [docA, docB],
      latestByCode: { READY_DOC_CORPORATIVA: docA, READY_MARCO_RIESGOS: docB },
      latestReviewByDocId: { a: { status: 'green', score: 90 }, b: { status: 'green', score: 90 } },
      latestNoteByDocumentId: { a: { decision: 'needs_more_info' } }
    }));
    expect(result.status).toBe('observado');
  });

  it('listo_para_revision_humana cuando todo esta evaluado, sin rojos ni notas', () => {
    const docA = { id: 'a', document_type: 'READY_DOC_CORPORATIVA' };
    const docB = { id: 'b', document_type: 'READY_MARCO_RIESGOS' };
    const result = computeReadinessLifecycle(baseArgs({
      documents: [docA, docB],
      latestByCode: { READY_DOC_CORPORATIVA: docA, READY_MARCO_RIESGOS: docB },
      latestReviewByDocId: { a: { status: 'yellow', score: 70 }, b: { status: 'green', score: 90 } }
    }));
    expect(result.status).toBe('listo_para_revision_humana');
  });
});
