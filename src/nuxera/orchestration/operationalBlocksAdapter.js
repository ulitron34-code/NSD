import { useEffect, useState } from "react";
import { nuxeraCaseTimelineAPI, nuxeraDecisionPackageAPI, nuxeraRiskOrchestrationAPI } from "../../services/api";
import { warn } from "../../utils/logger";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

const LOCAL_DECISION_PACKAGE = Object.freeze({
  source: "local-fallback",
  status: "decision-package-unavailable",
  loading: false,
  error: null,
  summary: { findings: 0, sourceTraced: 0, weakReferences: 0, coverageMissing: 0, operationalBlockers: 0 },
  coverage: [],
  findings: [],
  gaps: [],
  questions: [],
  conditions: [],
  guardrails: ["Decision package local vacio; no inventa hallazgos ni decisiones."],
});

const LOCAL_RISK_PROFILE = Object.freeze({
  source: "local-fallback",
  status: "risk-profile-unavailable",
  loading: false,
  error: null,
  riskTier: "unknown",
  policyOutcome: { policy: "refer", automatedDecision: false, label: "Sin perfil real", reasons: [], blockedActions: [] },
  summary: { blockers: 0, evidenceLinks: 0, openInformationRequests: 0, failedNotifications: 0, slaOverdue: 0, sourceHealth: 0, totalSources: 0 },
  signals: [],
  sources: [],
  guardrails: ["Risk profile local vacio; no ejecuta proveedores ni decisiones."],
});

const LOCAL_CASE_EVENTS = Object.freeze({
  source: "local-fallback",
  status: "case-events-unavailable",
  loading: false,
  error: null,
  summary: { total: 0, warning: 0, critical: 0, humanReviewRequired: 0 },
  contract: null,
  events: [],
  guardrails: ["case_events local vacio; no crea eventos persistidos."],
});

const LOCAL_RISK_HEALTH = Object.freeze({
  source: "local-fallback",
  status: "risk-health-unavailable",
  loading: false,
  error: null,
  summary: { failedNotifications: 0, suppressedNotifications: 0, openAssignments: 0, overdueAssignments: 0, auditEvents: 0, availableSources: 0, unavailableSources: 0 },
  signals: [],
  sources: [],
  guardrails: ["Risk health local vacio; no consulta proveedores externos."],
});

function normalizeDecisionPackage(response) {
  const data = response?.decisionPackage || response?.evidenceCoverage || response || null;
  if (!data || typeof data !== "object") return { ...LOCAL_DECISION_PACKAGE, error: "nuxera-decision-package-missing" };
  return {
    ...LOCAL_DECISION_PACKAGE,
    ...data,
    source: "remote",
    loading: false,
    error: null,
    summary: { ...LOCAL_DECISION_PACKAGE.summary, ...asObject(data.summary) },
    coverage: asArray(data.coverage),
    findings: asArray(data.findings),
    gaps: asArray(data.gaps),
    questions: asArray(data.questions),
    conditions: asArray(data.conditions),
    guardrails: [...asArray(data.guardrails), ...asArray(response?.guardrails)].filter(Boolean),
  };
}

function normalizeRiskProfile(response) {
  const data = response?.riskProfile || response || null;
  if (!data || typeof data !== "object") return { ...LOCAL_RISK_PROFILE, error: "nuxera-risk-profile-missing" };
  return {
    ...LOCAL_RISK_PROFILE,
    ...data,
    source: "remote",
    loading: false,
    error: null,
    policyOutcome: { ...LOCAL_RISK_PROFILE.policyOutcome, ...asObject(data.policyOutcome) },
    summary: { ...LOCAL_RISK_PROFILE.summary, ...asObject(data.summary) },
    signals: asArray(data.signals),
    sources: asArray(data.sources),
    guardrails: [...asArray(data.guardrails), ...asArray(response?.guardrails)].filter(Boolean),
  };
}

function normalizeCaseEvents(response) {
  const data = response?.caseEvents || response || null;
  if (!data || typeof data !== "object") return { ...LOCAL_CASE_EVENTS, error: "nuxera-case-events-missing" };
  return {
    ...LOCAL_CASE_EVENTS,
    ...data,
    source: "remote",
    loading: false,
    error: null,
    summary: { ...LOCAL_CASE_EVENTS.summary, ...asObject(data.summary) },
    contract: asObject(data.contract),
    events: asArray(data.events),
    guardrails: [...asArray(data.guardrails), ...asArray(response?.guardrails)].filter(Boolean),
  };
}

