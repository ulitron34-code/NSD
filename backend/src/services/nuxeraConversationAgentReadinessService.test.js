import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = {
  generateResult: null,
  generateError: null,
  auditEvents: []
};

vi.mock('./aiJsonProvider.js', () => ({
  generateJsonWithFallback: vi.fn(async () => {
    if (state.generateError) throw state.generateError;
    return state.generateResult;
  })
}));

vi.mock('../utils/audit.js', () => ({
  logAuditEvent: vi.fn((event) => {
    state.auditEvents.push(event);
    return Promise.resolve();
  })
}));

import {
  buildNuxeraConversationAgentEnvelope,
  buildNuxeraConversationPreview,
  getNuxeraConversationAgentReadiness,
  runNuxeraConversationTurn
} from './nuxeraConversationAgentReadinessService.js';

describe('nuxeraConversationAgentReadinessService', () => {
  beforeEach(() => {
    state.generateResult = null;
    state.generateError = null;
    state.auditEvents = [];
  });

  it('exposes a read-only role-scoped conversation agent contract', () => {
    const readiness = getNuxeraConversationAgentReadiness();

    expect(readiness).toMatchObject({
      id: 'nuxera-conversation-agent-readiness',
      status: 'agent-contract-ready-no-chat-delivery',
      runtimeEnabled: false
    });
    expect(readiness.roles.map((role) => role.role)).toEqual(['applicant', 'grantor', 'admin']);
    expect(readiness.roles.find((role) => role.role === 'grantor')).toMatchObject({
      channel: 'grantor-decision-desk-assistant',
      requiredPermission: 'data_room:authorized:read',
      humanReviewRequired: true
    });
    expect(readiness.summary).toMatchObject({
      roles: 3,
      runtimeEnabled: false,
      humanReviewRequired: true
    });
    expect(readiness.guardrails.join(' ')).toContain('no chat runtime');
  });

  it('blocks conversation envelopes until both selected context and runtime are approved', () => {
    const blocked = buildNuxeraConversationAgentEnvelope({
      role: 'grantor',
      orderId: 'order-1',
      authorized: true
    });
    const allowed = buildNuxeraConversationAgentEnvelope({
      role: 'grantor',
      orderId: 'order-1',
      authorized: true,
      runtimeEnabled: 'true'
    });

    expect(blocked).toMatchObject({
      allowed: false,
      status: 'blocked-by-runtime-or-context',
      channel: 'grantor-decision-desk-assistant',
      runtimeEnabled: false
    });
    expect(blocked.blockers.join(' ')).toContain('runtime is disabled');
    expect(allowed).toMatchObject({
      allowed: true,
      status: 'conversation-runtime-ready',
      requiredPermission: 'data_room:authorized:read'
    });
    expect(allowed.allowedSources).toEqual(expect.arrayContaining(['messages', 'nuxera_evidence_links']));
  });

  it('allows the admin operations-monitor channel without a selected file, unlike applicant/grantor', () => {
    const adminAllowed = buildNuxeraConversationAgentEnvelope({
      role: 'admin',
      authorized: true,
      runtimeEnabled: 'true'
    });
    const adminBlocked = buildNuxeraConversationAgentEnvelope({
      role: 'admin',
      authorized: false,
      runtimeEnabled: 'true'
    });
    const applicantStillNeedsFile = buildNuxeraConversationAgentEnvelope({
      role: 'applicant',
      authorized: true,
      runtimeEnabled: 'true'
    });

    expect(adminAllowed).toMatchObject({ allowed: true, status: 'conversation-runtime-ready', selectedId: null });
    expect(adminAllowed.blockers).toEqual([]);
    expect(adminBlocked.allowed).toBe(false);
    expect(applicantStillNeedsFile.allowed).toBe(false);
    expect(applicantStillNeedsFile.blockers.join(' ')).toContain('Selected file is required');
  });

  it('builds a blocked safe conversation preview without provider calls or persistence', () => {
    const preview = buildNuxeraConversationPreview({
      role: 'grantor',
      orderId: 'order-1',
      authorized: true,
      message: 'Que evidencia falta?',
      runtimeEnabled: 'false'
    });

    expect(preview).toMatchObject({
      id: 'nuxera-conversation-preview',
      status: 'conversation-preview-blocked',
      persistence: { chatTurnsPersisted: false, auditLogWritten: false }
    });
    expect(preview.envelope.allowed).toBe(false);
    expect(preview.draft.mode).toBe('blocked-preview');
    expect(preview.guardrails.join(' ')).toContain('no LLM provider call');
  });

  it('builds an allowed preview only with selected authorized context and runtime flag', () => {
    const preview = buildNuxeraConversationPreview({
      role: 'grantor',
      orderId: 'order-1',
      authorized: true,
      message: 'Resume riesgos y documentos faltantes',
      runtimeEnabled: 'true'
    });

    expect(preview.status).toBe('conversation-preview-ready');
    expect(preview.envelope.allowedSources).toEqual(expect.arrayContaining(['document_reviews', 'nuxera_evidence_links']));
    expect(preview.draft.citations.map((citation) => citation.source)).toEqual(expect.arrayContaining(['messages', 'nuxera_evidence_links']));
    expect(preview.draft.answer).toContain('No emitire aprobaciones');
  });

  it('blocks a conversation turn before calling any provider when context is not authorized', async () => {
    const turn = await runNuxeraConversationTurn({
      role: 'grantor',
      orderId: 'order-1',
      authorized: false,
      runtimeEnabled: 'true',
      message: 'Que evidencia falta?'
    });

    expect(turn).toMatchObject({
      status: 'conversation-turn-blocked',
      answer: null,
      persistence: { chatTurnPersisted: false, auditLogWritten: false }
    });
    expect(state.auditEvents).toEqual([]);
  });

  it('runs a real conversation turn through the risk-scoped provider chain and audits metadata only', async () => {
    state.generateResult = { text: 'Falta el estado financiero mas reciente para completar la revision.', provider: 'anthropic', model: 'claude-sonnet-4-6', costUsd: 0.002 };

    const turn = await runNuxeraConversationTurn({
      role: 'grantor',
      orderId: 'order-1',
      authorized: true,
      runtimeEnabled: 'true',
      message: 'Que evidencia falta?',
      authorizedContext: { links: [] },
      actorUserId: 'grantor-1'
    });

    expect(turn).toMatchObject({
      status: 'conversation-turn-ready',
      answer: 'Falta el estado financiero mas reciente para completar la revision.',
      provider: 'anthropic',
      persistence: { chatTurnPersisted: false, auditLogWritten: true }
    });
    expect(state.auditEvents).toHaveLength(1);
    expect(state.auditEvents[0]).toMatchObject({
      userId: 'grantor-1',
      action: 'nuxera_conversation_turn_completed',
      entityType: 'nuxera_conversation_turn',
      orderId: 'order-1'
    });
    expect(state.auditEvents[0].metadata).not.toHaveProperty('answer');
    expect(state.auditEvents[0].metadata.answerLength).toBeGreaterThan(0);
  });

  it('withholds and audits a provider response that violates output guardrails', async () => {
    state.generateResult = { text: 'Confirmo el credito y te envio el term sheet por email.', provider: 'openai', model: 'gpt-4o-mini' };

    const turn = await runNuxeraConversationTurn({
      role: 'applicant',
      orderId: 'order-2',
      authorized: true,
      runtimeEnabled: 'true',
      message: 'Ya me aprobaron?'
    });

    expect(turn).toMatchObject({ status: 'conversation-turn-output-blocked', answer: null });
    expect(state.auditEvents[0]).toMatchObject({ action: 'nuxera_conversation_turn_output_blocked' });
  });

  it('audits and rethrows when every configured provider fails', async () => {
    state.generateError = new Error('Todos los proveedores de IA configurados fallaron o fueron bloqueados por politica.');

    await expect(runNuxeraConversationTurn({
      role: 'applicant',
      orderId: 'order-3',
      authorized: true,
      runtimeEnabled: 'true',
      message: 'Cual es mi siguiente paso?'
    })).rejects.toThrow('Todos los proveedores');

    expect(state.auditEvents[0]).toMatchObject({ action: 'nuxera_conversation_turn_failed' });
  });
});