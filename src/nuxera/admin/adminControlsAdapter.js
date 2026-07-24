import { useEffect, useState } from "react";
import { nuxeraAdminControlsAPI } from "../../services/api";
import { warn } from "../../utils/logger";
import { pickLang } from "../../data/requisitosMinimos";

const LOCAL_ADMIN_CONTROLS_STATE = Object.freeze({
  source: "local-fallback",
  label: "Local controls",
  status: "read-only-local",
  persisted: false,
  loading: false,
  error: null,
  controls: [],
  guardrails: ["Local, read-only controls; no persisted nuxera_admin_controls loaded."],
});

function getTypeLabels(language) {
  return {
    release_gate: "Release gate",
    incident: pickLang({ es: "Incidente", en: "Incident" }, language),
    readiness: "Readiness",
    policy: pickLang({ es: "Politica", en: "Policy" }, language),
  };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeControl(control, language) {
  const payload = asObject(control.payload);

  return {
    id: control.id,
    controlType: control.controlType || control.control_type || "policy",
    typeLabel: getTypeLabels(language)[control.controlType || control.control_type] || "Control",
    scope: control.scope || "global",
    status: control.status || "watch",
    severity: control.severity || null,
    label: payload.label || control.label || control.id || "NUXERA control",
    detail: payload.requirement || payload.signal || payload.response || payload.detail || "Read-only NUXERA control.",
    payload,
    guardrails: asArray(control.guardrails).length ? asArray(control.guardrails) : [
      pickLang({ es: "Admin control read-only; no activa automatizaciones ni permisos.", en: "Read-only admin control; it does not activate automation or permissions." }, language),
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

export function normalizeNuxeraAdminControlsResponse(response, language = "es") {
  const controlsPayload = response?.controls || response || null;

  if (!controlsPayload || typeof controlsPayload !== "object") {
    return {
      ...LOCAL_ADMIN_CONTROLS_STATE,
      error: "nuxera-admin-controls-missing",
    };
  }

  const controls = asArray(controlsPayload.controls).map((control) => normalizeControl(control, language));
  const persisted = Boolean(controlsPayload.persisted && controls.length > 0);
  const guardrails = [
    ...asArray(controlsPayload.guardrails),
    ...asArray(response?.guardrails),
  ];

  return {
    source: persisted ? "remote-persisted" : "remote-default",
    label: persisted
      ? pickLang({ es: "Controles NUXERA persistidos", en: "Persisted NUXERA controls" }, language)
      : pickLang({ es: "Controles NUXERA default", en: "Default NUXERA controls" }, language),
    status: persisted ? "read-only-remote" : "read-only-remote-default",
    persisted,
    loading: false,
    error: null,
    controls,
    summary: summarizeControls(controls),
    guardrails: guardrails.length ? guardrails : LOCAL_ADMIN_CONTROLS_STATE.guardrails,
  };
}

export function mergeAdminControlsWithConsole(consoleState, adminControlsState = LOCAL_ADMIN_CONTROLS_STATE, language = "es") {
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
        ? pickLang({ es: "Admin controls persistidos visibles en modo read-only; no ejecutan cambios.", en: "Persisted admin controls visible in read-only mode; they do not execute changes." }, language)
        : pickLang({ es: "Admin controls backend usa fallback local/default; no ejecuta cambios.", en: "Admin controls backend uses a local/default fallback; it does not execute changes." }, language),
    ],
  };
}

export function useAdminControls({ enabled = true, language = "es" } = {}) {
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
      label: pickLang({ es: "Cargando admin controls NUXERA", en: "Loading NUXERA admin controls" }, language),
      loading: true,
    });

    nuxeraAdminControlsAPI.getControls()
      .then(({ data }) => {
        if (!active) return;
        setControlsState(normalizeNuxeraAdminControlsResponse(data, language));
      })
      .catch((err) => {
        if (!active) return;
        warn("NUXERA", "No se pudieron cargar admin controls; usando fallback local", err);
        setControlsState({
          ...LOCAL_ADMIN_CONTROLS_STATE,
          source: "remote-error-fallback",
          label: pickLang({ es: "Fallback local", en: "Local fallback" }, language),
          error: "nuxera-admin-controls-unavailable",
        });
      });

    return () => {
      active = false;
    };
  }, [enabled, language]);

  return controlsState;
}