import { generateJsonWithFallback } from './aiJsonProvider.js';
import { logAuditEvent } from '../utils/audit.js';

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

function normalizeConversationMessage(value) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 1200);
}

function buildAssistantDraft({ role, policy, message, selectedId, allowed }) {
  const topic = message.toLowerCase();
  const canDiscussEvidence = topic.includes('evidencia') || topic.includes('document') || topic.includes('faltante') || topic.includes('risk') || topic.includes('riesgo');
  const capabilities = allowed ? policy.capabilities : [];

  if (!allowed) {
    return {
      mode: 'blocked-preview',
      answer: 'No puedo conversar sobre este expediente hasta tener un expediente seleccionado, contexto autorizado por rol y runtime aprobado.',
      suggestedActions: ['Seleccionar expediente autorizado.', 'Verificar permisos del rol.', 'Mantener runtime apagado hasta aprobacion.'],
      citations: []
    };
  }

  return {
    mode: 'safe-preview',
    answer: canDiscussEvidence
      ? `Puedo ayudarte a ordenar evidencia y faltantes del expediente ${selectedId} usando solo fuentes autorizadas para ${role}. No emitire aprobaciones, term sheets ni envios automaticos.`
      : `Puedo responder preguntas operativas del expediente ${selectedId} dentro del canal ${policy.channel}, citando fuentes autorizadas cuando esten disponibles.`,
    suggestedActions: capabilities,
    citations: policy.allowedSources.map((source) => ({ source, scope: 'role-scoped-selected-file' }))
  };
}

const OUTPUT_BLOCK_PATTERNS = [
  /\bapruebo\b|\baprobad[oa]\b|\bapproved?\b/i,
  /\bterm\s?sheet\b|\bhoja de terminos\b/i,
  /\botorgo (el|la|acceso|permiso)/i,
  /\bconfirmo (el|la) (credito|financiamiento|prestamo)/i,
  /\benviare?\b.*(email|correo|whatsapp|notificacion)/i
];

function violatesConversationOutputGuardrails(text = '') {
  return OUTPUT_BLOCK_PATTERNS.some((pattern) => pattern.test(text));
}

function buildConversationSystemPrompt(role, policy, authorizedContext) {
  return [
    `Eres el asistente NUXERA para el rol ${role} en el canal ${policy.channel}.`,
    'Responde unicamente con base en el contexto autorizado provisto; si falta informacion, dilo explicitamente en vez de inventar datos.',
    `Capacidades permitidas: ${policy.capabilities.join(', ')}.`,
    `Tienes prohibido: ${policy.blockedActions.join(', ')}.`,
    'Nunca apruebes financiamiento, emitas term sheets, otorgues accesos/permisos ni confirmes el envio de notificaciones.',
    `Contexto autorizado (JSON, puede estar vacio si no hay evidencia disponible): ${JSON.stringify(authorizedContext || {}).slice(0, 4000)}`
  ].join('\n');
}

export async function runNuxeraConversationTurn({
  role,
  orderId,
  selectedId,
  authorized,
  runtimeEnabled,
  message,
  authorizedContext = null,
  actorUserId = null,
  req = null
} = {}) {
  const envelope = buildNuxeraConversationAgentEnvelope({
    role,
    orderId: orderId || selectedId,
    selectedId,
    authorized,
    runtimeEnabled
  });
  const policy = ROLE_POLICIES[envelope.role];
  const normalizedMessage = normalizeConversationMessage(message);

  if (!envelope.allowed) {
    return {
      id: 'nuxera-conversation-turn',
      status: 'conversation-turn-blocked',
      envelope,
      message: normalizedMessage,
      answer: null,
      provider: null,
      persistence: { chatTurnPersisted: false, auditLogWritten: false },
      guardrails: [
        'Blocked before calling any LLM provider because context, authorization or runtime checks failed.',
        'No email, WhatsApp, in-app notification or database write is performed.'
      ]
    };
  }

  if (!normalizedMessage) {
    throw new Error('Mensaje NUXERA conversation invalido');
  }

  const systemPrompt = buildConversationSystemPrompt(envelope.role, policy, authorizedContext);

  let result;
  try {
    result = await generateJsonWithFallback(systemPrompt, JSON.stringify({ message: normalizedMessage }), {
      taskType: 'nuxera-conversation-turn',
      dataRisk: 'sensitive',
      anonymized: false,
      maxTokens: 800
    });
  } catch (error) {
    await logAuditEvent({
      userId: actorUserId,
      action: 'nuxera_conversation_turn_failed',
      entityType: 'nuxera_conversation_turn',
      orderId: envelope.selectedId,
      req,
      complianceRelevant: true,
      metadata: { role: envelope.role, reason: error.message }
    });
    throw error;
  }

  const blocked = violatesConversationOutputGuardrails(result.text);

  await logAuditEvent({
    userId: actorUserId,
    action: blocked ? 'nuxera_conversation_turn_output_blocked' : 'nuxera_conversation_turn_completed',
    entityType: 'nuxera_conversation_turn',
    orderId: envelope.selectedId,
    req,
    complianceRelevant: true,
    metadata: {
      role: envelope.role,
      provider: result.provider,
      model: result.model,
      messageLength: normalizedMessage.length,
      answerLength: blocked ? 0 : String(result.text || '').length
    }
  });

  if (blocked) {
    return {
      id: 'nuxera-conversation-turn',
      status: 'conversation-turn-output-blocked',
      envelope,
      message: normalizedMessage,
      answer: null,
      provider: result.provider,
      persistence: { chatTurnPersisted: false, auditLogWritten: true },
      guardrails: [
        'Provider response withheld because it referenced an approval, term sheet, permission grant or automatic send.',
        'No email, WhatsApp, in-app notification or database write is performed.'
      ]
    };
  }

  return {
    id: 'nuxera-conversation-turn',
    status: 'conversation-turn-ready',
    envelope,
    message: normalizedMessage,
    answer: result.text,
    provider: result.provider,
    model: result.model,
    costUsd: result.costUsd,
    persistence: { chatTurnPersisted: false, auditLogWritten: true },
    guardrails: [
      'Response comes from a real LLM provider selected by risk policy; the turn is never persisted.',
      'The assistant cannot approve financing, issue term sheets, change permissions or grant document access.'
    ]
  };
}

export function buildNuxeraConversationPreview(input = {}) {
  const envelope = buildNuxeraConversationAgentEnvelope({
    role: input.role,
    orderId: input.orderId || input.selectedId,
    selectedId: input.selectedId,
    authorized: input.authorized,
    runtimeEnabled: input.runtimeEnabled
  });
  const policy = ROLE_POLICIES[envelope.role];
  const message = normalizeConversationMessage(input.message);
  const draft = buildAssistantDraft({
    role: envelope.role,
    policy,
    message,
    selectedId: envelope.selectedId,
    allowed: envelope.allowed
  });

  return {
    id: 'nuxera-conversation-preview',
    status: envelope.allowed ? 'conversation-preview-ready' : 'conversation-preview-blocked',
    message,
    envelope,
    draft,
    persistence: {
      chatTurnsPersisted: false,
      auditLogWritten: false,
      retentionApproved: false
    },
    guardrails: [
      'Preview only; no LLM provider call is performed.',
      'No email, WhatsApp, in-app notification or database write is performed.',
      'The assistant cannot approve financing, issue term sheets, change permissions or grant document access.'
    ]
  };
}
