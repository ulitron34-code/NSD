import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = {
  inserted: null,
  auditEvents: [],
  existingByDedupeKey: null,
  listRows: [],
  updates: []
};

vi.mock('../config/supabase.js', () => {
  function makeBuilder(table) {
    const builder = {
      insert: vi.fn((rows) => {
        state.inserted = { table, row: rows[0] };
        return builder;
      }),
      update: vi.fn((patch) => {
        state.updates.push({ table, patch });
        return builder;
      }),
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      in: vi.fn(() => builder),
      order: vi.fn(() => builder),
      limit: vi.fn(() => Promise.resolve({ data: state.listRows, error: null })),
      maybeSingle: vi.fn(() => Promise.resolve({ data: state.existingByDedupeKey, error: null })),
      single: vi.fn(() => Promise.resolve({
        data: { id: 'outbox-1', created_at: '2026-07-22T20:00:00.000Z', ...state.inserted.row },
        error: null
      }))
    };
    return builder;
  }

  return { supabaseAdmin: { from: vi.fn((table) => makeBuilder(table)) } };
});

vi.mock('../utils/audit.js', () => ({
  logAuditEvent: vi.fn((event) => {
    state.auditEvents.push(event);
    return Promise.resolve();
  })
}));

import {
  NUXERA_NOTIFICATION_EVENTS,
  buildNuxeraNotificationDedupeKey,
  buildNuxeraNotificationDeliveryPlan,
  buildNuxeraNotificationDryRunBatch,
  buildNuxeraNotificationOutboxPreview,
  enqueueNuxeraNotificationIntent,
  isNuxeraNotificationDeliveryEnabled,
  isNuxeraNotificationEmailDeliveryEnabled,
  listNuxeraNotificationOutbox,
  processNuxeraNotificationDeliveryBatch,
  getNuxeraNotificationOutboxReadiness
} from './nuxeraNotificationOutboxService.js';

