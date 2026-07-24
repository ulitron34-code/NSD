import { describe, expect, it } from 'vitest';
import { getNuxeraTenTrackExecutionBacklog } from './nuxeraTenTrackExecutionBacklogService.js';

describe('nuxeraTenTrackExecutionBacklogService', () => {
  it('turns the ten-track closure plan into a prioritized read-only execution backlog', () => {
    const backlog = getNuxeraTenTrackExecutionBacklog();

    expect(backlog).toMatchObject({
      id: 'nuxera-ten-track-execution-backlog',
      sourcePlanId: 'nuxera-ten-track-closure-plan',
      status: 'blocked-by-critical-path',
      summary: { total: 10, criticalPath: 3, criticalBlocked: 3 }
    });
    expect(backlog.items).toHaveLength(10);
    expect(backlog.items.slice(0, 3).map((item) => item.priority)).toEqual([
      'critical-path',
      'critical-path',
      'critical-path'
    ]);
    expect(backlog.items[0]).toEqual(expect.objectContaining({
      sourceTrackId: 'sql-rls-non-production',
      owner: 'admin-platform',
      nextGate: 'non-production-evidence',
      status: 'blocked'
    }));
    expect(backlog.milestones.map((milestone) => milestone.id)).toEqual([
      'evidence-first',
      'operational-cycles',
      'risk-decision-hardening'
    ]);
    expect(backlog.guardrails.join(' ')).toContain('does not apply SQL');
  });
});
