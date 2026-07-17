import { useEffect, useState } from "react";
import { nuxeraEvidenceAPI } from "../../services/api";
import { warn } from "../../utils/logger";
import { getNuxeraEvidenceLedger } from "./evidenceLedger";

const ENGINE_LABELS = Object.freeze({
  finance: "Finance",
  intelligence: "Intelligence",
  markets: "Markets",
  strategy: "Strategy",
  admin: "Admin",
});

const LOCAL_EVIDENCE_STATE = Object.freeze({
  source: "local-fallback",
  label: "Ledger local",
  status: "read-only-local",
  persisted: false,
  loading: false,
  error: null,
  items: [],
  guardrails: ["Ledger local de preparacion; no hay evidence_links persistidos cargados."],
});

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeEngine(engine) {
  return ENGINE_LABELS[String(engine || "").toLowerCase()] || "Intelligence";
}

function summarizeEvidence(items) {
  return {
    total: items.length,
    ready: items.filter((item) => item.status === "ready").length,
    inReview: items.filter((item) => item.status === "in-review").length,
    needsEvidence: items.filter((item) => item.status === "needs-evidence").length,
    watch: items.filter((item) => item.status === "watch").length,
    visibilityModes: [...new Set(items.map((item) => item.visibility))],
  };
}

function normalizeProvenance(provenance) {
  const data = asObject(provenance);
  if (data.source) return String(data.source);
  if (data.reason) return String(data.reason);
  return Object.keys(data).length ? "NUXERA evidence_links provenance" : "NUXERA evidence_links";
}

function mapRemoteEvidenceLink(link) {
  const provenance = asObject(link.provenance);
  return {
    id: link.id,
    engine: normalizeEngine(link.engine),
    label: link.label || "Evidencia NUXERA",
    status: "ready",
    visibility: link.visibility || "owner",
    provenance: normalizeProvenance(provenance),
    sourceType: provenance.sourceType || (link.documentId ? "document-link" : "evidence-link"),
    path: provenance.path || `/dashboard/nuxera/${String(link.engine || "intelligence").toLowerCase()}`,
    detail: provenance.detail || provenance.summary || "Evidence link owner-scoped read-only.",
    guardrail: "Evidence link read-only; no concede acceso documental ni cambia data room.",
    remoteEvidenceLink: true,
    documentId: link.documentId || null,
    documentReviewId: link.documentReviewId || null,
    createdAt: link.createdAt || null,
  };
}

export function normalizeNuxeraEvidenceResponse(response) {
  const evidence = response?.evidence || response || null;

  if (!evidence || typeof evidence !== "object") {
    return {
      ...LOCAL_EVIDENCE_STATE,
      error: "nuxera-evidence-missing",
    };
  }

  const items = asArray(evidence.links).map(mapRemoteEvidenceLink);
  const persisted = Boolean(evidence.persisted && items.length > 0);
  const guardrails = [
    ...asArray(evidence.guardrails),
    ...asArray(response?.guardrails),
  ];

  return {
    source: persisted ? "remote-persisted" : "remote-empty",
    label: persisted ? "Evidence links NUXERA persistidos" : "Sin evidence_links persistidos",
    status: persisted ? "read-only-remote" : "read-only-remote-empty",
    persisted,
    loading: false,
    error: null,
    orderId: evidence.orderId || response?.orderId || null,
    workspaceRole: response?.workspaceRole || null,
    items,
    summary: summarizeEvidence(items),
    guardrails: guardrails.length ? guardrails : LOCAL_EVIDENCE_STATE.guardrails,
  };
}

export function mergeNuxeraEvidenceLedger(localLedger, remoteState = LOCAL_EVIDENCE_STATE) {
  const state = remoteState || LOCAL_EVIDENCE_STATE;

  if (!state.persisted || state.items.length === 0) {
    return {
      ...localLedger,
      backendEvidence: state,
    };
  }

  const items = [
    ...state.items,
    ...localLedger.items.filter((item) => !state.items.some((remote) => remote.id === item.id)),
  ];

  return {
    ...localLedger,
    status: "read-only-remote-merged",
    summary: summarizeEvidence(items),
    items,
    backendEvidence: state,
    policies: [
      "Ledger read-only: mezcla evidence_links persistidos con fallback local.",
      "Los enlaces persistidos no otorgan acceso documental ni cambian permisos.",
      ...localLedger.policies,
    ],
  };
}

export function useOwnerEvidenceLedger(orderId, { enabled = true, role = "applicant", language = "es" } = {}) {
  const localLedger = getNuxeraEvidenceLedger(role, language);
  const [remoteState, setRemoteState] = useState(LOCAL_EVIDENCE_STATE);

  useEffect(() => {
    if (!enabled || !orderId) {
      setRemoteState(LOCAL_EVIDENCE_STATE);
      return undefined;
    }

    let active = true;
    setRemoteState({
      ...LOCAL_EVIDENCE_STATE,
      source: "remote-loading",
      label: "Cargando evidence_links NUXERA",
      loading: true,
      orderId,
    });

    nuxeraEvidenceAPI.getOrderEvidence(orderId)
      .then(({ data }) => {
        if (!active) return;
        setRemoteState(normalizeNuxeraEvidenceResponse(data));
      })
      .catch((err) => {
        if (!active) return;
        warn("NUXERA", "No se pudo cargar evidence ledger; usando fallback local", err);
        setRemoteState({
          ...LOCAL_EVIDENCE_STATE,
          source: "remote-error-fallback",
          label: "Fallback local",
          error: "nuxera-evidence-unavailable",
          orderId,
        });
      });

    return () => {
      active = false;
    };
  }, [enabled, orderId]);

  return mergeNuxeraEvidenceLedger(localLedger, remoteState);
}