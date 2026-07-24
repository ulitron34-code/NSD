import { useEffect, useState } from "react";
import { nuxeraCaseTimelineAPI } from "../../services/api";
import { warn } from "../../utils/logger";

const LOCAL_CASE_TIMELINE = Object.freeze({
  source: "local-fallback",
  status: "timeline-local-empty",
  loading: false,
  error: null,
  orderId: null,
  workspaceRole: null,
  order: null,
  summary: {
    total: 0,
    blockers: 0,
    criticalBlockers: 0,
    evidence: 0,
    notifications: 0,
    assignments: 0,
    auditEvents: 0,
    openInformationRequests: 0,
    failedNotifications: 0,
    suppressedNotifications: 0,
    slaOverdue: 0,
    slaDueSoon: 0,
    availableSources: 0,
    unavailableSources: 0,
    latestEventAt: null,
    byType: {},
    typeFilters: [],
    phases: [],
    health: {
      status: "needs-evidence",
      severity: "info",
      label: "Sin expediente real",
      signals: [],
      guardrails: [],
    },
  },
  sources: [],
  events: [],
  guardrails: ["Timeline local vacio; no inventa eventos ni lee evidencia sensible."],
});

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeHealth(health = {}) {
  const data = asObject(health);
  return {
    status: data.status || "needs-evidence",
    severity: data.severity || "info",
    label: data.label || "Sin salud operativa",
    signals: asArray(data.signals).map((signal) => ({
      id: signal.id || signal.label || "signal",
      status: signal.status || "observed",
      label: signal.label || "Senal",
      value: String(signal.value ?? "0"),
      detail: signal.detail || "Sin detalle disponible.",
    })),
    guardrails: asArray(data.guardrails),
  };
}

function normalizeSummary(summary = {}) {
  const data = asObject(summary);
  const byType = asObject(data.byType);
  return {
    ...LOCAL_CASE_TIMELINE.summary,
    ...data,
    total: Number(data.total || 0),
    blockers: Number(data.blockers || 0),
    criticalBlockers: Number(data.criticalBlockers || 0),
    evidence: Number(data.evidence ?? byType.evidence ?? 0),
    notifications: Number(data.notifications ?? byType.notification ?? 0),
    assignments: Number(data.assignments ?? byType.assignment ?? 0),
    auditEvents: Number(data.auditEvents ?? byType.audit ?? 0),
    openInformationRequests: Number(data.openInformationRequests || 0),
    failedNotifications: Number(data.failedNotifications || 0),
    suppressedNotifications: Number(data.suppressedNotifications || 0),
    slaOverdue: Number(data.slaOverdue || 0),
    slaDueSoon: Number(data.slaDueSoon || 0),
    availableSources: Number(data.availableSources || 0),
    unavailableSources: Number(data.unavailableSources || 0),
    byType,
    typeFilters: asArray(data.typeFilters).map((filter) => ({
      id: filter.id || "event",
      label: filter.label || filter.id || "Evento",
      count: Number(filter.count || 0),
      active: Boolean(filter.active),
    })),
    phases: asArray(data.phases).map((phase) => ({
      id: phase.id || "phase",
      label: phase.label || phase.id || "Fase",
      count: Number(phase.count || 0),
      blockers: Number(phase.blockers || 0),
      latestEventAt: phase.latestEventAt || null,
      status: phase.status || "empty",
    })),
    health: normalizeHealth(data.health),
  };
}

function normalizeEvent(event = {}) {
  const data = asObject(event);
  return {
    id: data.id || `${data.source || "timeline"}:${data.type || "event"}:${data.timestamp || Math.random()}`,
    type: data.type || "event",
    phase: data.phase || "intake",
    source: data.source || "unknown",
    title: data.title || "Evento NUXERA",
    description: data.description || "Evento operacional read-only.",
    timestamp: data.timestamp || null,
    status: data.status || "observed",
    severity: data.severity || "info",
    actorRole: data.actorRole || "system",
    metadata: asObject(data.metadata),
    sensitiveContentExcluded: data.sensitiveContentExcluded !== false,
    requiresHumanReview: Boolean(data.requiresHumanReview),
  };
}

export function normalizeNuxeraCaseTimelineResponse(response) {
  const timeline = response?.timeline || response || null;

  if (!timeline || typeof timeline !== "object") {
    return {
      ...LOCAL_CASE_TIMELINE,
      error: "nuxera-case-timeline-missing",
    };
  }

  return {
    ...LOCAL_CASE_TIMELINE,
    ...timeline,
    source: "remote",
    loading: false,
    error: null,
    orderId: timeline.orderId || response?.orderId || null,
    workspaceRole: timeline.workspaceRole || response?.workspaceRole || null,
    order: asObject(timeline.order),
    summary: normalizeSummary(timeline.summary),
    sources: asArray(timeline.sources),
    events: asArray(timeline.events).map(normalizeEvent),
    guardrails: [
      ...asArray(timeline.guardrails),
      ...asArray(response?.guardrails),
    ].filter(Boolean),
  };
}

function fetchTimeline(role, orderId) {
  if (role === "grantor") return nuxeraCaseTimelineAPI.getGrantorTimeline(orderId);
  if (role === "admin") return nuxeraCaseTimelineAPI.getAdminTimeline(orderId);
  return nuxeraCaseTimelineAPI.getApplicantTimeline(orderId);
}

export function useNuxeraCaseTimeline(orderId, { enabled = true, role = "applicant" } = {}) {
  const [state, setState] = useState(LOCAL_CASE_TIMELINE);

  useEffect(() => {
    if (!enabled || !orderId) {
      setState(LOCAL_CASE_TIMELINE);
      return undefined;
    }

    let active = true;
    setState({
      ...LOCAL_CASE_TIMELINE,
      source: "remote-loading",
      status: "timeline-loading",
      loading: true,
      orderId,
      workspaceRole: role,
    });

    fetchTimeline(role, orderId)
      .then(({ data }) => {
        if (!active) return;
        setState(normalizeNuxeraCaseTimelineResponse(data));
      })
      .catch((error) => {
        if (!active) return;
        warn("NUXERA", "Case timeline unavailable", error?.message || error);
        setState({
          ...LOCAL_CASE_TIMELINE,
          source: "remote-error",
          status: "timeline-unavailable",
          loading: false,
          error: error?.response?.data?.code || error?.message || "nuxera-case-timeline-unavailable",
          orderId,
          workspaceRole: role,
        });
      });

    return () => {
      active = false;
    };
  }, [enabled, orderId, role]);

  return state;
}
