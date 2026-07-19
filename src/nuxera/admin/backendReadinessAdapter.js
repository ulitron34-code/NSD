import { useEffect, useState } from "react";
import { nuxeraBackendReadinessAPI, nuxeraControlledApprovalPackageAPI, nuxeraControlledChangeRequestAPI, nuxeraControlledContinuationPackAPI, nuxeraControlledEvidenceReviewAPI, nuxeraControlledEvidenceScaffoldAPI, nuxeraControlledReleaseDossierAPI, nuxeraControlledRunbookAPI, nuxeraControlledVerificationAPI, nuxeraControlledWriteGateAPI } from "../../services/api";
import { warn } from "../../utils/logger";
import { pickLang } from "../../data/requisitosMinimos";

const LOCAL_BACKEND_READINESS_STATE = Object.freeze({
  source: "local-fallback",
  label: "Local backend readiness",
  status: "readiness-unverified",
  ready: false,
  loading: false,
  error: null,
  summary: { total: 3, available: 0, unavailable: 3, readiness: 0 },
  signals: [
    { id: "workspace-states", table: "nuxera_workspace_states", label: "Applicant workspace states", status: "unverified", ready: false },
    { id: "evidence-links", table: "nuxera_evidence_links", label: "Owner evidence links", status: "unverified", ready: false },
    { id: "admin-controls", table: "nuxera_admin_controls", label: "Admin controls", status: "unverified", ready: false },
  ],
  guardrails: ["Local readiness; it does not apply SQL or confirm RLS."],
});

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeSignal(signal) {
  const value = asObject(signal);
  return {
    id: value.id || value.table || "nuxera-readiness-signal",
    table: value.table || "nuxera_unknown",
    label: value.label || value.table || "NUXERA backend signal",
    owner: value.owner || "platform",
    status: value.status || "unverified",
    ready: Boolean(value.ready),
    count: Number.isFinite(value.count) ? value.count : null,
    requiredFor: asArray(value.requiredFor),
    guardrail: value.guardrail || "Read-only readiness signal; it does not change permissions.",
  };
}

export function normalizeNuxeraBackendReadinessResponse(response, language = "es") {
  const payload = response?.readiness || response || null;

  if (!payload || typeof payload !== "object") {
    return {
      ...LOCAL_BACKEND_READINESS_STATE,
      error: "nuxera-backend-readiness-missing",
    };
  }

  const signals = asArray(payload.signals).map(normalizeSignal);
  const available = signals.filter((signal) => signal.ready).length;
  const total = signals.length || LOCAL_BACKEND_READINESS_STATE.summary.total;
  const summary = {
    total,
    available: payload.summary?.available ?? available,
    unavailable: payload.summary?.unavailable ?? Math.max(total - available, 0),
    readiness: payload.summary?.readiness ?? Math.round((available / Math.max(total, 1)) * 100),
  };

  return {
    source: payload.ready ? "remote-ready" : "remote-blocked",
    label: payload.ready
      ? pickLang({ es: "Backend NUXERA visible", en: "NUXERA backend visible" }, language)
      : pickLang({ es: "Backend NUXERA pendiente", en: "NUXERA backend pending" }, language),
    status: payload.status || (payload.ready ? "backend-readiness-visible" : "blocked-by-backend-readiness"),
    ready: Boolean(payload.ready),
    loading: false,
    error: null,
    summary,
    signals,
    guardrails: [
      ...asArray(payload.guardrails),
      ...asArray(response?.guardrails),
    ].filter(Boolean),
  };
}

function buildBackendReadinessHealthSignal(state, language) {
  return {
    id: "backend-readiness-preflight",
    label: "Backend readiness",
    status: state.ready ? "backend-visible" : "backend-blocked",
    severity: state.ready ? "low" : "high",
    signal: pickLang(
      { es: `${state.summary.unavailable}/${state.summary.total} tablas NUXERA pendientes o no visibles.`, en: `${state.summary.unavailable}/${state.summary.total} NUXERA tables pending or not visible.` },
      language
    ),
    nextAction: state.ready
      ? pickLang({ es: "Mantener verificacion RLS controlada antes de produccion.", en: "Keep controlled RLS verification before production." }, language)
      : pickLang({ es: "Verificar SQL/RLS en Supabase controlado antes de habilitar writes productivos.", en: "Verify SQL/RLS in controlled Supabase before enabling production writes." }, language),
  };
}