describe('nuxeraNotificationOutboxService', () => {
  beforeEach(() => {
    state.inserted = null;
    state.auditEvents = [];
    state.existingByDedupeKey = null;
    state.listRows = [];
    state.updates = [];
  });

  it('builds a delivery-disabled preview without writing to Supabase', async () => {
    const result = await enqueueNuxeraNotificationIntent({
      actorUserId: 'admin-1',
      deliveryEnabled: false,
      intent: {
        eventId: NUXERA_NOTIFICATION_EVENTS.GRANTOR_INFORMATION_RESPONSE,
        orderId: 'order-1',
        recipientEmail: 'grantor@example.com',
        recipientRole: 'grantor',
        subject: 'Respuesta recibida',
        bodyPreview: 'El solicitante cargo evidencia nueva',
        channels: ['in-app', 'email']
      }
    });

    expect(result.persisted).toBe(false);
    expect(result.status).toBe('preview');
    expect(result.deliveryEnabled).toBe(false);
    expect(result.requiresAuditLog).toBe(true);
    expect(state.inserted).toBeNull();
    expect(state.auditEvents).toEqual([]);
  });

  it('accepts assignment and SLA notification events in dry-run normalization', () => {
    const preview = buildNuxeraNotificationOutboxPreview({
      eventId: NUXERA_NOTIFICATION_EVENTS.GRANTOR_SLA_DUE_SOON,
      recipientUserId: 'reviewer-1',
      recipientRole: 'grantor',
      orderId: 'order-1',
      subject: 'SLA por vencer',
      channels: ['in_app', 'email']
    });

    expect(preview).toMatchObject({
      eventId: NUXERA_NOTIFICATION_EVENTS.GRANTOR_SLA_DUE_SOON,
      audience: 'grantor',
      deliveryEnabled: false,
      status: 'preview'
    });
  });
  it('rejects notification intents when recipient role does not match event audience', () => {
    expect(() => buildNuxeraNotificationOutboxPreview({
      eventId: NUXERA_NOTIFICATION_EVENTS.GRANTOR_DECISION_READY,
      orderId: 'order-2',
      recipientEmail: 'applicant@example.com',
      recipientRole: 'applicant'
    })).toThrow('Audiencia NUXERA notification no coincide');
  });

  it('builds a stable lowercase dedupe key by event, file, recipient and channels', () => {
    const key = buildNuxeraNotificationDedupeKey({
      eventId: NUXERA_NOTIFICATION_EVENTS.APPLICANT_MISSING_EVIDENCE,
      orderId: 'ORDER-ABC',
      recipientEmail: 'User@Example.COM',
      channels: ['email', 'in-app', 'email']
    });

    expect(key).toBe('applicant-missing-evidence:order-abc:user@example.com:email+in_app');
  });

  it('persists queued rows and audit trail only when delivery is explicitly enabled', async () => {
    const result = await enqueueNuxeraNotificationIntent({
      actorUserId: 'admin-2',
      deliveryEnabled: true,
      intent: {
        eventId: NUXERA_NOTIFICATION_EVENTS.APPLICANT_MESSAGE_RECEIVED,
        orderId: 'order-3',
        recipientUserId: 'applicant-1',
        recipientRole: 'applicant',
        subject: 'Nuevo mensaje',
        channels: ['in_app']
      }
    });

    expect(result).toMatchObject({ persisted: true, status: 'queued', id: 'outbox-1' });
    expect(state.inserted.table).toBe('nuxera_notification_outbox');
    expect(state.inserted.row).toMatchObject({
      event_id: NUXERA_NOTIFICATION_EVENTS.APPLICANT_MESSAGE_RECEIVED,
      audience: 'applicant',
      recipient_user_id: 'applicant-1',
      order_id: 'order-3',
      status: 'queued'
    });
    expect(state.auditEvents[0]).toMatchObject({
      action: 'nuxera_notification_queued',
      entityType: 'nuxera_notification_outbox',
      orderId: 'order-3'
    });
  });

  it("builds a delivery worker plan that remains disabled unless explicitly enabled", () => {
    const disabled = buildNuxeraNotificationDeliveryPlan({ channels: ["email", "invalid"], maxBatchSize: 500 });
    const enabled = buildNuxeraNotificationDeliveryPlan({ deliveryEnabled: true, channels: ["whatsapp"], maxBatchSize: 0 });

    expect(disabled).toMatchObject({
      enabled: false,
      mode: "delivery-disabled-dry-run",
      maxBatchSize: 100,
      channels: ["email"]
    });
    expect(disabled.guardrails.join(" ")).toContain("Delivery disabled");
    expect(enabled).toMatchObject({
      enabled: true,
      mode: "delivery-enabled-controlled-worker",
      maxBatchSize: 1,
      channels: ["whatsapp"]
    });
  });

  it("runs the notification delivery worker as a no-write dry-run by default", async () => {
    const result = await processNuxeraNotificationDeliveryBatch();

    expect(result).toMatchObject({
      status: "delivery-disabled-dry-run",
      processed: 0,
      sent: 0,
      failed: 0,
      suppressed: 0,
      deliveryEnabled: false
    });
    expect(result.reason).toContain("NUXERA_NOTIFICATION_DELIVERY_ENABLED");
    expect(state.inserted).toBeNull();
    expect(state.auditEvents).toEqual([]);
  });

  it("does not read or update outbox rows when email delivery is not explicitly enabled", async () => {
    state.listRows = [
      { id: 'outbox-email-1', event_id: NUXERA_NOTIFICATION_EVENTS.APPLICANT_MISSING_EVIDENCE, audience: 'applicant', recipient_role: 'applicant', recipient_email: 'applicant@example.com', order_id: 'order-1', subject: 'Falta evidencia', body_preview: 'Carga documento faltante', channels: ['email'], priority: 'normal', status: 'queued', dedupe_key: 'k-email-1', attempts: 0, metadata: {} }
    ];

    const result = await processNuxeraNotificationDeliveryBatch({ deliveryEnabled: true });

    expect(result).toMatchObject({
      status: "email-delivery-disabled-dry-run",
      processed: 0,
      sent: 0,
      failed: 0,
      suppressed: 0,
      deliveryEnabled: true,
      emailDeliveryEnabled: false
    });
    expect(result.reason).toContain("NUXERA_NOTIFICATION_EMAIL_DELIVERY_ENABLED");
    expect(state.updates).toEqual([]);
    expect(state.auditEvents).toEqual([]);
  });

  it("delivers queued email notifications only when both delivery gates are enabled", async () => {
    const sent = [];
    state.listRows = [
      { id: 'outbox-email-1', event_id: NUXERA_NOTIFICATION_EVENTS.APPLICANT_MISSING_EVIDENCE, audience: 'applicant', recipient_role: 'applicant', recipient_email: 'applicant@example.com', order_id: 'order-1', subject: 'Falta evidencia', body_preview: 'Carga documento faltante', channels: ['email'], priority: 'normal', status: 'queued', dedupe_key: 'k-email-1', attempts: 0, metadata: {} }
    ];

    const result = await processNuxeraNotificationDeliveryBatch({
      deliveryEnabled: true,
      emailDeliveryEnabled: true,
      actorUserId: 'admin-1',
      emailSender: vi.fn(async (payload) => {
        sent.push(payload);
        return { id: 'resend-message-1' };
      })
    });

    expect(result).toMatchObject({ status: "delivery-worker-completed", processed: 1, sent: 1, failed: 0, suppressed: 0 });
    expect(sent[0]).toMatchObject({ to: 'applicant@example.com', subject: 'Falta evidencia' });
    expect(sent[0].html).toContain('NUXERA');
    expect(sent[0].html).not.toContain('attachment');
    expect(state.updates[0]).toMatchObject({ table: 'nuxera_notification_outbox' });
    expect(state.updates[0].patch).toMatchObject({ status: 'sent', attempts: 1 });
    expect(state.auditEvents[0]).toMatchObject({
      action: 'nuxera_notification_email_sent',
      entityType: 'nuxera_notification_outbox',
      entityId: 'outbox-email-1',
      orderId: 'order-1'
    });
  });
  it('builds a notification dry-run batch with duplicate suppression and no writes', () => {
    const result = buildNuxeraNotificationDryRunBatch([
      {
        eventId: NUXERA_NOTIFICATION_EVENTS.APPLICANT_MISSING_EVIDENCE,
        orderId: 'order-1',
        recipientUserId: 'applicant-1',
        recipientRole: 'applicant',
        subject: 'Falta evidencia',
        channels: ['email']
      },
      {
        eventId: NUXERA_NOTIFICATION_EVENTS.APPLICANT_MISSING_EVIDENCE,
        orderId: 'order-1',
        recipientUserId: 'applicant-1',
        recipientRole: 'applicant',
        subject: 'Duplicado',
        channels: ['email']
      },
      { eventId: NUXERA_NOTIFICATION_EVENTS.GRANTOR_DECISION_READY, recipientRole: 'applicant' }
    ]);

    expect(result).toMatchObject({
      status: 'notification-dry-run-ready',
      deliveryEnabled: false,
      summary: { accepted: 2, duplicates: 1, rejected: 1 }
    });
    expect(result.previews.map((preview) => preview.status)).toEqual(['preview', 'suppressed']);
    expect(result.rejected[0].reason).toContain('Destinatario NUXERA notification requerido');
    expect(state.inserted).toBeNull();
    expect(state.auditEvents).toEqual([]);
  });
  it('rejects a duplicate active dedupe key without inserting a second row', async () => {
    state.existingByDedupeKey = { id: 'outbox-existing', status: 'queued', created_at: '2026-07-22T18:00:00.000Z' };

    const result = await enqueueNuxeraNotificationIntent({
      actorUserId: 'admin-3',
      deliveryEnabled: true,
      intent: {
        eventId: NUXERA_NOTIFICATION_EVENTS.APPLICANT_MESSAGE_RECEIVED,
        orderId: 'order-3',
        recipientUserId: 'applicant-1',
        recipientRole: 'applicant',
        subject: 'Nuevo mensaje',
        channels: ['in_app']
      }
    });

    expect(result).toMatchObject({ persisted: false, duplicate: true, status: 'suppressed', id: 'outbox-existing' });
    expect(state.inserted).toBeNull();
    expect(state.auditEvents[0]).toMatchObject({
      action: 'nuxera_notification_duplicate_rejected',
      entityType: 'nuxera_notification_outbox',
      entityId: 'outbox-existing'
    });
  });

  it('reads the delivery-enabled flag from environment', () => {
    const original = process.env.NUXERA_NOTIFICATION_DELIVERY_ENABLED;
    const originalEmail = process.env.NUXERA_NOTIFICATION_EMAIL_DELIVERY_ENABLED;
    process.env.NUXERA_NOTIFICATION_DELIVERY_ENABLED = 'true';
    process.env.NUXERA_NOTIFICATION_EMAIL_DELIVERY_ENABLED = 'true';
    expect(isNuxeraNotificationDeliveryEnabled()).toBe(true);
    expect(isNuxeraNotificationEmailDeliveryEnabled()).toBe(true);
    process.env.NUXERA_NOTIFICATION_DELIVERY_ENABLED = 'false';
    process.env.NUXERA_NOTIFICATION_EMAIL_DELIVERY_ENABLED = 'false';
    expect(isNuxeraNotificationDeliveryEnabled()).toBe(false);
    expect(isNuxeraNotificationEmailDeliveryEnabled()).toBe(false);
    process.env.NUXERA_NOTIFICATION_DELIVERY_ENABLED = original;
    process.env.NUXERA_NOTIFICATION_EMAIL_DELIVERY_ENABLED = originalEmail;
  });

  it('lists persisted outbox rows read-only without sending anything', async () => {
    state.listRows = [
      { id: 'outbox-1', event_id: NUXERA_NOTIFICATION_EVENTS.GRANTOR_FILE_SHARED, audience: 'grantor', recipient_role: 'grantor', recipient_user_id: null, recipient_email: 'grantor@example.com', order_id: 'order-1', subject: 'Nuevo archivo', channels: ['email'], priority: 'normal', status: 'queued', dedupe_key: 'k1', attempts: 0, created_at: '2026-07-22T18:00:00.000Z', updated_at: '2026-07-22T18:00:00.000Z', sent_at: null }
    ];

    const result = await listNuxeraNotificationOutbox({ status: 'queued', limit: 10 });

    expect(result.status).toBe('outbox-list-ready');
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toMatchObject({ id: 'outbox-1', eventId: NUXERA_NOTIFICATION_EVENTS.GRANTOR_FILE_SHARED, status: 'queued' });
    expect(result.guardrails.join(' ')).toContain('no envia mensajes');
  });

  it("exposes a read-only outbox readiness contract", () => {
    const readiness = getNuxeraNotificationOutboxReadiness();

    expect(readiness).toMatchObject({
      status: "outbox-contract-ready-delivery-disabled",
      table: "nuxera_notification_outbox",
      deliveryEnabled: false,
      deliveryWorkerEnabled: false,
      workerMode: "delivery-disabled-dry-run"
    });
    expect(readiness.supportedChannels).toEqual(expect.arrayContaining(['email', 'in_app', 'whatsapp']));
    expect(readiness.guardrails.join(' ')).toContain('no aplica SQL');
  });
});
