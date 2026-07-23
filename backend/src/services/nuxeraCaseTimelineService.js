import { supabaseAdmin } from '../config/supabase.js';
import { assertApplicantOrderOwner } from './nuxeraWorkspaceStateService.js';
import { assertEvidenceGrantorAuthorized } from './nuxeraEvidenceLinkService.js';

const ROLE_VISIBILITY = Object.freeze({
  applicant: ['owner'],
  grantor: ['authorized_grantor'],
  admin: ['owner', 'authorized_grantor', 'internal']
});

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isMissingSourceError(error, source) {
  const message = String(error?.message || '').toLowerCase();
  return Boolean(message.includes(source.toLowerCase()) || message.includes('does not exist') || message.includes('schema cache'));
}

function sourceState(id, source, rows = [], error = null) {
  return {
    id,
    source,
    status: error ? 'unavailable' : 'available',
    count: Array.isArray(rows) ? rows.length : 0,
    error: error ? String(error.message || error) : null
  };
}

async function readOptionalSource({ id, source, query }) {
  try {
    const { data, error } = await query();
    if (error) {
      if (isMissingSourceError(error, source)) return { rows: [], source: sourceState(id, source, [], error) };
      throw error;
    }
    const rows = Array.isArray(data) ? data : data ? [data] : [];
    return { rows, source: sourceState(id, source, rows) };
  } catch (error) {
    if (isMissingSourceError(error, source)) return { rows: [], source: sourceState(id, source, [], error) };
    throw error;
  }
}

function eventTimestamp(...values) {
  return values.map(normalizeDate).find(Boolean) || null;
}

function buildEvent({ id, type, source, title, description, timestamp, status = 'observed', severity = 'info', actorRole = 'system', metadata = {} }) {
  return {
    id,
    type,
    source,
    title,
    description,
    timestamp,
    status,
    severity,
    actorRole,
    metadata: asObject(metadata),
    sensitiveContentExcluded: true,
    requiresHumanReview: ['decision', 'risk', 'assignment', 'information-request'].includes(type)
  };
}

function mapOrderEvents(order) {
  if (!order?.id) return [];
  const events = [
    buildEvent({
      id: `order-created:${order.id}`,
      type: 'order',
      source: 'service_orders',
      status: order.status || 'created',
      severity: 'info',
      actorRole: 'applicant',
      title: order.project_name || order.case_number || 'Expediente creado',
      description: `Expediente ${order.status || 'registrado'} en NUXERA.`,
      timestamp: eventTimestamp(order.created_at),
      metadata: { serviceType: order.service_type || null, caseNumber: order.case_number || null }
    })
  ];

  if (order.completed_at) {
    events.push(buildEvent({
      id: `order-completed:${order.id}`,
      type: 'order',
      source: 'service_orders',
      status: 'completed',
      severity: 'info',
      actorRole: 'system',
      title: 'Expediente completado',
      description: 'El expediente tiene marca de completado en service_orders.',
      timestamp: eventTimestamp(order.completed_at)
    }));
  }

  return events;
}

function mapChecklistEvents(rows) {
  return rows.map((row) => buildEvent({
    id: `workspace-state:${row.id}`,
    type: 'checklist',
    source: 'nuxera_workspace_states',
    status: row.status || 'unverified',
    severity: row.status === 'ready_for_review' ? 'success' : 'info',
    actorRole: 'applicant',
    title: 'Checklist del solicitante actualizado',
    description: `Estado ${row.status || 'sin estado'} / version ${row.version || 0}.`,
    timestamp: eventTimestamp(row.updated_at, row.created_at),
    metadata: { surface: row.surface || null, version: row.version || 0, payloadKeys: Object.keys(asObject(row.payload)) }
  }));
}

function mapEvidenceEvents(rows) {
  return rows.map((row) => buildEvent({
    id: `evidence:${row.id}`,
    type: 'evidence',
    source: 'nuxera_evidence_links',
    status: row.archived_at ? 'archived' : 'ready',
    severity: 'info',
    actorRole: row.visibility === 'owner' ? 'applicant' : row.visibility === 'authorized_grantor' ? 'grantor' : 'admin',
    title: row.label || 'Evidence link NUXERA',
    description: `${row.engine || 'intelligence'} / ${row.visibility || 'owner'}; referencia read-only sin conceder acceso documental.`,
    timestamp: eventTimestamp(row.created_at),
    metadata: { engine: row.engine || null, visibility: row.visibility || null, documentId: row.document_id || null, documentReviewId: row.document_review_id || null }
  }));
}

