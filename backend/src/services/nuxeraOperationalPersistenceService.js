import { buildNuxeraCaseEventsPersistencePlan, buildNuxeraCaseEventsProjection } from './nuxeraCaseEventsProjectionService.js';
import { buildNuxeraNotificationApprovalPlan, getNuxeraNotificationApprovalPersistenceReadiness } from './nuxeraNotificationOutboxService.js';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function getUniqueCount(items, keyName) {
  return new Set(items.map((item) => item?.[keyName]).filter(Boolean)).size;
}

function buildEvidenceProvenanceLedger(timeline = {}) {
  const events = asArray(timeline.events);
  const evidenceEvents = events.filter((event) => /evidence|document|checklist|review/i.test(`${event.type || ''} ${event.phase || ''} ${event.source || ''}`));
  const candidates = evidenceEvents.slice(0, 25).map((event, index) => ({
    id: `evidence-provenance-candidate:${event.id || index + 1}`,
    sourceEventId: event.id || null,
    orderId: timeline.orderId || null,
    status: timeline.orderId && event.id ? 'ready-for-non-production-dry-run' : 'blocked-by-contract',
    insertReady: Boolean(timeline.orderId && event.id),
    dedupeKey: [timeline.orderId || 'missing-order', 'evidence-provenance', event.source || 'timeline', event.id || index + 1].join(':').toLowerCase(),
    insertPayload: {
      order_id: timeline.orderId || null,
      source_event_id: event.id || null,
      source_table: event.source || 'timeline',
      evidence_kind: event.type || 'evidence',
      visibility_scope: event.actorRole === 'grantor' ? 'authorized-grantor' : 'owner-admin',
      metadata: {
        title: event.title || null,
        phase: event.phase || null,
        sensitiveContentExcluded: event.sensitiveContentExcluded !== false,
        persistencePlan: 'dry-run-only'
      }
    },
    blockers: [
      !timeline.orderId ? 'missing-order-id' : null,
      !event.id ? 'missing-source-event-id' : null,
      event.sensitiveContentExcluded === false ? 'sensitive-content-not-excluded' : null
    ].filter(Boolean)
  }));

  return {
    id: `nuxera-evidence-provenance-ledger:${timeline.orderId || 'unknown'}`,
    table: 'nuxera_evidence_links',
    status: candidates.some((candidate) => candidate.insertReady) ? 'evidence-provenance-dry-run-ready' : 'evidence-provenance-needs-real-events',
    mode: 'dry-run-only',
    summary: {
      totalProjected: candidates.length,
      insertReady: candidates.filter((candidate) => candidate.insertReady).length,
      blocked: candidates.filter((candidate) => !candidate.insertReady).length,
      uniqueDedupeKeys: getUniqueCount(candidates, 'dedupeKey')
    },
    candidates,
    requiredGates: [
      'Confirm evidence_links SQL/RLS against real applicant, grantor and admin tokens.',
      'Persist only metadata references; never persist document bodies in the operational ledger.',
      'Approve rollback and duplicate-key handling before enabling service_role writes.'
    ],
    guardrails: [
      'Evidence provenance candidates are metadata-only and dry-run only.',
      'Sensitive evidence content is excluded from every candidate payload.'
    ]
  };
}

