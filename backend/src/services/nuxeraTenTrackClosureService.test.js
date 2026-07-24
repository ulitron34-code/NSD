import { describe, expect, it } from 'vitest';
import { getNuxeraTenTrackClosurePlan } from './nuxeraTenTrackClosureService.js';

describe('nuxeraTenTrackClosureService', () => {
  it('summarizes all ten pending closure tracks without enabling production actions', () => {
    const plan = getNuxeraTenTrackClosurePlan();

    expect(plan).toMatchObject({
      id: 'nuxera-ten-track-closure-plan',
      status: 'blocked-by-controlled-cutover-evidence',
      summary: { total: 10, criticalPath: 3 }
    });
    expect(plan.progressPercent).toBeGreaterThanOrEqual(70);
    expect(plan.tracks).toHaveLength(10);
    expect(plan.tracks.map((track) => track.id)).toEqual(expect.arrayContaining([
      'sql-rls-non-production',
      'controlled-persistence-writes',
      'notifications-complete',
      'chat-agent-retention',
      'production-cutover',
      'risk-kyb-provider-orchestration'
    ]));
    expect(plan.tracks.every((track) => track.readyForProduction === false)).toBe(true);
    expect(plan.guardrails.join(' ')).toContain('does not apply SQL');
  });
});
