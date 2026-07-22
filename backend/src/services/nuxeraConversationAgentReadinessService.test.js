import { describe, expect, it } from 'vitest';
import {
  buildNuxeraConversationAgentEnvelope,
  buildNuxeraConversationPreview,
  getNuxeraConversationAgentReadiness
} from './nuxeraConversationAgentReadinessService.js';

describe('nuxeraConversationAgentReadinessService', () => {
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
});