function buildBackendReadinessActions(state, language) {
  return state.signals
    .filter((signal) => !signal.ready)
    .map((signal) => ({
      id: `backend-readiness-${signal.id}`,
      domain: "Backend readiness",
      priority: signal.id === "workspace-states" ? "critical-path" : "review",
      status: "backend-preflight-open",
      owner: signal.owner || "Platform",
      action: pickLang(
        { es: `Verificar ${signal.table} en Supabase controlado antes de depender de ${asArray(signal.requiredFor).join(", ") || "NUXERA backend"}.`, en: `Verify ${signal.table} in controlled Supabase before depending on ${asArray(signal.requiredFor).join(", ") || "NUXERA backend"}.` },
        language
      ),
      source: "backend-readiness-preflight",
      guardrail: pickLang({ es: "Accion humana; la consola no aplica SQL ni cambia RLS.", en: "Human action; the console does not apply SQL or change RLS." }, language),
    }));
}
function buildRlsVerificationMatrix(state, language) {
  const signalById = new Map(state.signals.map((signal) => [signal.id, signal]));
  const workspaceReady = Boolean(signalById.get("workspace-states")?.ready);
  const evidenceReady = Boolean(signalById.get("evidence-links")?.ready);
  const adminReady = Boolean(signalById.get("admin-controls")?.ready);

  return {
    id: "nuxera-rls-verification-matrix",
    status: state.ready ? "ready-for-controlled-identities" : "blocked-by-backend-readiness",
    scenarios: [
      {
        id: "applicant-owner",
        identity: "Applicant owner",
        mustRead: ["own applicant/checklist state", "own owner evidence links"],
        mustWrite: ["own applicant checklist state only"],
        mustDeny: ["foreign orders", "grantor/admin state", "document visibility changes"],
        blockedBy: [
          ...(!workspaceReady ? ["nuxera_workspace_states"] : []),
          ...(!evidenceReady ? ["nuxera_evidence_links"] : []),
        ],
      },
      {
        id: "different-applicant",
        identity: "Different applicant",
        mustRead: [],
        mustWrite: [],
        mustDeny: ["all rows for foreign orders", "row existence leaks"],
        blockedBy: !workspaceReady ? ["nuxera_workspace_states"] : [],
      },
      {
        id: "grantor-authorized",
        identity: "Grantor authorized",
        mustRead: ["authorized summaries only after existing data-room checks"],
        mustWrite: [],
        mustDeny: ["owner-only evidence", "hidden documents", "data-room permission changes"],
        blockedBy: !evidenceReady ? ["nuxera_evidence_links"] : [],
      },
      {
        id: "admin-internal",
        identity: "Admin/internal",
        mustRead: ["admin controls when permitted", "backend readiness signals"],
        mustWrite: [],
        mustDeny: ["feature flag mutation", "automation activation", "document grants"],
        blockedBy: !adminReady ? ["nuxera_admin_controls"] : [],
      },
    ],
    guardrails: [
      { es: "Matriz local de verificacion; no ejecuta consultas Supabase.", en: "Local verification matrix; it does not execute Supabase queries." },
      { es: "Cada escenario requiere usuarios controlados antes de produccion.", en: "Each scenario requires controlled users before production." },
      { es: "Denegaciones deben evitar filtrar existencia de filas restringidas.", en: "Denials must avoid leaking the existence of restricted rows." },
    ].map((guardrail) => pickLang(guardrail, language)),
  };
}
function buildControlledVerificationPackage(state, matrix, language) {
  const endpointChecks = [
    { id: "get-state-owner", method: "GET", path: "/api/nuxera/orders/:orderId/state", actor: "applicant-owner", expected: "Own applicant state only", auditLogRequired: false },
    { id: "patch-checklist-owner", method: "PATCH", path: "/api/nuxera/orders/:orderId/state/checklist", actor: "applicant-owner", expected: "Checklist-only write after gates pass", auditLogRequired: true },
    { id: "get-evidence-owner", method: "GET", path: "/api/nuxera/orders/:orderId/evidence", actor: "applicant-owner", expected: "Owner-visible evidence only", auditLogRequired: false },
    { id: "get-admin-controls", method: "GET", path: "/api/nuxera/admin/controls", actor: "admin-internal", expected: "Read-only admin controls with admin-read permission", auditLogRequired: false },
    { id: "get-admin-readiness", method: "GET", path: "/api/nuxera/admin/readiness", actor: "admin-internal", expected: "Read-only backend readiness with admin-read permission", auditLogRequired: false },
  ];
  const deniedChecks = [
    { id: "state-foreign-denied", actor: "different-applicant", target: "/api/nuxera/orders/:orderId/state", expected: "403/404 without row-existence leak" },
    { id: "admin-controls-applicant-denied", actor: "applicant-owner", target: "/api/nuxera/admin/controls", expected: "Denied without admin control details" },
    { id: "admin-readiness-applicant-denied", actor: "applicant-owner", target: "/api/nuxera/admin/readiness", expected: "Denied without backend inventory details" },
  ];
  const noGoCriteria = [
    "Any actor reads or writes a foreign order unexpectedly.",
    "Applicant checklist writes affect grantor, admin or evidence records.",
    "Grantor accesses owner-only evidence or hidden documents without explicit authorization.",
    "Admin readiness or controls work without admin-read permission.",
    "Denied responses leak restricted row existence.",
    "Any enabled write lacks audit_logs evidence.",
    "Feature flag off still allows NUXERA UI reads or writes.",
    "Rollback cannot hide or archive NUXERA state without deleting audit history.",
  ];
  const rollbackChecks = [
    "Feature flag off hides NUXERA UI reads/writes.",
    "Legacy service order flow ignores nuxera_* tables.",
    "nuxera_* records can be hidden or archived without audit deletion.",
    "Prior known-good commit is recorded.",
    "Rollback owner is recorded.",
  ];
  const blockedScenarios = matrix.scenarios.filter((scenario) => scenario.blockedBy.length > 0);

  return {
    id: "nuxera-controlled-rls-endpoint-evidence",
    status: state.ready && blockedScenarios.length === 0 ? "ready-for-controlled-run" : "blocked-by-backend-readiness",
    evidenceTemplate: {
      path: "docs/nuxera-migration/docs/migration/NUXERA_CONTROLLED_RLS_ENDPOINT_EVIDENCE_TEMPLATE.md",
      status: "template-required-before-production-decision",
      requiredSections: ["run metadata", "RLS identities", "endpoint evidence", "no-go criteria", "rollback rehearsal", "decision"],
    },
    requiredIdentities: matrix.scenarios.map((scenario) => ({
      id: scenario.id,
      identity: scenario.identity,
      blockedBy: scenario.blockedBy,
    })),
    endpointChecks,
    deniedChecks,
    noGoCriteria,
    rollbackChecks,
    summary: {
      identities: matrix.scenarios.length,
      endpoints: endpointChecks.length,
      deniedChecks: deniedChecks.length,
      noGoCriteria: noGoCriteria.length,
      rollbackChecks: rollbackChecks.length,
      blockedScenarios: blockedScenarios.length,
    },
    guardrails: [
      { es: "Paquete local de evidencia; no ejecuta endpoints ni aplica SQL.", en: "Local evidence package; it does not execute endpoints or apply SQL." },
      { es: "Completar la plantilla en Supabase no productivo antes de habilitar writes productivos.", en: "Complete the template in non-production Supabase before enabling production writes." },
      { es: "Cualquier no-go mantiene NUXERA en modo read-only/local fallback.", en: "Any no-go keeps NUXERA in read-only/local fallback mode." },
    ].map((guardrail) => pickLang(guardrail, language)),
  };
}
function buildControlledVerificationHealthSignal(verificationPackage, language) {
  return {
    id: "controlled-verification-evidence",
    label: pickLang({ es: "Evidencia RLS/endpoints", en: "RLS/endpoint evidence" }, language),
    status: verificationPackage.status,
    severity: verificationPackage.status === "ready-for-controlled-run" ? "medium" : "high",
    signal: pickLang(
      { es: `${verificationPackage.summary.endpoints} endpoints, ${verificationPackage.summary.deniedChecks} denegaciones y ${verificationPackage.summary.noGoCriteria} criterios no-go pendientes de evidencia.`, en: `${verificationPackage.summary.endpoints} endpoints, ${verificationPackage.summary.deniedChecks} denials and ${verificationPackage.summary.noGoCriteria} no-go criteria pending evidence.` },
      language
    ),
    nextAction: pickLang(
      { es: `Completar ${verificationPackage.evidenceTemplate.path} en Supabase no productivo antes de cualquier decision productiva.`, en: `Complete ${verificationPackage.evidenceTemplate.path} in non-production Supabase before any production decision.` },
      language
    ),
  };
}

