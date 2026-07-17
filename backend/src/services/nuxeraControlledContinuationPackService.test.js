import { describe, expect, it } from 'vitest';
import { getNuxeraControlledContinuationPack } from './nuxeraControlledContinuationPackService.js';

describe('nuxeraControlledContinuationPackService', () => {
  it('builds a night continuation pack with current migration progress', () => {
    const pack = getNuxeraControlledContinuationPack({
      progressPercent: 84,
      resumeFromCommit: 'abc1234',
      branch: 'nuxera-controlled-migration',
      recentCommits: [{ hash: 'abc1234', title: 'Close controlled migration handoff' }]
    });

    expect(pack).toMatchObject({
      id: 'nuxera-controlled-continuation-pack',
      status: 'ready-for-night-continuation',
      progress: { percent: 84 },
      resumeContext: {
        branch: 'nuxera-controlled-migration',
        resumeFromCommit: 'abc1234'
      }
    });
    expect(pack.recentCommits).toEqual([{ hash: 'abc1234', title: 'Close controlled migration handoff' }]);
    expect(pack.completedChain.map((item) => item.id)).toEqual(
      expect.arrayContaining(['evidence-review', 'write-gate', 'release-dossier'])
    );
    expect(pack.markdown).toContain('Resume from commit: abc1234');
  });

  it('defaults to the latest controlled release dossier commit', () => {
    const pack = getNuxeraControlledContinuationPack();

    expect(pack.progress.percent).toBe(84);
    expect(pack.resumeContext.resumeFromCommit).toBe('42c4ba7');
    expect(pack.validationSnapshot).toEqual(
      expect.arrayContaining(['Backend full suite passed: 50 files / 460 tests.'])
    );
    expect(pack.nextResumeSteps.join(' ')).toContain('controlled non-production Supabase verification');
    expect(pack.guardrails.join(' ')).toContain('does not execute endpoints');
  });
});
