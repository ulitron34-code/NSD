const ROLE_POLICIES = Object.freeze({
  applicant: {
    channel: 'applicant-file-assistant',
    requiredPermission: 'case:own:read',
    contextRequirement: 'Selected owner file with active authenticated applicant session.',
    allowedSources: ['service_orders', 'documents', 'document_extractions', 'document_reviews', 'information_requests', 'messages', 'nuxera_workspace_states', 'nuxera_evidence_links'],
    capabilities: ['explain-open-requirements', 'summarize-review-feedback', 'draft-applicant-response'],
    blockedActions: ['send-email', 'send-whatsapp', 'approve-financing', 'grant-data-room-access']
  },
  grantor: {
    channel: 'grantor-decision-desk-assistant',
    requiredPermission: 'data_room:authorized:read',
    contextRequirement: 'Selected file with accepted data_room_shares authorization for requester.',
    allowedSources: ['service_orders', 'documents', 'document_extractions', 'document_reviews', 'information_requests', 'messages', 'nuxera_evidence_links'],
    capabilities: ['summarize-authorized-evidence', 'compare-open-questions', 'draft-non-binding-desk-questions'],
    blockedActions: ['send-email', 'send-whatsapp', 'issue-term-sheet', 'change-applicant-checklist', 'grant-document-access']
  },
  admin: {
    channel: 'admin-agent-operations-monitor',
    requiredPermission: 'nuxera:admin:read',
    contextRequirement: 'Admin operational view only; no file-content chat without a selected authorized role path.',
    allowedSources: ['audit_logs', 'nuxera_admin_controls', 'nuxera_notification_outbox'],
    capabilities: ['monitor-agent-health', 'review-delivery-failures', 'prepare-controlled-runbook-notes'],
    blockedActions: ['read-file-content-by-default', 'send-notifications', 'enable-delivery', 'change-rls']
  }
});

export function getNuxeraConversationAgentReadiness() {
  const roles = Object.entries(ROLE_POLICIES).map(([role, policy]) => ({
    role,
    ...policy,
    status: role === 'admin' ? 'operations-monitor-ready-read-only' : 'requires-selected-authorized-file',
    humanReviewRequired: true
  }));

  return {
    id: 'nuxera-conversation-agent-readiness',
    status: 'agent-contract-ready-no-chat-delivery',
    runtimeEnabled: false,
    assistantScope: 'Conversation agent can answer only from role-scoped, selected-file context after authorization checks.',
    roles,
    summary: {
      roles: roles.length,
      allowedSources: [...new Set(roles.flatMap((role) => role.allowedSources))].length,
      blockedActions: [...new Set(roles.flatMap((role) => role.blockedActions))].length,
      runtimeEnabled: false,
      humanReviewRequired: true
    },
    requiredBackendSteps: [
      'Add a selected-file conversation endpoint that resolves role, order and authorization before retrieval.',
      'Build retrieval from existing messages, document_extractions and nuxera_evidence_links without broad file reads.',
      'Persist chat turns only after privacy, retention and audit rules are approved.'
    ],
    guardrails: [
      'Readiness only; no chat runtime, provider call, notification send or database write is performed.',
      'The agent must refuse when no selected authorized file is present.',
      'The agent cannot approve financing, issue term sheets, change permissions or send messages automatically.'
    ]
  };
}

export function buildNuxeraConversationAgentEnvelope(context = {}) {
  const role = ROLE_POLICIES[context.role] ? context.role : 'applicant';
  const policy = ROLE_POLICIES[role];
  const selectedId = context.orderId || context.selectedId || null;
  const hasAuthorizedContext = Boolean(selectedId && context.authorized === true);
  const runtimeEnabled = String(context.runtimeEnabled || '').trim().toLowerCase() === 'true';
  const allowed = hasAuthorizedContext && runtimeEnabled;

  return {
    allowed,
    status: allowed ? 'conversation-runtime-ready' : 'blocked-by-runtime-or-context',
    role,
    selectedId,
    channel: policy.channel,
    runtimeEnabled,
    requiredPermission: policy.requiredPermission,
    allowedSources: allowed ? policy.allowedSources : [],
    blockedSources: allowed ? [] : policy.allowedSources,
    capabilities: policy.capabilities,
    blockers: [
      !selectedId ? 'Selected file is required.' : null,
      !hasAuthorizedContext ? 'Authorized role-scoped context is required.' : null,
      !runtimeEnabled ? 'Conversation runtime is disabled until separate approval.' : null
    ].filter(Boolean),
    guardrails: [
      'No automatic email, WhatsApp or in-app send.',
      'No binding decision, term sheet or permission change.',
      'Answers must cite available authorized sources or say evidence is missing.'
    ]
  };
}
