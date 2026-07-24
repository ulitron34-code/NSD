import { getNuxeraAiProviderPolicy } from './nuxeraAiProviderPolicyService.js';
import { getNuxeraBackendReadiness } from './nuxeraBackendReadinessService.js';
import { getNuxeraConversationAgentReadiness } from './nuxeraConversationAgentReadinessService.js';
import { getNuxeraNotificationOutboxHealth, getNuxeraNotificationOutboxReadiness } from './nuxeraNotificationOutboxService.js';
import { getNuxeraTenTrackExecutionBacklog } from './nuxeraTenTrackExecutionBacklogService.js';

const REQUIRED_TABLE_IDS = Object.freeze([
  'workspace-states',
  'evidence-links',
  'admin-controls',
  'notification-outbox',
  'notification-approvals',
  'case-events',
  'case-assignments'
]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function buildDomain({ id, label, ready, severity = 'high', blockers = [], evidenceRequired = [], nextAction }) {
  return {
    id,
    label,
    ready: Boolean(ready),
    status: ready ? 'ready-for-human-review' : 'blocked',
    severity: ready ? 'medium' : severity,
    blockers,
    evidenceRequired,
    nextAction: nextAction || (ready ? 'Attach evidence to release dossier before production approval.' : 'Resolve blockers before requesting production review.')
  };
}

function evaluateBackendDomain(readiness = {}) {
  const signals = asArray(readiness.signals);
  const signalById = new Map(signals.map((signal) => [signal.id, signal]));
  const missingDefinitions = REQUIRED_TABLE_IDS.filter((id) => !signalById.has(id));
  const unavailable = REQUIRED_TABLE_IDS
    .map((id) => signalById.get(id))
    .filter((signal) => !signal?.ready);
  const blockers = [
    ...missingDefinitions.map((id) => `Readiness definition missing: ${id}.`),
    ...unavailable.map((signal) => `Table unavailable or unverified: ${signal?.table || signal?.id}.`)
  ];

  return buildDomain({
    id: 'sql-rls-backend',
    label: 'SQL/RLS and backend table readiness',
    ready: Boolean(readiness.ready) && blockers.length === 0,
    blockers,
    evidenceRequired: [
      'Supabase non-production run for every nuxera_* migration draft.',
      'RLS negative tests for owner, non-owner, authorized grantor, unauthorized grantor and admin.',
      'Schema evidence for notification approvals, case events and assignments.'
    ],
    nextAction: blockers.length
      ? 'Apply and verify pending SQL/RLS drafts in a controlled Supabase environment.'
      : 'Attach RLS evidence to approval package; do not enable production writes yet.'
  });
}

function evaluateNotificationDomain(readiness = {}, health = {}) {
  const summary = asObject(health.summary);
  const blockers = [
    readiness.deliveryWorkerEnabled ? null : 'Delivery worker is disabled by backend flag.',
    readiness.emailDeliveryEnabled ? null : 'Email delivery is disabled by backend flag.',
    Number(summary.failed || 0) > 0 ? `${summary.failed} failed notification(s) require review.` : null,
    Number(summary.queued || 0) > 0 ? `${summary.queued} queued notification(s) require manual review before automation.` : null,
    health.status === 'notification-health-unavailable' ? 'Outbox health unavailable because optional SQL may be missing.' : null
  ].filter(Boolean);

  return buildDomain({
    id: 'notifications',
    label: 'Automatic notifications and delivery worker',
    ready: blockers.length === 0,
    blockers,
    evidenceRequired: [
      'Approved templates with no evidence, attachments or binding decisions.',
      'Rules dry-run and approval plan for applicant, grantor and admin notices.',
      'Sandbox delivery batch with audit logs and retry/no-go policy.'
    ],
    nextAction: blockers.length
      ? 'Keep delivery in dry-run/preview and close outbox readiness, email flag and sandbox evidence.'
      : 'Run a controlled sandbox batch and attach outbox evidence to release dossier.'
  });
}

function evaluateAgentDomain(agent = {}, providerPolicy = {}) {
  const summary = asObject(agent.summary);
  const providerSummary = asObject(providerPolicy.summary);
  const blockers = [
    agent.runtimeEnabled ? null : 'Conversation runtime is disabled until separate approval.',
    providerPolicy.sensitiveRuntimeReady ? null : 'No configured primary provider is ready for sensitive review.',
    Number(providerSummary.configuredPrimary || 0) < 1 ? 'OpenAI or Anthropic API key required for sensitive tasks.' : null,
    Number(summary.blockedActions || 0) < 1 ? 'Agent blocked-action policy is missing or empty.' : null,
    agent.status === 'agent-contract-ready-no-chat-delivery' ? 'Agent contract is ready but runtime/retention are not production-approved.' : null
  ].filter(Boolean);

  return buildDomain({
    id: 'agent-chat',
    label: 'Conversation agent and provider policy',
    ready: blockers.length === 0,
    blockers,
    evidenceRequired: [
      'Provider policy evidence showing OpenAI/Anthropic for sensitive data.',
      'Kimi/DeepSeek restricted to low-risk anonymized tasks or shadow-runs.',
      'Prompt/output guardrail tests for no approvals, no sends, no permission grants and no term sheets.',
      'Retention decision for chat turns and metadata-only audit logs.'
    ],
    nextAction: blockers.length
      ? 'Keep chat in preview/runtime-gated mode and run provider/guardrail tests before production approval.'
      : 'Attach transcript and guardrail evidence to approval package before enabling runtime broadly.'
  });
}

function evaluateCutoverDomain(backlog = {}) {
  const summary = asObject(backlog.summary);
  const criticalBlocked = Number(summary.criticalBlocked || 0);
  const blockers = [
    criticalBlocked > 0 ? `${criticalBlocked} critical-path backlog item(s) still blocked.` : null,
    backlog.status === 'blocked-by-critical-path' ? 'Execution backlog is blocked by critical path.' : null
  ].filter(Boolean);

  return buildDomain({
    id: 'cutover',
    label: 'Production cutover and release dossier',
    ready: blockers.length === 0,
    blockers,
    evidenceRequired: [
      'Controlled evidence review marked clean.',
      'Approval package ready for human release decision.',
      'Write gate evaluated with environment and change ticket.',
      'Release dossier includes rollback owner, prior known-good commit and deployment window.'
    ],
    nextAction: blockers.length
      ? 'Close critical-path execution backlog before requesting release review.'
      : 'Prepare final change request and release dossier; production deploy remains manual.'
  });
}

export async function getNuxeraProductionReadinessGate(input = {}) {
  const backendReadiness = input.backendReadiness || await getNuxeraBackendReadiness();
  const notificationOutboxReadiness = input.notificationOutboxReadiness || getNuxeraNotificationOutboxReadiness();
  const notificationHealth = input.notificationHealth || await getNuxeraNotificationOutboxHealth({ limit: input.notificationHealthLimit || 100 });
  const aiProviderPolicy = input.aiProviderPolicy || getNuxeraAiProviderPolicy();
  const conversationAgent = input.conversationAgent || getNuxeraConversationAgentReadiness();
  const executionBacklog = input.executionBacklog || getNuxeraTenTrackExecutionBacklog();

  const domains = [
    evaluateBackendDomain(backendReadiness),
    evaluateNotificationDomain(notificationOutboxReadiness, notificationHealth),
    evaluateAgentDomain(conversationAgent, aiProviderPolicy),
    evaluateCutoverDomain(executionBacklog)
  ];
  const blocked = domains.filter((domain) => !domain.ready);
  const criticalBlocked = blocked.filter((domain) => domain.severity === 'high').length;
  const readinessPercent = Math.round((domains.filter((domain) => domain.ready).length / domains.length) * 100);

  return {
    id: 'nuxera-production-readiness-gate',
    status: blocked.length ? 'production-readiness-blocked' : 'ready-for-human-production-review',
    readyForProductionReview: blocked.length === 0,
    readyForAutomaticProduction: false,
    readinessPercent,
    summary: {
      domains: domains.length,
      ready: domains.filter((domain) => domain.ready).length,
      blocked: blocked.length,
      criticalBlocked,
      readinessPercent,
      backendReadiness: backendReadiness.summary?.readiness ?? null,
      notificationHealth: notificationHealth.status || null,
      agentRuntimeEnabled: Boolean(conversationAgent.runtimeEnabled),
      criticalBacklogBlocked: executionBacklog.summary?.criticalBlocked ?? null
    },
    domains,
    sourceSignals: {
      backendReadinessStatus: backendReadiness.status,
      notificationOutboxStatus: notificationOutboxReadiness.status,
      notificationHealthStatus: notificationHealth.status,
      aiProviderPolicyStatus: aiProviderPolicy.status,
      conversationAgentStatus: conversationAgent.status,
      executionBacklogStatus: executionBacklog.status
    },
    nextDecision: blocked.length
      ? 'Do not deploy production or enable real writes/delivery/runtime until every blocked domain has observed evidence.'
      : 'Ready for human production review only; deployment and feature flags still require a separate approved change.',
    guardrails: [
      'Production readiness gate is read-only and never applies SQL, changes RLS, enables delivery, calls providers or deploys production.',
      'Ready-for-human-production-review is not automatic deployment approval.',
      'Any blocked domain keeps production writes, email delivery and broad chat runtime disabled.'
    ]
  };
}