function buildControlledVerificationActions(verificationPackage, language) {
  const templateAction = {
    id: "controlled-verification-template",
    domain: pickLang({ es: "Evidencia RLS/endpoints", en: "RLS/endpoint evidence" }, language),
    priority: "critical-path",
    status: "controlled-evidence-open",
    owner: "Security admin",
    action: pickLang(
      { es: `Llenar ${verificationPackage.evidenceTemplate.path} con metadata, resultados RLS, endpoints, rollback y decision.`, en: `Fill in ${verificationPackage.evidenceTemplate.path} with metadata, RLS results, endpoints, rollback and decision.` },
      language
    ),
    source: "controlled-verification-package",
    guardrail: pickLang({ es: "Accion humana; la consola no ejecuta endpoints, no aplica SQL y no cambia permisos.", en: "Human action; the console does not execute endpoints, apply SQL, or change permissions." }, language),
  };
  const deniedActions = verificationPackage.deniedChecks.map((check) => ({
    id: `controlled-verification-${check.id}`,
    domain: pickLang({ es: "Evidencia de denegacion", en: "Denied path evidence" }, language),
    priority: "review",
    status: "controlled-evidence-open",
    owner: "Security admin",
    action: pickLang(
      { es: `Registrar evidencia de denegacion para ${check.actor}: ${check.expected}.`, en: `Record denial evidence for ${check.actor}: ${check.expected}.` },
      language
    ),
    source: "controlled-verification-package",
    guardrail: pickLang({ es: "Debe probarse con identidades controladas; no usar datos productivos reales.", en: "Must be tested with controlled identities; do not use real production data." }, language),
  }));
  const rollbackAction = {
    id: "controlled-verification-rollback",
    domain: pickLang({ es: "Ensayo de rollback", en: "Rollback rehearsal" }, language),
    priority: "review",
    status: "controlled-evidence-open",
    owner: "Ops NUXERA",
    action: pickLang(
      { es: `Registrar ${verificationPackage.summary.rollbackChecks} checks de rollback antes de habilitar writes fuera de fallback local.`, en: `Record ${verificationPackage.summary.rollbackChecks} rollback checks before enabling writes outside local fallback.` },
      language
    ),
    source: "controlled-verification-package",
    guardrail: pickLang({ es: "Rollback debe preservar auditoria y no borrar registros nuxera_* tras uso real.", en: "Rollback must preserve audit history and not delete nuxera_* records after real use." }, language),
  };

  return [templateAction, ...deniedActions, rollbackAction];
}
export function normalizeNuxeraControlledVerificationPlanResponse(response, fallbackPackage = null, language = "es") {
  const payload = response?.verificationPlan || response || null;
  const fallback = fallbackPackage || buildControlledVerificationPackage(
    LOCAL_BACKEND_READINESS_STATE,
    buildRlsVerificationMatrix(LOCAL_BACKEND_READINESS_STATE, language),
    language
  );

  if (!payload || typeof payload !== "object") {
    return {
      ...fallback,
      source: "remote-missing-fallback",
      error: "nuxera-controlled-verification-plan-missing",
    };
  }

  const endpointChecks = asArray(payload.endpointChecks);
  const deniedChecks = asArray(payload.deniedChecks);
  const noGoCriteria = asArray(payload.noGoCriteria);
  const rollbackChecks = asArray(payload.rollbackChecks);
  const requiredIdentities = asArray(payload.requiredIdentities);

  return {
    ...fallback,
    ...payload,
    source: "remote-read-only",
    loading: false,
    error: null,
    evidenceTemplate: {
      ...fallback.evidenceTemplate,
      ...asObject(payload.evidenceTemplate),
    },
    requiredIdentities: requiredIdentities.length ? requiredIdentities : fallback.requiredIdentities,
    endpointChecks: endpointChecks.length ? endpointChecks : fallback.endpointChecks,
    deniedChecks: deniedChecks.length ? deniedChecks : fallback.deniedChecks,
    noGoCriteria: noGoCriteria.length ? noGoCriteria : fallback.noGoCriteria,
    rollbackChecks: rollbackChecks.length ? rollbackChecks : fallback.rollbackChecks,
    summary: {
      identities: requiredIdentities.length || fallback.summary.identities,
      endpoints: endpointChecks.length || fallback.summary.endpoints,
      deniedChecks: deniedChecks.length || fallback.summary.deniedChecks,
      noGoCriteria: noGoCriteria.length || fallback.summary.noGoCriteria,
      rollbackChecks: rollbackChecks.length || fallback.summary.rollbackChecks,
      blockedScenarios: fallback.summary.blockedScenarios,
      ...asObject(payload.summary),
    },
    guardrails: [
      ...asArray(payload.guardrails),
      ...asArray(response?.guardrails),
    ].filter(Boolean),
  };
}
function buildLocalEvidenceScaffold(fallbackPackage = null, language = "es") {
  const verificationPackage = fallbackPackage || buildControlledVerificationPackage(
    LOCAL_BACKEND_READINESS_STATE,
    buildRlsVerificationMatrix(LOCAL_BACKEND_READINESS_STATE, language),
    language
  );

  return {
    id: "nuxera-controlled-evidence-scaffold",
    status: "local-scaffold-fallback",
    source: "local-fallback",
    loading: false,
    error: null,
    sourcePlanId: verificationPackage.id,
    evidenceTemplate: verificationPackage.evidenceTemplate,
    metadata: {
      environment: "TODO: controlled non-production Supabase project",
      repoCommit: "TODO",
      operator: "TODO",
      reviewer: "TODO",
    },
    summary: {
      identities: verificationPackage.requiredIdentities.length,
      endpointRows: verificationPackage.endpointChecks.length + verificationPackage.deniedChecks.length,
      noGoCriteria: verificationPackage.noGoCriteria.length,
      rollbackChecks: verificationPackage.rollbackChecks.length,
      sqlDrafts: 3,
    },
    markdown: "# NUXERA Controlled RLS and Endpoint Evidence - Scaffold\n\nTODO: load backend scaffold before controlled run.",
    guardrails: [pickLang({ es: "Local scaffold fallback; no ejecuta endpoints ni aplica SQL.", en: "Local scaffold fallback; it does not execute endpoints or apply SQL." }, language)],
  };
}

export function normalizeNuxeraControlledEvidenceScaffoldResponse(response, fallbackScaffold = null, language = "es") {
  const payload = response?.evidenceScaffold || response || null;
  const fallback = fallbackScaffold || buildLocalEvidenceScaffold(null, language);

  if (!payload || typeof payload !== "object") {
    return {
      ...fallback,
      source: "remote-missing-fallback",
      error: "nuxera-controlled-evidence-scaffold-missing",
    };
  }

  return {
    ...fallback,
    ...payload,
    source: "remote-read-only",
    loading: false,
    error: null,
    metadata: {
      ...fallback.metadata,
      ...asObject(payload.metadata),
    },
    summary: {
      ...fallback.summary,
      ...asObject(payload.summary),
    },
    guardrails: [
      ...asArray(payload.guardrails),
      ...asArray(response?.guardrails),
    ].filter(Boolean),
  };
}

function buildLocalWriteGate(language = "es") {
  return {
    id: "nuxera-controlled-write-gate",
    status: "blocked-by-write-gates",
    source: "local-fallback",
    loading: false,
    error: null,
    readyForControlledWriteChange: false,
    requestedScope: "applicant-checklist-controlled-write",
    requestedEnvironment: "TODO",
    changeTicket: "TODO",
    sourceApprovalPackageId: "nuxera-controlled-approval-package",
    summary: {
      backendReady: false,
      backendReadiness: 0,
      approvalReady: false,
      blockers: 4,
      releaseChecklist: 6,
    },
    blockers: [
      "Backend readiness is not fully visible.",
      "Approval package is not ready for human release decision.",
      "Requested environment is required before controlled write gate review.",
      "Change-control ticket is required before controlled write gate review.",
    ],
    releaseChecklist: ["Write enablement requires a separate deploy/change-control action."],
    nextDecision: "Resolve write gate blockers before any controlled write change request.",
    guardrails: [pickLang({ es: "Local write gate fallback; no habilita writes ni cambia feature flags.", en: "Local write gate fallback; it does not enable writes or change feature flags." }, language)],
  };
}

export function normalizeNuxeraControlledWriteGateResponse(response, fallbackWriteGate = null, language = "es") {
  const payload = response?.writeGate || response || null;
  const fallback = fallbackWriteGate || buildLocalWriteGate(language);

  if (!payload || typeof payload !== "object") {
    return {
      ...fallback,
      source: "remote-missing-fallback",
      error: "nuxera-controlled-write-gate-missing",
    };
  }

  return {
    ...fallback,
    ...payload,
    source: "remote-read-only",
    loading: false,
    error: null,
    blockers: asArray(payload.blockers),
    releaseChecklist: asArray(payload.releaseChecklist).length ? asArray(payload.releaseChecklist) : fallback.releaseChecklist,
    summary: {
      ...fallback.summary,
      ...asObject(payload.summary),
    },
    guardrails: [
      ...asArray(payload.guardrails),
      ...asArray(response?.guardrails),
    ].filter(Boolean),
  };
}

