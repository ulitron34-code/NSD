import { supabaseAdmin } from '../config/supabase.js';
import { logAuditEvent } from '../utils/audit.js';

export const NUXERA_NOTIFICATION_EVENTS = Object.freeze({
  APPLICANT_MISSING_EVIDENCE: 'applicant-missing-evidence',
  APPLICANT_EVIDENCE_REJECTED: 'applicant-evidence-rejected',
  APPLICANT_MESSAGE_RECEIVED: 'applicant-message-received',
  GRANTOR_FILE_SHARED: 'grantor-file-shared',
  GRANTOR_INFORMATION_RESPONSE: 'grantor-information-response',
  GRANTOR_DECISION_READY: 'grantor-decision-ready',
  ADMIN_DELIVERY_FAILURE: 'admin-delivery-failure'
});

const EVENT_AUDIENCE = Object.freeze({
  [NUXERA_NOTIFICATION_EVENTS.APPLICANT_MISSING_EVIDENCE]: 'applicant',
  [NUXERA_NOTIFICATION_EVENTS.APPLICANT_EVIDENCE_REJECTED]: 'applicant',
  [NUXERA_NOTIFICATION_EVENTS.APPLICANT_MESSAGE_RECEIVED]: 'applicant',
  [NUXERA_NOTIFICATION_EVENTS.GRANTOR_FILE_SHARED]: 'grantor',
  [NUXERA_NOTIFICATION_EVENTS.GRANTOR_INFORMATION_RESPONSE]: 'grantor',
  [NUXERA_NOTIFICATION_EVENTS.GRANTOR_DECISION_READY]: 'grantor',
  [NUXERA_NOTIFICATION_EVENTS.ADMIN_DELIVERY_FAILURE]: 'admin'
});

const ALLOWED_CHANNELS = new Set(['in_app', 'email', 'whatsapp']);
const ALLOWED_STATUSES = new Set(['preview', 'queued', 'sent', 'failed', 'suppressed']);
const DELIVERY_DISABLED_REASON = "NUXERA_NOTIFICATION_DELIVERY_ENABLED is not true";

function normalizeString(value, maxLength = 240) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

function normalizeChannels(channels) {
  const normalized = (Array.isArray(channels) ? channels : ['in_app'])
    .map((channel) => String(channel || '').trim().toLowerCase().replace('-', '_'))
    .filter((channel) => ALLOWED_CHANNELS.has(channel));

  return [...new Set(normalized.length ? normalized : ['in_app'])];
}

function isDeliveryEnabled(explicitValue = process.env.NUXERA_NOTIFICATION_DELIVERY_ENABLED) {
  return String(explicitValue || '').trim().toLowerCase() === 'true';
}

export function isNuxeraNotificationDeliveryEnabled() {
  return isDeliveryEnabled();
}

function getAudience(eventId) {
  const audience = EVENT_AUDIENCE[eventId];
  if (!audience) throw new Error('Evento NUXERA notification invalido');
  return audience;
}

export function buildNuxeraNotificationDedupeKey(intent = {}) {
  const eventId = normalizeString(intent.eventId, 120);
  const orderId = normalizeString(intent.orderId || intent.expedientId, 120) || 'no-order';
  const recipient = normalizeString(intent.recipientUserId || intent.recipientEmail, 180) || 'no-recipient';
  const channelKey = normalizeChannels(intent.channels).join('+');
  if (!eventId) throw new Error('Evento NUXERA notification requerido');
  return `${eventId}:${orderId}:${recipient}:${channelKey}`.toLowerCase();
}

export function normalizeNuxeraNotificationIntent(intent = {}) {
  const eventId = normalizeString(intent.eventId, 120);
  const audience = getAudience(eventId);
  const recipientRole = normalizeString(intent.recipientRole || audience, 80);
  const recipientUserId = normalizeString(intent.recipientUserId, 120);
  const recipientEmail = normalizeString(intent.recipientEmail, 180);
  const orderId = normalizeString(intent.orderId || intent.expedientId, 120);
  const subject = normalizeString(intent.subject, 180);
  const bodyPreview = normalizeString(intent.bodyPreview, 800);
  const channels = normalizeChannels(intent.channels);
  const status = normalizeString(intent.status || 'preview', 40);

  if (!ALLOWED_STATUSES.has(status)) throw new Error('Estado NUXERA notification invalido');
  if (!recipientUserId && !recipientEmail) throw new Error('Destinatario NUXERA notification requerido');
  if (recipientRole !== audience && audience !== 'admin') throw new Error('Audiencia NUXERA notification no coincide con destinatario');
  if (audience !== 'admin' && !orderId) throw new Error('Expediente NUXERA notification requerido');

  return {
    eventId,
    audience,
    recipientRole,
    recipientUserId,
    recipientEmail,
    orderId,
    subject: subject || 'NUXERA notification',
    bodyPreview: bodyPreview || '',
    channels,
    status,
    priority: normalizeString(intent.priority || 'normal', 40),
    metadata: intent.metadata && typeof intent.metadata === 'object' && !Array.isArray(intent.metadata) ? intent.metadata : {},
    dedupeKey: buildNuxeraNotificationDedupeKey({ ...intent, eventId, channels })
  };
}

