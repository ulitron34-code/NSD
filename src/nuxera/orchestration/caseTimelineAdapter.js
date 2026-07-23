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
    evidence: 0,
    notifications: 0,
    assignments: 0,
    auditEvents: 0,
    openInformationRequests: 0,
    availableSources: 0,
    unavailableSources: 0,
    latestEventAt: null,
    byType: {},
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

function normalizeSummary(summary = {}) {
  const data = asObject(summary);
  return {
    ...LOCAL_CASE_TIMELINE.summary,
    ...data,
    total: Number(data.total || 0),
    blockers: Number(data.blockers || 0),
    evidence: Number(data.evidence || 0),
    notifications: Number(data.notifications || 0),
    assignments: Number(data.assignments || 0),
    auditEvents: Number(data.auditEvents || 0),
    openInformationRequests: Number(data.openInformationRequests || 0),
    availableSources: Number(data.availableSources || 0),
    unavailableSources: Number(data.unavailableSources || 0),
    byType: asObject(data.byType),
  };
}

function normalizeEvent(event = {}) {
  const data = asObject(event);
  return {
    id: data.id || `${data.source || "timeline"}:${data.type || "event"}:${data.timestamp || Math.random()}`,
    type: data.type || "event",
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
