import { useEffect, useState } from "react";
import { nuxeraAdminGrantorCasesAPI, nuxeraCaseAssignmentsAPI } from "../../services/api";
import { warn } from "../../utils/logger";
import { pickLang } from "../../data/requisitosMinimos";
import { buildGrantorCaseQueueFromPipeline, getGrantorDocumentSummary } from "../grantor/caseQueue";

const LOCAL_ADMIN_GRANTOR_CASES_STATE = Object.freeze({
  source: "local-fallback",
  status: "grantor-cases-unverified",
  loading: false,
  error: null,
  pipeline: [],
  guardrails: ["Local fallback; no confirma pipeline real de otorgantes en todo el sistema."],
});

const LOCAL_CASE_ASSIGNMENT_PREVIEW_STATE = Object.freeze({
  source: "local-fallback",
  status: "case-assignment-preview-unverified",
  loading: false,
  error: null,
  writeEnabled: false,
  persisted: false,
  assignment: null,
  guardrails: ["Local fallback; no crea ni reasigna expedientes."],
});

const LOCAL_CASE_ASSIGNMENT_HISTORY_STATE = Object.freeze({
  source: "local-fallback",
  status: "case-assignment-history-unverified",
  loading: false,
  error: null,
  tableAvailable: false,
  assignments: [],
  summary: { total: 0, open: 0, reassigned: 0, overdue: 0, dueSoon: 0, onTrack: 0 },
  guardrails: ["Local fallback; no confirma historial real de asignaciones."],
});

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function normalizeNuxeraAdminGrantorCasesResponse(response) {
  const payload = response && typeof response === "object" ? response : null;

  if (!payload || !Array.isArray(payload.pipeline)) {
    return {
      ...LOCAL_ADMIN_GRANTOR_CASES_STATE,
      error: "nuxera-admin-grantor-cases-missing",
    };
  }

  return {
    ...LOCAL_ADMIN_GRANTOR_CASES_STATE,
    source: "remote",
    status: "grantor-cases-ready",
    loading: false,
    error: null,
    pipeline: payload.pipeline,
    guardrails: asArray(payload.guardrails).filter(Boolean),
  };
}

export function normalizeNuxeraCaseAssignmentHistoryResponse(response) {
  const payload = response && typeof response === "object" ? response : null;

  if (!payload || !Array.isArray(payload.assignments)) {
    return {
      ...LOCAL_CASE_ASSIGNMENT_HISTORY_STATE,
      error: "nuxera-case-assignment-history-missing",
    };
  }

  return {
    ...LOCAL_CASE_ASSIGNMENT_HISTORY_STATE,
    source: payload.source || "remote",
    status: payload.tableAvailable === false ? "case-assignment-history-unavailable" : "case-assignment-history-ready",
    error: null,
    tableAvailable: payload.tableAvailable !== false,
    assignments: payload.assignments,
    summary: { ...LOCAL_CASE_ASSIGNMENT_HISTORY_STATE.summary, ...(payload.summary || {}) },
    guardrails: asArray(payload.guardrails).filter(Boolean),
  };
}
export function normalizeNuxeraCaseAssignmentPreviewResponse(response) {
  const payload = response && typeof response === "object" ? response : null;
  const assignmentEnvelope = payload?.assignment && typeof payload.assignment === "object" ? payload.assignment : null;

  if (!payload || !assignmentEnvelope) {
    return {
      ...LOCAL_CASE_ASSIGNMENT_PREVIEW_STATE,
      error: "nuxera-case-assignment-preview-missing",
    };
  }

  const persisted = Boolean(assignmentEnvelope.persisted);
  const writeEnabled = Boolean(payload.writeEnabled || assignmentEnvelope.writeEnabled);

  return {
    ...LOCAL_CASE_ASSIGNMENT_PREVIEW_STATE,
    source: persisted ? "remote-persisted" : "remote-preview",
    status: assignmentEnvelope.status || (persisted ? "case-assignment-persisted" : "case-assignment-preview"),
    error: null,
    writeEnabled,
    persisted,
    assignment: assignmentEnvelope.assignment || null,
    guardrails: [
      ...asArray(payload.guardrails),
      ...asArray(assignmentEnvelope.guardrails),
    ].filter(Boolean),
  };
}

