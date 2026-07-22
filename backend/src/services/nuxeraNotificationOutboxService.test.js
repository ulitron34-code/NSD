import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = {
  inserted: null,
  auditEvents: []
};

vi.mock('../config/supabase.js', () => {
  function makeBuilder(table) {
    const builder = {
      insert: vi.fn((rows) => {
        state.inserted = { table, row: rows[0] };
        return builder;
      }),
      select: vi.fn(() => builder),
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
  buildNuxeraNotificationOutboxPreview,
  enqueueNuxeraNotificationIntent,
  processNuxeraNotificationDeliveryBatch,
  getNuxeraNotificationOutboxReadiness
} from './nuxeraNotificationOutboxService.js';

describe('nuxeraNotificationOutboxService', () => {
  beforeEach(() => {
    state.inserted = null;
    state.auditEvents = [];
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
