import { BRAND } from "../config/brand";
import { pickLang } from "./requisitosMinimos";

const statusLabels = {
  pending: { es: "Nuevo", en: "New" },
  paid: { es: "Data room abierto", en: "Data room open" },
  in_progress: { es: "En revision", en: "In review" },
  completed: { es: "Reporte listo", en: "Report ready" },
  cancelled: { es: "Observado", en: "Flagged" }
};

const serviceLabels = {
  "combo-complete": { es: "Expediente integral", en: "Full file" },
  "financial-analysis": { es: "Analisis financiero", en: "Financial analysis" },
  "business-plan": { es: "Business plan", en: "Business plan" },
  "pitch-deck": { es: "Presentacion ejecutiva", en: "Executive presentation" }
};

const documentTemplates = {
  "combo-complete": [
    { es: "Business plan", en: "Business plan" },
    { es: "Modelo financiero", en: "Financial model" },
    { es: "Pitch deck", en: "Pitch deck" },
    { es: "KYC/KYB", en: "KYC/KYB" },
    { es: "Estados financieros", en: "Financial statements" },
  ],
  "financial-analysis": [
    { es: "Estados financieros", en: "Financial statements" },
    { es: "Flujo de caja", en: "Cash flow" },
    { es: "Supuestos financieros", en: "Financial assumptions" },
    { es: "KYC/KYB", en: "KYC/KYB" },
  ],
  "business-plan": [
    { es: "Resumen ejecutivo", en: "Executive summary" },
    { es: "Business plan", en: "Business plan" },
    { es: "Uso de fondos", en: "Use of funds" },
    { es: "KYC/KYB", en: "KYC/KYB" },
  ],
  "pitch-deck": [
    { es: "Pitch deck", en: "Pitch deck" },
    { es: "Teaser", en: "Teaser" },
    { es: "Resumen financiero", en: "Financial summary" },
    { es: "KYC/KYB", en: "KYC/KYB" },
  ],
};

const defaultDocumentTemplate = [
  { es: "Resumen ejecutivo", en: "Executive summary" },
  { es: "KYC/KYB", en: "KYC/KYB" },
  { es: "Soporte financiero", en: "Financial support" },
];

const readinessLabels = {
  "committee-ready": { es: "Listo para comite", en: "Ready for committee" },
  fixable: { es: "Subsanable", en: "Fixable" },
  "initial-prep": { es: "Preparacion inicial", en: "Initial preparation" },
};

const riskLabels = {
  low: { es: "Bajo", en: "Low" },
  medium: { es: "Medio", en: "Medium" },
  high: { es: "Alto", en: "High" },
};

function localizeList(items, language) {
  return items.map((item) => (typeof item === "object" && item !== null ? pickLang(item, language) : item));
}

function normalizeAmount(amount = 0) {
  const numeric = Number(amount || 0);
  return numeric > 1000000 ? numeric / 100 : numeric;
}

function inferReadinessKey(score = 0, status = "") {
  if (score >= 82 || status === "completed") return "committee-ready";
  if (score >= 65 || status === "in_progress") return "fixable";
  return "initial-prep";
}

export function formatCurrency(amount = 0) {
  return normalizeAmount(amount).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });
}

export function mapOrderToOpportunity(order, language = "es") {
  const metadata = order.metadata || {};
  const normalizedStatus = order.status === "paid" ? "in_progress" : order.status;
  const amount = normalizeAmount(order.requested_amount ?? order.amount);
  const sector = metadata.sector || pickLang({ es: "No especificado", en: "Not specified" }, language);
  const targetEntity = metadata.targetEntity || metadata.target_entity || pickLang({ es: "Otorgante por definir", en: "Grantor to be defined" }, language);
  const structure = metadata.structure || metadata.fundingStructure || pickLang(serviceLabels[order.service_type], language) || pickLang({ es: "Estructura por definir", en: "Structure to be defined" }, language);
  const baseScore = normalizedStatus === "completed" ? 88 : normalizedStatus === "in_progress" ? 76 : 58;
  const complianceScore = Number(metadata.complianceScore || metadata.compliance_score || 0) || (metadata.country || metadata.rfc ? Math.min(baseScore + 8, 96) : baseScore);
  const financialScore = Number(metadata.financialScore || metadata.financial_score || 0) || (amount >= 75000 ? Math.max(baseScore - 4, 45) : baseScore);
  const averageScore = Math.round((financialScore + complianceScore) / 2);
  const riskLevel = averageScore >= 82 ? "low" : averageScore >= 65 ? "medium" : "high";
  const readinessKey = inferReadinessKey(averageScore, normalizedStatus);
  const documents = Array.isArray(metadata.documents) && metadata.documents.length
    ? metadata.documents
    : localizeList(documentTemplates[order.service_type] || defaultDocumentTemplate, language);
  const statusLabel = pickLang(statusLabels[normalizedStatus], language) || normalizedStatus || pickLang({ es: "Nuevo", en: "New" }, language);

  return {
    id: order.id,
    order,
    name: order.project_name || order.projectName || metadata.projectName || `${pickLang({ es: "Expediente", en: "File" }, language)} ${String(order.id).slice(0, 8)}`,
    applicant: metadata.companyName || metadata.email || order.applicant_type || `${pickLang({ es: "Solicitante", en: "Applicant" }, language)} ${BRAND.name}`,
    sector,
    country: metadata.country || "MX",
    amount,
    amountLabel: formatCurrency(amount),
    use: metadata.description || metadata.useOfFunds || pickLang({ es: "Uso de fondos pendiente de confirmar", en: "Use of funds pending confirmation" }, language),
    stage: statusLabel,
    financialScore,
    complianceScore,
    averageScore,
    risk: order.risk_level || pickLang(riskLabels[riskLevel], language),
    riskLevel,
    guarantee: metadata.guarantee || pickLang({ es: "Soporte documental por validar", en: "Documentary support to be validated" }, language),
    targetEntity,
    structure,
    readinessLevel: order.readiness_grade || metadata.readinessLevel || metadata.readiness_level || pickLang(readinessLabels[readinessKey], language),
    readinessKey,
    documents,
    status: statusLabel,
    rawStatus: normalizedStatus,
    createdAt: order.created_at,
    share: metadata.share || null,
    interest: metadata.interest || null,
    infoRequests: metadata.infoRequests || metadata.info_requests || [],
    contactRequest: metadata.contactRequest || metadata.contact_request || null,
    documentsCount: Number(metadata.documentsCount || metadata.documents_count || documents.length),
    invitationStatus: metadata.share?.status || metadata.invitationStatus || metadata.invitation_status || null
  };
}