export function buildNuxeraNotificationOutboxPreview(intent = {}) {
  const normalized = normalizeNuxeraNotificationIntent(intent);
  return {
    ...normalized,
    deliveryEnabled: false,
    requiresHumanReview: true,
    requiresAuditLog: true,
    guardrails: [
      'Preview only; no envia email, WhatsApp ni in-app automaticamente.',
      'El envio real requiere notification_outbox persistido, dedupe y audit_logs.',
      'El agente puede redactar o resumir; no decide ni entrega por si solo.'
    ]
  };
}

async function findActiveOutboxByDedupeKey(dedupeKey) {
  const { data, error } = await supabaseAdmin
    .from('nuxera_notification_outbox')
    .select('id, status, created_at')
    .eq('dedupe_key', dedupeKey)
    .in('status', ['preview', 'queued', 'sent'])
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function enqueueNuxeraNotificationIntent({ intent, actorUserId, req = null, deliveryEnabled = false }) {
  const preview = buildNuxeraNotificationOutboxPreview(intent);

  if (!deliveryEnabled) {
    return {
      ...preview,
      persisted: false,
      status: 'preview'
    };
  }

  const duplicate = await findActiveOutboxByDedupeKey(preview.dedupeKey);

  if (duplicate) {
    await logAuditEvent({
      userId: actorUserId || null,
      action: 'nuxera_notification_duplicate_rejected',
      entityType: 'nuxera_notification_outbox',
      entityId: duplicate.id,
      orderId: preview.orderId,
      req,
      complianceRelevant: true,
      metadata: {
        eventId: preview.eventId,
        audience: preview.audience,
        dedupeKey: preview.dedupeKey,
        existingStatus: duplicate.status
      }
    });

    return {
      ...preview,
      id: duplicate.id,
      persisted: false,
      duplicate: true,
      status: 'suppressed'
    };
  }

  const row = {
    event_id: preview.eventId,
    audience: preview.audience,
    recipient_role: preview.recipientRole,
    recipient_user_id: preview.recipientUserId,
    recipient_email: preview.recipientEmail,
    order_id: preview.orderId,
    subject: preview.subject,
    body_preview: preview.bodyPreview,
    channels: preview.channels,
    priority: preview.priority,
    status: 'queued',
    metadata: preview.metadata,
    dedupe_key: preview.dedupeKey,
    created_by: actorUserId || null
  };

  const { data, error } = await supabaseAdmin
    .from('nuxera_notification_outbox')
    .insert([row])
    .select('*')
    .single();

  if (error) throw error;

  await logAuditEvent({
    userId: actorUserId || null,
    action: 'nuxera_notification_queued',
    entityType: 'nuxera_notification_outbox',
    entityId: data.id,
    orderId: preview.orderId,
    req,
    complianceRelevant: true,
    metadata: {
      eventId: preview.eventId,
      audience: preview.audience,
      channels: preview.channels,
      dedupeKey: preview.dedupeKey,
      humanReviewRequired: true
    }
  });

  return {
    ...preview,
    id: data.id,
    persisted: true,
    status: 'queued',
    createdAt: data.created_at || null
  };
}

export function buildNuxeraNotificationDeliveryPlan(options = {}) {
  const enabled = isDeliveryEnabled(options.deliveryEnabled);
  const parsedBatchSize = Number(options.maxBatchSize ?? 25);

  return {
    enabled,
    mode: enabled ? "delivery-enabled-controlled-worker" : "delivery-disabled-dry-run",
    maxBatchSize: Math.max(1, Math.min(Number.isFinite(parsedBatchSize) ? parsedBatchSize : 25, 100)),
    channels: normalizeChannels(options.channels || ["in_app", "email", "whatsapp"]),
    requiredProviders: ["email-provider", "whatsapp-provider", "audit-log"],
    guardrails: [
      enabled
        ? "Delivery enabled only by explicit backend configuration."
        : "Delivery disabled; worker can only report pending delivery posture.",
      "Worker must update nuxera_notification_outbox status and audit each delivery transition.",
      "Emails/WhatsApp must never include sensitive evidence or attachments."
    ]
  };
}

export async function processNuxeraNotificationDeliveryBatch(options = {}) {
  const plan = buildNuxeraNotificationDeliveryPlan(options);

  if (!plan.enabled) {
    return {
      status: "delivery-disabled-dry-run",
      processed: 0,
      sent: 0,
      failed: 0,
      suppressed: 0,
      deliveryEnabled: false,
      reason: DELIVERY_DISABLED_REASON,
      guardrails: plan.guardrails
    };
  }

  return {
    status: "delivery-worker-not-implemented",
    processed: 0,
    sent: 0,
    failed: 0,
    suppressed: 0,
    deliveryEnabled: true,
    reason: "Delivery adapters require separate approved implementation.",
    guardrails: plan.guardrails
  };
}

export function getNuxeraNotificationOutboxReadiness() {
  const worker = buildNuxeraNotificationDeliveryPlan();

  return {
    status: "outbox-contract-ready-delivery-disabled",
    table: "nuxera_notification_outbox",
    deliveryEnabled: false,
    deliveryWorkerEnabled: worker.enabled,
    workerMode: worker.mode,
    workerGuardrails: worker.guardrails,
    supportedEvents: Object.values(NUXERA_NOTIFICATION_EVENTS),
    supportedChannels: [...ALLOWED_CHANNELS],
    statuses: [...ALLOWED_STATUSES],
    requiredBackendSteps: [
      "Aplicar SQL nuxera_notification_outbox en entorno controlado.",
      "Verificar RLS/readiness antes de habilitar writes.",
      "Conectar worker de entrega con RESEND_API_KEY/Twilio solo despues de aprobacion."
    ],
    guardrails: [
      "Readiness solamente; no aplica SQL ni envia mensajes.",
      "Los correos no deben incluir evidencia sensible ni adjuntos.",
      "Todo cambio de estado debe quedar auditable."
    ]
  };
}

function mapOutboxRow(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    audience: row.audience,
    recipientRole: row.recipient_role,
    recipientUserId: row.recipient_user_id || null,
    recipientEmail: row.recipient_email || null,
    orderId: row.order_id || null,
    subject: row.subject,
    channels: Array.isArray(row.channels) ? row.channels : [],
    priority: row.priority,
    status: row.status,
    dedupeKey: row.dedupe_key,
    attempts: row.attempts || 0,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    sentAt: row.sent_at || null
  };
}

