import { useEffect, useState } from "react";
import { nuxeraNotificationOutboxAPI } from "../../services/api";
import { warn } from "../../utils/logger";
import { pickLang } from "../../data/requisitosMinimos";
import { getNuxeraNotificationCatalog } from "./notificationOperatingModel";

const LOCAL_OUTBOX_READINESS = Object.freeze({
  source: "local-fallback",
  status: "outbox-readiness-unverified",
  table: "nuxera_notification_outbox",
  deliveryEnabled: false,
  emailDeliveryEnabled: false,
  loading: false,
  error: null,
  supportedEvents: [],
  supportedChannels: ["in_app", "email", "whatsapp"],
  statuses: ["preview", "queued", "sent", "failed", "suppressed"],
  requiredBackendSteps: [
    "Verificar endpoint /api/nuxera/admin/notification-outbox-readiness.",
    "Aplicar SQL nuxera_notification_outbox en entorno controlado.",
    "Mantener delivery deshabilitado hasta aprobar worker y auditoria.",
  ],
  guardrails: ["Local fallback; no confirma tabla, RLS ni worker de entrega."],
});

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function normalizeNuxeraNotificationOutboxReadinessResponse(response, language = "es") {
  const payload = response?.notificationOutbox || response || null;

  if (!payload || typeof payload !== "object") {
    return {
      ...LOCAL_OUTBOX_READINESS,
      error: "nuxera-notification-outbox-readiness-missing",
    };
  }

  return {
    source: payload.deliveryEnabled ? "remote-delivery-enabled" : "remote-delivery-disabled",
    label: payload.deliveryEnabled
      ? pickLang({ es: "Outbox con delivery activo", en: "Outbox delivery enabled" }, language)
      : pickLang({ es: "Outbox listo, delivery apagado", en: "Outbox ready, delivery disabled" }, language),
    status: payload.status || "outbox-contract-ready-delivery-disabled",
    table: payload.table || LOCAL_OUTBOX_READINESS.table,
    deliveryEnabled: Boolean(payload.deliveryEnabled),
    emailDeliveryEnabled: Boolean(payload.emailDeliveryEnabled),
    loading: false,
    error: null,
    supportedEvents: asArray(payload.supportedEvents),
    supportedChannels: asArray(payload.supportedChannels),
    statuses: asArray(payload.statuses),
    requiredBackendSteps: asArray(payload.requiredBackendSteps),
    guardrails: [
      ...asArray(payload.guardrails),
      ...asArray(response?.guardrails),
    ].filter(Boolean),
  };
}

export function mergeNotificationCatalogWithOutboxReadiness(catalog = getNuxeraNotificationCatalog(), outbox = LOCAL_OUTBOX_READINESS, language = "es") {
  const normalizedOutbox = { ...LOCAL_OUTBOX_READINESS, ...asObject(outbox) };
  const deliveryEnabled = Boolean(normalizedOutbox.deliveryEnabled);

  return {
    ...catalog,
    status: deliveryEnabled ? "delivery-enabled-requires-monitoring" : normalizedOutbox.status || catalog.status,
    outbox: normalizedOutbox,
    summary: {
      ...catalog.summary,
      automatedDeliveryEnabled: deliveryEnabled,
      outboxReady: normalizedOutbox.source?.startsWith("remote") || normalizedOutbox.status === "outbox-contract-ready-delivery-disabled",
      supportedChannels: normalizedOutbox.supportedChannels.length,
      deliveryStatuses: normalizedOutbox.statuses.length,
    },
    guardrails: [
      ...asArray(catalog.guardrails),
      ...asArray(normalizedOutbox.guardrails),
      deliveryEnabled
        ? pickLang({ es: "Delivery activo requiere monitoreo de fallos y auditoria continua.", en: "Enabled delivery requires failure monitoring and continuous audit." }, language)
        : pickLang({ es: "Delivery permanece apagado; no se envian correos automaticos desde UI.", en: "Delivery remains disabled; no automatic emails are sent from the UI." }, language),
    ],
  };
}

