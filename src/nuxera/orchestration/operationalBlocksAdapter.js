import { useEffect, useState } from "react";
import { nuxeraCaseTimelineAPI, nuxeraDecisionPackageAPI, nuxeraJurisdictionIntelligenceAPI, nuxeraRiskOrchestrationAPI } from "../../services/api";
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

const LOCAL_JURISDICTION_EVIDENCE = Object.freeze({
  source: "local-fallback",
  status: "jurisdiction-evidence-unavailable",
  loading: false,
  error: null,
  title: "Regulatory & Jurisdiction Evidence",
  country: "",
  countryName: "",
  region: "",
  riskTier: "unknown",
  riskLabel: "Sin perfil real",
  territory: { label: "", risk: "unknown", focus: "", signals: [] },
  coverage: { reviewed: 0, unavailable: 0, conditional: 0, mode: "Sin cobertura remota" },
  countryBrief: { economy: "", politics: "", social: "", indicators: [] },
  sourceMap: [],
  findings: [],
  conditionalSources: [],
  humanReviewChecklist: [],
  scoreImpacts: [],
  providerPlan: { publicApis: [], privateOrAgreement: [], runtimePolicy: "disabled" },
  guardrails: ["Jurisdiction evidence local vacio; no consulta proveedores externos ni aprueba decisiones."],
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


const LOCAL_CASE_EVENTS_PERSISTENCE_PLAN = Object.freeze({
  source: "local-fallback",
  status: "case-events-persistence-plan-unavailable",
  loading: false,
  error: null,
  table: "nuxera_case_events",
  mode: "dry-run-only",
  summary: { totalProjected: 0, insertReady: 0, blocked: 0, warnings: 0, critical: 0, humanReviewRequired: 0, uniqueDedupeKeys: 0 },
  candidates: [],
  requiredGates: [],
  guardrails: ["Persistence plan local vacio; no crea eventos persistidos."],
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

function normalizeJurisdictionEvidence(response, fallback = LOCAL_JURISDICTION_EVIDENCE) {
  const seed = fallback && typeof fallback === "object" ? fallback : LOCAL_JURISDICTION_EVIDENCE;
  const data = response?.jurisdictionEvidence || response || null;
  if (!data || typeof data !== "object") return { ...seed, error: "nuxera-jurisdiction-evidence-missing" };
  return {
    ...seed,
    ...data,
    source: "remote",
    loading: false,
    error: null,
    territory: { ...asObject(seed.territory), ...asObject(data.territory) },
    coverage: { ...asObject(seed.coverage), ...asObject(data.coverage) },
    countryBrief: { ...asObject(seed.countryBrief), ...asObject(data.countryBrief), indicators: asArray(data.countryBrief?.indicators) },
    sourceMap: asArray(data.sourceMap),
    findings: asArray(data.findings),
    conditionalSources: asArray(data.conditionalSources),
    humanReviewChecklist: asArray(data.humanReviewChecklist),
    scoreImpacts: asArray(data.scoreImpacts),
    providerPlan: { ...asObject(seed.providerPlan), ...asObject(data.providerPlan) },
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


function normalizeCaseEventsPersistencePlan(response) {
  const data = response?.persistencePlan || response || null;
  if (!data || typeof data !== "object") return { ...LOCAL_CASE_EVENTS_PERSISTENCE_PLAN, error: "nuxera-case-events-persistence-plan-missing" };
  return {
    ...LOCAL_CASE_EVENTS_PERSISTENCE_PLAN,
    ...data,
    source: "remote",
    loading: false,
    error: null,
    summary: { ...LOCAL_CASE_EVENTS_PERSISTENCE_PLAN.summary, ...asObject(data.summary) },
    candidates: asArray(data.candidates),
    requiredGates: asArray(data.requiredGates),
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

function fetchJurisdictionEvidence(role, orderId, language) {
  if (role === "admin") return nuxeraJurisdictionIntelligenceAPI.getAdminJurisdictionEvidence(orderId, language);
  return nuxeraJurisdictionIntelligenceAPI.getGrantorJurisdictionEvidence(orderId, language);
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

export function useNuxeraJurisdictionEvidence(orderId, { enabled = true, role = "grantor", language = "es", fallback = null } = {}) {
  const seed = fallback && typeof fallback === "object" ? fallback : LOCAL_JURISDICTION_EVIDENCE;
  return useRemoteState({
    enabled: enabled && Boolean(orderId),
    seed,
    onLoad: () => fetchJurisdictionEvidence(role, orderId, language).then(({ data }) => ({ data: normalizeJurisdictionEvidence(data, seed) })),
    onErrorLabel: "Jurisdiction evidence unavailable",
    deps: [enabled, orderId, role, language, seed],
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


export function useNuxeraCaseEventsPersistencePlan(orderId, { enabled = true } = {}) {
  return useRemoteState({
    enabled: enabled && Boolean(orderId),
    seed: LOCAL_CASE_EVENTS_PERSISTENCE_PLAN,
    onLoad: () => nuxeraCaseTimelineAPI.getAdminCaseEventsPersistencePlan(orderId).then(({ data }) => ({ data: normalizeCaseEventsPersistencePlan(data) })),
    onErrorLabel: "Case events persistence plan unavailable",
    deps: [enabled, orderId],
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