export async function listNuxeraNotificationOutbox({ status, audience, orderId, limit = 50 } = {}) {
  const parsedLimit = Math.max(1, Math.min(Number(limit) || 50, 100));
  let query = supabaseAdmin
    .from('nuxera_notification_outbox')
    .select('id, event_id, audience, recipient_role, recipient_user_id, recipient_email, order_id, subject, channels, priority, status, dedupe_key, attempts, created_at, updated_at, sent_at');

  if (status && ALLOWED_STATUSES.has(status)) query = query.eq('status', status);
  if (audience && ['applicant', 'grantor', 'admin'].includes(audience)) query = query.eq('audience', audience);
  if (orderId) query = query.eq('order_id', orderId);

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(parsedLimit);
  if (error) throw error;

  return {
    status: 'outbox-list-ready',
    entries: (data || []).map(mapOutboxRow),
    guardrails: [
      'Listado administrativo de outbox; no envia mensajes ni cambia estado.',
      'El envio real permanece deshabilitado hasta aprobar el worker de entrega.'
    ]
  };
}

export function buildNuxeraNotificationDryRunBatch(intents = [], options = {}) {
  const plan = buildNuxeraNotificationDeliveryPlan({
    deliveryEnabled: false,
    channels: options.channels,
    maxBatchSize: options.maxBatchSize
  });
  const normalizedIntents = Array.isArray(intents) ? intents.slice(0, plan.maxBatchSize) : [];
  const previews = [];
  const rejected = [];
  const seen = new Set();

  normalizedIntents.forEach((intent, index) => {
    try {
      const preview = buildNuxeraNotificationOutboxPreview(intent);
      const duplicate = seen.has(preview.dedupeKey);
      seen.add(preview.dedupeKey);
      previews.push({
        ...preview,
        dryRunIndex: index,
        duplicate,
        status: duplicate ? 'suppressed' : 'preview'
      });
    } catch (error) {
      rejected.push({
        dryRunIndex: index,
        reason: error.message,
        eventId: intent?.eventId || null
      });
    }
  });

  return {
    status: 'notification-dry-run-ready',
    deliveryEnabled: false,
    workerMode: plan.mode,
    processed: previews.length + rejected.length,
    previews,
    rejected,
    summary: {
      accepted: previews.length,
      duplicates: previews.filter((preview) => preview.duplicate).length,
      rejected: rejected.length,
      channels: [...new Set(previews.flatMap((preview) => preview.channels))].length
    },
    guardrails: [
      'Dry-run only; no Supabase insert, email, WhatsApp or in-app delivery is performed.',
      'Duplicate previews are marked suppressed but not persisted.',
      'Human review is required before any notification is queued.'
    ]
  };
}