function buildNotificationApprovalLedger(timeline, context) {
  const approvalPlan = buildNuxeraNotificationApprovalPlan(timeline, context);
  const readiness = getNuxeraNotificationApprovalPersistenceReadiness();
  const candidates = asArray(approvalPlan.approvalItems).slice(0, 25).map((item) => ({
    id: `notification-approval-candidate:${item.id}`,
    sourceApprovalItemId: item.id,
    orderId: item.orderId || approvalPlan.orderId || timeline?.orderId || null,
    status: item.duplicate ? 'blocked-duplicate' : 'ready-for-non-production-dry-run',
    insertReady: !item.duplicate,
    dedupeKey: item.dedupeKey,
    insertPayload: {
      order_id: item.orderId || approvalPlan.orderId || timeline?.orderId || null,
      event_id: item.eventId,
      audience: item.audience,
      recipient_role: item.recipientRole,
      template_id: item.template?.templateId || null,
      approval_status: 'pending-human-approval',
      delivery_enabled_at_approval: false,
      dedupe_key: item.dedupeKey,
      sensitive_content_excluded: true,
      metadata: {
        source: 'nuxera-notification-approval-plan',
        channels: item.channels,
        priority: item.priority,
        persistencePlan: 'dry-run-only'
      }
    },
    blockers: item.duplicate ? ['duplicate-notification-intent'] : []
  }));

  return {
    id: `nuxera-notification-approval-ledger:${timeline?.orderId || 'unknown'}`,
    table: readiness.table,
    status: candidates.some((candidate) => candidate.insertReady) ? 'notification-approval-dry-run-ready' : 'notification-approval-empty',
    mode: 'dry-run-only',
    readiness,
    summary: {
      totalProjected: candidates.length,
      insertReady: candidates.filter((candidate) => candidate.insertReady).length,
      blocked: candidates.filter((candidate) => !candidate.insertReady).length,
      uniqueDedupeKeys: getUniqueCount(candidates, 'dedupeKey')
    },
    candidates,
    requiredGates: readiness.requiredBackendSteps,
    guardrails: [
      'Notification approval candidates do not queue or send messages.',
      'Delivery remains disabled unless the separate notification delivery gate is approved.'
    ]
  };
}

function buildControlledOperationalWriteGate(ledgers, context = {}) {
  const enabled = String(context.writeEnabled || process.env.NUXERA_OPERATIONAL_PERSISTENCE_WRITE_ENABLED || '').trim().toLowerCase() === 'true';
  const rlsEvidenceAccepted = context.rlsEvidenceAccepted === true || String(process.env.NUXERA_OPERATIONAL_PERSISTENCE_RLS_ACCEPTED || '').trim().toLowerCase() === 'true';
  const rollbackRehearsed = context.rollbackRehearsed === true || String(process.env.NUXERA_OPERATIONAL_PERSISTENCE_ROLLBACK_REHEARSED || '').trim().toLowerCase() === 'true';
  const serviceRoleApproved = context.serviceRoleApproved === true || String(process.env.NUXERA_OPERATIONAL_PERSISTENCE_SERVICE_ROLE_APPROVED || '').trim().toLowerCase() === 'true';
  const orderId = context.orderId || context.expedientId || ledgers.find((ledger) => ledger.orderId)?.orderId || null;
  const insertCandidates = ledgers.flatMap((ledger) => asArray(ledger.candidates).filter((candidate) => candidate.insertReady).map((candidate) => ({
    ledger: ledger.table,
    candidateId: candidate.id,
    dedupeKey: candidate.dedupeKey,
    insertPayload: candidate.insertPayload
  })));
  const blockers = [
    !orderId ? 'Missing order id for controlled persistence' : null,
    !enabled ? 'NUXERA_OPERATIONAL_PERSISTENCE_WRITE_ENABLED is not true' : null,
    !rlsEvidenceAccepted ? 'RLS/endpoint evidence has not been accepted' : null,
    !rollbackRehearsed ? 'Rollback rehearsal has not been accepted' : null,
    !serviceRoleApproved ? 'Service-role write path has not been approved' : null,
    insertCandidates.length === 0 ? 'No insert-ready candidates are available' : null
  ].filter(Boolean);

  return {
    id: 'nuxera-operational-persistence-write-gate',
    status: blockers.length ? 'write-gate-blocked' : 'write-gate-ready-for-controlled-worker',
    writeEnabled: enabled && blockers.length === 0,
    dryRunOnly: blockers.length > 0,
    requiredFlags: {
      NUXERA_OPERATIONAL_PERSISTENCE_WRITE_ENABLED: enabled,
      NUXERA_OPERATIONAL_PERSISTENCE_RLS_ACCEPTED: rlsEvidenceAccepted,
      NUXERA_OPERATIONAL_PERSISTENCE_ROLLBACK_REHEARSED: rollbackRehearsed,
      NUXERA_OPERATIONAL_PERSISTENCE_SERVICE_ROLE_APPROVED: serviceRoleApproved
    },
    blockers,
    workerContract: {
      mode: 'service-role-controlled-batch',
      maxBatchSize: Math.max(1, Math.min(Number(context.maxBatchSize || 25) || 25, 100)),
      idempotency: 'dedupe_key required per candidate before insert',
      auditActions: ['nuxera_operational_persistence_batch_started', 'nuxera_operational_persistence_candidate_inserted', 'nuxera_operational_persistence_candidate_failed', 'nuxera_operational_persistence_batch_completed'],
      rollback: 'disable flag, stop worker, preserve audit_logs, archive bad nuxera_* rows instead of deleting'
    },
    summary: {
      ledgers: ledgers.length,
      insertCandidates: insertCandidates.length,
      uniqueDedupeKeys: getUniqueCount(insertCandidates, 'dedupeKey'),
      blockedByGates: blockers.length
    },
    insertCandidates: insertCandidates.slice(0, 25),
    guardrails: [
      'This gate describes the controlled worker contract; it does not insert rows.',
      'Writes require backend flags, accepted RLS evidence, rollback rehearsal and service-role approval.',
      'Frontend input cannot enable operational persistence.'
    ]
  };
}

