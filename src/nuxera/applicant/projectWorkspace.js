import { getApplicantDataRoomChecklist, getApplicantOnboardingWizard } from "./guidedMission";

const fallbackProfile = Object.freeze({
  companyName: "Empresa solicitante",
  projectName: "Proyecto de financiamiento",
  requestedAmount: "Monto por confirmar",
  sector: "Sector por clasificar",
  country: "MX",
  useOfFunds: "Uso de fondos pendiente de detalle",
  stage: "Preparacion de expediente",
});

const workspaceSections = [
  {
    id: "company-profile",
    label: "Empresa",
    owner: "Solicitante",
    fieldIds: ["companyName", "country", "sector"],
    requirementIds: ["doc_corporativa", "identificacion_oficial", "doc_kyc"],
    path: "/dashboard/nuxera/intelligence",
  },
  {
    id: "project-case",
    label: "Proyecto",
    owner: "Solicitante + analista",
    fieldIds: ["projectName", "stage", "useOfFunds"],
    requirementIds: ["estudio_viabilidad", "estudio_mercado", "plan_negocios"],
    path: "/dashboard/nuxera/finance",
  },
  {
    id: "funding-plan",
    label: "Financiamiento",
    owner: "Finance",
    fieldIds: ["requestedAmount", "useOfFunds"],
    requirementIds: ["modelo_financiero", "viabilidad_financiera", "transparencia_documental"],
    path: "/dashboard/nuxera/finance",
  },
  {
    id: "risk-impact",
    label: "Riesgo e impacto",
    owner: "Strategy",
    fieldIds: ["sector", "country"],
    requirementIds: ["marco_riesgos", "ods", "esg", "esia"],
    path: "/dashboard/nuxera/strategy",
  },
];

function getMetadata(order) {
  return order?.metadata && typeof order.metadata === "object" && !Array.isArray(order.metadata)
    ? order.metadata
    : {};
}

function pickFirst(...values) {
  return values.find((value) => typeof value === "string" && value.trim()) || null;
}

export function normalizeApplicantProjectProfile(order) {
  const metadata = getMetadata(order);

  return {
    companyName: pickFirst(metadata.companyName, metadata.company, order?.companyName) || fallbackProfile.companyName,
    projectName: pickFirst(order?.projectName, order?.project_name, metadata.projectName) || fallbackProfile.projectName,
    requestedAmount: pickFirst(metadata.requestedAmount, metadata.amount, metadata.monto) || fallbackProfile.requestedAmount,
    sector: pickFirst(metadata.sector, order?.sector, metadata.industry) || fallbackProfile.sector,
    country: pickFirst(metadata.country, metadata.projectCountry, order?.country) || fallbackProfile.country,
    useOfFunds: pickFirst(metadata.useOfFunds, metadata.use, metadata.fundUse) || fallbackProfile.useOfFunds,
    stage: pickFirst(metadata.stage, metadata.projectStage, order?.status) || fallbackProfile.stage,
  };
}

export function getApplicantCompanyProjectWorkspace(order = null, language = "es") {
  const profile = normalizeApplicantProjectProfile(order);
  const checklist = getApplicantDataRoomChecklist(language);
  const onboarding = getApplicantOnboardingWizard(language);
  const requirementsById = new Map(
    checklist.categories.flatMap((category) => category.items).map((item) => [item.id, item])
  );
  const sections = workspaceSections.map((section) => {
    const evidence = section.requirementIds
      .map((requirementId) => requirementsById.get(requirementId))
      .filter(Boolean);
    const missingEvidence = evidence.filter((item) => item.status === "missing");
    const readyEvidence = evidence.filter((item) => item.status === "ready");
    const fields = section.fieldIds.map((fieldId) => ({
      id: fieldId,
      value: profile[fieldId],
      status: profile[fieldId] === fallbackProfile[fieldId] ? "needs-confirmation" : "available",
    }));

    return {
      ...section,
      fields,
      evidence,
      readyEvidence: readyEvidence.length,
      missingEvidence: missingEvidence.length,
      status: missingEvidence.length > 0 ? "needs-evidence" : "ready-for-review",
      nextEvidence: missingEvidence[0]?.label || "Revision humana",
    };
  });
  const blockedSections = sections.filter((section) => section.status === "needs-evidence");

  return {
    id: "applicant-company-project-workspace-local",
    source: order?.id ? "order-metadata-normalized" : "local-fallback",
    status: blockedSections.length > 0 ? "needs-evidence" : "ready-for-human-review",
    profile,
    summary: {
      sections: sections.length,
      readySections: sections.length - blockedSections.length,
      missingEvidence: sections.reduce((total, section) => total + section.missingEvidence, 0),
      readiness: checklist.summary.total > 0
        ? Math.round((checklist.summary.ready / checklist.summary.total) * 100)
        : 0,
      onboardingStage: onboarding.nextStage.label,
    },
    sections,
    nextAction: blockedSections[0]
      ? `Completar ${blockedSections[0].nextEvidence} en ${blockedSections[0].label}.`
      : "Preparar revision humana con evidencia trazable.",
    guardrails: [
      "Workspace local de datos; no persiste respuestas ni modifica metadata del expediente.",
      "No cambia permisos de documentos, data room ni visibilidad para otorgantes.",
      "No aprueba credito, no recomienda inversion y no emite term sheet.",
    ],
  };
}