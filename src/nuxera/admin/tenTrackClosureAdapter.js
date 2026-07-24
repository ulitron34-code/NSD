import { useEffect, useState } from "react";
import { nuxeraTenTrackClosureAPI, nuxeraTenTrackExecutionBacklogAPI } from "../../services/api";
import { warn } from "../../utils/logger";

const LOCAL_TEN_TRACK_CLOSURE = Object.freeze({
  source: "local-fallback",
  status: "ten-track-closure-unavailable",
  loading: false,
  error: null,
  progressPercent: 0,
  summary: { total: 10, averageCompletion: 0, blocked: 10, ready: 0, blockers: 10, criticalPath: 3 },
  tracks: [],
  nextBigMove: "Cargar backend closure plan.",
  guardrails: ["Local fallback; no confirma cierre operativo ni habilita produccion."],
});

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeTrack(track) {
  const value = asObject(track);
  return {
    id: value.id || "nuxera-track",
    label: value.label || value.id || "NUXERA track",
    status: value.status || "unverified",
    domain: value.domain || "operations",
    percent: Number.isFinite(value.percent) ? value.percent : 0,
    implemented: asArray(value.implemented),
    blockers: asArray(value.blockers),
    nextActions: asArray(value.nextActions),
    readyForProduction: Boolean(value.readyForProduction),
  };
}

export function normalizeNuxeraTenTrackClosureResponse(response) {
  const payload = response?.closurePlan || response || null;

  if (!payload || typeof payload !== "object") {
    return {
      ...LOCAL_TEN_TRACK_CLOSURE,
      error: "nuxera-ten-track-closure-missing",
    };
  }

  const tracks = asArray(payload.tracks).map(normalizeTrack);
  return {
    ...LOCAL_TEN_TRACK_CLOSURE,
    ...payload,
    source: "remote-read-only",
    loading: false,
    error: null,
    progressPercent: Number(payload.progressPercent || payload.summary?.averageCompletion || 0),
    tracks,
    summary: {
      ...LOCAL_TEN_TRACK_CLOSURE.summary,
      ...asObject(payload.summary),
      total: tracks.length || payload.summary?.total || LOCAL_TEN_TRACK_CLOSURE.summary.total,
    },
    guardrails: [
      ...asArray(payload.guardrails),
      ...asArray(response?.guardrails),
    ].filter(Boolean),
  };
}

export function useTenTrackClosure({ enabled = true } = {}) {
  const [state, setState] = useState(LOCAL_TEN_TRACK_CLOSURE);

  useEffect(() => {
    let alive = true;

    if (!enabled) {
      setState(LOCAL_TEN_TRACK_CLOSURE);
      return () => { alive = false; };
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    nuxeraTenTrackClosureAPI.getPlan()
      .then(({ data }) => {
        if (!alive) return;
        setState(normalizeNuxeraTenTrackClosureResponse(data));
      })
      .catch((error) => {
        warn("NUXERA", "Ten-track closure unavailable", error?.message || error);
        if (!alive) return;
        setState({
          ...LOCAL_TEN_TRACK_CLOSURE,
          loading: false,
          error: error?.response?.data?.code || error?.message || "nuxera-ten-track-closure-unavailable",
        });
      });

    return () => { alive = false; };
  }, [enabled]);

  return state;
}

const LOCAL_TEN_TRACK_EXECUTION_BACKLOG = Object.freeze({
  source: "local-fallback",
  status: "ten-track-execution-backlog-unavailable",
  loading: false,
  error: null,
  summary: { total: 0, blocked: 0, criticalPath: 0, criticalBlocked: 0, highPriority: 0, averageCompletion: 0 },
  items: [],
  milestones: [],
  nextDecision: "Cargar backlog ejecutivo desde backend.",
  guardrails: ["Local fallback; no confirma ruta de ejecucion ni habilita produccion."],
});

function normalizeBacklogItem(item) {
  const value = asObject(item);
  return {
    id: value.id || value.sourceTrackId || "nuxera-backlog-item",
    order: Number.isFinite(value.order) ? value.order : 0,
    sourceTrackId: value.sourceTrackId || "unknown-track",
    label: value.label || value.sourceTrackId || "NUXERA backlog item",
    domain: value.domain || "operations",
    owner: value.owner || "admin-platform",
    priority: value.priority || "medium",
    status: value.status || "blocked",
    percent: Number.isFinite(value.percent) ? value.percent : 0,
    nextGate: value.nextGate || "controlled-review",
    action: value.action || "Revisar siguiente accion.",
    readyCriteria: asArray(value.readyCriteria),
    blocker: value.blocker || null,
    dependencies: asArray(value.dependencies),
  };
}

function normalizeMilestone(milestone) {
  const value = asObject(milestone);
  return {
    id: value.id || "nuxera-milestone",
    label: value.label || value.id || "NUXERA milestone",
    status: value.status || "blocked",
    items: asArray(value.items),
    outcome: value.outcome || "Pendiente de revision.",
  };
}

export function normalizeNuxeraTenTrackExecutionBacklogResponse(response) {
  const payload = response?.executionBacklog || response || null;

  if (!payload || typeof payload !== "object") {
    return {
      ...LOCAL_TEN_TRACK_EXECUTION_BACKLOG,
      error: "nuxera-ten-track-execution-backlog-missing",
    };
  }

  const items = asArray(payload.items).map(normalizeBacklogItem);
  return {
    ...LOCAL_TEN_TRACK_EXECUTION_BACKLOG,
    ...payload,
    source: "remote-read-only",
    loading: false,
    error: null,
    items,
    milestones: asArray(payload.milestones).map(normalizeMilestone),
    summary: {
      ...LOCAL_TEN_TRACK_EXECUTION_BACKLOG.summary,
      ...asObject(payload.summary),
      total: items.length || payload.summary?.total || 0,
    },
    guardrails: [
      ...asArray(payload.guardrails),
      ...asArray(response?.guardrails),
    ].filter(Boolean),
  };
}

export function useTenTrackExecutionBacklog({ enabled = true } = {}) {
  const [state, setState] = useState(LOCAL_TEN_TRACK_EXECUTION_BACKLOG);

  useEffect(() => {
    let alive = true;

    if (!enabled) {
      setState(LOCAL_TEN_TRACK_EXECUTION_BACKLOG);
      return () => { alive = false; };
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    nuxeraTenTrackExecutionBacklogAPI.getBacklog()
      .then(({ data }) => {
        if (!alive) return;
        setState(normalizeNuxeraTenTrackExecutionBacklogResponse(data));
      })
      .catch((error) => {
        warn("NUXERA", "Ten-track execution backlog unavailable", error?.message || error);
        if (!alive) return;
        setState({
          ...LOCAL_TEN_TRACK_EXECUTION_BACKLOG,
          loading: false,
          error: error?.response?.data?.code || error?.message || "nuxera-ten-track-execution-backlog-unavailable",
        });
      });

    return () => { alive = false; };
  }, [enabled]);

  return state;
}
