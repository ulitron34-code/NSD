import { supabaseAdmin } from '../config/supabase.js';
import { getOrderCountry } from './documentIntelligenceService.js';
import { computeWeightedGlobalScore } from '../config/readinessRubrics.js';
import { getLatestNotesByOrder } from './documentReviewNotesService.js';
import { computeReadinessLifecycle } from './readinessLifecycleService.js';

// Espejo de REQUISITOS_MINIMOS (frontend/src/data/requisitosMinimos.js) — solo
// lo necesario para cruzar contra documents/document_reviews reales. Las
// etiquetas bilingües y detalles siguen viviendo únicamente en el frontend.
export const READINESS_ITEMS = [
  { id: 'doc_corporativa', code: 'READY_DOC_CORPORATIVA', critico: false },
  { id: 'identificacion_oficial', code: 'READY_IDENTIFICACION_OFICIAL', critico: true },
  { id: 'doc_kyc', code: 'READY_DOC_KYC', critico: false },
  { id: 'marco_riesgos', code: 'READY_MARCO_RIESGOS', critico: true },
  { id: 'estudio_viabilidad', code: 'READY_ESTUDIO_VIABILIDAD', critico: false },
  { id: 'estudio_mercado', code: 'READY_ESTUDIO_MERCADO', critico: false },
  { id: 'plan_negocios', code: 'READY_PLAN_NEGOCIOS', critico: false },
  { id: 'modelo_financiero', code: 'READY_MODELO_FINANCIERO', critico: false },
  { id: 'viabilidad_financiera', code: 'READY_VIABILIDAD_FINANCIERA', critico: false },
  { id: 'transparencia_documental', code: 'READY_TRANSPARENCIA_DOCUMENTAL', critico: false },
  { id: 'ods', code: 'READY_ODS', critico: false },
  { id: 'esg', code: 'READY_ESG', critico: true },
  { id: 'esia', code: 'READY_ESIA', critico: false }
];

const REVIEW_PASS_SCORE = 60;

export async function getReadinessChecklist(orderId) {
  const codes = READINESS_ITEMS.map((item) => item.code);
  const [country, latestNoteByDocumentId, { data: orderMetadataRow }] = await Promise.all([
    getOrderCountry(orderId),
    getLatestNotesByOrder(orderId),
    supabaseAdmin.from('service_orders').select('metadata').eq('id', orderId).maybeSingle()
  ]);

  const { data: documents, error: docsError } = await supabaseAdmin
    .from('documents')
    .select('id, document_type, filename, uploaded_at')
    .eq('order_id', orderId)
    .in('document_type', codes)
    .order('uploaded_at', { ascending: false });

  if (docsError) throw docsError;

  const latestByCode = {};
  for (const doc of documents || []) {
    if (!latestByCode[doc.document_type]) latestByCode[doc.document_type] = doc;
  }

  const documentIds = Object.values(latestByCode).map((doc) => doc.id);
  const latestReviewByDocId = {};

  if (documentIds.length > 0) {
    const { data: reviews, error: reviewsError } = await supabaseAdmin
      .from('document_reviews')
      .select('document_id, status, score, summary, findings, extracted_data, created_at')
      .in('document_id', documentIds)
      .order('created_at', { ascending: false });

    if (reviewsError) throw reviewsError;

    for (const review of reviews || []) {
      if (!latestReviewByDocId[review.document_id]) latestReviewByDocId[review.document_id] = review;
    }
  }

  const items = READINESS_ITEMS.map((item) => {
    const doc = latestByCode[item.code] || null;
    const review = doc ? latestReviewByDocId[doc.id] || null : null;
    const reviewCompleted = Boolean(review) && review.status !== 'processing';
    const estado = reviewCompleted && Number(review.score) >= REVIEW_PASS_SCORE ? 'listo' : 'pendiente';
    const extractedData = review?.extracted_data || [];
    const extractedValue = (key) => extractedData.find((entry) => entry?.key === key)?.value ?? null;
    const humanNote = doc ? latestNoteByDocumentId[doc.id] || null : null;

    return {
      id: item.id,
      critico: item.critico,
      estado,
      evidenciaNombre: doc?.filename || null,
      documentoId: doc?.id || null,
      enRevision: Boolean(doc) && !reviewCompleted,
      reviewStatus: review?.status || null,
      reviewScore: review ? Number(review.score) : null,
      reviewSummary: review?.summary || null,
      reviewFindings: review?.findings || [],
      recommendation: extractedValue('recomendacion'),
      structureScore: extractedValue('structure_score') != null ? Number(extractedValue('structure_score')) : null,
      humanReview: humanNote ? { decision: humanNote.decision, comment: humanNote.comment, reviewedAt: humanNote.created_at } : null
    };
  });

  const lifecycle = computeReadinessLifecycle({
    items: READINESS_ITEMS,
    documents: documents || [],
    latestByCode,
    latestReviewByDocId,
    latestNoteByDocumentId,
    archivedAt: orderMetadataRow?.metadata?.archivedAt || null
  });

  return { items, country, globalScore: computeWeightedGlobalScore(items), lifecycle };
}