function buildLocalChangeRequest(language = "es") {
  return {
    id: "nuxera-controlled-change-request",
    status: "blocked-by-change-request-gates",
    source: "local-fallback",
    loading: false,
    error: null,
    readyForChangeReview: false,
    sourceWriteGateId: "nuxera-controlled-write-gate",
    changeMetadata: {
      changeTicket: "TODO",
      requestedScope: "applicant-checklist-controlled-write",
      requestedEnvironment: "TODO",
      deploymentWindow: "TODO",
      rollbackOwner: "TODO",
      releaseReviewer: "TODO",
    },
    missingChangeMetadata: [
      { id: "deploymentWindow", label: "Deployment window" },
      { id: "rollbackOwner", label: "Rollback owner" },
      { id: "releaseReviewer", label: "Release reviewer" },
    ],
    summary: {
      writeGateReady: false,
      changeMetadataMissing: 3,
      blockers: 4,
      reviewChecklist: 7,
      rollbackSteps: 5,
    },
    blockers: [
      "Write gate is not ready for controlled write change review.",
      "Missing change metadata: Deployment Window.",
      "Missing change metadata: Rollback Owner.",
      "Missing change metadata: Release Reviewer.",
    ],
    reviewChecklist: ["Change ticket references completed evidence review, approval package and write gate output."],
    rollbackPlan: ["Disable NUXERA experience flag if UI behavior degrades."],
    nextDecision: "Resolve change-request blockers before submitting to change control.",
    guardrails: [pickLang({ es: "Local change request fallback; no persiste tickets ni habilita writes.", en: "Local change request fallback; it does not persist tickets or enable writes." }, language)],
    markdown: "# NUXERA Controlled Change Request Package\n\nStatus: blocked-by-change-request-gates",
  };
}

export function normalizeNuxeraControlledChangeRequestResponse(response, fallbackChangeRequest = null, language = "es") {
  const payload = response?.changeRequest || response || null;
  const fallback = fallbackChangeRequest || buildLocalChangeRequest(language);

  if (!payload || typeof payload !== "object") {
    return {
      ...fallback,
      source: "remote-missing-fallback",
      error: "nuxera-controlled-change-request-missing",
    };
  }

  return {
    ...fallback,
    ...payload,
    source: "remote-read-only",
    loading: false,
    error: null,
    changeMetadata: {
      ...fallback.changeMetadata,
      ...asObject(payload.changeMetadata),
    },
    missingChangeMetadata: asArray(payload.missingChangeMetadata),
    blockers: asArray(payload.blockers),
    reviewChecklist: asArray(payload.reviewChecklist).length ? asArray(payload.reviewChecklist) : fallback.reviewChecklist,
    rollbackPlan: asArray(payload.rollbackPlan).length ? asArray(payload.rollbackPlan) : fallback.rollbackPlan,
    summary: {
      ...fallback.summary,
      ...asObject(payload.summary),
    },
    guardrails: [
      ...asArray(payload.guardrails),
      ...asArray(response?.guardrails),
    ].filter(Boolean),
  };
}
function buildLocalContinuationPack(language = "es") {
  return {
    id: "nuxera-controlled-continuation-pack",
    status: "ready-for-night-continuation",
    source: "local-fallback",
    loading: false,
    error: null,
    progress: { percent: 83, label: "83% complete", confidence: "approximate-controlled-migration-progress" },
    resumeContext: {
      branch: "nuxera-controlled-migration",
      resumeFromCommit: "42c4ba7",
      localRepo: "C:/Users/usalgado/Documents/Codex/2026-07-16/h/work/NSD",
      downloadsRoot: "C:/Users/usalgado/Downloads/NUXERA_AVANCE_LOCAL_2026-07-17",
    },
    recentCommits: [
      { hash: "42c4ba7", title: "Add NUXERA controlled release dossier" },
      { hash: "4fb98ad", title: "Add NUXERA controlled change request package" },
      { hash: "12e2e63", title: "Add NUXERA controlled write gate" },
    ],
    completedChain: [
      { id: "verification-plan", label: "Verification plan", status: "implemented-read-only" },
      { id: "release-dossier", label: "Release readiness dossier", status: "implemented-read-only" },
    ],
    validationSnapshot: ["Backend full suite passed: 49 files / 456 tests.", "Frontend full suite passed: 9 files / 238 tests."],
    nextResumeSteps: ["Start from latest clean commit and confirm git status is empty."],
    guardrails: [pickLang({ es: "Local continuation pack fallback; no ejecuta endpoints ni habilita writes.", en: "Local continuation pack fallback; it does not execute endpoints or enable writes." }, language)],
    markdown: "# NUXERA Controlled Migration Continuation Pack\n\nStatus: ready-for-night-continuation",
  };
}

export function normalizeNuxeraControlledContinuationPackResponse(response, fallbackContinuationPack = null, language = "es") {
  const payload = response?.continuationPack || response || null;
  const fallback = fallbackContinuationPack || buildLocalContinuationPack(language);

  if (!payload || typeof payload !== "object") {
    return {
      ...fallback,
      source: "remote-missing-fallback",
      error: "nuxera-controlled-continuation-pack-missing",
    };
  }

  return {
    ...fallback,
    ...payload,
    source: "remote-read-only",
    loading: false,
    error: null,
    progress: {
      ...fallback.progress,
      ...asObject(payload.progress),
    },
    resumeContext: {
      ...fallback.resumeContext,
      ...asObject(payload.resumeContext),
    },
    recentCommits: asArray(payload.recentCommits).length ? asArray(payload.recentCommits) : fallback.recentCommits,
    completedChain: asArray(payload.completedChain).length ? asArray(payload.completedChain) : fallback.completedChain,
    validationSnapshot: asArray(payload.validationSnapshot).length ? asArray(payload.validationSnapshot) : fallback.validationSnapshot,
    nextResumeSteps: asArray(payload.nextResumeSteps).length ? asArray(payload.nextResumeSteps) : fallback.nextResumeSteps,
    guardrails: [
      ...asArray(payload.guardrails),
      ...asArray(response?.guardrails),
    ].filter(Boolean),
  };
}
function buildLocalReleaseDossier(language = "es") {
  return {
    id: "nuxera-controlled-release-dossier",
    status: "blocked-by-release-dossier-gates",
    source: "local-fallback",
    loading: false,
    error: null,
    readyForReleaseReview: false,
    sourceChangeRequestId: "nuxera-controlled-change-request",
    dossierMetadata: {
      dossierOwner: "TODO",
      dossierDate: "TODO",
      finalReviewer: "TODO",
      changeTicket: "TODO",
      requestedEnvironment: "TODO",
    },
    missingDossierMetadata: [
      { id: "dossierOwner", label: "Dossier owner" },
      { id: "dossierDate", label: "Dossier date" },
      { id: "finalReviewer", label: "Final reviewer" },
    ],
    summary: {
      changeRequestReady: false,
      dossierMetadataMissing: 3,
      blockers: 4,
      evidenceChain: 6,
      finalReviewChecklist: 8,
    },
    evidenceChain: [
      { id: "verification-plan", label: "Controlled verification plan", status: "required-before-run" },
      { id: "change-request", label: "Change request package", status: "blocked-by-change-request-gates" },
    ],
    blockers: [
      "Change request package is not ready for separate change-control review.",
      "Missing dossier metadata: Dossier Owner.",
      "Missing dossier metadata: Dossier Date.",
      "Missing dossier metadata: Final Reviewer.",
    ],
    finalReviewChecklist: ["Final reviewer understands this dossier is not deployment approval."],
    nextDecision: "Resolve release dossier blockers before final release-readiness review.",
    guardrails: [pickLang({ es: "Local release dossier fallback; no persiste aprobaciones, tickets ni habilita writes.", en: "Local release dossier fallback; it does not persist approvals, tickets, or enable writes." }, language)],
    markdown: "# NUXERA Controlled Release Readiness Dossier\n\nStatus: blocked-by-release-dossier-gates",
  };
}

