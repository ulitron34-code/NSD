// Auditor cruzado para los documentos READY_* del checklist de 12 Requisitos
// Minimos. A diferencia de agentCrossRef.js (hardcodeado a 4 document_type
// viejos: RFC_CSF, ACTA_CONST, COMP_DOMICILIO, EDOS_FINANCIEROS), este agente
// es generico: compara los "extracted_fields" que readinessRubricAgent.js ya
// guarda en document_reviews.extracted_data (monto_solicitado, razon_social,
// fecha_documento, etc.) entre todos los documentos READY_* de una orden, sin
// necesidad de una nueva llamada a IA -- es comparacion de datos ya guardados.
// Reusa la misma tabla/helpers que agentCrossRef.js (cross_references,
// saveCrossReferences) para no crear un esquema paralelo.
import { supabaseAdmin } from '../config/supabase.js';
import { saveCrossReferences } from '../services/documentIntelligenceService.js';

function normalizeValue(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export async function runReadinessCrossReferences(orderId) {
  const { data: documents, error: docsError } = await supabaseAdmin
    .from('documents')
    .select('id, filename, document_type')
    .eq('order_id', orderId)
    .like('document_type', 'READY_%');

  if (docsError) throw docsError;

  const documentIds = (documents || []).map((doc) => doc.id);
  if (documentIds.length < 2) {
    await saveCrossReferences(orderId, []);
    return { inconsistencies: [], comparedDocuments: documentIds.length };
  }

  const { data: reviews, error: reviewsError } = await supabaseAdmin
    .from('document_reviews')
    .select('document_id, extracted_data, created_at')
    .in('document_id', documentIds)
    .order('created_at', { ascending: false });

  if (reviewsError) throw reviewsError;

  const latestByDoc = {};
  for (const review of reviews || []) {
    if (!latestByDoc[review.document_id]) latestByDoc[review.document_id] = review;
  }

  const docById = Object.fromEntries(documents.map((doc) => [doc.id, doc]));

  const byKey = {};
  for (const [documentId, review] of Object.entries(latestByDoc)) {
    for (const entry of review.extracted_data || []) {
      if (!entry?.key || entry.key === 'Bandera roja') continue;
      byKey[entry.key] = byKey[entry.key] || [];
      byKey[entry.key].push({ documentId, value: entry.value });
    }
  }

  const inconsistencies = [];
  const crossReferenceRows = [];

  for (const [key, entries] of Object.entries(byKey)) {
    if (entries.length < 2) continue;

    for (let i = 0; i < entries.length; i += 1) {
      for (let j = i + 1; j < entries.length; j += 1) {
        const a = entries[i];
        const b = entries[j];
        if (normalizeValue(a.value) === normalizeValue(b.value)) continue;

        const message = `"${key}" no coincide entre "${docById[a.documentId]?.filename || a.documentId}" (${a.value}) y "${docById[b.documentId]?.filename || b.documentId}" (${b.value}).`;
        inconsistencies.push({
          field: key,
          documentA: docById[a.documentId]?.filename || a.documentId,
          documentB: docById[b.documentId]?.filename || b.documentId,
          valueA: a.value,
          valueB: b.value,
          message
        });
        crossReferenceRows.push({
          order_id: orderId,
          source_document_id: a.documentId,
          target_document_id: b.documentId,
          cross_reference_type: key,
          status: 'fail',
          confidence_score: null,
          details: message
        });
      }
    }
  }

  await saveCrossReferences(orderId, crossReferenceRows);

  return { inconsistencies, comparedDocuments: documentIds.length };
}