export function buildNuxeraOperationalPersistencePlan(timeline = {}, context = {}) {
  const caseEventsProjection = buildNuxeraCaseEventsProjection(timeline);
  const caseEventsLedger = buildNuxeraCaseEventsPersistencePlan(caseEventsProjection, {
    orderId: timeline.orderId,
    workspaceRole: 'admin'
  });
  const notificationApprovalsLedger = buildNotificationApprovalLedger(timeline, context);
  const evidenceProvenanceLedger = buildEvidenceProvenanceLedger(timeline);
  const ledgers = [caseEventsLedger, notificationApprovalsLedger, evidenceProvenanceLedger];
  const writeGate = buildControlledOperationalWriteGate(ledgers, context);
  const insertReady = ledgers.reduce((total, ledger) => total + (ledger.summary?.insertReady || 0), 0);
  const blocked = ledgers.reduce((total, ledger) => total + (ledger.summary?.blocked || 0), 0);

  return {
    id: `nuxera-operational-persistence-plan:${timeline.orderId || 'unknown'}`,
    status: insertReady ? 'operational-persistence-dry-run-ready' : 'operational-persistence-needs-real-case-data',
    mode: 'dry-run-only',
    writeEnabled: writeGate.writeEnabled,
    orderId: timeline.orderId || null,
    workspaceRole: 'admin',
    summary: {
      ledgers: ledgers.length,
      insertReady,
      blocked,
      caseEventCandidates: caseEventsLedger.summary?.insertReady || 0,
      notificationApprovalCandidates: notificationApprovalsLedger.summary?.insertReady || 0,
      evidenceProvenanceCandidates: evidenceProvenanceLedger.summary?.insertReady || 0
    },
    ledgers,
    writeGate,
    requiredGates: [
      'Run SQL drafts in non-production and archive migration evidence.',
      'Run HTTP/RLS mustAllow and mustDeny evidence with real applicant, grantor and admin tokens.',
      'Approve service_role writes per ledger; do not use frontend flags to enable persistence.',
      'Run rollback rehearsal before production cutover.'
    ],
    guardrails: [
      'Operational persistence plan is read-only and cannot insert, update or delete rows.',
      'Every candidate uses metadata-only payloads with sensitive content excluded.',
      'Human approval remains required for notification approval and any production write gate.'
    ]
  };
}