export function normalizeNuxeraControlledReleaseDossierResponse(response, fallbackReleaseDossier = null, language = "es") {
  const payload = response?.releaseDossier || response || null;
  const fallback = fallbackReleaseDossier || buildLocalReleaseDossier(language);

  if (!payload || typeof payload !== "object") {
    return {
      ...fallback,
      source: "remote-missing-fallback",
      error: "nuxera-controlled-release-dossier-missing",
    };
  }

  return {
    ...fallback,
    ...payload,
    source: "remote-read-only",
    loading: false,
    error: null,
    dossierMetadata: {
      ...fallback.dossierMetadata,
      ...asObject(payload.dossierMetadata),
    },
    missingDossierMetadata: asArray(payload.missingDossierMetadata),
    evidenceChain: asArray(payload.evidenceChain).length ? asArray(payload.evidenceChain) : fallback.evidenceChain,
    blockers: asArray(payload.blockers),
    finalReviewChecklist: asArray(payload.finalReviewChecklist).length ? asArray(payload.finalReviewChecklist) : fallback.finalReviewChecklist,
    summary: {
      ...fallback.summary,
      ...asObject(payload.summary),
    },
    guardrails: [
      ...asArray(payload.guardrails),
      ...asArray(response?.guardrails),
    ].filter(Boolean),
  };
}
function buildLocalApprovalPackage(language = "es") {
  return {
    id: "nuxera-controlled-approval-package",
    status: "blocked-by-approval-gates",
    source: "local-fallback",
    loading: false,
    error: null,
    readyForReleaseDecision: false,
    sourceReviewId: "nuxera-controlled-evidence-review",
    sourcePlanId: "nuxera-controlled-rls-endpoint-evidence",
    approvalMetadata: {
      approver: "TODO",
      approvalDate: "TODO",
      approvalScope: "TODO",
      evidenceHash: "TODO",
      decision: "TODO",
    },
    missingApprovalMetadata: [
      { id: "approver", label: "Approver" },
      { id: "approvalDate", label: "Approval date" },
      { id: "approvalScope", label: "Approval scope" },
      { id: "evidenceHash", label: "Evidence hash" },
    ],
    summary: {
      evidenceReady: false,
      evidenceBlockers: 1,
      approvalMetadataMissing: 4,
      decisionAccepted: false,
      blockers: 5,
    },
    blockers: ["Evidence review is not ready for human approval review."],
    releaseChecklist: ["Human approver reviewed completed controlled evidence."],
    nextDecision: "Resolve approval blockers before any release decision.",
    guardrails: [pickLang({ es: "Local approval package fallback; no persiste aprobaciones ni habilita writes.", en: "Local approval package fallback; it does not persist approvals or enable writes." }, language)],
  };
}

export function normalizeNuxeraControlledApprovalPackageResponse(response, fallbackApprovalPackage = null, language = "es") {
  const payload = response?.approvalPackage || response || null;
  const fallback = fallbackApprovalPackage || buildLocalApprovalPackage(language);

  if (!payload || typeof payload !== "object") {
    return {
      ...fallback,
      source: "remote-missing-fallback",
      error: "nuxera-controlled-approval-package-missing",
    };
  }

  return {
    ...fallback,
    ...payload,
    source: "remote-read-only",
    loading: false,
    error: null,
    approvalMetadata: {
      ...fallback.approvalMetadata,
      ...asObject(payload.approvalMetadata),
    },
    missingApprovalMetadata: asArray(payload.missingApprovalMetadata),
    blockers: asArray(payload.blockers),
    releaseChecklist: asArray(payload.releaseChecklist).length ? asArray(payload.releaseChecklist) : fallback.releaseChecklist,
    summary: {
      ...fallback.summary,
      ...asObject(payload.summary),
    },
    guardrails: [
      ...asArray(payload.guardrails),
      ...asArray(response?.guardrails),
    ].filter(Boolean),
  };
}

function buildLocalEvidenceReview(language = "es") {
  return {
    id: "nuxera-controlled-evidence-review",
    status: "missing-evidence-markdown",
    source: "local-fallback",
    loading: false,
    error: null,
    readyForHumanReview: false,
    sourcePlanId: "nuxera-controlled-rls-endpoint-evidence",
    summary: {
      requiredSections: 7,
      missingSections: 7,
      todoMarkers: 0,
      passMarkers: 0,
      failMarkers: 0,
      missingDecisions: 4,
      noGoIndicators: 0,
    },
    missingSections: [],
    missingDecisions: [],
    blockers: ["Evidence Markdown payload is required before review."],
    nextDecision: "Submit completed controlled evidence Markdown for read-only review.",
    guardrails: [pickLang({ es: "Local review fallback; no ejecuta endpoints ni aplica SQL.", en: "Local review fallback; it does not execute endpoints or apply SQL." }, language)],
  };
}

export function normalizeNuxeraControlledEvidenceReviewResponse(response, fallbackReview = null, language = "es") {
  const payload = response?.evidenceReview || response || null;
  const fallback = fallbackReview || buildLocalEvidenceReview(language);

  if (!payload || typeof payload !== "object") {
    return {
      ...fallback,
      source: "remote-missing-fallback",
      error: "nuxera-controlled-evidence-review-missing",
    };
  }

  return {
    ...fallback,
    ...payload,
    source: "remote-read-only",
    loading: false,
    error: null,
    missingSections: asArray(payload.missingSections),
    missingDecisions: asArray(payload.missingDecisions),
    blockers: asArray(payload.blockers),
    summary: {
      ...fallback.summary,
      ...asObject(payload.summary),
    },
    guardrails: [
      ...asArray(payload.guardrails),
      ...asArray(response?.guardrails),
    ].filter(Boolean),
  };
}

function buildLocalRunbook(fallbackScaffold = null, language = "es") {
  const scaffold = fallbackScaffold || buildLocalEvidenceScaffold(null, language);

  return {
    id: "nuxera-controlled-runbook",
    status: "blocked-by-run-metadata",
    source: "local-fallback",
    loading: false,
    error: null,
    readyForRun: false,
    sourceScaffoldId: scaffold.id,
    sourcePlanId: scaffold.sourcePlanId,
    missingMetadata: [
      { id: "environment", label: "Environment" },
      { id: "repoCommit", label: "Repo commit" },
      { id: "operator", label: "Operator" },
      { id: "reviewer", label: "Reviewer" },
      { id: "priorKnownGoodCommit", label: "Prior known-good commit" },
      { id: "rollbackOwner", label: "Rollback owner" },
    ],
    summary: {
      identities: scaffold.summary.identities,
      endpointRows: scaffold.summary.endpointRows,
      noGoCriteria: scaffold.summary.noGoCriteria,
      rollbackChecks: scaffold.summary.rollbackChecks,
      sqlDrafts: scaffold.summary.sqlDrafts,
      missingMetadata: 6,
    },
    commands: [
      { id: "generate-scaffold-markdown", command: "npm run scaffold:nuxera-evidence -- --environment=<non-prod> --commit=<commit>" },
      { id: "verify-local-guards", command: "npm run check:nuxera-verification-plan && npm run check:nuxera-sql" },
    ],
    acceptanceGates: ["All four RLS identities have observed pass/fail evidence."],
    nextDecision: "Fill missing run metadata before attempting controlled Supabase verification.",
    guardrails: [pickLang({ es: "Local runbook fallback; no ejecuta endpoints ni aplica SQL.", en: "Local runbook fallback; it does not execute endpoints or apply SQL." }, language)],
  };
}

