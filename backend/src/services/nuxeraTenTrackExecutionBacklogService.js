import { getNuxeraTenTrackClosurePlan } from './nuxeraTenTrackClosureService.js';

const CRITICAL_TRACK_IDS = new Set([
  'sql-rls-non-production',
  'controlled-persistence-writes',
  'production-cutover'
]);

const OWNER_BY_DOMAIN = Object.freeze({
  cutover: 'admin-platform',
  persistence: 'backend',
  notifications: 'communications',
  agents: 'ai-ops',
  release: 'admin-platform',
  decision: 'grantor-ops',
  operations: 'case-ops',
  applicant: 'applicant-ops',
  risk: 'risk-ops',
  documentation: 'migration-ops'
});

function priorityForTrack(track) {
  if (CRITICAL_TRACK_IDS.has(track.id)) return 'critical-path';
  if (track.blockers.length >= 2 || track.percent < 70) return 'high';
  if (track.blockers.length > 0) return 'medium';
  return 'maintenance';
}

function nextGateForTrack(track) {
  if (track.id === 'sql-rls-non-production') return 'non-production-evidence';
  if (track.id === 'controlled-persistence-writes') return 'write-gate';
  if (track.id === 'production-cutover') return 'release-dossier';
  if (track.domain === 'notifications') return 'approval-ledger';
  if (track.domain === 'agents') return 'retention-policy';
  if (track.domain === 'risk') return 'provider-shadow-run';
  return track.blockers.length ? 'controlled-review' : 'maintenance-review';
}

function buildBacklogItem(track, index) {
  const blockers = Array.isArray(track.blockers) ? track.blockers : [];
  const nextActions = Array.isArray(track.nextActions) ? track.nextActions : [];
  return {
    id: `exec-${track.id}`,
    order: index + 1,
    sourceTrackId: track.id,
    label: track.label,
    domain: track.domain,
    owner: OWNER_BY_DOMAIN[track.domain] || 'admin-platform',
    priority: priorityForTrack({ ...track, blockers }),
    status: blockers.length ? 'blocked' : 'ready-for-review',
    percent: Number.isFinite(track.percent) ? track.percent : 0,
    nextGate: nextGateForTrack({ ...track, blockers }),
    action: nextActions[0] || 'Mantener evidencia y confirmar que no hay regresion.',
    readyCriteria: [
      'Observed evidence attached to the controlled review pack.',
      'Human reviewer accepts the result for this track.',
      'Rollback/no-go condition documented before any write or delivery is enabled.'
    ],
    blocker: blockers[0] || null,
    dependencies: CRITICAL_TRACK_IDS.has(track.id)
      ? ['cutover-review-pack', 'human-approval', 'rollback-plan']
      : ['ten-track-closure-plan', 'admin-review']
  };
}

function buildMilestones(items) {
  const byPriority = (priority) => items.filter((item) => item.priority === priority);
  return [
    {
      id: 'evidence-first',
      label: 'Evidencia no productiva primero',
      status: byPriority('critical-path').some((item) => item.status === 'blocked') ? 'blocked' : 'ready',
      items: byPriority('critical-path').map((item) => item.id),
      outcome: 'SQL/RLS, write gate y cutover quedan listos para revision humana sin activar produccion.'
    },
    {
      id: 'operational-cycles',
      label: 'Ciclos operativos completos',
      status: items.some((item) => ['notifications', 'agents', 'operations', 'applicant'].includes(item.domain) && item.status === 'blocked') ? 'blocked' : 'ready',
      items: items.filter((item) => ['notifications', 'agents', 'operations', 'applicant'].includes(item.domain)).map((item) => item.id),
      outcome: 'Solicitante, otorgante, notificaciones, chat y SLA quedan conectados con trazabilidad.'
    },
    {
      id: 'risk-decision-hardening',
      label: 'Riesgo y decision con fuentes',
      status: items.some((item) => ['risk', 'decision'].includes(item.domain) && item.status === 'blocked') ? 'blocked' : 'ready',
      items: items.filter((item) => ['risk', 'decision'].includes(item.domain)).map((item) => item.id),
      outcome: 'Mesa de decision y risk/KYB usan provenance y proveedores en modo controlado.'
    }
  ];
}

export function getNuxeraTenTrackExecutionBacklog() {
  const closurePlan = getNuxeraTenTrackClosurePlan();
  const items = closurePlan.tracks.map(buildBacklogItem)
    .sort((a, b) => {
      const priorityRank = { 'critical-path': 0, high: 1, medium: 2, maintenance: 3 };
      return priorityRank[a.priority] - priorityRank[b.priority] || a.order - b.order;
    });
  const blocked = items.filter((item) => item.status === 'blocked').length;
  const criticalBlocked = items.filter((item) => item.priority === 'critical-path' && item.status === 'blocked').length;

  return {
    id: 'nuxera-ten-track-execution-backlog',
    sourcePlanId: closurePlan.id,
    status: criticalBlocked ? 'blocked-by-critical-path' : blocked ? 'blocked-by-operational-gates' : 'ready-for-final-review',
    summary: {
      total: items.length,
      blocked,
      criticalPath: items.filter((item) => item.priority === 'critical-path').length,
      criticalBlocked,
      highPriority: items.filter((item) => item.priority === 'high').length,
      averageCompletion: closurePlan.summary.averageCompletion
    },
    items,
    milestones: buildMilestones(items),
    nextDecision: criticalBlocked
      ? 'Run and attach controlled non-production SQL/RLS evidence before enabling any write path.'
      : 'Use the highest-priority blocked item as the next reviewed implementation block.',
    guardrails: [
      'Execution backlog is read-only and does not apply SQL, enable delivery, persist approvals or deploy production.',
      'A ready item means ready for human review, not ready for automatic production release.',
      'Critical-path items must be closed before notification delivery, provider orchestration or chat retention changes move beyond preview.'
    ]
  };
}
