import { getDemoDocuments } from "../../data/demoDocuments";
import { getApplicantDataRoomChecklist } from "./guidedMission";
import { getApplicantCompanyProjectWorkspace } from "./projectWorkspace";
import { pickLang } from "../../data/requisitosMinimos";

const statusMap = {
  approved: "ready",
  ready: "ready",
  review: "in-review",
  "in-review": "in-review",
  observed: "needs-attention",
  missing: "missing",
};

const folderDefinitions = [
  {
    id: "identity-kyb",
    label: { es: "Identidad y KYB", en: "Identity & KYB" },
    scope: "owner-only",
    requirementIds: ["doc_corporativa", "identificacion_oficial", "doc_kyc"],
    documentKeywords: ["fiscal", "identificacion", "domicilio", "acta", "ubo", "accionaria"],
    path: "/dashboard/nuxera/intelligence",
  },
  {
    id: "project-file",
    label: { es: "Proyecto y uso de fondos", en: "Project & use of funds" },
    scope: "preparation-only",
    requirementIds: ["estudio_viabilidad", "estudio_mercado", "plan_negocios"],
    documentKeywords: ["plan", "proyecto", "viabilidad", "mercado"],
    path: "/dashboard/nuxera/finance",
  },
  {
    id: "financial-file",
    label: { es: "Finanzas y transparencia", en: "Finance & transparency" },
    scope: "owner-plus-authorized-review",
    requirementIds: ["modelo_financiero", "viabilidad_financiera", "transparencia_documental"],
    documentKeywords: ["financieros", "modelo", "proyecciones", "auditoria"],
    path: "/dashboard/nuxera/finance",
  },
  {
    id: "impact-risk",
    label: { es: "Riesgo, impacto y ESG", en: "Risk, impact & ESG" },
    scope: "human-review-required",
    requirementIds: ["marco_riesgos", "ods", "esg", "esia"],
    documentKeywords: ["riesgo", "impacto", "esg", "esia"],
    path: "/dashboard/nuxera/strategy",
  },
];

function normalizeDocumentStatus(status) {
  return statusMap[status] || "watch";
}

function matchesKeyword(document, keywords) {
  const haystack = `${document.name || ""} ${document.notes || ""}`.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword));
}

function buildDocumentRows(folder, requirements, language) {
  const applicantLabel = pickLang({ es: "Solicitante", en: "Applicant" }, language);
  const criticalLabel = pickLang({ es: "Critico", en: "Critical" }, language);
  const normalLabel = pickLang({ es: "Normal", en: "Normal" }, language);
  const toValidateLabel = pickLang({ es: "Por validar", en: "To validate" }, language);

  const matchedDemoDocuments = getDemoDocuments(language)
    .filter((document) => matchesKeyword(document, folder.documentKeywords))
    .map((document) => ({
      id: `demo-document-${document.id}`,
      label: document.name,
      status: normalizeDocumentStatus(document.status),
      source: "demo-document-registry",
      owner: document.owner,
      version: document.version,
      detail: document.notes,
      risk: document.risk,
      expires: document.expires,
    }));

  const requirementRows = requirements.map((requirement) => ({
    id: `requirement-${requirement.id}`,
    label: requirement.label,
    status: requirement.status === "missing" ? "missing" : normalizeDocumentStatus(requirement.status),
    source: "minimum-requirement",
    owner: applicantLabel,
    version: "local",
    detail: requirement.detail,
    risk: requirement.critical ? criticalLabel : normalLabel,
    expires: toValidateLabel,
  }));

  const rowsById = new Map([...matchedDemoDocuments, ...requirementRows].map((row) => [row.id, row]));
  return [...rowsById.values()];
}

function summarizeRows(rows) {
  return {
    total: rows.length,
    ready: rows.filter((row) => row.status === "ready").length,
    inReview: rows.filter((row) => row.status === "in-review").length,
    missing: rows.filter((row) => row.status === "missing").length,
    needsAttention: rows.filter((row) => row.status === "needs-attention").length,
  };
}

export function getApplicantDocumentCenter(order = null, language = "es") {
  const checklist = getApplicantDataRoomChecklist(language);
  const workspace = getApplicantCompanyProjectWorkspace(order, language);
  const requirementsById = new Map(
    checklist.categories.flatMap((category) => category.items).map((item) => [item.id, item])
  );
  const humanReviewLabel = pickLang({ es: "Revision humana", en: "Human review" }, language);
  const folders = folderDefinitions.map((folder) => {
    const requirements = folder.requirementIds
      .map((requirementId) => requirementsById.get(requirementId))
      .filter(Boolean);
    const rows = buildDocumentRows(folder, requirements, language);
    const summary = summarizeRows(rows);

    return {
      ...folder,
      label: pickLang(folder.label, language),
      rows,
      summary,
      status: summary.missing > 0 || summary.needsAttention > 0 ? "needs-document-work" : "ready-for-review",
      nextDocument: rows.find((row) => ["missing", "needs-attention"].includes(row.status))?.label || humanReviewLabel,
    };
  });
  const activeFolder = folders.find((folder) => folder.status === "needs-document-work") || folders[0];

  return {
    id: "applicant-contextual-document-center-local",
    status: "read-only-local",
    source: workspace.source,
    profile: workspace.profile,
    summary: {
      folders: folders.length,
      documents: folders.reduce((total, folder) => total + folder.summary.total, 0),
      missing: folders.reduce((total, folder) => total + folder.summary.missing, 0),
      needsAttention: folders.reduce((total, folder) => total + folder.summary.needsAttention, 0),
      ready: folders.reduce((total, folder) => total + folder.summary.ready, 0),
    },
    folders,
    activeFolder,
    nextAction: pickLang(
      { es: `Revisar ${activeFolder.nextDocument} en ${activeFolder.label}.`, en: `Review ${activeFolder.nextDocument} in ${activeFolder.label}.` },
      language
    ),
    guardrails: [
      { es: "Centro documental local/read-only; no sube, elimina ni comparte archivos.", en: "Local, read-only document center; it does not upload, delete or share files." },
      { es: "No cambia permisos de data room ni concede acceso a otorgantes.", en: "It does not change data room permissions or grant grantor access." },
      { es: "La vigencia y suficiencia documental requieren revision humana.", en: "Document validity and sufficiency require human review." },
    ].map((guardrail) => pickLang(guardrail, language)),
  };
}
