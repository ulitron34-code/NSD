import { useEffect, useState } from "react";
import { nuxeraBackendReadinessAPI } from "../../services/api";
import { warn } from "../../utils/logger";

const LOCAL_BACKEND_READINESS_STATE = Object.freeze({
  source: "local-fallback",
  label: "Readiness backend local",
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
  guardrails: ["Readiness local; no aplica SQL ni confirma RLS."],
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
    guardrail: value.guardrail || "Read-only readiness signal; no cambia permisos.",
  };
}

export function normalizeNuxeraBackendReadinessResponse(response) {
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
    label: payload.ready ? "Backend NUXERA visible" : "Backend NUXERA pendiente",
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

function buildBackendReadinessHealthSignal(state) {
  return {
    id: "backend-readiness-preflight",
    label: "Backend readiness",
    status: state.ready ? "backend-visible" : "backend-blocked",
    severity: state.ready ? "low" : "high",
    signal: `${state.summary.unavailable}/${state.summary.total} tablas NUXERA pendientes o no visibles.`,
    nextAction: state.ready
      ? "Mantener verificacion RLS controlada antes de produccion."
      : "Verificar SQL/RLS en Supabase controlado antes de habilitar writes productivos.",
  };
}

function buildBackendReadinessActions(state) {
  return state.signals
    .filter((signal) => !signal.ready)
    .map((signal) => ({
      id: `backend-readiness-${signal.id}`,
      domain: "Backend readiness",
      priority: signal.id === "workspace-states" ? "critical-path" : "review",
      status: "backend-preflight-open",
      owner: signal.owner || "Platform",
      action: `Verificar ${signal.table} en Supabase controlado antes de depender de ${signal.requiredFor.join(", ") || "NUXERA backend"}.`,
      source: "backend-readiness-preflight",
      guardrail: "Accion humana; la consola no aplica SQL ni cambia RLS.",
    }));
}
function buildRlsVerificationMatrix(state) {
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
      "Matriz local de verificacion; no ejecuta consultas Supabase.",
      "Cada escenario requiere usuarios controlados antes de produccion.",
      "Denegaciones deben evitar filtrar existencia de filas restringidas.",
    ],
  };
}
function buildBackendReadinessHandoff(state, actions) {
  const unavailableSignals = state.signals.filter((signal) => !signal.ready);

  return {
    id: "nuxera-backend-readiness-handoff",
    status: state.ready ? "ready-for-rls-verification" : "blocked-by-backend-readiness",
    generatedFor: "controlled-supabase-verification",
    summary: state.summary,
    unavailableTables: unavailableSignals.map((signal) => ({
      table: signal.table,
      owner: signal.owner,
      requiredFor: signal.requiredFor,
      status: signal.status,
    })),
    nextActions: actions.map((action) => action.action),
    guardrails: [
      ...state.guardrails,
      "Handoff local; no aplica SQL, no cambia RLS y no sustituye pruebas con identidades reales.",
    ],
  };
}
function mergeBackendReadinessIntoAuditPackage(auditPackage, handoff) {
  const existingSignals = asArray(auditPackage?.signals).filter((signal) => signal.id !== "backend-readiness");
  const existingActions = asArray(auditPackage?.nextActions).filter(
    (action) => !String(action).startsWith("Verificar backend readiness:")
  );

  return {
    ...auditPackage,
    scope: [...new Set([...asArray(auditPackage?.scope), "backend-readiness"])],
    signals: [
      ...existingSignals,
      {
        id: "backend-readiness",
        label: "Readiness backend",
        value: `${handoff.summary.readiness}%`,
        status: handoff.status,
      },
    ],
    nextActions: [
      ...existingActions,
      ...handoff.nextActions.map((action) => `Verificar backend readiness: ${action}`),
    ],
    guardrails: [
      ...asArray(auditPackage?.guardrails),
      "Backend readiness en audit package es evidencia local; no aplica SQL ni valida RLS por si sola.",
    ],
  };
}

export function mergeBackendReadinessWithConsole(consoleState, readinessState = LOCAL_BACKEND_READINESS_STATE) {
  const state = readinessState || LOCAL_BACKEND_READINESS_STATE;
  const readinessHealthSignal = buildBackendReadinessHealthSignal(state);
  const readinessActions = buildBackendReadinessActions(state);
  const rlsVerificationMatrix = buildRlsVerificationMatrix(state);
  const readinessHandoff = buildBackendReadinessHandoff(state, readinessActions);
  const auditPackage = mergeBackendReadinessIntoAuditPackage(consoleState.auditPackage, readinessHandoff);
  const adminHealthSignals = [
    ...consoleState.adminHealthSignals.filter((signal) => signal.id !== readinessHealthSignal.id),
    readinessHealthSignal,
  ];
  const adminActionQueue = [
    ...readinessActions,
    ...consoleState.adminActionQueue.filter((item) => !item.id.startsWith("backend-readiness-")),
  ];

  return {
    ...consoleState,
    backendReadiness: state,
    backendReadinessHandoff: readinessHandoff,
    rlsVerificationMatrix,
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
        ? "Backend readiness visible; RLS aun requiere verificacion controlada."
        : "Backend readiness pendiente; mantener writes productivos bloqueados.",
    ],
  };
}

export function useBackendReadiness({ enabled = true } = {}) {
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
      label: "Cargando readiness backend NUXERA",
      loading: true,
    });

    nuxeraBackendReadinessAPI.getReadiness()
      .then(({ data }) => {
        if (!active) return;
        setReadinessState(normalizeNuxeraBackendReadinessResponse(data));
      })
      .catch((err) => {
        if (!active) return;
        warn("NUXERA", "No se pudo cargar backend readiness; usando fallback local", err);
        setReadinessState({
          ...LOCAL_BACKEND_READINESS_STATE,
          source: "remote-error-fallback",
          label: "Fallback readiness local",
          error: "nuxera-backend-readiness-unavailable",
        });
      });

    return () => {
      active = false;
    };
  }, [enabled]);

  return readinessState;
}