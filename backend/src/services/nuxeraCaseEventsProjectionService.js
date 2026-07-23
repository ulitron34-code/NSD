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
