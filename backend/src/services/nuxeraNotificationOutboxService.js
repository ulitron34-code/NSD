import { supabaseAdmin } from '../config/supabase.js';
import { logAuditEvent } from '../utils/audit.js';
import { sendEmail } from './emailService.js';

export const NUXERA_NOTIFICATION_EVENTS = Object.freeze({
  APPLICANT_MISSING_EVIDENCE: 'applicant-missing-evidence',
  APPLICANT_EVIDENCE_REJECTED: 'applicant-evidence-rejected',
  APPLICANT_MESSAGE_RECEIVED: 'applicant-message-received',
  GRANTOR_FILE_SHARED: 'grantor-file-shared',
  GRANTOR_INFORMATION_RESPONSE: 'grantor-information-response',
  GRANTOR_DECISION_READY: 'grantor-decision-ready',
  GRANTOR_CASE_ASSIGNED: 'grantor-case-assigned',
  GRANTOR_SLA_DUE_SOON: 'grantor-sla-due-soon',
  ADMIN_CASE_SLA_OVERDUE: 'admin-case-sla-overdue',
  ADMIN_DELIVERY_FAILURE: 'admin-delivery-failure'
});

const EVENT_AUDIENCE = Object.freeze({
  [NUXERA_NOTIFICATION_EVENTS.APPLICANT_MISSING_EVIDENCE]: 'applicant',
  [NUXERA_NOTIFICATION_EVENTS.APPLICANT_EVIDENCE_REJECTED]: 'applicant',
  [NUXERA_NOTIFICATION_EVENTS.APPLICANT_MESSAGE_RECEIVED]: 'applicant',
  [NUXERA_NOTIFICATION_EVENTS.GRANTOR_FILE_SHARED]: 'grantor',
  [NUXERA_NOTIFICATION_EVENTS.GRANTOR_INFORMATION_RESPONSE]: 'grantor',
  [NUXERA_NOTIFICATION_EVENTS.GRANTOR_DECISION_READY]: 'grantor',
  [NUXERA_NOTIFICATION_EVENTS.GRANTOR_CASE_ASSIGNED]: 'grantor',
  [NUXERA_NOTIFICATION_EVENTS.GRANTOR_SLA_DUE_SOON]: 'grantor',
  [NUXERA_NOTIFICATION_EVENTS.ADMIN_CASE_SLA_OVERDUE]: 'admin',
  [NUXERA_NOTIFICATION_EVENTS.ADMIN_DELIVERY_FAILURE]: 'admin'
});

const ALLOWED_CHANNELS = new Set(['in_app', 'email', 'whatsapp']);
const ALLOWED_STATUSES = new Set(['preview', 'queued', 'sent', 'failed', 'suppressed']);
const DELIVERY_DISABLED_REASON = "NUXERA_NOTIFICATION_DELIVERY_ENABLED is not true";
const EMAIL_DELIVERY_DISABLED_REASON = "NUXERA_NOTIFICATION_EMAIL_DELIVERY_ENABLED is not true";

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
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

function isEmailDeliveryEnabled(explicitValue = process.env.NUXERA_NOTIFICATION_EMAIL_DELIVERY_ENABLED) {
  return String(explicitValue || '').trim().toLowerCase() === 'true';
}

export function isNuxeraNotificationDeliveryEnabled() {
  return isDeliveryEnabled();
}

