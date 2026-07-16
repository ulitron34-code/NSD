import { demoDocuments } from "../../data/demoDocuments";
import { getApplicantDataRoomChecklist } from "../applicant/guidedMission";
import { getFinanceJourneyEvidenceLinks } from "../finance/financeJourney";
import { getResearchMission } from "../intelligence/researchMissions";
import { getStrategyWorkspace } from "../strategy/strategyWorkspace";

const visibilityByRole = {
  applicant: "owner",
  grantor: "authorized-summary-only",
  admin: "internal-review",
};

function normalizeStatus(status) {
  if (["approved", "ready"].includes(status)) return "ready";
  if (["review", "in-review"].includes(status)) return "in-review";
  if (["observed", "missing"].includes(status)) return "needs-evidence";
  return "watch";
}

function buildChecklistEvidence(language, role) {
  const checklist = getApplicantDataRoomChecklist(language);
  return checklist.categories.flatMap((category) => category.items).slice(0, 5).map((item) => ({
    id: `checklist-${item.id}`,
    engine: "Finance",
    label: item.label,
    status: normalizeStatus(item.status),
    visibility: visibilityByRole[role] || visibilityByRole.applicant,
    provenance: "NUXERA applicant checklist local model",
    sourceType: "requirement",
    path: "/dashboard/nuxera/finance",
    detail: item.detail,
    guardrail: "No concede acceso documental ni valida el archivo original.",
  }));
}

function buildDocumentEvidence(role) {
  return demoDocuments.slice(0, 4).map((document) => ({
    id: `document-${document.id}`,
    engine: "Intelligence",
    label: document.name,
    status: normalizeStatus(document.status),
    visibility: visibilityByRole[role] || visibilityByRole.applicant,
    provenance: `Demo document registry / ${document.version}`,
    sourceType: "document-summary",
    path: "/dashboard/nuxera/intelligence",
    detail: document.notes,
    guardrail: "Resumen read-only; no cambia permisos de data room.",
  }));
}

function buildResearchEvidence(role) {
  const mission = getResearchMission(role);
  return mission.sources.map((source) => ({
    id: `source-${source.id}`,
    engine: "Intelligence",
    label: source.source,
    status: source.reliability.includes("Alta") ? "ready" : "watch",
    visibility: visibilityByRole[role] || visibilityByRole.applicant,
    provenance: source.provenance,
    sourceType: "research-source",
    path: "/dashboard/nuxera/intelligence",
    detail: `${source.delay}. ${source.reliability}.`,
    guardrail: "Fuente contextual; requiere revision humana antes de exportar.",
  }));
}

function buildStrategyEvidence(role) {
  const strategy = getStrategyWorkspace(role);
  return strategy.evidenceLinks.map((link) => ({
    id: `strategy-${link.id}`,
    engine: "Strategy",
    label: link.label,
    status: "watch",
    visibility: visibilityByRole[role] || visibilityByRole.applicant,
    provenance: "NUXERA Strategy decision flow local model",
    sourceType: "decision-link",
    path: link.path,
    detail: link.signal,
    guardrail: "Soporta decision; no ejecuta aprobaciones ni compromisos.",
  }));
}

function buildFinanceLinks(role) {
  return getFinanceJourneyEvidenceLinks().map((link) => ({
    id: `finance-${link.id}`,
    engine: "Finance",
    label: link.label,
    status: "watch",
    visibility: visibilityByRole[role] || visibilityByRole.applicant,
    provenance: "NUXERA Finance journey local model",
    sourceType: "journey-link",
    path: link.path,
    detail: link.detail,
    guardrail: "Preparacion financiera; no garantiza fondeo.",
  }));
}

function summarizeEvidence(items) {
  return {
    total: items.length,
    ready: items.filter((item) => item.status === "ready").length,
    inReview: items.filter((item) => item.status === "in-review").length,
    needsEvidence: items.filter((item) => item.status === "needs-evidence").length,
    watch: items.filter((item) => item.status === "watch").length,
    visibilityModes: [...new Set(items.map((item) => item.visibility))],
  };
}

export function getNuxeraEvidenceLedger(role = "applicant", language = "es") {
  const items = [
    ...buildChecklistEvidence(language, role),
    ...buildDocumentEvidence(role),
    ...buildResearchEvidence(role),
    ...buildStrategyEvidence(role),
    ...buildFinanceLinks(role),
  ];

  return {
    status: "read-only-local",
    role,
    summary: summarizeEvidence(items),
    items,
    policies: [
      "Ledger read-only: no crea evidence_links ni cambia documentos.",
      "La visibilidad resume permisos esperados; no otorga acceso nuevo.",
      "Toda exportacion o persistencia requiere contrato backend y revision humana.",
    ],
  };
}

export function getEvidenceLedgerByEngine(role = "applicant", language = "es") {
  const ledger = getNuxeraEvidenceLedger(role, language);
  return ledger.items.reduce((groups, item) => {
    const current = groups[item.engine] || [];
    return { ...groups, [item.engine]: [...current, item] };
  }, {});
}