import { getDemoDocuments } from "../../data/demoDocuments";
import { getApplicantDataRoomChecklist } from "../applicant/guidedMission";
import { getFinanceJourneyEvidenceLinks } from "../finance/financeJourney";
import { getResearchMission } from "../intelligence/researchMissions";
import { getStrategyWorkspace } from "../strategy/strategyWorkspace";
import { pickLang } from "../../data/requisitosMinimos";

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
    guardrail: pickLang({ es: "No concede acceso documental ni valida el archivo original.", en: "It does not grant document access or validate the original file." }, language),
  }));
}

function buildDocumentEvidence(role, language) {
  return getDemoDocuments(language).slice(0, 4).map((document) => ({
    id: `document-${document.id}`,
    engine: "Intelligence",
    label: document.name,
    status: normalizeStatus(document.status),
    visibility: visibilityByRole[role] || visibilityByRole.applicant,
    provenance: `Demo document registry / ${document.version}`,
    sourceType: "document-summary",
    path: "/dashboard/nuxera/intelligence",
    detail: document.notes,
    guardrail: pickLang({ es: "Resumen read-only; no cambia permisos de data room.", en: "Read-only summary; it does not change data room permissions." }, language),
  }));
}

function buildResearchEvidence(role, language) {
  const mission = getResearchMission(role, undefined, language);
  return mission.sources.map((source) => ({
    id: `source-${source.id}`,
    engine: "Intelligence",
    label: source.source,
    status: source.reliabilityLevel === "high" ? "ready" : "watch",
    visibility: visibilityByRole[role] || visibilityByRole.applicant,
    provenance: source.provenance,
    sourceType: "research-source",
    path: "/dashboard/nuxera/intelligence",
    detail: `${source.delay}. ${source.reliability}.`,
    guardrail: pickLang({ es: "Fuente contextual; requiere revision humana antes de exportar.", en: "Contextual source; requires human review before export." }, language),
  }));
}

function buildStrategyEvidence(role, language) {
  const strategy = getStrategyWorkspace(role, language);
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
    guardrail: pickLang({ es: "Soporta decision; no ejecuta aprobaciones ni compromisos.", en: "Supports the decision; it does not execute approvals or commitments." }, language),
  }));
}

function buildFinanceLinks(role, language) {
  return getFinanceJourneyEvidenceLinks(language).map((link) => ({
    id: `finance-${link.id}`,
    engine: "Finance",
    label: link.label,
    status: "watch",
    visibility: visibilityByRole[role] || visibilityByRole.applicant,
    provenance: "NUXERA Finance journey local model",
    sourceType: "journey-link",
    path: link.path,
    detail: link.detail,
    guardrail: pickLang({ es: "Preparacion financiera; no garantiza fondeo.", en: "Financial preparation; it does not guarantee funding." }, language),
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
    ...buildDocumentEvidence(role, language),
    ...buildResearchEvidence(role, language),
    ...buildStrategyEvidence(role, language),
    ...buildFinanceLinks(role, language),
  ];

  return {
    status: "read-only-local",
    role,
    summary: summarizeEvidence(items),
    items,
    policies: [
      { es: "Ledger read-only: no crea evidence_links ni cambia documentos.", en: "Read-only ledger: it does not create evidence_links or change documents." },
      { es: "La visibilidad resume permisos esperados; no otorga acceso nuevo.", en: "Visibility summarizes expected permissions; it does not grant new access." },
      { es: "Toda exportacion o persistencia requiere contrato backend y revision humana.", en: "Any export or persistence requires a backend contract and human review." },
    ].map((policy) => pickLang(policy, language)),
  };
}

export function getEvidenceLedgerByEngine(role = "applicant", language = "es") {
  const ledger = getNuxeraEvidenceLedger(role, language);
  return ledger.items.reduce((groups, item) => {
    const current = groups[item.engine] || [];
    return { ...groups, [item.engine]: [...current, item] };
  }, {});
}