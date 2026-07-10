// Dashboard de métricas cross-expediente (sección 30 del plan: "Métricas del
// módulo"). Antes de esto solo existían métricas POR expediente individual
// (totalCostUsd en readinessChecklistService.js) o una lista sin agregar
// (humanReviewQueueService.js) -- esta es la primera vista que resume el
// módulo completo a través de todos los expedientes, reusando exactamente
// los mismos datos (documents/document_reviews/cross_references/audit_logs)
// que ya alimentan el checklist y los reportes, sin tabla ni columna nueva.
import { supabaseAdmin } from '../config/supabase.js';
import { READINESS_ITEMS } from './readinessChecklistService.js';
import { computeWeightedGlobalScore, sectorHasSpecificDocuments } from '../config/readinessRubrics.js';
import { categorizeRedFlag, isRedFlagFinding } from '../utils/redFlagCategories.js';

const SECTOR_ITEM = { id: 'permisos_sectoriales', code: 'READY_PERMISOS_SECTORIALES' };

// "Listo" para el KPI de sección 30 se define igual que la sección 11.4 del
// plan: score >= 75 ya es "Listo con observaciones" o mejor (apto para
// revisión financiera inicial en adelante).
const READY_SCORE_THRESHOLD = 75;

function extractedValue(extractedData, key) {
  return (extractedData || []).find((entry) => entry?.key === key)?.value ?? null;
}

// La categorización heurística de banderas rojas vive en
// utils/redFlagCategories.js (compartida con el resumen anonimizado de
// readinessMemoService.js -- sección 29 -- para no duplicar la taxonomía).

// Etiquetas legibles para los campos que compara readinessCrossRefAgent.js
// (extracted_data key -> nombre humano). Solo prettifica, no agrega ningún
// campo que el agente no extraiga ya.
const FIELD_LABELS = {
  monto_solicitado: 'Monto solicitado',
  razon_social: 'Razón social',
  fecha_documento: 'Fecha del documento',
  rfc: 'RFC',
  representante_legal: 'Representante legal',
  capex: 'CAPEX',
  deuda_total: 'Deuda total'
};

const REPORT_DOWNLOAD_ACTIONS = [
  'readiness_memo_downloaded',
  'readiness_memo_pdf_downloaded',
  'readiness_technical_memo_downloaded',
  'readiness_technical_memo_pdf_downloaded',
  'institutional_memo_downloaded'
];

function topN(counts, n = 5) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, count]) => ({ label, count }));
}

function emptyMetrics() {
  return {
    totalOrders: 0,
    avgGlobalScore: null,
    avgMissingDocuments: null,
    avgEvaluationSeconds: null,
    avgEvaluationNote: 'Sin expedientes con documentos del checklist todavía.',
    avgCostUsdPerOrder: null,
    illegibleDocumentRate: null,
    illegibleDocumentSample: 0,
    topRedFlags: [],
    topInconsistencies: [],
    readyOrdersPercentage: null,
    avgCorrectionsPerDocument: null,
    granteeReportDownloads: 0,
    totalReportDownloads: 0
  };
}

const EVALUATION_TIME_NOTE = 'No disponible: document_reviews solo guarda la marca de tiempo de INICIO de la evaluación (created_at, escrita al insertar el registro con status "processing"); no se persiste una marca de finalización separada. Calcularlo sin inventar el dato requeriría agregar una columna nueva.';

