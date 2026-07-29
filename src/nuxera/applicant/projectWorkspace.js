import { getApplicantDataRoomChecklist, getApplicantOnboardingWizard } from "./guidedMission";
import { pickLang } from "../../data/requisitosMinimos";

const fallbackProfile = Object.freeze({
  companyName: { es: "Empresa solicitante", en: "Applicant company" },
  projectName: { es: "Proyecto de financiamiento", en: "Funding project" },
  requestedAmount: { es: "Monto por confirmar", en: "Amount to confirm" },
  sector: { es: "Sector por clasificar", en: "Sector to classify" },
  country: { es: "MX", en: "MX" },
  useOfFunds: { es: "Uso de fondos pendiente de detalle", en: "Use of funds pending detail" },
  stage: { es: "Preparacion de expediente", en: "File preparation" },
});

const workspaceSections = [
  {
    id: "company-profile",
    label: { es: "Empresa", en: "Company" },
    owner: { es: "Solicitante", en: "Applicant" },
    fieldIds: ["companyName", "country", "sector"],
    requirementIds: ["doc_corporativa", "identificacion_oficial", "doc_kyc"],
    path: "/dashboard/nuxera/intelligence",
  },
  {
    id: "project-case",
    label: { es: "Proyecto", en: "Project" },
    owner: { es: "Solicitante + analista", en: "Applicant + analyst" },
    fieldIds: ["projectName", "stage", "useOfFunds"],
    requirementIds: ["estudio_viabilidad", "estudio_mercado", "plan_negocios"],
    path: "/dashboard/nuxera/finance",
  },
  {
    id: "funding-plan",
    label: { es: "Financiamiento", en: "Funding" },
    owner: { es: "Finance", en: "Finance" },
    fieldIds: ["requestedAmount", "useOfFunds"],
    requirementIds: ["modelo_financiero", "viabilidad_financiera", "transparencia_documental"],
    path: "/dashboard/nuxera/finance",
  },
  {
    id: "risk-impact",
    label: { es: "Riesgo e impacto", en: "Risk & impact" },
    owner: { es: "Strategy", en: "Strategy" },
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

export function normalizeApplicantProjectProfile(order, language = "es") {
  const metadata = getMetadata(order);

  return {
    companyName: pickFirst(metadata.companyName, metadata.company, order?.companyName) || pickLang(fallbackProfile.companyName, language),
    projectName: pickFirst(order?.projectName, order?.project_name, metadata.projectName) || pickLang(fallbackProfile.projectName, language),
    requestedAmount: pickFirst(metadata.requestedAmount, metadata.amount, metadata.monto) || pickLang(fallbackProfile.requestedAmount, language),
    sector: pickFirst(metadata.sector, order?.sector, metadata.industry) || pickLang(fallbackProfile.sector, language),
    country: pickFirst(metadata.country, metadata.projectCountry, order?.country) || pickLang(fallbackProfile.country, language),
    useOfFunds: pickFirst(metadata.useOfFunds, metadata.use, metadata.fundUse) || pickLang(fallbackProfile.useOfFunds, language),
    stage: pickFirst(metadata.stage, metadata.projectStage, order?.status) || pickLang(fallbackProfile.stage, language),
  };
}

export function getApplicantCompanyProjectWorkspace(order = null, language = "es") {
  const profile = normalizeApplicantProjectProfile(order, language);
  const checklist = getApplicantDataRoomChecklist(language);
  const onboarding = getApplicantOnboardingWizard(language);
  const requirementsById = new Map(
    checklist.categories.flatMap((category) => category.items).map((item) => [item.id, item])
  );
  const humanReviewLabel = pickLang({ es: "Revision humana", en: "Human review" }, language);
  const sections = workspaceSections.map((section) => {
    const evidence = section.requirementIds
      .map((requirementId) => requirementsById.get(requirementId))
      .filter(Boolean);
    const missingEvidence = evidence.filter((item) => item.status === "missing");
    const readyEvidence = evidence.filter((item) => item.status === "ready");
    const fields = section.fieldIds.map((fieldId) => ({
      id: fieldId,
      value: profile[fieldId],
      status: profile[fieldId] === pickLang(fallbackProfile[fieldId], language) ? "needs-confirmation" : "available",
    }));

    return {
      ...section,
      label: pickLang(section.label, language),
      owner: pickLang(section.owner, language),
      fields,
      evidence,
      readyEvidence: readyEvidence.length,
      missingEvidence: missingEvidence.length,
      status: missingEvidence.length > 0 ? "needs-evidence" : "ready-for-review",
      nextEvidence: missingEvidence[0]?.label || humanReviewLabel,
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
      ? pickLang(
          { es: `Completar ${blockedSections[0].nextEvidence} en ${blockedSections[0].label}.`, en: `Complete ${blockedSections[0].nextEvidence} in ${blockedSections[0].label}.` },
          language
        )
      : pickLang({ es: "Preparar revision humana con evidencia trazable.", en: "Prepare for human review with traceable evidence." }, language),
    guardrails: [
      { es: "Workspace local de datos; no persiste respuestas ni modifica metadata del expediente.", en: "Local data workspace; it does not persist answers or modify the file's metadata." },
      { es: "No cambia permisos de documentos, data room ni visibilidad para otorgantes.", en: "It does not change document permissions, data room access, or grantor visibility." },
      { es: "No aprueba credito, no recomienda inversion y no emite term sheet.", en: "It does not approve credit, recommend investment, or issue a term sheet." },
    ].map((guardrail) => pickLang(guardrail, language)),
  };
}
