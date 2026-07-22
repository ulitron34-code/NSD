import { describe, expect, it } from 'vitest';
import {
  buildNuxeraConversationAgentEnvelope,
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
});