export function useNotificationOutboxReadiness({ enabled = true, language = "es" } = {}) {
  const [state, setState] = useState(LOCAL_OUTBOX_READINESS);

  useEffect(() => {
    let alive = true;

    if (!enabled) {
      setState(LOCAL_OUTBOX_READINESS);
      return () => { alive = false; };
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    nuxeraNotificationOutboxAPI.getReadiness()
      .then(({ data }) => {
        if (!alive) return;
        setState(normalizeNuxeraNotificationOutboxReadinessResponse(data, language));
      })
      .catch((error) => {
        warn("NUXERA", "Notification outbox readiness unavailable", error?.message || error);
        if (!alive) return;
        setState({
          ...LOCAL_OUTBOX_READINESS,
          loading: false,
          error: error?.response?.data?.code || error?.message || "nuxera-notification-outbox-unavailable",
        });
      });

    return () => { alive = false; };
  }, [enabled, language]);

  return state;
}


const LOCAL_NOTIFICATION_HEALTH = Object.freeze({
  source: "local-fallback",
  status: "notification-health-unverified",
  loading: false,
  error: null,
  deliveryEnabled: false,
  emailDeliveryEnabled: false,
  summary: { total: 0, queued: 0, sent: 0, failed: 0, suppressed: 0, retryCandidates: 0, manualReviewRequired: 0 },
  signals: [],
  entries: [],
  guardrails: ["Local fallback; no confirma health de outbox ni ejecuta delivery."],
});

export function normalizeNuxeraNotificationOutboxHealthResponse(response) {
  const payload = response?.notificationHealth || response || null;

  if (!payload || typeof payload !== "object") {
    return {
      ...LOCAL_NOTIFICATION_HEALTH,
      error: "nuxera-notification-health-missing",
    };
  }

  return {
    ...LOCAL_NOTIFICATION_HEALTH,
    ...payload,
    source: "remote",
    loading: false,
    error: null,
    deliveryEnabled: Boolean(payload.deliveryEnabled),
    emailDeliveryEnabled: Boolean(payload.emailDeliveryEnabled),
    summary: {
      ...LOCAL_NOTIFICATION_HEALTH.summary,
      ...asObject(payload.summary),
    },
    signals: asArray(payload.signals),
    entries: asArray(payload.entries),
    guardrails: [
      ...asArray(payload.guardrails),
      ...asArray(response?.guardrails),
    ].filter(Boolean),
  };
}

export function useNotificationOutboxHealth({ enabled = true, limit = 100 } = {}) {
  const [state, setState] = useState(LOCAL_NOTIFICATION_HEALTH);

  useEffect(() => {
    let alive = true;

    if (!enabled) {
      setState(LOCAL_NOTIFICATION_HEALTH);
      return () => { alive = false; };
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    nuxeraNotificationOutboxAPI.getHealth({ limit })
      .then(({ data }) => {
        if (!alive) return;
        setState(normalizeNuxeraNotificationOutboxHealthResponse(data));
      })
      .catch((error) => {
        warn("NUXERA", "Notification outbox health unavailable", error?.message || error);
        if (!alive) return;
        setState({
          ...LOCAL_NOTIFICATION_HEALTH,
          loading: false,
          error: error?.response?.data?.code || error?.message || "nuxera-notification-health-unavailable",
        });
      });

    return () => { alive = false; };
  }, [enabled, limit]);

  return state;
}

const LOCAL_NOTIFICATION_TEMPLATE_CATALOG = Object.freeze({
  source: "local-fallback",
  status: "notification-templates-unavailable",
  loading: false,
  error: null,
  templates: [],
  guardrails: ["Local fallback; no confirma plantillas backend ni queuea notificaciones."],
});

export function normalizeNuxeraNotificationTemplateCatalogResponse(response) {
  const payload = response?.templateCatalog || response || null;

  if (!payload || typeof payload !== "object") {
    return {
      ...LOCAL_NOTIFICATION_TEMPLATE_CATALOG,
      error: "nuxera-notification-templates-missing",
    };
  }

  return {
    ...LOCAL_NOTIFICATION_TEMPLATE_CATALOG,
    ...payload,
    source: "remote-template-catalog",
    loading: false,
    error: null,
    templates: asArray(payload.templates),
    guardrails: [
      ...asArray(payload.guardrails),
      ...asArray(response?.guardrails),
    ].filter(Boolean),
  };
}

export function useNotificationTemplateCatalog({ enabled = true } = {}) {
  const [state, setState] = useState(LOCAL_NOTIFICATION_TEMPLATE_CATALOG);

  useEffect(() => {
    let alive = true;

    if (!enabled) {
      setState(LOCAL_NOTIFICATION_TEMPLATE_CATALOG);
      return () => { alive = false; };
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    nuxeraNotificationOutboxAPI.getTemplates()
      .then(({ data }) => {
        if (!alive) return;
        setState(normalizeNuxeraNotificationTemplateCatalogResponse(data));
      })
      .catch((error) => {
        warn("NUXERA", "Notification templates unavailable", error?.message || error);
        if (!alive) return;
        setState({
          ...LOCAL_NOTIFICATION_TEMPLATE_CATALOG,
          loading: false,
          error: error?.response?.data?.code || error?.message || "nuxera-notification-templates-unavailable",
        });
      });

    return () => { alive = false; };
  }, [enabled]);

  return state;
}

const LOCAL_NOTIFICATION_DRY_RUN = Object.freeze({
  source: "local-fallback",
  status: "notification-dry-run-local",
  deliveryEnabled: false,
  loading: false,
  error: null,
  previews: [],
  rejected: [],
  summary: { accepted: 0, duplicates: 0, rejected: 0, channels: 0 },
  guardrails: ["Local dry-run fallback; no envia mensajes ni inserta outbox."],
});

export function normalizeNuxeraNotificationDryRunResponse(response) {
  const payload = response?.dryRun || response || null;

  if (!payload || typeof payload !== "object") {
    return {
      ...LOCAL_NOTIFICATION_DRY_RUN,
      error: "nuxera-notification-dry-run-missing",
    };
  }

  return {
    ...LOCAL_NOTIFICATION_DRY_RUN,
    ...payload,
    source: "remote-dry-run",
    loading: false,
    error: null,
    previews: asArray(payload.previews),
    rejected: asArray(payload.rejected),
    summary: {
      ...LOCAL_NOTIFICATION_DRY_RUN.summary,
      ...asObject(payload.summary),
    },
    guardrails: [
      ...asArray(payload.guardrails),
      ...asArray(response?.guardrails),
    ].filter(Boolean),
  };
}


const LOCAL_NOTIFICATION_RULES_DRY_RUN = Object.freeze({
  source: "local-fallback",
  status: "notification-rules-dry-run-unavailable",
  loading: false,
  error: null,
  summary: { matchedRules: 0, generatedIntents: 0, accepted: 0, rejected: 0, duplicates: 0, byAudience: {} },
  matchedRules: [],
  intents: [],
  dryRun: LOCAL_NOTIFICATION_DRY_RUN,
  guardrails: ["Local fallback; no genera ni queuea notificaciones desde reglas."],
});

export function normalizeNuxeraNotificationRulesDryRunResponse(response) {
  const payload = response?.notificationRules || response || null;

  if (!payload || typeof payload !== "object") {
    return {
      ...LOCAL_NOTIFICATION_RULES_DRY_RUN,
      error: "nuxera-notification-rules-dry-run-missing",
    };
  }

  return {
    ...LOCAL_NOTIFICATION_RULES_DRY_RUN,
    ...payload,
    source: "remote-rules-dry-run",
    loading: false,
    error: null,
    summary: {
      ...LOCAL_NOTIFICATION_RULES_DRY_RUN.summary,
      ...asObject(payload.summary),
    },
    matchedRules: asArray(payload.matchedRules),
    intents: asArray(payload.intents),
    dryRun: normalizeNuxeraNotificationDryRunResponse(payload.dryRun),
    guardrails: [
      ...asArray(payload.guardrails),
      ...asArray(response?.guardrails),
    ].filter(Boolean),
  };
}

export function useNotificationRulesDryRun(orderId, { enabled = true, params = {} } = {}) {
  const [state, setState] = useState(LOCAL_NOTIFICATION_RULES_DRY_RUN);

  useEffect(() => {
    let alive = true;

    if (!enabled || !orderId) {
      setState(LOCAL_NOTIFICATION_RULES_DRY_RUN);
      return () => { alive = false; };
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    nuxeraNotificationOutboxAPI.getRulesDryRun(orderId, params)
      .then(({ data }) => {
        if (!alive) return;
        setState(normalizeNuxeraNotificationRulesDryRunResponse(data));
      })
      .catch((error) => {
        warn("NUXERA", "Notification rules dry-run unavailable", error?.message || error);
        if (!alive) return;
        setState({
          ...LOCAL_NOTIFICATION_RULES_DRY_RUN,
          loading: false,
          error: error?.response?.data?.code || error?.message || "nuxera-notification-rules-dry-run-unavailable",
        });
      });

    return () => { alive = false; };
  }, [enabled, orderId, params]);

  return state;
}

const LOCAL_NOTIFICATION_APPROVAL_PLAN = Object.freeze({
  source: "local-fallback",
  status: "notification-approval-plan-unavailable",
  loading: false,
  error: null,
  summary: { generated: 0, actionable: 0, duplicates: 0, rejected: 0, byAudience: {} },
  approvalItems: [],
  rulesDryRun: LOCAL_NOTIFICATION_RULES_DRY_RUN,
  guardrails: ["Local fallback; no confirma plan de aprobacion ni queuea notificaciones."],
});

const LOCAL_NOTIFICATION_APPROVAL_RESULT = Object.freeze({
  source: "local-fallback",
  status: "notification-approval-idle",
  loading: false,
  error: null,
  deliveryEnabled: false,
  summary: { approved: 0, persisted: 0, previews: 0, suppressed: 0, duplicatesSkipped: 0 },
  results: [],
  guardrails: ["Local fallback; no aprueba ni queuea notificaciones."],
});

export function normalizeNuxeraNotificationApprovalPlanResponse(response) {
  const payload = response?.approvalPlan || response || null;

  if (!payload || typeof payload !== "object") {
    return {
      ...LOCAL_NOTIFICATION_APPROVAL_PLAN,
      error: "nuxera-notification-approval-plan-missing",
    };
  }

  return {
    ...LOCAL_NOTIFICATION_APPROVAL_PLAN,
    ...payload,
    source: "remote-approval-plan",
    loading: false,
    error: null,
    summary: {
      ...LOCAL_NOTIFICATION_APPROVAL_PLAN.summary,
      ...asObject(payload.summary),
    },
    approvalItems: asArray(payload.approvalItems),
    rulesDryRun: normalizeNuxeraNotificationRulesDryRunResponse(payload.rulesDryRun),
    guardrails: [
      ...asArray(payload.guardrails),
      ...asArray(response?.guardrails),
    ].filter(Boolean),
  };
}

export function normalizeNuxeraNotificationApprovalResultResponse(response) {
  const payload = response?.approvalResult || response || null;

  if (!payload || typeof payload !== "object") {
    return {
      ...LOCAL_NOTIFICATION_APPROVAL_RESULT,
      error: "nuxera-notification-approval-result-missing",
    };
  }

  return {
    ...LOCAL_NOTIFICATION_APPROVAL_RESULT,
    ...payload,
    source: "remote-approval-result",
    loading: false,
    error: null,
    deliveryEnabled: Boolean(payload.deliveryEnabled),
    summary: {
      ...LOCAL_NOTIFICATION_APPROVAL_RESULT.summary,
      ...asObject(payload.summary),
    },
    results: asArray(payload.results),
    guardrails: [
      ...asArray(payload.guardrails),
      ...asArray(response?.guardrails),
    ].filter(Boolean),
  };
}

export function useNotificationApprovalPlan(orderId, { enabled = true, params = {} } = {}) {
  const [state, setState] = useState(LOCAL_NOTIFICATION_APPROVAL_PLAN);

  useEffect(() => {
    let alive = true;

    if (!enabled || !orderId) {
      setState(LOCAL_NOTIFICATION_APPROVAL_PLAN);
      return () => { alive = false; };
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    nuxeraNotificationOutboxAPI.getApprovalPlan(orderId, params)
      .then(({ data }) => {
        if (!alive) return;
        setState(normalizeNuxeraNotificationApprovalPlanResponse(data));
      })
      .catch((error) => {
        warn("NUXERA", "Notification approval plan unavailable", error?.message || error);
        if (!alive) return;
        setState({
          ...LOCAL_NOTIFICATION_APPROVAL_PLAN,
          loading: false,
          error: error?.response?.data?.code || error?.message || "nuxera-notification-approval-plan-unavailable",
        });
      });

    return () => { alive = false; };
  }, [enabled, orderId, params]);

  return state;
}

export function useNotificationRulesApproval({ enabled = true, orderId = null, payload = {} } = {}) {
  const [state, setState] = useState(LOCAL_NOTIFICATION_APPROVAL_RESULT);

  const approve = async () => {
    if (!enabled || !orderId) {
      const disabled = {
        ...LOCAL_NOTIFICATION_APPROVAL_RESULT,
        error: "nuxera-notification-approval-disabled",
      };
      setState(disabled);
      return disabled;
    }

    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const { data } = await nuxeraNotificationOutboxAPI.approveRules(orderId, payload);
      const normalized = normalizeNuxeraNotificationApprovalResultResponse(data);
      setState(normalized);
      return normalized;
    } catch (error) {
      warn("NUXERA", "Notification rules approval unavailable", error?.message || error);
      const failed = {
        ...LOCAL_NOTIFICATION_APPROVAL_RESULT,
        loading: false,
        error: error?.response?.data?.code || error?.message || "nuxera-notification-approval-unavailable",
      };
      setState(failed);
      return failed;
    }
  };

  return { ...state, approve };
}

const LOCAL_OUTBOX_LIST = Object.freeze({
  source: "local-fallback",
  status: "outbox-list-unverified",
  loading: false,
  error: null,
  entries: [],
  guardrails: ["Local fallback; no confirma filas persistidas de outbox."],
});

const LOCAL_DELIVERY_BATCH = Object.freeze({
  source: "local-fallback",
  status: "delivery-batch-idle",
  loading: false,
  error: null,
  deliveryEnabled: false,
  emailDeliveryEnabled: false,
  processed: 0,
  sent: 0,
  failed: 0,
  suppressed: 0,
  results: [],
  guardrails: ["Local fallback; no ejecuta batch ni envia mensajes."],
});

export function normalizeNuxeraNotificationDeliveryBatchResponse(response) {
  const payload = response?.batch || response || null;

  if (!payload || typeof payload !== "object") {
    return {
      ...LOCAL_DELIVERY_BATCH,
      error: "nuxera-notification-delivery-batch-missing",
    };
  }

  return {
    ...LOCAL_DELIVERY_BATCH,
    ...payload,
    source: "remote",
    loading: false,
    error: null,
    deliveryEnabled: Boolean(payload.deliveryEnabled),
    emailDeliveryEnabled: Boolean(payload.emailDeliveryEnabled),
    processed: Number(payload.processed || 0),
    sent: Number(payload.sent || 0),
    failed: Number(payload.failed || 0),
    suppressed: Number(payload.suppressed || 0),
    results: asArray(payload.results),
    guardrails: [
      ...asArray(payload.guardrails),
      ...asArray(response?.guardrails),
    ].filter(Boolean),
  };
}

export function normalizeNuxeraNotificationOutboxListResponse(response) {
  const payload = response?.outbox || response || null;

  if (!payload || typeof payload !== "object") {
    return {
      ...LOCAL_OUTBOX_LIST,
      error: "nuxera-notification-outbox-list-missing",
    };
  }

  return {
    ...LOCAL_OUTBOX_LIST,
    source: "remote",
    status: payload.status || "outbox-list-ready",
    loading: false,
    error: null,
    entries: asArray(payload.entries),
    guardrails: [
      ...asArray(payload.guardrails),
      ...asArray(response?.guardrails),
    ].filter(Boolean),
  };
}

export function useNotificationOutboxList({ enabled = true, status, audience, orderId, limit = 20 } = {}) {
  const [state, setState] = useState(LOCAL_OUTBOX_LIST);

  useEffect(() => {
    let alive = true;

    if (!enabled) {
      setState(LOCAL_OUTBOX_LIST);
      return () => { alive = false; };
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    nuxeraNotificationOutboxAPI.list({ status, audience, orderId, limit })
      .then(({ data }) => {
        if (!alive) return;
        setState(normalizeNuxeraNotificationOutboxListResponse(data));
      })
      .catch((error) => {
        warn("NUXERA", "Notification outbox list unavailable", error?.message || error);
        if (!alive) return;
        setState({
          ...LOCAL_OUTBOX_LIST,
          loading: false,
          error: error?.response?.data?.code || error?.message || "nuxera-notification-outbox-list-unavailable",
        });
      });

    return () => { alive = false; };
  }, [enabled, status, audience, orderId, limit]);

  return state;
}

export function useNotificationDeliveryBatch({ enabled = true, maxBatchSize = 1, channels = ["email"] } = {}) {
  const [state, setState] = useState(LOCAL_DELIVERY_BATCH);

  const runBatch = async () => {
    if (!enabled) {
      const disabled = {
        ...LOCAL_DELIVERY_BATCH,
        error: "nuxera-experience-disabled",
      };
      setState(disabled);
      return disabled;
    }

    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const { data } = await nuxeraNotificationOutboxAPI.runDeliveryBatch({ maxBatchSize, channels });
      const normalized = normalizeNuxeraNotificationDeliveryBatchResponse(data);
      setState(normalized);
      return normalized;
    } catch (error) {
      warn("NUXERA", "Notification delivery batch unavailable", error?.message || error);
      const failed = {
        ...LOCAL_DELIVERY_BATCH,
        loading: false,
        error: error?.response?.data?.code || error?.message || "nuxera-notification-delivery-batch-unavailable",
      };
      setState(failed);
      return failed;
    }
  };

  return { ...state, runBatch };
}

export function useNotificationDryRun({ enabled = true, intents = [], language = "es" } = {}) {
  const [state, setState] = useState(LOCAL_NOTIFICATION_DRY_RUN);

  useEffect(() => {
    let alive = true;

    if (!enabled || !intents.length) {
      setState(LOCAL_NOTIFICATION_DRY_RUN);
      return () => { alive = false; };
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    nuxeraNotificationOutboxAPI.dryRun({ intents })
      .then(({ data }) => {
        if (!alive) return;
        setState(normalizeNuxeraNotificationDryRunResponse(data, language));
      })
      .catch((error) => {
        warn("NUXERA", "Notification dry-run unavailable", error?.message || error);
        if (!alive) return;
        setState({
          ...LOCAL_NOTIFICATION_DRY_RUN,
          loading: false,
          error: error?.response?.data?.code || error?.message || "nuxera-notification-dry-run-unavailable",
        });
      });

    return () => { alive = false; };
  }, [enabled, intents, language]);

  return state;
}
