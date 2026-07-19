import { describe, expect, it } from 'vitest';
import { getNuxeraControlledEvidenceScaffold } from './nuxeraControlledEvidenceScaffoldService.js';

describe('nuxeraControlledEvidenceScaffoldService', () => {
  it('generates a controlled evidence scaffold without executing verification checks', () => {
    const scaffold = getNuxeraControlledEvidenceScaffold({
      generatedAt: '2026-07-17T20:00:00.000Z',
      environment: 'non-production-supabase',
      repoCommit: 'abc1234',
      operator: 'Compliance operator',
      reviewer: 'Security reviewer',
      priorKnownGoodCommit: 'good1234',
      rollbackOwner: 'Platform owner'
    });

    expect(scaffold).toMatchObject({
      id: 'nuxera-controlled-evidence-scaffold',
      status: 'scaffold-ready-for-controlled-run',
      sourcePlanId: 'nuxera-controlled-rls-endpoint-evidence',
      metadata: {
        environment: 'non-production-supabase',
        repoCommit: 'abc1234'
      },
      summary: {
        identities: 4,
        endpointRows: 9,
        noGoCriteria: 8,
        rollbackChecks: 5,
        sqlDrafts: 3
      }
    });
    expect(scaffold.markdown).toContain('## Required RLS identities');
    expect(scaffold.markdown).toContain('`applicant-owner`');
    expect(scaffold.markdown).toContain('`PATCH /api/nuxera/orders/:orderId/state/checklist`');
    expect(scaffold.markdown).toContain('Controlled RLS pass complete?');
    expect(scaffold.guardrails.join(' ')).toContain('no endpoint execution');
  });

  it('keeps missing run metadata as TODO placeholders', () => {
    const scaffold = getNuxeraControlledEvidenceScaffold({ generatedAt: '2026-07-17T20:00:00.000Z' });

    expect(scaffold.metadata.operator).toBe('TODO');
    expect(scaffold.metadata.verificationDate).toBe('2026-07-17');
    expect(scaffold.markdown).toContain('| Operator | TODO |');
    expect(scaffold.markdown).toContain('controlled non-production Supabase project');
  });
});