export function isNuxeraNotificationEmailDeliveryEnabled() {
  return isEmailDeliveryEnabled();
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

function buildNuxeraNotificationEmailHtml(row) {
  const body = escapeHtml(normalizeString(row.body_preview, 1200) || 'Tienes una actualizacion pendiente en NUXERA.');
  const subject = escapeHtml(normalizeString(row.subject, 180) || 'NUXERA notification');
  const orderLine = row.order_id ? `<p style="margin:0 0 12px;color:#506070;font-size:13px;">Expediente: <strong>${escapeHtml(row.order_id)}</strong></p>` : '';
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#F6F7F9;margin:0;padding:24px;">
  <div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #D9DEE7;border-radius:10px;overflow:hidden;">
    <div style="background:#172B45;padding:22px 28px;"><h1 style="color:#fff;margin:0;font-size:20px;">NUXERA</h1><p style="color:#D8B25A;margin:6px 0 0;font-size:13px;">Notificacion operativa</p></div>
    <div style="padding:26px 28px;">
      ${orderLine}
      <h2 style="margin:0 0 12px;color:#172B45;font-size:18px;">${subject}</h2>
      <p style="margin:0;color:#344054;font-size:14px;line-height:1.55;">${body}</p>
      <div style="margin-top:20px;padding:14px;background:#F8FAFC;border-left:4px solid #D8B25A;border-radius:6px;">
        <p style="margin:0;color:#667085;font-size:12px;line-height:1.45;">Este mensaje no incluye evidencia sensible ni adjuntos. Revisa NUXERA para consultar el expediente con tus permisos vigentes.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function updateOutboxDeliveryStatus(row, status, metadata = {}) {
  const attempts = Number(row.attempts || 0) + 1;
  const patch = {
    status,
    attempts,
    updated_at: new Date().toISOString(),
    metadata: {
      ...(row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata) ? row.metadata : {}),
      delivery: metadata
    }
  };

  if (status === 'sent') patch.sent_at = patch.updated_at;

  const { error } = await supabaseAdmin
    .from('nuxera_notification_outbox')
    .update(patch)
    .eq('id', row.id);

  if (error) throw error;
  return patch;
}

async function fetchQueuedNotificationOutboxRows(limit) {
  const { data, error } = await supabaseAdmin
    .from('nuxera_notification_outbox')
    .select('id, event_id, audience, recipient_role, recipient_user_id, recipient_email, order_id, subject, body_preview, channels, priority, status, dedupe_key, attempts, metadata, created_at, updated_at, sent_at')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function processNuxeraNotificationDeliveryBatch(options = {}) {
  const plan = buildNuxeraNotificationDeliveryPlan(options);
  const emailDeliveryEnabled = isEmailDeliveryEnabled(options.emailDeliveryEnabled);
  const emailSender = options.emailSender || sendEmail;

  if (!plan.enabled) {
    return {
      status: "delivery-disabled-dry-run",
      processed: 0,
      sent: 0,
      failed: 0,
      suppressed: 0,
      deliveryEnabled: false,
      emailDeliveryEnabled: false,
      reason: DELIVERY_DISABLED_REASON,
      guardrails: plan.guardrails
    };
  }

  if (!emailDeliveryEnabled) {
    return {
      status: "email-delivery-disabled-dry-run",
      processed: 0,
      sent: 0,
      failed: 0,
      suppressed: 0,
      deliveryEnabled: true,
      emailDeliveryEnabled: false,
      reason: EMAIL_DELIVERY_DISABLED_REASON,
      guardrails: [
        ...plan.guardrails,
        "Email adapter disabled; no outbox row was read or updated."
      ]
    };
  }

  const rows = await fetchQueuedNotificationOutboxRows(plan.maxBatchSize);
  const summary = { processed: 0, sent: 0, failed: 0, suppressed: 0 };
  const results = [];

  for (const row of rows) {
    summary.processed += 1;
    const channels = normalizeChannels(row.channels);
    const hasEmailChannel = channels.includes('email');

    if (!hasEmailChannel || !row.recipient_email) {
      const reason = !hasEmailChannel ? 'email-channel-not-requested' : 'recipient-email-missing';
      await updateOutboxDeliveryStatus(row, 'suppressed', { channel: 'email', reason });
      await logAuditEvent({
        userId: options.actorUserId || null,
        action: 'nuxera_notification_delivery_suppressed',
        entityType: 'nuxera_notification_outbox',
        entityId: row.id,
        orderId: row.order_id || null,
        req: options.req || null,
        complianceRelevant: true,
        metadata: { eventId: row.event_id, audience: row.audience, reason }
      });
      summary.suppressed += 1;
      results.push({ id: row.id, status: 'suppressed', reason });
      continue;
    }

    try {
      const providerResult = await emailSender({
        to: row.recipient_email,
        subject: row.subject || 'NUXERA notification',
        html: buildNuxeraNotificationEmailHtml(row)
      });
      await updateOutboxDeliveryStatus(row, 'sent', {
        channel: 'email',
        provider: providerResult?.simulated ? 'resend-simulated' : 'resend',
        providerMessageId: providerResult?.id || providerResult?.data?.id || null
      });
      await logAuditEvent({
        userId: options.actorUserId || null,
        action: 'nuxera_notification_email_sent',
        entityType: 'nuxera_notification_outbox',
        entityId: row.id,
        orderId: row.order_id || null,
        req: options.req || null,
        complianceRelevant: true,
        metadata: { eventId: row.event_id, audience: row.audience, channel: 'email' }
      });
      summary.sent += 1;
      results.push({ id: row.id, status: 'sent' });
    } catch (error) {
      await updateOutboxDeliveryStatus(row, 'failed', { channel: 'email', reason: error.message });
      await logAuditEvent({
        userId: options.actorUserId || null,
        action: 'nuxera_notification_email_failed',
        entityType: 'nuxera_notification_outbox',
        entityId: row.id,
        orderId: row.order_id || null,
        req: options.req || null,
        complianceRelevant: true,
        metadata: { eventId: row.event_id, audience: row.audience, channel: 'email', reason: error.message }
      });
      summary.failed += 1;
      results.push({ id: row.id, status: 'failed', reason: error.message });
    }
  }

  return {
    status: "delivery-worker-completed",
    ...summary,
    deliveryEnabled: true,
    emailDeliveryEnabled: true,
    results,
    guardrails: [
      ...plan.guardrails,
      "Only queued rows with the email channel and recipient_email are delivered.",
      "Email body uses subject/body_preview only; no evidence, attachments or hidden file content are included."
    ]
  };
}
export function getNuxeraNotificationOutboxReadiness() {
  const worker = buildNuxeraNotificationDeliveryPlan();

  return {
    status: "outbox-contract-ready-delivery-disabled",
    table: "nuxera_notification_outbox",
    deliveryEnabled: false,
    emailDeliveryEnabled: isEmailDeliveryEnabled(),
    deliveryWorkerEnabled: worker.enabled,
    workerMode: worker.mode,
    workerGuardrails: worker.guardrails,
    supportedEvents: Object.values(NUXERA_NOTIFICATION_EVENTS),
    supportedChannels: [...ALLOWED_CHANNELS],
    statuses: [...ALLOWED_STATUSES],
    requiredBackendSteps: [
      "Aplicar SQL nuxera_notification_outbox en entorno controlado.",
      "Verificar RLS/readiness antes de habilitar writes.",
      "Configurar RESEND_API_KEY, NUXERA_NOTIFICATION_EMAIL_DELIVERY_ENABLED y un runbook/cron solo despues de aprobacion."
    ],
    guardrails: [
      "Readiness solamente; no aplica SQL ni envia mensajes.",
      "El worker de email permanece apagado hasta habilitar dos banderas backend.",
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


function summarizeOutboxEntries(entries = []) {
  const byStatus = entries.reduce((acc, entry) => ({ ...acc, [entry.status]: (acc[entry.status] || 0) + 1 }), {});
  const byAudience = entries.reduce((acc, entry) => ({ ...acc, [entry.audience]: (acc[entry.audience] || 0) + 1 }), {});
  const failed = entries.filter((entry) => entry.status === 'failed');
  const suppressed = entries.filter((entry) => entry.status === 'suppressed');
  const queued = entries.filter((entry) => entry.status === 'queued');
  const latestActivityAt = entries.map((entry) => entry.updatedAt || entry.sentAt || entry.createdAt).filter(Boolean).sort().at(-1) || null;

  return {
    total: entries.length,
    queued: queued.length,
    sent: byStatus.sent || 0,
    failed: failed.length,
    suppressed: suppressed.length,
    preview: byStatus.preview || 0,
    byStatus,
    byAudience,
    latestActivityAt,
    retryCandidates: failed.filter((entry) => Number(entry.attempts || 0) < 3).length,
    manualReviewRequired: failed.length + suppressed.length + queued.length
  };
}

function buildOutboxHealthSignals({ summary, readiness }) {
  return [
    {
      id: 'delivery-gate',
      label: 'Delivery gate',
      status: readiness.deliveryEnabled ? 'attention' : 'safe-disabled',
      value: readiness.deliveryEnabled ? 'enabled' : 'disabled',
      detail: readiness.deliveryEnabled ? 'Delivery general esta activo; requiere monitoreo.' : 'Delivery general apagado; no se envian mensajes.'
    },
    {
      id: 'email-gate',
      label: 'Email worker',
      status: readiness.emailDeliveryEnabled ? 'attention' : 'safe-disabled',
      value: readiness.emailDeliveryEnabled ? 'enabled' : 'disabled',
      detail: readiness.emailDeliveryEnabled ? 'Worker email activo por bandera backend.' : 'Worker email apagado por bandera backend.'
    },
    {
      id: 'failed',
      label: 'Fallidas',
      status: summary.failed ? 'attention' : 'ready',
      value: String(summary.failed),
      detail: summary.failed ? 'Hay notificaciones fallidas para revisar antes de automatizar.' : 'Sin fallas registradas en la ventana consultada.'
    },
    {
      id: 'suppressed',
      label: 'Suprimidas',
      status: summary.suppressed ? 'attention' : 'ready',
      value: String(summary.suppressed),
      detail: summary.suppressed ? 'Hay dedupe/politicas que suprimieron envios.' : 'Sin supresiones registradas.'
    },
    {
      id: 'queued',
      label: 'Pendientes',
      status: summary.queued ? 'attention' : 'ready',
      value: String(summary.queued),
      detail: summary.queued ? 'Hay filas queued; no procesar sin runbook aprobado.' : 'Sin cola pendiente.'
    }
  ];
}

export async function getNuxeraNotificationOutboxHealth({ limit = 100 } = {}) {
  const readiness = getNuxeraNotificationOutboxReadiness();
  let list;
  try {
    list = await listNuxeraNotificationOutbox({ limit });
  } catch (error) {
    if (String(error.message || '').includes('does not exist') || String(error.message || '').includes('schema cache')) {
      return {
        id: 'nuxera-notification-outbox-health',
        status: 'notification-health-unavailable',
        table: 'nuxera_notification_outbox',
        deliveryEnabled: readiness.deliveryEnabled,
        emailDeliveryEnabled: readiness.emailDeliveryEnabled,
        summary: summarizeOutboxEntries([]),
        signals: [
          { id: 'source', label: 'Outbox table', status: 'unavailable', value: '0', detail: 'Tabla opcional no disponible; health degrada sin romper.' }
        ],
        entries: [],
        guardrails: [
          'Notification health is read-only and tolerates missing optional SQL.',
          'No message is sent, queued, retried or updated from this endpoint.'
        ]
      };
    }
    throw error;
  }

  const entries = list.entries || [];
  const summary = summarizeOutboxEntries(entries);
  const status = summary.failed ? 'notification-health-attention' : summary.queued || summary.suppressed ? 'notification-health-watch' : 'notification-health-ready';

  return {
    id: 'nuxera-notification-outbox-health',
    status,
    table: 'nuxera_notification_outbox',
    deliveryEnabled: readiness.deliveryEnabled,
    emailDeliveryEnabled: readiness.emailDeliveryEnabled,
    workerMode: readiness.workerMode,
    summary,
    signals: buildOutboxHealthSignals({ summary, readiness }),
    entries: entries.slice(0, 20),
    guardrails: [
      'Notification health is read-only; it does not send, queue, retry or update rows.',
      'Failed/suppressed/queued rows require human review before any delivery automation.',
      'Email, WhatsApp and in-app remain controlled by backend flags and runbook approval.'
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
function firstEvent(events = [], predicate) {
  return events.find(predicate) || null;
}

function buildRuleIntent({ ruleId, eventId, timeline, context, recipientRole, recipientUserId, recipientEmail, subject, bodyPreview, channels, priority, sourceEvent = null }) {
  return {
    eventId,
    orderId: timeline?.orderId || context.orderId || null,
    recipientRole,
    recipientUserId: recipientUserId || null,
    recipientEmail: recipientEmail || null,
    subject,
    bodyPreview,
    channels,
    priority,
    metadata: {
      ruleId,
      source: 'nuxera-notification-rule-engine',
      sourceEventId: sourceEvent?.id || null,
      sourceEventType: sourceEvent?.type || null,
      sourceEventStatus: sourceEvent?.status || null,
      workspaceRole: timeline?.workspaceRole || 'admin',
      dryRunOnly: true
    }
  };
}

export function buildNuxeraNotificationRulesDryRun(timeline = {}, context = {}) {
  const events = Array.isArray(timeline.events) ? timeline.events : [];
  const summary = timeline.summary && typeof timeline.summary === 'object' ? timeline.summary : {};
  const order = timeline.order && typeof timeline.order === 'object' ? timeline.order : {};
  const orderLabel = order.projectName || order.caseNumber || timeline.orderId || context.orderId || 'expediente NUXERA';
  const rules = [];
  const intents = [];

  const applicantRecipient = {
    recipientRole: 'applicant',
    recipientUserId: context.applicantRecipientUserId || order.userId || null,
    recipientEmail: context.applicantRecipientEmail || null
  };
  const grantorRecipient = {
    recipientRole: 'grantor',
    recipientUserId: context.grantorRecipientUserId || null,
    recipientEmail: context.grantorRecipientEmail || null
  };
  const adminRecipient = {
    recipientRole: 'admin',
    recipientUserId: context.adminRecipientUserId || 'admin-operations',
    recipientEmail: context.adminRecipientEmail || null
  };

  const openRequest = firstEvent(events, (event) => event.type === 'information-request' && ['open', 'pending', 'requested'].includes(String(event.status || '').toLowerCase()));
  if (openRequest || Number(summary.openInformationRequests || 0) > 0 || Number(summary.evidence || 0) === 0) {
    const intent = buildRuleIntent({
      ruleId: 'applicant-missing-evidence',
      eventId: NUXERA_NOTIFICATION_EVENTS.APPLICANT_MISSING_EVIDENCE,
      timeline,
      context,
      ...applicantRecipient,
      subject: 'Tu expediente NUXERA requiere evidencia adicional',
      bodyPreview: `${orderLabel} / ${openRequest?.title || openRequest?.description || 'faltantes documentales por atender'}`,
      channels: ['in_app', 'email'],
      priority: 'high',
      sourceEvent: openRequest
    });
    rules.push({ id: 'applicant-missing-evidence', status: 'matched', audience: 'applicant', reason: 'open-information-request-or-empty-evidence', sourceEventId: openRequest?.id || null });
    intents.push(intent);
  }

  const assignmentEvent = firstEvent(events, (event) => event.type === 'assignment' && ['open', 'pending', 'assigned'].includes(String(event.status || '').toLowerCase()));
  if (assignmentEvent) {
    const intent = buildRuleIntent({
      ruleId: 'grantor-case-assigned',
      eventId: NUXERA_NOTIFICATION_EVENTS.GRANTOR_CASE_ASSIGNED,
      timeline,
      context,
      ...grantorRecipient,
      subject: 'Tienes un expediente asignado en NUXERA',
      bodyPreview: `${orderLabel} / ${assignmentEvent.metadata?.slaTier || 'SLA operativo'} / ${assignmentEvent.description || 'revision requerida'}`,
      channels: ['in_app', 'email'],
      priority: 'high',
      sourceEvent: assignmentEvent
    });
    rules.push({ id: 'grantor-case-assigned', status: 'matched', audience: 'grantor', reason: 'open-assignment', sourceEventId: assignmentEvent.id });
    intents.push(intent);
  }

  if (Number(summary.slaDueSoon || 0) > 0) {
    const intent = buildRuleIntent({
      ruleId: 'grantor-sla-due-soon',
      eventId: NUXERA_NOTIFICATION_EVENTS.GRANTOR_SLA_DUE_SOON,
      timeline,
      context,
      ...grantorRecipient,
      subject: 'SLA NUXERA por vencer',
      bodyPreview: `${orderLabel} / ${summary.slaDueSoon} asignacion(es) por vencer`,
      channels: ['in_app', 'email'],
      priority: 'high',
      sourceEvent: assignmentEvent
    });
    rules.push({ id: 'grantor-sla-due-soon', status: 'matched', audience: 'grantor', reason: 'sla-due-soon', sourceEventId: assignmentEvent?.id || null });
    intents.push(intent);
  }

  if (Number(summary.slaOverdue || 0) > 0) {
    const intent = buildRuleIntent({
      ruleId: 'admin-case-sla-overdue',
      eventId: NUXERA_NOTIFICATION_EVENTS.ADMIN_CASE_SLA_OVERDUE,
      timeline,
      context,
      ...adminRecipient,
      subject: 'SLA NUXERA vencido requiere seguimiento',
      bodyPreview: `${orderLabel} / ${summary.slaOverdue} asignacion(es) vencida(s)`,
      channels: ['in_app'],
      priority: 'critical',
      sourceEvent: assignmentEvent
    });
    rules.push({ id: 'admin-case-sla-overdue', status: 'matched', audience: 'admin', reason: 'sla-overdue', sourceEventId: assignmentEvent?.id || null });
    intents.push(intent);
  }

  if (Number(summary.failedNotifications || 0) > 0) {
    const failedNotification = firstEvent(events, (event) => event.type === 'notification' && String(event.status || '').toLowerCase() === 'failed');
    const intent = buildRuleIntent({
      ruleId: 'admin-delivery-failure',
      eventId: NUXERA_NOTIFICATION_EVENTS.ADMIN_DELIVERY_FAILURE,
      timeline,
      context,
      ...adminRecipient,
      subject: 'Fallo de entrega de notificacion NUXERA',
      bodyPreview: `${orderLabel} / ${summary.failedNotifications} notificacion(es) fallida(s)`,
      channels: ['in_app'],
      priority: 'critical',
      sourceEvent: failedNotification
    });
    rules.push({ id: 'admin-delivery-failure', status: 'matched', audience: 'admin', reason: 'failed-notification', sourceEventId: failedNotification?.id || null });
    intents.push(intent);
  }

  if (Number(summary.blockers || 0) === 0 && Number(summary.evidence || 0) > 0 && Number(summary.openInformationRequests || 0) === 0) {
    const intent = buildRuleIntent({
      ruleId: 'grantor-decision-ready',
      eventId: NUXERA_NOTIFICATION_EVENTS.GRANTOR_DECISION_READY,
      timeline,
      context,
      ...grantorRecipient,
      subject: 'Expediente NUXERA listo para analisis de mesa',
      bodyPreview: `${orderLabel} / evidencia y timeline sin blockers criticos`,
      channels: ['in_app', 'email'],
      priority: 'high',
      sourceEvent: firstEvent(events, (event) => event.type === 'evidence')
    });
    rules.push({ id: 'grantor-decision-ready', status: 'matched', audience: 'grantor', reason: 'evidence-ready-no-blockers', sourceEventId: intent.metadata.sourceEventId });
    intents.push(intent);
  }

  const dryRun = buildNuxeraNotificationDryRunBatch(intents, { maxBatchSize: context.maxBatchSize || 25 });

  return {
    id: `nuxera-notification-rules-dry-run:${timeline.orderId || context.orderId || 'unknown'}`,
    status: intents.length ? 'notification-rules-dry-run-ready' : 'notification-rules-dry-run-empty',
    orderId: timeline.orderId || context.orderId || null,
    workspaceRole: 'admin',
    matchedRules: rules,
    summary: {
      matchedRules: rules.length,
      generatedIntents: intents.length,
      accepted: dryRun.summary.accepted,
      rejected: dryRun.summary.rejected,
      duplicates: dryRun.summary.duplicates,
      byAudience: intents.reduce((acc, intent) => ({ ...acc, [intent.recipientRole]: (acc[intent.recipientRole] || 0) + 1 }), {})
    },
    intents,
    dryRun,
    guardrails: [
      'Notification rules dry-run is read-only and never queues outbox rows.',
      'Recipients must be provided by an authorized admin context before any real queueing.',
      'Rules generate operational notices only; no evidence, attachments, approval or decision is sent.'
    ]
  };
}