export function normalizeNuxeraControlledRunbookResponse(response, fallbackRunbook = null, language = "es") {
  const payload = response?.runbook || response || null;
  const fallback = fallbackRunbook || buildLocalRunbook(null, language);

  if (!payload || typeof payload !== "object") {
    return {
      ...fallback,
      source: "remote-missing-fallback",
      error: "nuxera-controlled-runbook-missing",
    };
  }

  return {
    ...fallback,
    ...payload,
    source: "remote-read-only",
    loading: false,
    error: null,
    missingMetadata: asArray(payload.missingMetadata),
    commands: asArray(payload.commands).length ? asArray(payload.commands) : fallback.commands,
    acceptanceGates: asArray(payload.acceptanceGates).length ? asArray(payload.acceptanceGates) : fallback.acceptanceGates,
    summary: {
      ...fallback.summary,
      ...asObject(payload.summary),
    },
    guardrails: [
      ...asArray(payload.guardrails),
      ...asArray(response?.guardrails),
    ].filter(Boolean),
  };
}

function buildBackendReadinessHandoff(state, actions, language) {
  const unavailableSignals = state.signals.filter((signal) => !signal.ready);

  return {
    id: "nuxera-backend-readiness-handoff",
    status: state.ready ? "ready-for-rls-verification" : "blocked-by-backend-readiness",
    generatedFor: "controlled-supabase-verification",
    summary: state.summary,
    unavailableTables: unavailableSignals.map((signal) => ({
      table: signal.table,
      owner: signal.owner,
      requiredFor: asArray(signal.requiredFor),
      status: signal.status,
    })),
    nextActions: actions.map((action) => action.action),
    guardrails: [
      ...state.guardrails,
      pickLang({ es: "Handoff local; no aplica SQL, no cambia RLS y no sustituye pruebas con identidades reales.", en: "Local handoff; it does not apply SQL, change RLS, or replace testing with real identities." }, language),
    ],
  };
}
function mergeBackendReadinessIntoAuditPackage(auditPackage, handoff, language) {
  const existingSignals = asArray(auditPackage?.signals).filter((signal) => signal.id !== "backend-readiness");
  const existingActions = asArray(auditPackage?.nextActions).filter(
    (action) => !String(action).startsWith("Verificar backend readiness:") && !String(action).startsWith("Verify backend readiness:")
  );

  return {
    ...auditPackage,
    scope: [...new Set([...asArray(auditPackage?.scope), "backend-readiness"])],
    signals: [
      ...existingSignals,
      {
        id: "backend-readiness",
        label: pickLang({ es: "Readiness backend", en: "Backend readiness" }, language),
        value: `${handoff.summary.readiness}%`,
        status: handoff.status,
      },
    ],
    nextActions: [
      ...existingActions,
      ...handoff.nextActions.map((action) => pickLang({ es: `Verificar backend readiness: ${action}`, en: `Verify backend readiness: ${action}` }, language)),
    ],
    guardrails: [
      ...asArray(auditPackage?.guardrails),
      pickLang({ es: "Backend readiness en audit package es evidencia local; no aplica SQL ni valida RLS por si sola.", en: "Backend readiness in the audit package is local evidence; it does not apply SQL or validate RLS on its own." }, language),
    ],
  };
}
function mergeControlledVerificationIntoAuditPackage(auditPackage, verificationPackage, language) {
  const existingSignals = asArray(auditPackage?.signals).filter((signal) => signal.id !== "controlled-verification-package");
  const existingActions = asArray(auditPackage?.nextActions).filter(
    (action) => !String(action).startsWith("Completar evidencia RLS/endpoints:") && !String(action).startsWith("Complete RLS/endpoint evidence:")
  );

  return {
    ...auditPackage,
    scope: [...new Set([...asArray(auditPackage?.scope), "controlled-rls-endpoint-evidence"])],
    signals: [
      ...existingSignals,
      {
        id: "controlled-verification-package",
        label: pickLang({ es: "Evidencia RLS/endpoints", en: "RLS/endpoint evidence" }, language),
        value: `${verificationPackage.summary.endpoints}/${verificationPackage.summary.identities}`,
        status: verificationPackage.status,
      },
    ],
    nextActions: [
      ...existingActions,
      pickLang(
        { es: `Completar evidencia RLS/endpoints: llenar ${verificationPackage.evidenceTemplate.path} antes de decision productiva.`, en: `Complete RLS/endpoint evidence: fill in ${verificationPackage.evidenceTemplate.path} before a production decision.` },
        language
      ),
      ...verificationPackage.deniedChecks.map((check) => pickLang(
        { es: `Completar evidencia RLS/endpoints: ${check.actor} debe recibir ${check.expected}.`, en: `Complete RLS/endpoint evidence: ${check.actor} must receive ${check.expected}.` },
        language
      )),
    ],
    guardrails: [
      ...asArray(auditPackage?.guardrails),
      pickLang({ es: "Evidencia RLS/endpoints en audit package es plantilla local; requiere ejecucion controlada real.", en: "RLS/endpoint evidence in the audit package is a local template; it requires a real controlled run." }, language),
    ],
  };
}
function mergeRlsMatrixIntoAuditPackage(auditPackage, matrix, language) {
  const blockedScenarios = matrix.scenarios.filter((scenario) => scenario.blockedBy.length > 0);
  const existingSignals = asArray(auditPackage?.signals).filter((signal) => signal.id !== "rls-verification-matrix");
  const existingActions = asArray(auditPackage?.nextActions).filter(
    (action) => !String(action).startsWith("Verificar RLS controlado:") && !String(action).startsWith("Verify controlled RLS:")
  );

  return {
    ...auditPackage,
    scope: [...new Set([...asArray(auditPackage?.scope), "rls-verification-matrix"])],
    signals: [
      ...existingSignals,
      {
        id: "rls-verification-matrix",
        label: pickLang({ es: "Matriz RLS controlada", en: "Controlled RLS matrix" }, language),
        value: `${blockedScenarios.length}/${matrix.scenarios.length}`,
        status: matrix.status,
      },
    ],
    nextActions: [
      ...existingActions,
      ...blockedScenarios.map((scenario) => pickLang(
        { es: `Verificar RLS controlado: ${scenario.identity} bloqueado por ${scenario.blockedBy.join(", ")}.`, en: `Verify controlled RLS: ${scenario.identity} blocked by ${scenario.blockedBy.join(", ")}.` },
        language
      )),
    ],
    guardrails: [
      ...asArray(auditPackage?.guardrails),
      pickLang({ es: "Matriz RLS en audit package es planeacion local; requiere pruebas con identidades controladas.", en: "RLS matrix in the audit package is local planning; it requires testing with controlled identities." }, language),
    ],
  };
}

