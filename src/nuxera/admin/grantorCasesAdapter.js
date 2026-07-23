import { useEffect, useState } from "react";
import { nuxeraAdminGrantorCasesAPI } from "../../services/api";
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