function mapInformationRequestEvents(rows) {
  return rows.map((row) => buildEvent({
    id: `information-request:${row.id}`,
    type: 'information-request',
    source: 'information_requests',
    status: row.status || 'open',
    severity: ['open', 'pending', 'requested'].includes(String(row.status || '').toLowerCase()) ? 'warning' : 'info',
    actorRole: 'grantor',
    title: row.title || row.document_type || 'Solicitud de informacion',
    description: `Solicitud ${row.status || 'abierta'}${row.due_date ? `; vence ${row.due_date}` : ''}.`,
    timestamp: eventTimestamp(row.created_at, row.due_date),
    metadata: { priority: row.priority || null, dueDate: row.due_date || null, documentType: row.document_type || null }
  }));
}

function mapAssignmentEvents(rows) {
  return rows.map((row) => buildEvent({
    id: `assignment:${row.id}`,
    type: 'assignment',
    source: 'nuxera_case_assignments',
    status: row.status || 'open',
    severity: row.status === 'open' ? 'info' : 'warning',
    actorRole: 'admin',
    title: 'Asignacion operativa registrada',
    description: `${row.assigned_reviewer_role || 'reviewer'} / ${row.sla_tier || 'sin SLA'}${row.sla_due_at ? ` / vence ${row.sla_due_at}` : ''}.`,
    timestamp: eventTimestamp(row.updated_at, row.created_at),
    metadata: { assignedReviewerRole: row.assigned_reviewer_role || null, assignedReviewerId: row.assigned_reviewer_id || null, slaTier: row.sla_tier || null, slaDueAt: row.sla_due_at || null, reason: row.reason || null }
  }));
}

function mapNotificationEvents(rows) {
  return rows.map((row) => buildEvent({
    id: `notification:${row.id}`,
    type: 'notification',
    source: 'nuxera_notification_outbox',
    status: row.status || 'preview',
    severity: row.status === 'failed' ? 'critical' : row.status === 'suppressed' ? 'warning' : 'info',
    actorRole: 'system',
    title: row.subject || row.event_id || 'Notificacion NUXERA',
    description: `${row.event_id || 'evento'} / ${Array.isArray(row.channels) ? row.channels.join(', ') : 'sin canal'} / ${row.status || 'preview'}.`,
    timestamp: eventTimestamp(row.updated_at, row.sent_at, row.created_at),
    metadata: { eventId: row.event_id || null, audience: row.audience || null, priority: row.priority || null, attempts: row.attempts || 0 }
  }));
}

function mapAuditEvents(rows) {
  return rows.map((row) => buildEvent({
    id: `audit:${row.id}`,
    type: 'audit',
    source: 'audit_logs',
    status: row.compliance_relevant === false ? 'non-compliance-log' : 'compliance-log',
    severity: String(row.action || '').includes('failed') ? 'warning' : 'info',
    actorRole: 'system',
    title: row.action || 'Audit log',
    description: `${row.entity_type || 'entity'}${row.entity_id ? ` / ${row.entity_id}` : ''}.`,
    timestamp: eventTimestamp(row.created_at),
    metadata: { entityType: row.entity_type || null, entityId: row.entity_id || null, userId: row.user_id || null, action: row.action || null }
  }));
}

function summarizeTimeline(events, sources) {
  const byType = events.reduce((acc, event) => ({ ...acc, [event.type]: (acc[event.type] || 0) + 1 }), {});
  return {
    total: events.length,
    blockers: events.filter((event) => ['warning', 'critical'].includes(event.severity)).length,
    evidence: byType.evidence || 0,
    notifications: byType.notification || 0,
    assignments: byType.assignment || 0,
    auditEvents: byType.audit || 0,
    openInformationRequests: events.filter((event) => event.type === 'information-request' && ['open', 'pending', 'requested'].includes(String(event.status).toLowerCase())).length,
    availableSources: sources.filter((source) => source.status === 'available').length,
    unavailableSources: sources.filter((source) => source.status === 'unavailable').length,
    latestEventAt: events.map((event) => event.timestamp).filter(Boolean).sort().at(-1) || null,
    byType
  };
}

async function readOrder(orderId) {
  const { data, error } = await supabaseAdmin
    .from('service_orders')
    .select('id, user_id, service_type, status, amount, created_at, completed_at, metadata, case_number, project_name, applicant_type, requested_amount, funding_purpose, stage, risk_level, readiness_grade, compliance_status')
    .eq('id', orderId)
    .maybeSingle();

  if (error || !data) throw new Error('Expediente no encontrado o sin permisos para timeline NUXERA');
  return data;
}

