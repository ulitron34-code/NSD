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

export function mergeBackendReadinessWithConsole(consoleState, readinessState = LOCAL_BACKEND_READINESS_STATE) {
  const state = readinessState || LOCAL_BACKEND_READINESS_STATE;

  return {
    ...consoleState,
    backendReadiness: state,
    summary: {
      ...consoleState.summary,
      backendReadiness: state.summary.readiness,
      backendReadinessUnavailable: state.summary.unavailable,
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