export async function getReadinessMetrics() {
  const { data: documents, error: docsError } = await supabaseAdmin
    .from('documents')
    .select('id, order_id, document_type, version_number, uploaded_at')
    .like('document_type', 'READY_%');

  if (docsError) throw docsError;
  if (!documents?.length) return emptyMetrics();

  const documentIds = documents.map((doc) => doc.id);

  const [{ data: reviews, error: reviewsError }, { data: orders }, { data: crossRefs }, { data: downloadLogs }] = await Promise.all([
    supabaseAdmin
      .from('document_reviews')
      .select('document_id, score, findings, extracted_data, created_at')
      .in('document_id', documentIds)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('service_orders')
      .select('id, metadata')
      .in('id', [...new Set(documents.map((doc) => doc.order_id))]),
    supabaseAdmin
      .from('cross_references')
      .select('field_name, document_a_id')
      .eq('match_result', 'fail')
      .in('document_a_id', documentIds),
    supabaseAdmin
      .from('audit_logs')
      .select('user_id, action')
      .in('action', REPORT_DOWNLOAD_ACTIONS)
  ]);

  if (reviewsError) throw reviewsError;

  const latestReviewByDoc = {};
  for (const review of reviews || []) {
    if (!latestReviewByDoc[review.document_id]) latestReviewByDoc[review.document_id] = review;
  }

  const orderById = Object.fromEntries((orders || []).map((order) => [order.id, order]));

  // Documento más reciente por (orden, tipo) -- mismo criterio que
  // getReadinessChecklist(); y versión máxima por (orden, tipo) para medir
  // correcciones (una versión > 1 implica que el solicitante recargó el
  // documento tras observaciones).
  const latestDocByOrderAndCode = {};
  const maxVersionByGroup = {};
  for (const doc of documents) {
    latestDocByOrderAndCode[doc.order_id] = latestDocByOrderAndCode[doc.order_id] || {};
    const existing = latestDocByOrderAndCode[doc.order_id][doc.document_type];
    if (!existing || new Date(doc.uploaded_at) > new Date(existing.uploaded_at)) {
      latestDocByOrderAndCode[doc.order_id][doc.document_type] = doc;
    }
    const groupKey = `${doc.order_id}::${doc.document_type}`;
    maxVersionByGroup[groupKey] = Math.max(maxVersionByGroup[groupKey] || 1, Number(doc.version_number) || 1);
  }

  const orderIds = Object.keys(latestDocByOrderAndCode);
  let sumGlobalScore = 0;
  let sumMissing = 0;
  let sumCostUsd = 0;
  let readyOrders = 0;

  for (const orderId of orderIds) {
    const sector = orderById[orderId]?.metadata?.sector || null;
    const financingType = orderById[orderId]?.metadata?.financingType || null;
    const effectiveItems = sectorHasSpecificDocuments(sector) ? [...READINESS_ITEMS, SECTOR_ITEM] : READINESS_ITEMS;
    const docsByCode = latestDocByOrderAndCode[orderId] || {};

    let missing = 0;
    let orderCost = 0;
    const items = effectiveItems.map((item) => {
      const doc = docsByCode[item.code];
      if (!doc) {
        missing += 1;
        return { id: item.id, reviewScore: null };
      }
      const review = latestReviewByDoc[doc.id];
      orderCost += Number(extractedValue(review?.extracted_data, 'costo_estimado_usd')) || 0;
      return { id: item.id, reviewScore: review ? Number(review.score) : null };
    });

    sumMissing += missing;
    sumCostUsd += orderCost;

    const { score } = computeWeightedGlobalScore(items, sector, financingType);
    sumGlobalScore += score;
    if (score >= READY_SCORE_THRESHOLD) readyOrders += 1;
  }

  let withOcrStatus = 0;
  let illegible = 0;
  const redFlagCounts = {};
  for (const doc of documents) {
    const review = latestReviewByDoc[doc.id];
    if (!review) continue;

    const ocrStatus = extractedValue(review.extracted_data, 'ocr_status');
    if (ocrStatus) {
      withOcrStatus += 1;
      if (ocrStatus !== 'completed') illegible += 1;
    }

    for (const finding of review.findings || []) {
      if (isRedFlagFinding(finding)) {
        const label = categorizeRedFlag(finding);
        redFlagCounts[label] = (redFlagCounts[label] || 0) + 1;
      }
    }
  }

  const inconsistencyCounts = {};
  for (const ref of crossRefs || []) {
    const label = FIELD_LABELS[ref.field_name] || ref.field_name;
    inconsistencyCounts[label] = (inconsistencyCounts[label] || 0) + 1;
  }

  const versionGroups = Object.values(maxVersionByGroup);
  const avgCorrectionsPerDocument = versionGroups.length
    ? Number((versionGroups.reduce((sum, maxVersion) => sum + (maxVersion - 1), 0) / versionGroups.length).toFixed(2))
    : 0;

  const downloaderIds = [...new Set((downloadLogs || []).map((log) => log.user_id).filter(Boolean))];
  let granteeReportDownloads = 0;
  if (downloaderIds.length) {
    const { data: downloaders } = await supabaseAdmin.from('users').select('id, profile_type').in('id', downloaderIds);
    const granteeIds = new Set((downloaders || []).filter((user) => user.profile_type === 'otorgante').map((user) => user.id));
    granteeReportDownloads = (downloadLogs || []).filter((log) => granteeIds.has(log.user_id)).length;
  }

  const totalOrders = orderIds.length;

  return {
    totalOrders,
    avgGlobalScore: totalOrders ? Math.round(sumGlobalScore / totalOrders) : null,
    avgMissingDocuments: totalOrders ? Number((sumMissing / totalOrders).toFixed(2)) : null,
    avgEvaluationSeconds: null,
    avgEvaluationNote: EVALUATION_TIME_NOTE,
    avgCostUsdPerOrder: totalOrders ? Number((sumCostUsd / totalOrders).toFixed(4)) : null,
    illegibleDocumentRate: withOcrStatus ? Number(((illegible / withOcrStatus) * 100).toFixed(1)) : null,
    illegibleDocumentSample: withOcrStatus,
    topRedFlags: topN(redFlagCounts),
    topInconsistencies: topN(inconsistencyCounts),
    readyOrdersPercentage: totalOrders ? Number(((readyOrders / totalOrders) * 100).toFixed(1)) : null,
    avgCorrectionsPerDocument,
    granteeReportDownloads,
    totalReportDownloads: (downloadLogs || []).length
  };
}
