import { demoDocuments } from "../../data/demoDocuments";
import { getApplicantDataRoomChecklist } from "./guidedMission";
import { getApplicantCompanyProjectWorkspace } from "./projectWorkspace";

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
    label: "Identidad y KYB",
    scope: "owner-only",
    requirementIds: ["doc_corporativa", "identificacion_oficial", "doc_kyc"],
    documentKeywords: ["fiscal", "identificacion", "domicilio", "acta", "ubo", "accionaria"],
    path: "/dashboard/nuxera/intelligence",
  },
  {
    id: "project-file",
    label: "Proyecto y uso de fondos",
    scope: "preparation-only",
    requirementIds: ["estudio_viabilidad", "estudio_mercado", "plan_negocios"],
    documentKeywords: ["plan", "proyecto", "viabilidad", "mercado"],
    path: "/dashboard/nuxera/finance",
  },
  {
    id: "financial-file",
    label: "Finanzas y transparencia",
    scope: "owner-plus-authorized-review",
    requirementIds: ["modelo_financiero", "viabilidad_financiera", "transparencia_documental"],
    documentKeywords: ["financieros", "modelo", "proyecciones", "auditoria"],
    path: "/dashboard/nuxera/finance",
  },
  {
    id: "impact-risk",
    label: "Riesgo, impacto y ESG",
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

function buildDocumentRows(folder, requirements) {
  const matchedDemoDocuments = demoDocuments
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
    owner: "Solicitante",
    version: "local",
    detail: requirement.detail,
    risk: requirement.critical ? "Critico" : "Normal",
    expires: "Por validar",
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
  const folders = folderDefinitions.map((folder) => {
    const requirements = folder.requirementIds
      .map((requirementId) => requirementsById.get(requirementId))
      .filter(Boolean);
    const rows = buildDocumentRows(folder, requirements);
    const summary = summarizeRows(rows);

    return {
      ...folder,
      rows,
      summary,
      status: summary.missing > 0 || summary.needsAttention > 0 ? "needs-document-work" : "ready-for-review",
      nextDocument: rows.find((row) => ["missing", "needs-attention"].includes(row.status))?.label || "Revision humana",
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
    nextAction: `Revisar ${activeFolder.nextDocument} en ${activeFolder.label}.`,
    guardrails: [
      "Centro documental local/read-only; no sube, elimina ni comparte archivos.",
      "No cambia permisos de data room ni concede acceso a otorgantes.",
      "La vigencia y suficiencia documental requieren revision humana.",
    ],
  };
}