async function buildCaseTimeline({ orderId, workspaceRole }) {
  const order = await readOrder(orderId);
  const visibility = ROLE_VISIBILITY[workspaceRole] || ROLE_VISIBILITY.applicant;
  const [states, evidence, informationRequests, assignments, notifications, audit] = await Promise.all([
    readOptionalSource({
      id: 'workspace-states',
      source: 'nuxera_workspace_states',
      query: () => supabaseAdmin.from('nuxera_workspace_states').select('id, order_id, workspace_role, surface, status, payload, version, created_at, updated_at').eq('order_id', orderId).is('archived_at', null)
    }),
    readOptionalSource({
      id: 'evidence-links',
      source: 'nuxera_evidence_links',
      query: () => supabaseAdmin.from('nuxera_evidence_links').select('id, order_id, document_id, document_review_id, engine, label, visibility, provenance, created_at, archived_at').eq('order_id', orderId).in('visibility', visibility).is('archived_at', null)
    }),
    readOptionalSource({
      id: 'information-requests',
      source: 'information_requests',
      query: () => supabaseAdmin.from('information_requests').select('id, order_id, title, status, priority, due_date, document_type, created_at').eq('order_id', orderId).order('created_at', { ascending: false }).limit(25)
    }),
    readOptionalSource({
      id: 'case-assignments',
      source: 'nuxera_case_assignments',
      query: () => supabaseAdmin.from('nuxera_case_assignments').select('id, order_id, assigned_reviewer_id, assigned_reviewer_role, sla_tier, sla_due_at, status, reason, created_at, updated_at').eq('order_id', orderId).order('updated_at', { ascending: false }).limit(25)
    }),
    readOptionalSource({
      id: 'notification-outbox',
      source: 'nuxera_notification_outbox',
      query: () => supabaseAdmin.from('nuxera_notification_outbox').select('id, event_id, audience, recipient_role, order_id, subject, channels, priority, status, attempts, created_at, updated_at, sent_at').eq('order_id', orderId).order('created_at', { ascending: false }).limit(25)
    }),
    readOptionalSource({
      id: 'audit-logs',
      source: 'audit_logs',
      query: () => supabaseAdmin.from('audit_logs').select('id, user_id, action, entity_type, entity_id, order_id, metadata, compliance_relevant, created_at').eq('order_id', orderId).order('created_at', { ascending: false }).limit(25)
    })
  ]);

  const sources = [states.source, evidence.source, informationRequests.source, assignments.source, notifications.source, audit.source];
  const events = [
    ...mapOrderEvents(order),
    ...mapChecklistEvents(states.rows),
    ...mapEvidenceEvents(evidence.rows),
    ...mapInformationRequestEvents(informationRequests.rows),
    ...mapAssignmentEvents(assignments.rows),
    ...mapNotificationEvents(notifications.rows),
    ...mapAuditEvents(audit.rows)
  ].sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || ''))).slice(0, 50);

  return {
    id: `nuxera-case-timeline:${orderId}:${workspaceRole}`,
    status: events.length ? 'timeline-ready' : 'timeline-empty',
    orderId,
    workspaceRole,
    order: {
      id: order.id,
      status: order.status || null,
      projectName: order.project_name || order.case_number || order.id,
      caseNumber: order.case_number || null,
      complianceStatus: order.compliance_status || null,
      readinessGrade: order.readiness_grade || null,
      riskLevel: order.risk_level || null
    },
    summary: summarizeTimeline(events, sources),
    sources,
    events,
    guardrails: [
      'Timeline read-only: agrega fuentes existentes y no crea tablas ni eventos persistidos nuevos.',
      'El contenido sensible se excluye; se muestran metadata, estados y referencias autorizadas por rol.',
      'Las decisiones, envios y cambios de permisos permanecen sujetos a revision humana y flags backend.'
    ]
  };
}

export async function getApplicantCaseTimeline({ orderId, userId }) {
  await assertApplicantOrderOwner(orderId, userId);
  return buildCaseTimeline({ orderId, workspaceRole: 'applicant' });
}

export async function getGrantorCaseTimeline({ orderId, userId, email }) {
  await assertEvidenceGrantorAuthorized(orderId, userId, email);
  return buildCaseTimeline({ orderId, workspaceRole: 'grantor' });
}

export async function getAdminCaseTimeline({ orderId }) {
  return buildCaseTimeline({ orderId, workspaceRole: 'admin' });
}
