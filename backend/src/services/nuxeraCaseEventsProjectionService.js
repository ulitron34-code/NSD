function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function mapProjectedEvent(event, index) {
  return {
    id: event.id || `projected-event-${index + 1}`,
    orderId: event.metadata?.orderId || null,
    eventType: event.type || 'event',
    phase: event.phase || 'intake',
    status: event.status || 'observed',
    severity: event.severity || 'info',
    actorRole: event.actorRole || 'system',
    sourceTable: event.source || 'virtual_projection',
    sourceId: String(event.id || '').split(':').at(-1) || null,
    occurredAt: event.timestamp || null,
    title: event.title || 'Evento NUXERA',
    summary: event.description || 'Evento operacional proyectado sin payload sensible.',
    metadata: {
      requiresHumanReview: Boolean(event.requiresHumanReview),
      sensitiveContentExcluded: event.sensitiveContentExcluded !== false,
      projectedFrom: event.source || 'timeline'
    },
    persistenceStatus: 'virtual-read-only'
  };
}

export function buildNuxeraCaseEventsProjection(timeline) {
  const events = asArray(timeline?.events).map(mapProjectedEvent);
  return {
    id: `nuxera-case-events-projection:${timeline?.orderId || 'unknown'}:${timeline?.workspaceRole || 'unknown'}`,
    status: events.length ? 'case-events-projection-ready' : 'case-events-projection-empty',
    orderId: timeline?.orderId || null,
    workspaceRole: timeline?.workspaceRole || null,
    contract: {
      table: 'nuxera_case_events',
      persistenceMode: 'not-applied-read-only-projection',
      primaryKey: 'id uuid',
      requiredColumns: [
        'order_id uuid not null',
        'event_type text not null',
        'phase text not null',
        'status text not null',
        'severity text not null',
        'actor_role text not null',
        'source_table text',
        'source_id text',
        'occurred_at timestamptz not null',
        'summary text',
        'metadata jsonb not null default {}'
      ],
      rlsIntent: [
        'owner can read owner-safe event metadata for own order',
        'authorized_grantor can read grantor-safe event metadata for accepted/shared data-room order',
        'admin can read operational metadata across orders',
        'writes reserved for service_role until controlled write gate is approved'
      ]
    },
    summary: {
      total: events.length,
      warning: events.filter((event) => event.severity === 'warning').length,
      critical: events.filter((event) => event.severity === 'critical').length,
      humanReviewRequired: events.filter((event) => event.metadata.requiresHumanReview).length,
      phases: timeline?.summary?.phases || [],
      typeFilters: timeline?.summary?.typeFilters || []
    },
    events,
    guardrails: [
      'case_events projection is read-only and does not create nuxera_case_events rows.',
      'Projected events exclude sensitive payloads and retain only operational metadata.',
      'Persisted writes require SQL/RLS evidence and a separate controlled write flag.'
    ]
  };
}
function buildDedupeKey(event, orderId) {
  return [
    orderId || 'missing-order',
    event.eventType || 'event',
    event.sourceTable || 'virtual_projection',
    event.sourceId || event.id || 'missing-source',
    event.occurredAt || 'missing-timestamp'
  ].map((part) => String(part).replace(/\s+/g, '-').toLowerCase()).join(':');
}

function buildInsertPayload(event, orderId) {
  return {
    order_id: orderId,
    event_type: event.eventType,
    phase: event.phase,
    status: event.status,
    severity: event.severity,
    actor_role: event.actorRole,
    source_table: event.sourceTable,
    source_id: event.sourceId,
    occurred_at: event.occurredAt,
    summary: event.summary,
    metadata: {
      ...event.metadata,
      title: event.title,
      dedupeKey: buildDedupeKey(event, orderId),
      projectedEventId: event.id,
      persistencePlan: 'dry-run-only'
    },
    sensitive_content_excluded: event.metadata?.sensitiveContentExcluded !== false,
    requires_human_review: Boolean(event.metadata?.requiresHumanReview)
  };
}

function buildCandidate(event, orderId) {
  const blockers = [
    !orderId ? 'missing-order-id' : null,
    !event.eventType ? 'missing-event-type' : null,
    !event.phase ? 'missing-phase' : null,
    !event.occurredAt ? 'missing-occurred-at' : null,
    event.metadata?.sensitiveContentExcluded === false ? 'sensitive-content-not-excluded' : null
  ].filter(Boolean);

  return {
    id: `case-event-insert-candidate:${event.id}`,
    projectedEventId: event.id,
    dedupeKey: buildDedupeKey(event, orderId),
    status: blockers.length ? 'blocked-by-contract' : 'ready-for-non-production-dry-run',
    insertReady: blockers.length === 0,
    blockers,
    insertPayload: buildInsertPayload(event, orderId),
    guardrails: [
      'Candidate is not inserted by this plan.',
      'Service-role write remains blocked until SQL/RLS evidence and controlled write gate approval.'
    ]
  };
}

export function buildNuxeraCaseEventsPersistencePlan(projection, options = {}) {
  const orderId = projection?.orderId || options.orderId || null;
  const events = asArray(projection?.events);
  const candidates = events.map((event) => buildCandidate(event, orderId));
  const readyCandidates = candidates.filter((candidate) => candidate.insertReady);
  const blockedCandidates = candidates.filter((candidate) => !candidate.insertReady);

  return {
    id: `nuxera-case-events-persistence-plan:${orderId || 'unknown'}:${projection?.workspaceRole || 'admin'}`,
    status: readyCandidates.length && !blockedCandidates.length ? 'case-events-persistence-plan-ready' : readyCandidates.length ? 'case-events-persistence-plan-partial' : 'case-events-persistence-plan-blocked',
    table: 'nuxera_case_events',
    mode: 'dry-run-only',
    orderId,
    workspaceRole: projection?.workspaceRole || options.workspaceRole || 'admin',
    summary: {
      totalProjected: events.length,
      insertReady: readyCandidates.length,
      blocked: blockedCandidates.length,
      warnings: events.filter((event) => event.severity === 'warning').length,
      critical: events.filter((event) => event.severity === 'critical').length,
      humanReviewRequired: events.filter((event) => event.metadata?.requiresHumanReview).length,
      uniqueDedupeKeys: new Set(candidates.map((candidate) => candidate.dedupeKey)).size
    },
    candidates: candidates.slice(0, 25),
    requiredGates: [
      'Apply reviewed nuxera_case_events SQL in non-production first.',
      'Capture RLS evidence for owner, non-owner, authorized grantor, unauthorized grantor and admin.',
      'Approve a separate service_role write path and rollback plan.',
      'Keep production writes disabled until cutover review is accepted.'
    ],
    guardrails: [
      'Persistence plan is read-only; it prepares insert payloads but never writes rows.',
      'Client input cannot enable writes from this endpoint.',
      'Sensitive content remains excluded from every insert candidate.'
    ]
  };
}