export async function previewNuxeraCaseAssignment(payload = {}) {
  try {
    const { data } = await nuxeraCaseAssignmentsAPI.preview(payload);
    return normalizeNuxeraCaseAssignmentPreviewResponse(data);
  } catch (error) {
    warn("NUXERA", "Case assignment preview unavailable", error?.message || error);
    return {
      ...LOCAL_CASE_ASSIGNMENT_PREVIEW_STATE,
      loading: false,
      error: error?.response?.data?.code || error?.response?.data?.error || error?.message || "nuxera-case-assignment-preview-unavailable",
    };
  }
}

export function mergeGrantorCasesWithConsole(consoleState, grantorCasesState = LOCAL_ADMIN_GRANTOR_CASES_STATE, language = "es") {
  const state = { ...LOCAL_ADMIN_GRANTOR_CASES_STATE, ...(grantorCasesState || {}) };

  if (state.source !== "remote" || !state.pipeline.length) {
    return {
      ...consoleState,
      policies: [
        ...consoleState.policies,
        pickLang({ es: "Vista admin de expedientes otorgante usa fallback local/demo; no hay pipeline real disponible todavia.", en: "Admin grantor-case view uses a local/demo fallback; no real pipeline is available yet." }, language),
      ],
    };
  }

  const realQueue = buildGrantorCaseQueueFromPipeline(state.pipeline, language);
  const grantorDocumentReadiness = realQueue.cases.map((caseItem) => {
    const documentSummary = getGrantorDocumentSummary(caseItem.id, realQueue, language);

    return {
      caseId: caseItem.id,
      label: caseItem.name,
      applicant: caseItem.applicant,
      status: documentSummary.status,
      visible: documentSummary.summary.visible,
      pending: documentSummary.summary.pending,
      total: documentSummary.summary.total,
      nextAction: documentSummary.nextAction,
      policy: documentSummary.guardrails[0],
    };
  });

  return {
    ...consoleState,
    grantorDocumentReadiness,
    summary: {
      ...consoleState.summary,
      grantorCasesSource: "remote-authorized-pipeline",
      grantorCasesTotal: realQueue.cases.length,
    },
    policies: [
      ...consoleState.policies,
      pickLang({ es: `Vista admin de expedientes otorgante usa pipeline real (${realQueue.cases.length} casos); no aprueba credito ni cambia permisos de data room.`, en: `Admin grantor-case view uses the real pipeline (${realQueue.cases.length} cases); it does not approve credit or change data-room permissions.` }, language),
      ...asArray(state.guardrails),
    ],
  };
}

export function useCaseAssignmentHistory({ enabled = true, limit = 50 } = {}) {
  const [state, setState] = useState(LOCAL_CASE_ASSIGNMENT_HISTORY_STATE);

  useEffect(() => {
    let alive = true;

    if (!enabled) {
      setState(LOCAL_CASE_ASSIGNMENT_HISTORY_STATE);
      return () => { alive = false; };
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    nuxeraCaseAssignmentsAPI.list({ limit })
      .then(({ data }) => {
        if (!alive) return;
        setState(normalizeNuxeraCaseAssignmentHistoryResponse(data));
      })
      .catch((error) => {
        warn("NUXERA", "Case assignment history unavailable", error?.message || error);
        if (!alive) return;
        setState({
          ...LOCAL_CASE_ASSIGNMENT_HISTORY_STATE,
          loading: false,
          error: error?.response?.data?.code || error?.response?.data?.error || error?.message || "nuxera-case-assignment-history-unavailable",
        });
      });

    return () => { alive = false; };
  }, [enabled, limit]);

  return state;
}

export function useAdminGrantorCases({ enabled = true, language = "es" } = {}) {
  const [state, setState] = useState(LOCAL_ADMIN_GRANTOR_CASES_STATE);

  useEffect(() => {
    let alive = true;

    if (!enabled) {
      setState(LOCAL_ADMIN_GRANTOR_CASES_STATE);
      return () => { alive = false; };
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    nuxeraAdminGrantorCasesAPI.getCases()
      .then(({ data }) => {
        if (!alive) return;
        setState(normalizeNuxeraAdminGrantorCasesResponse(data));
      })
      .catch((error) => {
        warn("NUXERA", "Admin grantor cases unavailable", error?.message || error);
        if (!alive) return;
        setState({
          ...LOCAL_ADMIN_GRANTOR_CASES_STATE,
          loading: false,
          error: error?.response?.data?.code || error?.message || "nuxera-admin-grantor-cases-unavailable",
        });
      });

    return () => { alive = false; };
  }, [enabled, language]);

  return state;
}
