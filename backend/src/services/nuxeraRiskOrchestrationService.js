import { supabaseAdmin } from '../config/supabase.js';
import { getAdminCaseTimeline, getApplicantCaseTimeline, getGrantorCaseTimeline } from './nuxeraCaseTimelineService.js';
import { getAuthorizedGrantorEvidenceLinks, getOwnerEvidenceLinks } from './nuxeraEvidenceLinkService.js';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeRiskLevel(orderRisk, timeline) {
  const risk = String(orderRisk || '').toLowerCase();
  if (['critical', 'critico', 'alto', 'high'].includes(risk)) return 'high';
  if (['medium', 'medio'].includes(risk)) return 'medium';
  if (['low', 'bajo'].includes(risk)) return 'low';
  if ((timeline?.summary?.criticalBlockers || 0) > 0 || (timeline?.summary?.failedNotifications || 0) > 0) return 'high';
  if ((timeline?.summary?.blockers || 0) > 0 || (timeline?.summary?.openInformationRequests || 0) > 0) return 'medium';
  return 'unknown';
}

function buildPolicyOutcome({ riskTier, timeline, evidence }) {
  const missingEvidence = !asArray(evidence?.links).length || (timeline?.summary?.openInformationRequests || 0) > 0;
  const operationalRisk = (timeline?.summary?.failedNotifications || 0) > 0 || (timeline?.summary?.slaOverdue || 0) > 0;
  const criticalRisk = riskTier === 'high' || (timeline?.summary?.criticalBlockers || 0) > 0;

  let policy = 'refer';
  if (criticalRisk || operationalRisk) policy = 'manual-review-required';
  else if (missingEvidence) policy = 'refer';

  return {
    policy,
    automatedDecision: false,
    label: policy === 'manual-review-required' ? 'Revision humana requerida' : 'Referir con evidencia faltante',
    reasons: [
      ...(criticalRisk ? ['risk-tier-or-critical-blocker'] : []),
      ...(operationalRisk ? ['operational-sla-or-notification-risk'] : []),
      ...(missingEvidence ? ['missing-or-open-evidence'] : [])
    ],
    blockedActions: ['approve', 'reject', 'issue-term-sheet', 'send-notification', 'change-permissions']
  };
}

function buildRiskProfile({ orderId, workspaceRole, timeline, evidence }) {
  const order = asObject(timeline?.order);
  const riskTier = normalizeRiskLevel(order.riskLevel, timeline);
  const policyOutcome = buildPolicyOutcome({ riskTier, timeline, evidence });
  const sources = [
    { id: 'timeline', label: 'Timeline operacional', status: timeline?.status || 'unavailable', freshness: timeline?.summary?.latestEventAt || null },
    { id: 'evidence-links', label: 'Evidence links', status: evidence?.persisted ? 'available' : 'empty-or-unavailable', freshness: asArray(evidence?.links).map((link) => link.createdAt).filter(Boolean).sort().at(-1) || null },
    { id: 'notification-outbox', label: 'Notification outbox', status: (timeline?.summary?.notifications || 0) > 0 ? 'available' : 'empty', freshness: null },
    { id: 'case-assignments', label: 'SLA/asignaciones', status: (timeline?.summary?.assignments || 0) > 0 ? 'available' : 'empty', freshness: null }
  ];

  return {
    id: `nuxera-risk-profile:${orderId}:${workspaceRole}`,
    status: policyOutcome.policy === 'manual-review-required' ? 'risk-profile-manual-review' : 'risk-profile-refer',
    orderId,
    workspaceRole,
    riskTier,
    readinessGrade: order.readinessGrade || null,
    complianceStatus: order.complianceStatus || null,
    policyOutcome,
    summary: {
      blockers: timeline?.summary?.blockers || 0,
      criticalBlockers: timeline?.summary?.criticalBlockers || 0,
      evidenceLinks: asArray(evidence?.links).length,
      openInformationRequests: timeline?.summary?.openInformationRequests || 0,
      failedNotifications: timeline?.summary?.failedNotifications || 0,
      slaOverdue: timeline?.summary?.slaOverdue || 0,
      sourceHealth: sources.filter((source) => source.status === 'available').length,
      totalSources: sources.length
    },
    signals: [
      { id: 'risk-tier', status: riskTier === 'high' ? 'attention' : riskTier === 'unknown' ? 'unknown' : 'observed', label: 'Risk tier', value: riskTier, detail: 'Derivado de metadata del expediente y senales operativas.' },
      { id: 'evidence', status: asArray(evidence?.links).length ? 'available' : 'missing', label: 'Evidencia', value: String(asArray(evidence?.links).length), detail: 'Conteo de evidence_links visibles al rol.' },
      { id: 'operations', status: timeline?.summary?.blockers ? 'attention' : 'ready', label: 'Operacion', value: String(timeline?.summary?.blockers || 0), detail: 'Blockers operativos de timeline.' },
      { id: 'policy', status: policyOutcome.policy === 'manual-review-required' ? 'attention' : 'refer', label: 'Policy', value: policyOutcome.policy, detail: 'No es decision automatica.' }
    ],
    sources,
    guardrails: [
      'Risk profile is read-only and does not run external KYB/KYC providers in this slice.',
      'Policy output is a routing signal only; no automatic approval, rejection or term sheet is produced.',
      'Role output excludes sensitive evidence content and uses metadata/summaries only.'
    ]
  };
}

