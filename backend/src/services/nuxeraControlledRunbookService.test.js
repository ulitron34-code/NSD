import { describe, expect, it } from 'vitest';
import { getNuxeraControlledRunbook } from './nuxeraControlledRunbookService.js';

describe('nuxeraControlledRunbookService', () => {
  it('blocks controlled runs when required metadata is missing', () => {
    const runbook = getNuxeraControlledRunbook({ generatedAt: '2026-07-17T20:00:00.000Z' });

    expect(runbook).toMatchObject({
      id: 'nuxera-controlled-runbook',
      status: 'blocked-by-run-metadata',
      readyForRun: false,
      summary: {
        identities: 4,
        endpointRows: 8,
        missingMetadata: 6
      }
    });
    expect(runbook.missingMetadata.map((item) => item.id)).toEqual([
      'environment',
      'repoCommit',
      'operator',
      'reviewer',
      'priorKnownGoodCommit',
      'rollbackOwner'
    ]);
    expect(runbook.commands.map((item) => item.id)).toEqual([
      'generate-scaffold-markdown',
      'verify-local-guards'
    ]);
    expect(runbook.guardrails.join(' ')).toContain('does not execute endpoints');
  });

  it('marks the runbook ready only after controlled-run metadata is filled', () => {
    const runbook = getNuxeraControlledRunbook({
      generatedAt: '2026-07-17T20:00:00.000Z',
      environment: 'non-production-supabase',
      repoCommit: '8e3899b',
      operator: 'Compliance operator',
      reviewer: 'Security reviewer',
      priorKnownGoodCommit: '6e2d174',
      rollbackOwner: 'Platform owner'
    });

    expect(runbook.status).toBe('ready-for-controlled-supabase-run');
    expect(runbook.readyForRun).toBe(true);
    expect(runbook.missingMetadata).toEqual([]);
    expect(runbook.nextDecision).toContain('Run controlled non-production Supabase verification');
    expect(runbook.acceptanceGates).toEqual(
      expect.arrayContaining([expect.stringContaining('All four RLS identities')])
    );
  });

  it('blocks placeholder assignments and production environments', () => {
    const runbook = getNuxeraControlledRunbook({
      generatedAt: '2026-07-17T20:00:00.000Z',
      environment: 'production',
      repoCommit: '66769b9',
      operator: 'pending-assignment',
      reviewer: 'TBD',
      priorKnownGoodCommit: '3ac37a4',
      rollbackOwner: 'unassigned'
    });

    expect(runbook.status).toBe('blocked-by-run-metadata');
    expect(runbook.readyForRun).toBe(false);
    expect(runbook.missingMetadata.map((item) => item.id)).toEqual([
      'environment',
      'operator',
      'reviewer',
      'rollbackOwner'
    ]);
  });
});
