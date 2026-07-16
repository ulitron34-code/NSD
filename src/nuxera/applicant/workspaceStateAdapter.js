import { useEffect, useState } from "react";
import { nuxeraWorkspaceStateAPI } from "../../services/api";
import { warn } from "../../utils/logger";

const LOCAL_FALLBACK_STATE = Object.freeze({
  source: "local-fallback",
  label: "Checklist local",
  persisted: false,
  status: "local",
  version: 0,
  loading: false,
  error: null,
  completedItemIds: [],
  guardrails: ["Checklist local de preparacion; no hay estado NUXERA persistido cargado."],
});

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function getChecklistState(response) {
  return response?.states?.checklist || response?.state || null;
}

export function normalizeNuxeraApplicantChecklistState(response) {
  const state = getChecklistState(response);

  if (!state || state.surface !== "checklist") {
    return {
      ...LOCAL_FALLBACK_STATE,
      error: "nuxera-checklist-state-missing",
    };
  }

  const payload = state.payload && typeof state.payload === "object" && !Array.isArray(state.payload)
    ? state.payload
    : {};
  const completedItemIds = asArray(payload.completedItemIds).filter(Boolean);
  const persisted = Boolean(state.persisted);

  return {
    source: persisted ? "remote-persisted" : "remote-default",
    label: persisted ? "Estado NUXERA persistido" : "Estado NUXERA sin persistencia",
    persisted,
    status: state.status || "draft",
    version: Number(state.version || 0),
    loading: false,
    error: null,
    payload,
    completedItemIds,
    guardrails: asArray(state.guardrails).length ? state.guardrails : asArray(response?.guardrails),
    updatedAt: state.updatedAt || null,
    orderId: state.orderId || response?.orderId || null,
  };
}

function applyCompletedItemIds(requirement, completedItemIds) {
  if (!completedItemIds.includes(requirement.id)) return requirement;
  return {
    ...requirement,
    status: "ready",
    statusLabel: "Listo",
    persistedByNuxera: true,
  };
}

function recalculateSummary(categories) {
  const requirements = categories.flatMap((category) => category.items);
  const missing = requirements.filter((requirement) => requirement.status === "missing");
  const criticalMissing = missing.filter((requirement) => requirement.critical);

  return {
    total: requirements.length,
    ready: requirements.filter((requirement) => requirement.status === "ready").length,
    inReview: requirements.filter((requirement) => requirement.status === "in-review").length,
    missing: missing.length,
    criticalMissing: criticalMissing.length,
    status: criticalMissing.length > 0 ? "critical-gaps" : "fillable-gaps",
  };
}

export function mergeApplicantChecklistWithWorkspaceState(localChecklist, workspaceState = LOCAL_FALLBACK_STATE) {
  const state = workspaceState || LOCAL_FALLBACK_STATE;
  const completedItemIds = asArray(state.completedItemIds);

  if (!state.persisted || completedItemIds.length === 0) {
    return {
      ...localChecklist,
      workspaceState: state,
    };
  }

  const categories = localChecklist.categories.map((category) => ({
    ...category,
    items: category.items.map((item) => applyCompletedItemIds(item, completedItemIds)),
  }));
  const itemsById = new Map(categories.flatMap((category) => category.items.map((item) => [item.id, item])));
  const folders = localChecklist.folders.map((folder) => {
    const items = folder.items.map((item) => itemsById.get(item.id) || item);
    return {
      ...folder,
      items,
      status: items.some((item) => item.status === "missing") ? "needs-evidence" : "ready-for-review",
    };
  });
  const missing = categories.flatMap((category) => category.items).filter((item) => item.status === "missing");

  return {
    ...localChecklist,
    categories,
    folders,
    summary: recalculateSummary(categories),
    nextEvidence: missing.slice(0, 3),
    workspaceState: state,
  };
}

export function useApplicantWorkspaceState(orderId, { enabled = true } = {}) {
  const [workspaceState, setWorkspaceState] = useState(LOCAL_FALLBACK_STATE);

  useEffect(() => {
    if (!enabled || !orderId) {
      setWorkspaceState(LOCAL_FALLBACK_STATE);
      return undefined;
    }

    let active = true;
    setWorkspaceState({
      ...LOCAL_FALLBACK_STATE,
      source: "remote-loading",
      label: "Cargando estado NUXERA",
      loading: true,
      orderId,
    });

    nuxeraWorkspaceStateAPI.getOrderState(orderId)
      .then(({ data }) => {
        if (!active) return;
        setWorkspaceState(normalizeNuxeraApplicantChecklistState(data));
      })
      .catch((err) => {
        if (!active) return;
        warn("NUXERA", "No se pudo cargar estado applicant checklist; usando fallback local", err);
        setWorkspaceState({
          ...LOCAL_FALLBACK_STATE,
          source: "remote-error-fallback",
          label: "Fallback local",
          error: "nuxera-checklist-state-unavailable",
          orderId,
        });
      });

    return () => {
      active = false;
    };
  }, [enabled, orderId]);

  return workspaceState;
}