function normalizeRiskHealth(response) {
  const data = response?.riskHealth || response || null;
  if (!data || typeof data !== "object") return { ...LOCAL_RISK_HEALTH, error: "nuxera-risk-health-missing" };
  return {
    ...LOCAL_RISK_HEALTH,
    ...data,
    source: "remote",
    loading: false,
    error: null,
    summary: { ...LOCAL_RISK_HEALTH.summary, ...asObject(data.summary) },
    signals: asArray(data.signals),
    sources: asArray(data.sources),
    guardrails: [...asArray(data.guardrails), ...asArray(response?.guardrails)].filter(Boolean),
  };
}

function fetchRiskProfile(role, orderId) {
  if (role === "grantor") return nuxeraRiskOrchestrationAPI.getGrantorRiskProfile(orderId);
  if (role === "admin") return nuxeraRiskOrchestrationAPI.getAdminRiskProfile(orderId);
  return nuxeraRiskOrchestrationAPI.getApplicantRiskProfile(orderId);
}

function fetchCaseEvents(role, orderId) {
  if (role === "grantor") return nuxeraCaseTimelineAPI.getGrantorCaseEvents(orderId);
  if (role === "admin") return nuxeraCaseTimelineAPI.getAdminCaseEvents(orderId);
  return nuxeraCaseTimelineAPI.getApplicantCaseEvents(orderId);
}

function useRemoteState({ enabled, seed, onLoad, onErrorLabel, deps }) {
  const [state, setState] = useState(seed);

  useEffect(() => {
    if (!enabled) {
      setState(seed);
      return undefined;
    }
    let active = true;
    setState({ ...seed, source: "remote-loading", loading: true });
    onLoad()
      .then(({ data }) => {
        if (active) setState(data);
      })
      .catch((error) => {
        if (!active) return;
        warn("NUXERA", onErrorLabel, error?.message || error);
        setState({ ...seed, source: "remote-error", loading: false, error: error?.response?.data?.code || error?.message || onErrorLabel });
      });
    return () => { active = false; };
  }, deps);

  return state;
}

export function useNuxeraDecisionPackage(orderId, { enabled = true } = {}) {
  return useRemoteState({
    enabled: enabled && Boolean(orderId),
    seed: LOCAL_DECISION_PACKAGE,
    onLoad: () => nuxeraDecisionPackageAPI.getGrantorDecisionPackage(orderId).then(({ data }) => ({ data: normalizeDecisionPackage(data) })),
    onErrorLabel: "Decision package unavailable",
    deps: [enabled, orderId],
  });
}

export function useNuxeraEvidenceCoverage(orderId, { enabled = true } = {}) {
  return useRemoteState({
    enabled: enabled && Boolean(orderId),
    seed: LOCAL_DECISION_PACKAGE,
    onLoad: () => nuxeraDecisionPackageAPI.getAdminEvidenceCoverage(orderId).then(({ data }) => ({ data: normalizeDecisionPackage(data) })),
    onErrorLabel: "Evidence coverage unavailable",
    deps: [enabled, orderId],
  });
}

export function useNuxeraRiskProfile(orderId, { enabled = true, role = "applicant" } = {}) {
  return useRemoteState({
    enabled: enabled && Boolean(orderId),
    seed: LOCAL_RISK_PROFILE,
    onLoad: () => fetchRiskProfile(role, orderId).then(({ data }) => ({ data: normalizeRiskProfile(data) })),
    onErrorLabel: "Risk profile unavailable",
    deps: [enabled, orderId, role],
  });
}

export function useNuxeraCaseEvents(orderId, { enabled = true, role = "applicant" } = {}) {
  return useRemoteState({
    enabled: enabled && Boolean(orderId),
    seed: LOCAL_CASE_EVENTS,
    onLoad: () => fetchCaseEvents(role, orderId).then(({ data }) => ({ data: normalizeCaseEvents(data) })),
    onErrorLabel: "Case events projection unavailable",
    deps: [enabled, orderId, role],
  });
}

export function useNuxeraRiskHealth({ enabled = true } = {}) {
  return useRemoteState({
    enabled,
    seed: LOCAL_RISK_HEALTH,
    onLoad: () => nuxeraRiskOrchestrationAPI.getAdminRiskHealth().then(({ data }) => ({ data: normalizeRiskHealth(data) })),
    onErrorLabel: "Risk health unavailable",
    deps: [enabled],
  });
}
