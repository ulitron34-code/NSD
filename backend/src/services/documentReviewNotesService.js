import { supabaseAdmin } from '../config/supabase.js';

// Workflow humano de revisión (sección 7 del plan): un analista puede
// aprobar/rechazar/pedir más información o solo comentar sobre la evaluación
// de IA ya guardada en document_reviews. Historial insert-only (mismo patrón
// que nagmar_case_actions en caseManagerService.js) -- el "estado vigente" es
// la última nota, no se sobreescribe nada.
const VALID_DECISIONS = new Set(['approved', 'rejected', 'needs_more_info', 'note']);

async function getLatestReviewId(documentId) {
  const { data, error } = await supabaseAdmin
    .from('document_reviews')
    .select('id')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id || null;
}

export async function addReviewNote({ orderId, documentId, reviewerUserId, decision, comment }) {
  if (!VALID_DECISIONS.has(decision)) {
    throw new Error(`Decisión inválida: "${decision}". Debe ser una de: ${[...VALID_DECISIONS].join(', ')}.`);
  }

  const documentReviewId = await getLatestReviewId(documentId);
  if (!documentReviewId) {
    throw new Error('Este documento todavía no tiene una evaluación de IA que revisar.');
  }

  const { data, error } = await supabaseAdmin
    .from('document_review_notes')
    .insert({
      document_review_id: documentReviewId,
      document_id: documentId,
      order_id: orderId,
      reviewer_user_id: reviewerUserId,
      decision,
      comment: comment || null
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getReviewNotes(documentId) {
  const { data, error } = await supabaseAdmin
    .from('document_review_notes')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Última nota por documento para todo un expediente en una sola consulta,
// usado por readinessChecklistService.js para no hacer N+1 queries.
//
// IMPORTANTE: esta función la llama getReadinessChecklist(), que ya es una
// ruta EN PRODUCCION usada por el checklist, los memos y los reportes. Si la
// migración 2026-07-06_document_review_notes.sql todavía no se corrió en
// Supabase, la tabla no existe -- se degrada devolviendo {} en vez de tronar,
// para no romper todo el checklist solo porque la feature nueva de revisión
// humana aún no está lista en esa base de datos (mismo patrón que
// INEGI/Banxico/CNBV cuando su fuente no está configurada).
export async function getLatestNotesByOrder(orderId) {
  const { data, error } = await supabaseAdmin
    .from('document_review_notes')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[documentReviewNotesService] No se pudo leer document_review_notes (¿falta correr la migración?):', error.message);
    return {};
  }

  const latestByDocumentId = {};
  for (const note of data || []) {
    if (!latestByDocumentId[note.document_id]) latestByDocumentId[note.document_id] = note;
  }
  return latestByDocumentId;
}
