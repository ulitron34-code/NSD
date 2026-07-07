import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = { reviews: [], notes: [], notesError: null };

vi.mock('../config/supabase.js', () => {
  function makeBuilder(table) {
    const builder = {
      select: vi.fn(() => builder),
      insert: vi.fn((row) => {
        const inserted = { id: `note-${state.notes.length + 1}`, created_at: new Date().toISOString(), ...row };
        state.notes.push(inserted);
        builder.__lastInserted = inserted;
        return builder;
      }),
      eq: vi.fn(() => builder),
      order: vi.fn(() => builder),
      limit: vi.fn(() => builder),
      maybeSingle: vi.fn(() => {
        const sorted = [...state.reviews].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
        return Promise.resolve({ data: sorted[0] || null, error: null });
      }),
      single: vi.fn(() => Promise.resolve({ data: builder.__lastInserted, error: null })),
      then: (resolve, reject) => {
        if (table === 'document_review_notes' && state.notesError) {
          return Promise.resolve({ data: null, error: state.notesError }).then(resolve, reject);
        }
        const data = table === 'document_review_notes' ? state.notes : state.reviews;
        return Promise.resolve({ data, error: null }).then(resolve, reject);
      }
    };
    return builder;
  }
  return { supabaseAdmin: { from: vi.fn((table) => makeBuilder(table)) } };
});

import { addReviewNote, getReviewNotes, getLatestNotesByOrder } from './documentReviewNotesService.js';

describe('documentReviewNotesService', () => {
  beforeEach(() => {
    state.reviews = [{ id: 'review-1', document_id: 'doc-1', created_at: '2026-07-01T00:00:00Z' }];
    state.notes = [];
    state.notesError = null;
  });

  it('rechaza una decision invalida sin tocar la base de datos', async () => {
    await expect(addReviewNote({
      orderId: 'order-1', documentId: 'doc-1', reviewerUserId: 'user-1', decision: 'algo_invalido'
    })).rejects.toThrow(/Decisión inválida/);
  });

  it('falla si el documento no tiene ninguna evaluacion de IA todavia', async () => {
    state.reviews = [];
    await expect(addReviewNote({
      orderId: 'order-1', documentId: 'doc-sin-review', reviewerUserId: 'user-1', decision: 'approved'
    })).rejects.toThrow(/todavía no tiene una evaluación/);
  });

  it('agrega una nota valida asociada al ultimo document_review del documento', async () => {
    const note = await addReviewNote({
      orderId: 'order-1', documentId: 'doc-1', reviewerUserId: 'user-1', decision: 'approved', comment: 'Se ve bien'
    });

    expect(note.document_review_id).toBe('review-1');
    expect(note.decision).toBe('approved');

    const notes = await getReviewNotes('doc-1');
    expect(notes).toHaveLength(1);
  });

  it('getLatestNotesByOrder regresa solo la nota mas reciente por documento', async () => {
    // El mock no ordena de verdad (order() es un passthrough) -- se simula el
    // orden ya descendente que produciria la query real (created_at DESC).
    state.notes = [
      { id: 'n2', document_id: 'doc-1', order_id: 'order-1', decision: 'approved', created_at: '2026-07-02T00:00:00Z' },
      { id: 'n1', document_id: 'doc-1', order_id: 'order-1', decision: 'needs_more_info', created_at: '2026-07-01T00:00:00Z' }
    ];

    const latest = await getLatestNotesByOrder('order-1');
    expect(latest['doc-1'].decision).toBe('approved');
  });

  it('getLatestNotesByOrder se degrada a {} en vez de tronar si la tabla no existe todavia (migracion no corrida)', async () => {
    state.notesError = { message: 'relation "document_review_notes" does not exist' };

    const latest = await getLatestNotesByOrder('order-1');
    expect(latest).toEqual({});
  });
});
