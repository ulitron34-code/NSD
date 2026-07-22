import { useEffect, useState } from "react";
import { nuxeraConversationAgentAPI } from "../../services/api";
import { warn } from "../../utils/logger";
import { pickLang } from "../../data/requisitosMinimos";

const LOCAL_CONVERSATION_AGENT_READINESS = Object.freeze({
  source: "local-fallback",
  id: "nuxera-conversation-agent-readiness",
  status: "agent-readiness-unverified",
  runtimeEnabled: false,
  loading: false,
  error: null,
  assistantScope: "Agente conversacional pendiente de readiness backend.",
  roles: [
    {
      role: "applicant",
      channel: "applicant-file-assistant",
      requiredPermission: "case:own:read",
      allowedSources: ["service_orders", "documents", "messages"],
      capabilities: ["explain-open-requirements"],
      blockedActions: ["send-email", "approve-financing"],
      status: "requires-selected-authorized-file",
    },
    {
      role: "grantor",
      channel: "grantor-decision-desk-assistant",
      requiredPermission: "data_room:authorized:read",
      allowedSources: ["service_orders", "document_extractions", "messages", "nuxera_evidence_links"],
      capabilities: ["summarize-authorized-evidence"],
      blockedActions: ["issue-term-sheet", "grant-document-access"],
      status: "requires-selected-authorized-file",
    },
    {
      role: "admin",
      channel: "admin-agent-operations-monitor",
      requiredPermission: "nuxera:admin:read",
      allowedSources: ["audit_logs", "nuxera_admin_controls", "nuxera_notification_outbox"],
      capabilities: ["monitor-agent-health"],
      blockedActions: ["enable-delivery", "change-rls"],
      status: "operations-monitor-ready-read-only",
    },
  ],
  summary: {
    roles: 3,
    allowedSources: 8,
    blockedActions: 6,
    runtimeEnabled: false,
    humanReviewRequired: true,
  },
  requiredBackendSteps: [
    "Verificar endpoint /api/nuxera/admin/conversation-agent-readiness.",
    "Crear endpoint conversacional por expediente con autorizacion por rol.",
    "Aprobar auditoria, retencion y fuentes antes de activar runtime.",
  ],
  guardrails: ["Local fallback; no confirma runtime, retrieval, auditoria ni proveedor LLM."],
});

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function normalizeNuxeraConversationAgentReadinessResponse(response, language = "es") {
  const payload = response?.conversationAgent || response || null;

  if (!payload || typeof payload !== "object") {
    return {
      ...LOCAL_CONVERSATION_AGENT_READINESS,
      error: "nuxera-conversation-agent-readiness-missing",
    };
  }

  const runtimeEnabled = Boolean(payload.runtimeEnabled);

  return {
    ...LOCAL_CONVERSATION_AGENT_READINESS,
    source: runtimeEnabled ? "remote-runtime-enabled" : "remote-runtime-disabled",
    label: runtimeEnabled
      ? pickLang({ es: "Runtime conversacional activo", en: "Conversation runtime enabled" }, language)
      : pickLang({ es: "Contrato listo, runtime apagado", en: "Contract ready, runtime disabled" }, language),
    id: payload.id || LOCAL_CONVERSATION_AGENT_READINESS.id,
    status: payload.status || "agent-contract-ready-no-chat-delivery",
    runtimeEnabled,
    loading: false,
    error: null,
    assistantScope: payload.assistantScope || LOCAL_CONVERSATION_AGENT_READINESS.assistantScope,
    roles: asArray(payload.roles),
    summary: {
      ...LOCAL_CONVERSATION_AGENT_READINESS.summary,
      ...asObject(payload.summary),
      runtimeEnabled,
    },
    requiredBackendSteps: asArray(payload.requiredBackendSteps),
    guardrails: [
      ...asArray(payload.guardrails),
      ...asArray(response?.guardrails),
    ].filter(Boolean),
  };
}

