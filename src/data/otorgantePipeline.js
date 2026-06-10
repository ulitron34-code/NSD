const statusLabels = {
  pending: "Nuevo",
  paid: "Data room abierto",
  in_progress: "En revision",
  completed: "Reporte listo",
  cancelled: "Observado"
};

const serviceLabels = {
  "combo-complete": "Expediente integral",
  "financial-analysis": "Analisis financiero",
  "business-plan": "Business plan",
  "pitch-deck": "Presentacion ejecutiva"
};

const documentTemplates = {
  "combo-complete": ["Business plan", "Modelo financiero", "Pitch deck", "KYC/KYB", "Estados financieros"],
  "financial-analysis": ["Estados financieros", "Flujo de caja", "Supuestos financieros", "KYC/KYB"],
  "business-plan": ["Resumen ejecutivo", "Business plan", "Uso de fondos", "KYC/KYB"],
  "pitch-deck": ["Pitch deck", "Teaser", "Resumen financiero", "KYC/KYB"]
};

function normalizeAmount(amount = 0) {
  const numeric = Number(amount || 0);
  return numeric > 1000000 ? numeric / 100 : numeric;
}

function inferReadinessLevel(score = 0, status = "") {
  if (score >= 82 || status === "completed") return "Listo para comite";
  if (score >= 65 || status === "in_progress") return "Subsanable";
  return "Preparacion inicial";
}

export function formatCurrency(amount = 0) {
  return normalizeAmount(amount).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });
}

export function mapOrderToOpportunity(order) {
  const metadata = order.metadata || {};
  const normalizedStatus = order.status === "paid" ? "in_progress" : order.status;
  const amount = normalizeAmount(order.amount);
  const sector = metadata.sector || "No especificado";
  const targetEntity = metadata.targetEntity || metadata.target_entity || "Otorgante por definir";
  const structure = metadata.structure || metadata.fundingStructure || serviceLabels[order.service_type] || "Estructura por definir";
  const baseScore = normalizedStatus === "completed" ? 88 : normalizedStatus === "in_progress" ? 76 : 58;
  const complianceScore = Number(metadata.complianceScore || metadata.compliance_score || 0) || (metadata.country || metadata.rfc ? Math.min(baseScore + 8, 96) : baseScore);
  const financialScore = Number(metadata.financialScore || metadata.financial_score || 0) || (amount >= 75000 ? Math.max(baseScore - 4, 45) : baseScore);
  const averageScore = Math.round((financialScore + complianceScore) / 2);
  const risk = averageScore >= 82 ? "Bajo" : averageScore >= 65 ? "Medio" : "Alto";
  const documents = Array.isArray(metadata.documents) && metadata.documents.length
    ? metadata.documents
    : documentTemplates[order.service_type] || ["Resumen ejecutivo", "KYC/KYB", "Soporte financiero"];

  return {
    id: order.id,
    order,
    name: order.projectName || metadata.projectName || `Expediente ${String(order.id).slice(0, 8)}`,
    applicant: metadata.companyName || metadata.email || "Solicitante NSD",
    sector,
    country: metadata.country || "MX",
    amount,
    amountLabel: formatCurrency(amount),
    use: metadata.description || metadata.useOfFunds || "Uso de fondos pendiente de confirmar",
    stage: statusLabels[normalizedStatus] || normalizedStatus || "Nuevo",
    financialScore,
    complianceScore,
    averageScore,
    risk,
    guarantee: metadata.guarantee || "Soporte documental por validar",
    targetEntity,
    structure,
    readinessLevel: metadata.readinessLevel || metadata.readiness_level || inferReadinessLevel(averageScore, normalizedStatus),
    documents,
    status: statusLabels[normalizedStatus] || normalizedStatus || "Nuevo",
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

export function mapPipelineEntryToOpportunity(entry) {
  const opportunity = mapOrderToOpportunity({
    ...entry.order,
    metadata: {
      ...(entry.order?.metadata || {}),
      sharedWith: entry.share?.recipientName,
      shareStatus: entry.share?.status
    }
  });

  return {
    ...opportunity,
    share: entry.share,
    interest: entry.interest || null,
    documentsCount: entry.documentsCount || 0,
    latestReview: entry.latestReview || null,
    scoring: entry.scoring || null,
    financialScore: entry.scoring?.finalScore ?? opportunity.financialScore,
    complianceScore: entry.scoring?.regulatoryValidation?.status === "clear" ? Math.max(opportunity.complianceScore, 85) : opportunity.complianceScore,
    averageScore: entry.scoring?.finalScore ?? opportunity.averageScore,
    risk: (entry.scoring?.finalScore ?? opportunity.averageScore) >= 82 ? "Bajo" : (entry.scoring?.finalScore ?? opportunity.averageScore) >= 65 ? "Medio" : "Alto",
    readinessLevel: inferReadinessLevel(entry.scoring?.finalScore ?? opportunity.averageScore, opportunity.rawStatus),
    invitationStatus: entry.share?.status || "accepted",
    status: entry.interest?.status === "term_sheet"
      ? "Reporte listo"
      : entry.interest?.status === "under_review"
        ? "En revision"
        : entry.interest?.status === "declined"
          ? "Observado"
          : entry.share?.status === "invited"
            ? "Invitado"
            : opportunity.status
  };
}

export function buildOtorgantePipeline(orders = []) {
  return orders.map(mapOrderToOpportunity);
}

export function buildOtorgantePipelineFromEntries(entries = []) {
  return entries.map(mapPipelineEntryToOpportunity);
}

export function buildOtorganteAnalytics(opportunities = []) {
  const total = opportunities.length;
  const dataRooms = opportunities.filter((item) => ["in_progress", "completed"].includes(item.rawStatus)).length;
  const offers = opportunities.filter((item) => item.rawStatus === "completed").length;
  const observed = opportunities.filter((item) => item.risk === "Alto").length;
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
    lowRisk: opportunities.filter((item) => item.risk === "Bajo").length,
    mediumRisk: opportunities.filter((item) => item.risk === "Medio").length,
    highRisk: observed,
    funnel: [
      { label: "Expedientes recibidos", value: total, width: 100 },
      { label: "Data rooms abiertos", value: dataRooms, width: total ? Math.max(Math.round((dataRooms / total) * 100), 12) : 12 },
      { label: "Reportes listos", value: offers, width: total ? Math.max(Math.round((offers / total) * 100), 12) : 12 },
      { label: "Riesgo alto", value: observed, width: total ? Math.max(Math.round((observed / total) * 100), 12) : 12 }
    ],
    sectorExposure
  };
}