export function mapPipelineEntryToOpportunity(entry, language = "es") {
  const opportunity = mapOrderToOpportunity({
    ...entry.order,
    metadata: {
      ...(entry.order?.metadata || {}),
      sharedWith: entry.share?.recipientName,
      shareStatus: entry.share?.status
    }
  }, language);

  const averageScore = entry.scoring?.finalScore ?? opportunity.averageScore;
  const riskLevel = averageScore >= 82 ? "low" : averageScore >= 65 ? "medium" : "high";
  const readinessKey = inferReadinessKey(averageScore, opportunity.rawStatus);
  const statusKey = entry.interest?.status === "term_sheet"
    ? "report-ready"
    : entry.interest?.status === "under_review"
      ? "in-review"
      : entry.interest?.status === "declined"
        ? "flagged"
        : entry.share?.status === "invited"
          ? "invited"
          : null;
  const statusLabelByKey = {
    "report-ready": { es: "Reporte listo", en: "Report ready" },
    "in-review": { es: "En revision", en: "In review" },
    flagged: { es: "Observado", en: "Flagged" },
    invited: { es: "Invitado", en: "Invited" },
  };

  return {
    ...opportunity,
    share: entry.share,
    interest: entry.interest || null,
    documentsCount: entry.documentsCount || 0,
    latestReview: entry.latestReview || null,
    infoRequests: Array.isArray(entry.informationRequests) ? entry.informationRequests : opportunity.infoRequests,
    scoring: entry.scoring || null,
    financialScore: entry.scoring?.finalScore ?? opportunity.financialScore,
    complianceScore: entry.scoring?.regulatoryValidation?.status === "clear" ? Math.max(opportunity.complianceScore, 85) : opportunity.complianceScore,
    averageScore,
    risk: pickLang(riskLabels[riskLevel], language),
    riskLevel,
    readinessLevel: pickLang(readinessLabels[readinessKey], language),
    readinessKey,
    invitationStatus: entry.share?.status || "accepted",
    status: statusKey ? pickLang(statusLabelByKey[statusKey], language) : opportunity.status,
  };
}

export function buildOtorgantePipeline(orders = [], language = "es") {
  return orders.map((order) => mapOrderToOpportunity(order, language));
}

export function buildOtorgantePipelineFromEntries(entries = [], language = "es") {
  return entries.map((entry) => mapPipelineEntryToOpportunity(entry, language));
}

export function buildOtorganteAnalytics(opportunities = [], language = "es") {
  const total = opportunities.length;
  const dataRooms = opportunities.filter((item) => ["in_progress", "completed"].includes(item.rawStatus)).length;
  const offers = opportunities.filter((item) => item.rawStatus === "completed").length;
  const observed = opportunities.filter((item) => (item.riskLevel ? item.riskLevel === "high" : item.risk === "Alto")).length;
  const totalAmount = opportunities.reduce((sum, item) => sum + item.amount, 0);
  const averageTicket = total ? totalAmount / total : 0;

  const bySector = opportunities.reduce((acc, item) => {
    acc[item.sector] = (acc[item.sector] || 0) + item.amount;
    return acc;
  }, {});

  const sectorExposure = Object.entries(bySector)
    .map(([sector, amount]) => ({
      sector,
      amount,
      pct: totalAmount ? Math.round((amount / totalAmount) * 100) : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    total,
    dataRooms,
    offers,
    observed,
    totalAmount,
    averageTicket,
    lowRisk: opportunities.filter((item) => (item.riskLevel ? item.riskLevel === "low" : item.risk === "Bajo")).length,
    mediumRisk: opportunities.filter((item) => (item.riskLevel ? item.riskLevel === "medium" : item.risk === "Medio")).length,
    highRisk: observed,
    funnel: [
      { label: pickLang({ es: "Expedientes recibidos", en: "Files received" }, language), value: total, width: 100 },
      { label: pickLang({ es: "Data rooms abiertos", en: "Data rooms opened" }, language), value: dataRooms, width: total ? Math.max(Math.round((dataRooms / total) * 100), 12) : 12 },
      { label: pickLang({ es: "Reportes listos", en: "Reports ready" }, language), value: offers, width: total ? Math.max(Math.round((offers / total) * 100), 12) : 12 },
      { label: pickLang({ es: "Riesgo alto", en: "High risk" }, language), value: observed, width: total ? Math.max(Math.round((observed / total) * 100), 12) : 12 }
    ],
    sectorExposure
  };
}
