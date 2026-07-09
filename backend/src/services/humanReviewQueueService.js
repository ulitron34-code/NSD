// Cola agregada de "revisión humana pendiente" (sección 21.3 del plan: panel
// Admin "Revisión humana pendiente"). human_review_required ya se calculaba
// por documento desde la sección 16 (readinessRubricAgent.js), pero no había
// ninguna vista que lo agregara a través de todos los expedientes -- solo se
// veía documento por documento dentro del checklist de cada expediente.
import { supabaseAdmin } from '../config/supabase.js';

function extractedValue(extractedData, key) {
  return (extractedData || []).find((entry) => entry?.key === key)?.value ?? null;
}

export async function getHumanReviewQueue({ limit = 50, offset = 0 } = {}) {
  const { data: documents, error: docsError } = await supabaseAdmin
    .from('documents')
    .select('id, order_id, document_type, filename, uploaded_at')
    .like('document_type', 'READY_%')
    .order('uploaded_at', { ascending: false });

  if (docsError) throw docsError;
  if (!documents?.length) return { items: [], total: 0, limit, offset };

  const documentIds = documents.map((d) => d.id);
  const { data: reviews, error: reviewsError } = await supabaseAdmin
    .from('document_reviews')
    .select('document_id, score, status, extracted_data, created_at')
    .in('document_id', documentIds)
    .order('created_at', { ascending: false });

  if (reviewsError) throw reviewsError;

  const latestByDoc = {};
  for (const review of reviews || []) {
    if (!latestByDoc[review.document_id]) latestByDoc[review.document_id] = review;
  }

  const pending = documents
    .map((doc) => {
      const review = latestByDoc[doc.id];
      if (!review) return null;
      if (extractedValue(review.extracted_data, 'human_review_required') !== true) return null;

      return {
        documentId: doc.id,
        orderId: doc.order_id,
        documentType: doc.document_type,
        filename: doc.filename,
        reviewScore: review.score != null ? Number(review.score) : null,
        reviewStatus: review.status || null,
        reviewedAt: review.created_at,
        confidence: extractedValue(review.extracted_data, 'confidence'),
        costUsd: extractedValue(review.extracted_data, 'costo_estimado_usd')
      };
    })
    .filter(Boolean);

  const orderIds = [...new Set(pending.map((p) => p.orderId))];
  const { data: orders } = orderIds.length
    ? await supabaseAdmin.from('service_orders').select('id, case_number, project_name').in('id', orderIds)
    : { data: [] };
  const orderById = Object.fromEntries((orders || []).map((o) => [o.id, o]));

  const enriched = pending
    .map((p) => ({
      ...p,
      caseNumber: orderById[p.orderId]?.case_number || null,
      projectName: orderById[p.orderId]?.project_name || null
    }))
    .sort((a, b) => new Date(b.reviewedAt) - new Date(a.reviewedAt));

  const total = enriched.length;
  const items = enriched.slice(offset, offset + limit);

  return { items, total, limit, offset };
}