export function mergeBackendReadinessWithConsole(consoleState, readinessState = LOCAL_BACKEND_READINESS_STATE, verificationPlanState = null, language = "es") {
  const state = readinessState || LOCAL_BACKEND_READINESS_STATE;
  const readinessHealthSignal = buildBackendReadinessHealthSignal(state, language);
  const readinessActions = buildBackendReadinessActions(state, language);
  const rlsVerificationMatrix = buildRlsVerificationMatrix(state, language);
  const controlledVerificationPackage = verificationPlanState || buildControlledVerificationPackage(state, rlsVerificationMatrix, language);
  const controlledVerificationHealthSignal = buildControlledVerificationHealthSignal(controlledVerificationPackage, language);
  const controlledVerificationActions = buildControlledVerificationActions(controlledVerificationPackage, language);
  const readinessHandoff = buildBackendReadinessHandoff(state, readinessActions, language);
  const auditPackage = mergeControlledVerificationIntoAuditPackage(
    mergeRlsMatrixIntoAuditPackage(
      mergeBackendReadinessIntoAuditPackage(consoleState.auditPackage, readinessHandoff, language),
      rlsVerificationMatrix,
      language
    ),
    controlledVerificationPackage,
    language
  );
  const adminHealthSignals = [
    ...consoleState.adminHealthSignals.filter(
      (signal) => ![readinessHealthSignal.id, controlledVerificationHealthSignal.id].includes(signal.id)
    ),
    readinessHealthSignal,
    controlledVerificationHealthSignal,
  ];
  const adminActionQueue = [
    ...readinessActions,
    ...controlledVerificationActions,
    ...consoleState.adminActionQueue.filter(
      (item) => !item.id.startsWith("backend-readiness-") && !item.id.startsWith("controlled-verification-")
    ),
  ];

  return {
    ...consoleState,
    backendReadiness: state,
    backendReadinessHandoff: readinessHandoff,
    rlsVerificationMatrix,
    controlledVerificationPackage,
    auditPackage,
    adminHealthSignals,
    adminActionQueue,
    summary: {
      ...consoleState.summary,
      backendReadiness: state.summary.readiness,
      backendReadinessUnavailable: state.summary.unavailable,
      backendReadinessActions: readinessActions.length,
      rlsVerificationScenarios: rlsVerificationMatrix.scenarios.length,
      rlsVerificationBlocked: rlsVerificationMatrix.scenarios.filter((item) => item.blockedBy.length > 0).length,
      controlledVerificationEndpoints: controlledVerificationPackage.summary.endpoints,
      controlledVerificationDeniedChecks: controlledVerificationPackage.summary.deniedChecks,
      controlledVerificationNoGo: controlledVerificationPackage.summary.noGoCriteria,
      auditPackageSignals: auditPackage.signals.length,
      auditPackageActions: auditPackage.nextActions.length,
      adminHealthSignals: adminHealthSignals.length,
      adminHealthWatch: adminHealthSignals.filter((item) => item.severity !== "low").length,
      adminActionQueue: adminActionQueue.length,
      adminCriticalActions: adminActionQueue.filter((item) => item.priority === "critical-path").length,
    },
    policies: [
      ...consoleState.policies,
      state.ready
        ? pickLang({ es: "Backend readiness visible; RLS aun requiere verificacion controlada.", en: "Backend readiness visible; RLS still requires controlled verification." }, language)
        : pickLang({ es: "Backend readiness pendiente; mantener writes productivos bloqueados.", en: "Backend readiness pending; keep production writes blocked." }, language),
      pickLang({ es: "Paquete RLS/endpoints requiere evidencia completada antes de decision productiva.", en: "RLS/endpoint package requires completed evidence before a production decision." }, language),
    ],
  };
}

export function useBackendReadiness({ enabled = true, language = "es" } = {}) {
  const [readinessState, setReadinessState] = useState(LOCAL_BACKEND_READINESS_STATE);

  useEffect(() => {
    if (!enabled) {
      setReadinessState(LOCAL_BACKEND_READINESS_STATE);
      return undefined;
    }

    let active = true;
    setReadinessState({
      ...LOCAL_BACKEND_READINESS_STATE,
      source: "remote-loading",
      label: pickLang({ es: "Cargando readiness backend NUXERA", en: "Loading NUXERA backend readiness" }, language),
      loading: true,
    });

    nuxeraBackendReadinessAPI.getReadiness()
      .then(({ data }) => {
        if (!active) return;
        setReadinessState(normalizeNuxeraBackendReadinessResponse(data, language));
      })
      .catch((err) => {
        if (!active) return;
        warn("NUXERA", "No se pudo cargar backend readiness; usando fallback local", err);
        setReadinessState({
          ...LOCAL_BACKEND_READINESS_STATE,
          source: "remote-error-fallback",
          label: pickLang({ es: "Fallback readiness local", en: "Local readiness fallback" }, language),
          error: "nuxera-backend-readiness-unavailable",
        });
      });

    return () => {
      active = false;
    };
  }, [enabled, language]);

  return readinessState;
}
export function useControlledEvidenceScaffold({ enabled = true, fallbackScaffold = null, language = "es" } = {}) {
  const [evidenceScaffoldState, setEvidenceScaffoldState] = useState(
    fallbackScaffold || buildLocalEvidenceScaffold(null, language)
  );

  useEffect(() => {
    if (!enabled) {
      setEvidenceScaffoldState(fallbackScaffold || buildLocalEvidenceScaffold(null, language));
      return undefined;
    }

    let active = true;
    const fallback = fallbackScaffold || buildLocalEvidenceScaffold(null, language);
    setEvidenceScaffoldState({ ...fallback, source: "remote-loading", loading: true });

    nuxeraControlledEvidenceScaffoldAPI.getScaffold()
      .then(({ data }) => {
        if (!active) return;
        setEvidenceScaffoldState(normalizeNuxeraControlledEvidenceScaffoldResponse(data, fallback, language));
      })
      .catch((err) => {
        if (!active) return;
        warn("NUXERA", "No se pudo cargar evidence scaffold; usando fallback local", err);
        setEvidenceScaffoldState({
          ...fallback,
          source: "remote-error-fallback",
          error: "nuxera-controlled-evidence-scaffold-unavailable",
        });
      });

    return () => {
      active = false;
    };
  }, [enabled, fallbackScaffold, language]);

  return evidenceScaffoldState;
}

export function useControlledWriteGate({ enabled = true, payload = null, fallbackWriteGate = null, language = "es" } = {}) {
  const [writeGateState, setWriteGateState] = useState(fallbackWriteGate || buildLocalWriteGate(language));

  useEffect(() => {
    if (!enabled || !payload) {
      setWriteGateState(fallbackWriteGate || buildLocalWriteGate(language));
      return undefined;
    }

    let active = true;
    const fallback = fallbackWriteGate || buildLocalWriteGate(language);
    setWriteGateState({ ...fallback, source: "remote-loading", loading: true });

    nuxeraControlledWriteGateAPI.evaluate(payload)
      .then(({ data }) => {
        if (!active) return;
        setWriteGateState(normalizeNuxeraControlledWriteGateResponse(data, fallback, language));
      })
      .catch((err) => {
        if (!active) return;
        warn("NUXERA", "No se pudo evaluar write gate; usando fallback local", err);
        setWriteGateState({
          ...fallback,
          source: "remote-error-fallback",
          error: "nuxera-controlled-write-gate-unavailable",
        });
      });

    return () => {
      active = false;
    };
  }, [enabled, payload, fallbackWriteGate, language]);

  return writeGateState;
}

