const TRACKS = Object.freeze([
  {
    id: 'sql-rls-non-production',
    label: 'SQL/RLS non-production validation',
    status: 'blocked-by-controlled-evidence',
    domain: 'cutover',
    percent: 70,
    implemented: ['SQL drafts exist for case_events, notification_approvals and evidence provenance.', 'Local SQL checker validates additive shape and read-only RLS policies.'],
    blockers: ['Observed non-production RLS evidence is still required for owner, foreign applicant, authorized grantor, unauthorized grantor and admin identities.'],
    nextActions: ['Run controlled Supabase non-production verification and attach evidence to the cutover pack.']
  },
  {
    id: 'controlled-persistence-writes',
    label: 'Controlled persistence writes',
    status: 'blocked-by-write-gate',
    domain: 'persistence',
    percent: 62,
    implemented: ['case_events persistence plan is dry-run only.', 'notification approval ledger readiness exists as read-only contract.', 'case assignment write preview is feature-flag gated.'],
    blockers: ['No service_role ledger insert path should be enabled until SQL/RLS evidence and change approval are complete.'],
    nextActions: ['Design service_role writes for case_events and notification_approvals behind explicit backend flags and audit logs.']
  },
  {
    id: 'notifications-complete',
    label: 'Notifications complete lifecycle',
    status: 'partial-controlled',
    domain: 'notifications',
    percent: 78,
    implemented: ['Outbox readiness, health, templates, rules dry-run, approval plan, approval preview and manual email batch worker exist.', 'Delivery remains protected by backend flags.'],
    blockers: ['No persisted approval history yet.', 'WhatsApp and in-app adapters are not implemented.', 'No scheduler/cron is approved.'],
    nextActions: ['Persist approval ledger after RLS evidence, then add delivery-attempt history and retry review.']
  },
  {
    id: 'chat-agent-retention',
    label: 'Chat/agent retention and authorized context',
    status: 'blocked-by-retention-policy',
    domain: 'agents',
    percent: 74,
    implemented: ['Conversation turn endpoint derives role server-side and audits metadata only.', 'Agent readiness lists authorized operational sources and blocked actions.', 'Role chat UI is mounted with guardrails.'],
    blockers: ['Retention policy for full chat text is not approved.', 'Retrieval depth is still intentionally narrow.'],
    nextActions: ['Approve retention policy, then add role-scoped retrieval packs without storing sensitive text by default.']
  },
  {
    id: 'production-cutover',
    label: 'Production cutover package',
    status: 'blocked-by-release-evidence',
    domain: 'release',
    percent: 68,
    implemented: ['Verification plan, scaffold, runbook, approval package, write gate, change request and release dossier services exist.', 'Docs track go/no-go and rollback guardrails.'],
    blockers: ['Observed evidence, human approval metadata, change ticket, release window and rollback owner still need completion.'],
    nextActions: ['Fill cutover evidence and route to human release-readiness review before deployment/promotion.']
  },
  {
    id: 'decision-desk-source-tracing',
    label: 'Mesa de decision source tracing',
    status: 'partial-read-only',
    domain: 'decision',
    percent: 76,
    implemented: ['Grantor decision package and admin evidence coverage are read-only and metadata-only.', 'Evidence provenance SQL draft exists.'],
    blockers: ['Strong document/page/section provenance is not persisted yet.', 'Decision package remains non-binding and not export-approved.'],
    nextActions: ['Apply provenance columns in non-production, then map extracted references into decision packages.']
  },
  {
    id: 'case-management-sla-handoff',
    label: 'Gestion de expedientes SLA/handoff',
    status: 'partial-controlled',
    domain: 'operations',
    percent: 80,
    implemented: ['Grantor management differs from Mesa with SLA, blockers, assignment history and Desk handoff preview.', 'Assignment preview/write route is backend-flag gated.'],
    blockers: ['Production assignment writes are disabled.', 'Handoff to Mesa is still preview-only.'],
    nextActions: ['After RLS evidence, enable controlled assignment writes in non-production and design a no-auto-decision Desk handoff ledger.']
  },
  {
    id: 'applicant-live-actions',
    label: 'Solicitante live actions',
    status: 'partial-read-only',
    domain: 'applicant',
    percent: 72,
    implemented: ['Applicant checklist/state, evidence, timeline, risk profile and conversation UI are connected with fallbacks.', 'case_events projection shows operational event contract.'],
    blockers: ['Applicant actions do not yet write durable case_events rows.', 'Information request response cycle is not fully unified with notifications.'],
    nextActions: ['Persist case_events from applicant checklist/evidence/request actions once the write gate is approved.']
  },
  {
    id: 'risk-kyb-provider-orchestration',
    label: 'Risk/KYB provider orchestration',
    status: 'provider-integration-pending',
    domain: 'risk',
    percent: 63,
    implemented: ['Risk profile by role and admin risk health aggregate current internal signals without external provider calls.', 'AI provider policy restricts low-risk providers.'],
    blockers: ['Real KYB/KYC provider contracts, freshness SLAs and versioned policy engine remain pending.'],
    nextActions: ['Add shadow/dry-run provider adapters and versioned policy rules before any automated risk routing is trusted.']
  },
  {
    id: 'docs-continuation-sync',
    label: 'Docs/continuation sync',
    status: 'ready-with-maintenance',
    domain: 'documentation',
    percent: 86,
    implemented: ['MEJORAS, PROJECT_STATE, persistence contracts, runbooks and cutover pack are being updated with each block.', 'Git commits are pushed to the controlled migration branch.'],
    blockers: ['Downloads/USB mirrors may lag when not explicitly refreshed.', 'Operational evidence docs still need real run results.'],
    nextActions: ['After each implementation block, update continuation docs and attach observed validation snapshot.']
  }
]);

function cloneTrack(track) {
  return {
    ...track,
    implemented: [...track.implemented],
    blockers: [...track.blockers],
    nextActions: [...track.nextActions],
    readyForProduction: track.blockers.length === 0 && track.status.startsWith('ready')
  };
}

function buildSummary(tracks) {
  const blockers = tracks.reduce((total, track) => total + track.blockers.length, 0);
  const average = Math.round(tracks.reduce((total, track) => total + track.percent, 0) / Math.max(tracks.length, 1));
  const blocked = tracks.filter((track) => track.blockers.length > 0).length;
  return {
    total: tracks.length,
    averageCompletion: average,
    blocked,
    ready: tracks.filter((track) => track.readyForProduction).length,
    blockers,
    criticalPath: tracks.filter((track) => ['sql-rls-non-production', 'controlled-persistence-writes', 'production-cutover'].includes(track.id)).length
  };
}

export function getNuxeraTenTrackClosurePlan() {
  const tracks = TRACKS.map(cloneTrack);
  const summary = buildSummary(tracks);
  return {
    id: 'nuxera-ten-track-closure-plan',
    status: summary.blockers ? 'blocked-by-controlled-cutover-evidence' : 'ready-for-release-review',
    progressPercent: summary.averageCompletion,
    tracks,
    summary,
    nextBigMove: 'Complete non-production SQL/RLS evidence, then wire service_role persistence writes behind backend flags.',
    guardrails: [
      'This closure plan is read-only; it does not apply SQL, enable flags, deploy production or send notifications.',
      'A track marked partial or ready in UI is not production approval.',
      'Any real write, provider call, delivery adapter or retention change requires separate human approval and rollback evidence.'
    ]
  };
}