export function mergeCommunicationModelWithConversationAgent(model, agent = LOCAL_CONVERSATION_AGENT_READINESS, language = "es") {
  const normalizedAgent = { ...LOCAL_CONVERSATION_AGENT_READINESS, ...asObject(agent) };
  const runtimeEnabled = Boolean(normalizedAgent.runtimeEnabled);

  return {
    ...model,
    conversationAgent: normalizedAgent,
    summary: {
      ...model.summary,
      conversationRuntimeEnabled: runtimeEnabled,
      conversationRoles: normalizedAgent.summary.roles || normalizedAgent.roles.length,
      conversationSources: normalizedAgent.summary.allowedSources || 0,
      blockedAgentActions: normalizedAgent.summary.blockedActions || 0,
    },
    guardrails: [
      ...asArray(model.guardrails),
      ...asArray(normalizedAgent.guardrails),
      runtimeEnabled
        ? pickLang({ es: "Runtime conversacional activo requiere monitoreo, trazabilidad y auditoria continua.", en: "Enabled conversation runtime requires monitoring, traceability and continuous audit." }, language)
        : pickLang({ es: "Chat runtime permanece apagado; la UI solo muestra contrato y fuentes autorizadas.", en: "Chat runtime remains disabled; the UI only shows contract and authorized sources." }, language),
    ],
  };
}

export function useConversationAgentReadiness({ enabled = true, language = "es" } = {}) {
  const [state, setState] = useState(LOCAL_CONVERSATION_AGENT_READINESS);

  useEffect(() => {
    let alive = true;

    if (!enabled) {
      setState(LOCAL_CONVERSATION_AGENT_READINESS);
      return () => { alive = false; };
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    nuxeraConversationAgentAPI.getReadiness()
      .then(({ data }) => {
        if (!alive) return;
        setState(normalizeNuxeraConversationAgentReadinessResponse(data, language));
      })
      .catch((error) => {
        warn("NUXERA", "Conversation agent readiness unavailable", error?.message || error);
        if (!alive) return;
        setState({
          ...LOCAL_CONVERSATION_AGENT_READINESS,
          loading: false,
          error: error?.response?.data?.code || error?.message || "nuxera-conversation-agent-unavailable",
        });
      });

    return () => { alive = false; };
  }, [enabled, language]);

  return state;
}

const LOCAL_CONVERSATION_PREVIEW = Object.freeze({
  source: "local-fallback",
  status: "conversation-preview-local-blocked",
  loading: false,
  error: null,
  draft: {
    mode: "blocked-preview",
    answer: "Chat runtime apagado hasta autorizacion por expediente, rol y fuentes.",
    suggestedActions: [],
    citations: []
  },
  persistence: { chatTurnsPersisted: false, auditLogWritten: false, retentionApproved: false },
  guardrails: ["Local fallback; no llama proveedor LLM ni persiste conversacion."],
});

export function normalizeNuxeraConversationPreviewResponse(response) {
  const payload = response?.conversationPreview || response || null;

  if (!payload || typeof payload !== "object") {
    return {
      ...LOCAL_CONVERSATION_PREVIEW,
      error: "nuxera-conversation-preview-missing",
    };
  }

  return {
    ...LOCAL_CONVERSATION_PREVIEW,
    ...payload,
    source: "remote-preview",
    loading: false,
    error: null,
    guardrails: [
      ...asArray(payload.guardrails),
      ...asArray(response?.guardrails),
    ].filter(Boolean),
  };
}

export function useConversationPreview({ enabled = true, payload = null } = {}) {
  const [state, setState] = useState(LOCAL_CONVERSATION_PREVIEW);

  useEffect(() => {
    let alive = true;

    if (!enabled || !payload) {
      setState(LOCAL_CONVERSATION_PREVIEW);
      return () => { alive = false; };
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    nuxeraConversationAgentAPI.preview(payload)
      .then(({ data }) => {
        if (!alive) return;
        setState(normalizeNuxeraConversationPreviewResponse(data));
      })
      .catch((error) => {
        warn("NUXERA", "Conversation preview unavailable", error?.message || error);
        if (!alive) return;
        setState({
          ...LOCAL_CONVERSATION_PREVIEW,
          loading: false,
          error: error?.response?.data?.code || error?.message || "nuxera-conversation-preview-unavailable",
        });
      });

    return () => { alive = false; };
  }, [enabled, payload]);

  return state;
}
