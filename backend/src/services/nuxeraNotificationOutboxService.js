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

export async function enqueueNuxeraNotificationIntent({ intent, actorUserId, req = null, deliveryEnabled = false }) {
  const preview = buildNuxeraNotificationOutboxPreview(intent);

  if (!deliveryEnabled) {
    return {
      ...preview,
      persisted: false,
      status: 'preview'
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

export function getNuxeraNotificationOutboxReadiness() {
  return {
    status: 'outbox-contract-ready-delivery-disabled',
    table: 'nuxera_notification_outbox',
    deliveryEnabled: false,
    supportedEvents: Object.values(NUXERA_NOTIFICATION_EVENTS),
    supportedChannels: [...ALLOWED_CHANNELS],
    statuses: [...ALLOWED_STATUSES],
    requiredBackendSteps: [
      'Aplicar SQL nuxera_notification_outbox en entorno controlado.',
      'Verificar RLS/readiness antes de habilitar writes.',
      'Conectar worker de entrega con RESEND_API_KEY/Twilio solo despues de aprobacion.'
    ],
    guardrails: [
      'Readiness solamente; no aplica SQL ni envia mensajes.',
      'Los correos no deben incluir evidencia sensible ni adjuntos.',
      'Todo cambio de estado debe quedar auditable.'
    ]
  };
}
