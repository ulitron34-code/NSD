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
