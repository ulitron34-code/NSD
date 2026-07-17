import { useEffect, useState } from "react";
import { nuxeraAdminControlsAPI } from "../../services/api";
import { warn } from "../../utils/logger";

const LOCAL_ADMIN_CONTROLS_STATE = Object.freeze({
  source: "local-fallback",
  label: "Controles locales",
  status: "read-only-local",
  persisted: false,
  loading: false,
  error: null,
  controls: [],
  guardrails: ["Controles locales read-only; no hay nuxera_admin_controls persistidos cargados."],
});

const TYPE_LABELS = Object.freeze({
  release_gate: "Release gate",
  incident: "Incidente",
  readiness: "Readiness",
  policy: "Politica",
});

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeControl(control) {
  const payload = asObject(control.payload);

  return {
    id: control.id,
    controlType: control.controlType || control.control_type || "policy",
    typeLabel: TYPE_LABELS[control.controlType || control.control_type] || "Control",
    scope: control.scope || "global",
    status: control.status || "watch",
    severity: control.severity || null,
    label: payload.label || control.label || control.id || "Control NUXERA",
    detail: payload.requirement || payload.signal || payload.response || payload.detail || "Control NUXERA read-only.",
    payload,
    guardrails: asArray(control.guardrails).length ? asArray(control.guardrails) : [
      "Admin control read-only; no activa automatizaciones ni permisos.",
    ],
    remoteAdminControl: true,
    createdAt: control.createdAt || control.created_at || null,
    updatedAt: control.updatedAt || control.updated_at || null,
  };
}

function summarizeControls(controls) {
  return {
    total: controls.length,
    active: controls.filter((control) => !String(control.status).includes("archived")).length,
    highSeverity: controls.filter((control) => ["high", "critical"].includes(control.severity)).length,
    byType: controls.reduce((acc, control) => ({
      ...acc,
      [control.controlType]: (acc[control.controlType] || 0) + 1,
    }), {}),
  };
}

export function normalizeNuxeraAdminControlsResponse(response) {
  const controlsPayload = response?.controls || response || null;

  if (!controlsPayload || typeof controlsPayload !== "object") {
    return {
      ...LOCAL_ADMIN_CONTROLS_STATE,
      error: "nuxera-admin-controls-missing",
    };
  }

  const controls = asArray(controlsPayload.controls).map(normalizeControl);
  const persisted = Boolean(controlsPayload.persisted && controls.length > 0);
  const guardrails = [
    ...asArray(controlsPayload.guardrails),
    ...asArray(response?.guardrails),
  ];

  return {
    source: persisted ? "remote-persisted" : "remote-default",
    label: persisted ? "Controles NUXERA persistidos" : "Controles NUXERA default",
    status: persisted ? "read-only-remote" : "read-only-remote-default",
    persisted,
    loading: false,
    error: null,
    controls,
    summary: summarizeControls(controls),
    guardrails: guardrails.length ? guardrails : LOCAL_ADMIN_CONTROLS_STATE.guardrails,
  };
}

export function mergeAdminControlsWithConsole(consoleState, adminControlsState = LOCAL_ADMIN_CONTROLS_STATE) {
  const state = adminControlsState || LOCAL_ADMIN_CONTROLS_STATE;

  return {
    ...consoleState,
    backendControls: state,
    summary: {
      ...consoleState.summary,
      backendControls: state.controls.length,
      backendHighSeverityControls: state.summary?.highSeverity || 0,
    },
    policies: [
      ...consoleState.policies,
      state.persisted
        ? "Admin controls persistidos visibles en modo read-only; no ejecutan cambios."
        : "Admin controls backend usa fallback local/default; no ejecuta cambios.",
    ],
  };
}

export function useAdminControls({ enabled = true } = {}) {
  const [controlsState, setControlsState] = useState(LOCAL_ADMIN_CONTROLS_STATE);

  useEffect(() => {
    if (!enabled) {
      setControlsState(LOCAL_ADMIN_CONTROLS_STATE);
      return undefined;
    }

    let active = true;
    setControlsState({
      ...LOCAL_ADMIN_CONTROLS_STATE,
      source: "remote-loading",
      label: "Cargando admin controls NUXERA",
      loading: true,
    });

    nuxeraAdminControlsAPI.getControls()
      .then(({ data }) => {
        if (!active) return;
        setControlsState(normalizeNuxeraAdminControlsResponse(data));
      })
      .catch((err) => {
        if (!active) return;
        warn("NUXERA", "No se pudieron cargar admin controls; usando fallback local", err);
        setControlsState({
          ...LOCAL_ADMIN_CONTROLS_STATE,
          source: "remote-error-fallback",
          label: "Fallback local",
          error: "nuxera-admin-controls-unavailable",
        });
      });

    return () => {
      active = false;
    };
  }, [enabled]);

  return controlsState;
}