export function useControlledChangeRequest({ enabled = true, payload = null, fallbackChangeRequest = null, language = "es" } = {}) {
  const [changeRequestState, setChangeRequestState] = useState(fallbackChangeRequest || buildLocalChangeRequest(language));

  useEffect(() => {
    if (!enabled || !payload) {
      setChangeRequestState(fallbackChangeRequest || buildLocalChangeRequest(language));
      return undefined;
    }

    let active = true;
    const fallback = fallbackChangeRequest || buildLocalChangeRequest(language);
    setChangeRequestState({ ...fallback, source: "remote-loading", loading: true });

    nuxeraControlledChangeRequestAPI.build(payload)
      .then(({ data }) => {
        if (!active) return;
        setChangeRequestState(normalizeNuxeraControlledChangeRequestResponse(data, fallback, language));
      })
      .catch((err) => {
        if (!active) return;
        warn("NUXERA", "No se pudo construir change request; usando fallback local", err);
        setChangeRequestState({
          ...fallback,
          source: "remote-error-fallback",
          error: "nuxera-controlled-change-request-unavailable",
        });
      });

    return () => {
      active = false;
    };
  }, [enabled, payload, fallbackChangeRequest, language]);

  return changeRequestState;
}
export function useControlledContinuationPack({ enabled = true, fallbackContinuationPack = null, language = "es" } = {}) {
  const [continuationPackState, setContinuationPackState] = useState(fallbackContinuationPack || buildLocalContinuationPack(language));

  useEffect(() => {
    if (!enabled) {
      setContinuationPackState(fallbackContinuationPack || buildLocalContinuationPack(language));
      return undefined;
    }

    let active = true;
    const fallback = fallbackContinuationPack || buildLocalContinuationPack(language);
    setContinuationPackState({ ...fallback, source: "remote-loading", loading: true });

    nuxeraControlledContinuationPackAPI.getPack()
      .then(({ data }) => {
        if (!active) return;
        setContinuationPackState(normalizeNuxeraControlledContinuationPackResponse(data, fallback, language));
      })
      .catch((err) => {
        if (!active) return;
        warn("NUXERA", "No se pudo cargar continuation pack; usando fallback local", err);
        setContinuationPackState({
          ...fallback,
          source: "remote-error-fallback",
          error: "nuxera-controlled-continuation-pack-unavailable",
        });
      });

    return () => {
      active = false;
    };
  }, [enabled, fallbackContinuationPack, language]);

  return continuationPackState;
}
export function useControlledReleaseDossier({ enabled = true, payload = null, fallbackReleaseDossier = null, language = "es" } = {}) {
  const [releaseDossierState, setReleaseDossierState] = useState(fallbackReleaseDossier || buildLocalReleaseDossier(language));

  useEffect(() => {
    if (!enabled || !payload) {
      setReleaseDossierState(fallbackReleaseDossier || buildLocalReleaseDossier(language));
      return undefined;
    }

    let active = true;
    const fallback = fallbackReleaseDossier || buildLocalReleaseDossier(language);
    setReleaseDossierState({ ...fallback, source: "remote-loading", loading: true });

    nuxeraControlledReleaseDossierAPI.build(payload)
      .then(({ data }) => {
        if (!active) return;
        setReleaseDossierState(normalizeNuxeraControlledReleaseDossierResponse(data, fallback, language));
      })
      .catch((err) => {
        if (!active) return;
        warn("NUXERA", "No se pudo construir release dossier; usando fallback local", err);
        setReleaseDossierState({
          ...fallback,
          source: "remote-error-fallback",
          error: "nuxera-controlled-release-dossier-unavailable",
        });
      });

    return () => {
      active = false;
    };
  }, [enabled, payload, fallbackReleaseDossier, language]);

  return releaseDossierState;
}
export function useControlledApprovalPackage({ enabled = true, payload = null, fallbackApprovalPackage = null, language = "es" } = {}) {
  const [approvalPackageState, setApprovalPackageState] = useState(fallbackApprovalPackage || buildLocalApprovalPackage(language));

  useEffect(() => {
    if (!enabled || !payload) {
      setApprovalPackageState(fallbackApprovalPackage || buildLocalApprovalPackage(language));
      return undefined;
    }

    let active = true;
    const fallback = fallbackApprovalPackage || buildLocalApprovalPackage(language);
    setApprovalPackageState({ ...fallback, source: "remote-loading", loading: true });

    nuxeraControlledApprovalPackageAPI.build(payload)
      .then(({ data }) => {
        if (!active) return;
        setApprovalPackageState(normalizeNuxeraControlledApprovalPackageResponse(data, fallback, language));
      })
      .catch((err) => {
        if (!active) return;
        warn("NUXERA", "No se pudo construir approval package; usando fallback local", err);
        setApprovalPackageState({
          ...fallback,
          source: "remote-error-fallback",
          error: "nuxera-controlled-approval-package-unavailable",
        });
      });

    return () => {
      active = false;
    };
  }, [enabled, payload, fallbackApprovalPackage, language]);

  return approvalPackageState;
}

export function useControlledEvidenceReview({ enabled = true, markdown = "", fallbackReview = null, language = "es" } = {}) {
  const [reviewState, setReviewState] = useState(fallbackReview || buildLocalEvidenceReview(language));

  useEffect(() => {
    if (!enabled || !markdown) {
      setReviewState(fallbackReview || buildLocalEvidenceReview(language));
      return undefined;
    }

    let active = true;
    const fallback = fallbackReview || buildLocalEvidenceReview(language);
    setReviewState({ ...fallback, source: "remote-loading", loading: true });

    nuxeraControlledEvidenceReviewAPI.review(markdown)
      .then(({ data }) => {
        if (!active) return;
        setReviewState(normalizeNuxeraControlledEvidenceReviewResponse(data, fallback, language));
      })
      .catch((err) => {
        if (!active) return;
        warn("NUXERA", "No se pudo revisar evidencia controlada; usando fallback local", err);
        setReviewState({
          ...fallback,
          source: "remote-error-fallback",
          error: "nuxera-controlled-evidence-review-unavailable",
        });
      });

    return () => {
      active = false;
    };
  }, [enabled, markdown, fallbackReview, language]);

  return reviewState;
}

export function useControlledRunbook({ enabled = true, fallbackRunbook = null, language = "es" } = {}) {
  const [runbookState, setRunbookState] = useState(fallbackRunbook || buildLocalRunbook(null, language));

  useEffect(() => {
    if (!enabled) {
      setRunbookState(fallbackRunbook || buildLocalRunbook(null, language));
      return undefined;
    }

    let active = true;
    const fallback = fallbackRunbook || buildLocalRunbook(null, language);
    setRunbookState({ ...fallback, source: "remote-loading", loading: true });

    nuxeraControlledRunbookAPI.getRunbook()
      .then(({ data }) => {
        if (!active) return;
        setRunbookState(normalizeNuxeraControlledRunbookResponse(data, fallback, language));
      })
      .catch((err) => {
        if (!active) return;
        warn("NUXERA", "No se pudo cargar controlled runbook; usando fallback local", err);
        setRunbookState({
          ...fallback,
          source: "remote-error-fallback",
          error: "nuxera-controlled-runbook-unavailable",
        });
      });

    return () => {
      active = false;
    };
  }, [enabled, fallbackRunbook, language]);

  return runbookState;
}

export function useControlledVerificationPlan({ enabled = true, fallbackPackage = null, language = "es" } = {}) {
  const [verificationPlanState, setVerificationPlanState] = useState(
    fallbackPackage || buildControlledVerificationPackage(LOCAL_BACKEND_READINESS_STATE, buildRlsVerificationMatrix(LOCAL_BACKEND_READINESS_STATE, language), language)
  );

  useEffect(() => {
    if (!enabled) {
      setVerificationPlanState(
        fallbackPackage || buildControlledVerificationPackage(LOCAL_BACKEND_READINESS_STATE, buildRlsVerificationMatrix(LOCAL_BACKEND_READINESS_STATE, language), language)
      );
      return undefined;
    }

    let active = true;
    const fallback = fallbackPackage || buildControlledVerificationPackage(LOCAL_BACKEND_READINESS_STATE, buildRlsVerificationMatrix(LOCAL_BACKEND_READINESS_STATE, language), language);
    setVerificationPlanState({ ...fallback, source: "remote-loading", loading: true });

    nuxeraControlledVerificationAPI.getPlan()
      .then(({ data }) => {
        if (!active) return;
        setVerificationPlanState(normalizeNuxeraControlledVerificationPlanResponse(data, fallback, language));
      })
      .catch((err) => {
        if (!active) return;
        warn("NUXERA", "No se pudo cargar verification plan; usando fallback local", err);
        setVerificationPlanState({
          ...fallback,
          source: "remote-error-fallback",
          error: "nuxera-controlled-verification-plan-unavailable",
        });
      });

    return () => {
      active = false;
    };
  }, [enabled, fallbackPackage, language]);

  return verificationPlanState;
}
