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

const LOCAL_OUTBOX_LIST = Object.freeze({
  source: "local-fallback",
  status: "outbox-list-unverified",
  loading: false,
  error: null,
  entries: [],
  guardrails: ["Local fallback; no confirma filas persistidas de outbox."],
});

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
