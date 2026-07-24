import { describe, expect, it } from 'vitest';
import { getNuxeraControlledVerificationPlan } from './nuxeraControlledVerificationService.js';

describe('nuxeraControlledVerificationService', () => {
  it('returns the read-only controlled RLS and endpoint verification plan', () => {
    const plan = getNuxeraControlledVerificationPlan();

    expect(plan).toMatchObject({
      id: 'nuxera-controlled-rls-endpoint-evidence',
      status: 'template-required-before-controlled-run'
    });
    expect(plan.requiredIdentities.map((identity) => identity.id)).toEqual([
      'applicant-owner',
      'different-applicant',
      'authorized-grantor',
      'admin-internal'
    ]);
    expect(plan.endpointChecks.map((endpoint) => endpoint.path)).toEqual(expect.arrayContaining([
      '/api/nuxera/orders/:orderId/state',
      '/api/nuxera/orders/:orderId/state/checklist',
      '/api/nuxera/orders/:orderId/evidence',
      '/api/nuxera/orders/:orderId/grantor-evidence',
      '/api/nuxera/admin/controls',
      '/api/nuxera/admin/readiness',
      "/api/nuxera/admin/notification-outbox-readiness",
      "/api/nuxera/admin/conversation-agent-readiness"
    ]));
    expect(plan.deniedChecks.length).toBeGreaterThan(0);
    expect(plan.noGoCriteria.join(' ')).toContain('row existence');
    expect(plan.rollbackChecks.join(' ')).toContain('Prior known-good commit');
    expect(plan.guardrails.join(' ')).toContain('no ejecuta endpoints');
  });
});