async function readAdminEvidenceLinks(orderId) {
  const { data, error } = await supabaseAdmin
    .from('nuxera_evidence_links')
    .select('id, order_id, engine, visibility, provenance, created_at, archived_at')
    .eq('order_id', orderId)
    .is('archived_at', null);

  if (error) return { orderId, persisted: false, links: [] };
  const links = asArray(data).map((row) => ({ id: row.id, orderId: row.order_id, engine: row.engine, visibility: row.visibility, provenance: asObject(row.provenance), createdAt: row.created_at || null }));
  return { orderId, persisted: links.length > 0, links };
}

async function readOptionalRows(table, queryBuilder) {
  try {
    const { data, error } = await queryBuilder(supabaseAdmin.from(table));
    if (error) return { rows: [], status: 'unavailable', error: String(error.message || error) };
    return { rows: asArray(data), status: 'available', error: null };
  } catch (error) {
    return { rows: [], status: 'unavailable', error: String(error.message || error) };
  }
}

export async function getApplicantRiskProfile({ orderId, userId }) {
  const [timeline, evidence] = await Promise.all([
    getApplicantCaseTimeline({ orderId, userId }),
    getOwnerEvidenceLinks({ orderId, userId })
  ]);
  return buildRiskProfile({ orderId, workspaceRole: 'applicant', timeline, evidence });
}

export async function getGrantorRiskProfile({ orderId, userId, email }) {
  const [timeline, evidence] = await Promise.all([
    getGrantorCaseTimeline({ orderId, userId, email }),
    getAuthorizedGrantorEvidenceLinks({ orderId, userId, email })
  ]);
  return buildRiskProfile({ orderId, workspaceRole: 'grantor', timeline, evidence });
}

export async function getAdminRiskProfile({ orderId }) {
  const [timeline, evidence] = await Promise.all([
    getAdminCaseTimeline({ orderId }),
    readAdminEvidenceLinks(orderId)
  ]);
  return buildRiskProfile({ orderId, workspaceRole: 'admin', timeline, evidence });
}

export async function getAdminRiskHealth() {
  const [notifications, assignments, audit] = await Promise.all([
    readOptionalRows('nuxera_notification_outbox', (query) => query.select('id, status, priority, event_id, created_at, updated_at').order('created_at', { ascending: false }).limit(100)),
    readOptionalRows('nuxera_case_assignments', (query) => query.select('id, order_id, status, sla_due_at, sla_tier, updated_at').order('updated_at', { ascending: false }).limit(100)),
    readOptionalRows('audit_logs', (query) => query.select('id, action, entity_type, created_at, compliance_relevant').order('created_at', { ascending: false }).limit(100))
  ]);
  const now = Date.now();
  const openAssignments = assignments.rows.filter((row) => ['open', 'pending', 'assigned'].includes(String(row.status || '').toLowerCase()));
  const overdueAssignments = openAssignments.filter((row) => {
    const due = row.sla_due_at ? new Date(row.sla_due_at).getTime() : null;
    return due && due < now;
  });
  const failedNotifications = notifications.rows.filter((row) => String(row.status || '').toLowerCase() === 'failed');
  const suppressedNotifications = notifications.rows.filter((row) => String(row.status || '').toLowerCase() === 'suppressed');
  const unavailable = [notifications, assignments, audit].filter((source) => source.status !== 'available').length;
  const status = failedNotifications.length || overdueAssignments.length ? 'risk-health-attention' : unavailable ? 'risk-health-degraded' : 'risk-health-ready';

  return {
    id: 'nuxera-admin-risk-health',
    status,
    summary: {
      failedNotifications: failedNotifications.length,
      suppressedNotifications: suppressedNotifications.length,
      openAssignments: openAssignments.length,
      overdueAssignments: overdueAssignments.length,
      auditEvents: audit.rows.length,
      availableSources: 3 - unavailable,
      unavailableSources: unavailable
    },
    sources: [
      { id: 'notification-outbox', status: notifications.status, count: notifications.rows.length, error: notifications.error },
      { id: 'case-assignments', status: assignments.status, count: assignments.rows.length, error: assignments.error },
      { id: 'audit-logs', status: audit.status, count: audit.rows.length, error: audit.error }
    ],
    signals: [
      { id: 'notifications', status: failedNotifications.length ? 'attention' : 'ready', label: 'Notificaciones fallidas', value: failedNotifications.length },
      { id: 'sla', status: overdueAssignments.length ? 'attention' : 'ready', label: 'SLA vencidos', value: overdueAssignments.length },
      { id: 'audit', status: audit.status, label: 'Eventos auditables', value: audit.rows.length },
      { id: 'sources', status: unavailable ? 'degraded' : 'ready', label: 'Fuentes disponibles', value: `${3 - unavailable}/3` }
    ],
    guardrails: [
      'Risk health is read-only and does not execute screenings or provider calls.',
      'Provider KYB/KYC freshness remains a contract placeholder until live providers are approved.',
      'No policy rule can approve/reject automatically from this endpoint.'
    ]
  };
}
