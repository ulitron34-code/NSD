import { describe, expect, it } from 'vitest';
import { getNuxeraControlledChangeRequest } from './nuxeraControlledChangeRequestService.js';

const READY_WRITE_GATE = Object.freeze({
  id: 'nuxera-controlled-write-gate',
  readyForControlledWriteChange: true,
  requestedScope: 'applicant-checklist-controlled-write',
  requestedEnvironment: 'controlled-non-production',
  changeTicket: 'CHG-NUXERA-001',
  blockers: []
});

describe('nuxeraControlledChangeRequestService', () => {
  it('blocks change request when write gate is not ready', () => {
    const request = getNuxeraControlledChangeRequest({
      writeGate: {
        id: 'nuxera-controlled-write-gate',
        readyForControlledWriteChange: false,
        blockers: ['Approval package is not ready for human release decision.']
      },
      deploymentWindow: '2026-07-20T03:00Z/2026-07-20T04:00Z',
      rollbackOwner: 'Platform lead',
      releaseReviewer: 'Compliance reviewer'
    });

    expect(request.status).toBe('blocked-by-change-request-gates');
    expect(request.readyForChangeReview).toBe(false);
    expect(request.summary.writeGateReady).toBe(false);
    expect(request.blockers).toEqual(
      expect.arrayContaining(['Write gate is not ready for controlled write change review.'])
    );
  });

  it('blocks change request when required change metadata is missing', () => {
    const request = getNuxeraControlledChangeRequest({
      writeGate: READY_WRITE_GATE,
      deploymentWindow: 'TODO'
    });

    expect(request.readyForChangeReview).toBe(false);
    expect(request.summary.changeMetadataMissing).toBe(3);
    expect(request.missingChangeMetadata.map((item) => item.id)).toEqual([
      'deploymentWindow',
      'rollbackOwner',
      'releaseReviewer'
    ]);
    expect(request.markdown).toContain('Missing change metadata: Deployment Window.');
  });

  it('builds a read-only package for separate change-control review', () => {
    const request = getNuxeraControlledChangeRequest({
      writeGate: READY_WRITE_GATE,
      deploymentWindow: '2026-07-20T03:00Z/2026-07-20T04:00Z',
      rollbackOwner: 'Platform lead',
      releaseReviewer: 'Compliance reviewer'
    });

    expect(request).toMatchObject({
      id: 'nuxera-controlled-change-request',
      status: 'ready-for-separate-change-review',
      readyForChangeReview: true,
      sourceWriteGateId: 'nuxera-controlled-write-gate',
      summary: {
        writeGateReady: true,
        changeMetadataMissing: 0,
        blockers: 0,
        reviewChecklist: 7,
        rollbackSteps: 5
      }
    });
    expect(request.blockers).toEqual([]);
    expect(request.nextDecision).toContain('do not enable writes from this endpoint');
    expect(request.guardrails.join(' ')).toContain('does not persist tickets');
    expect(request.markdown).toContain('# NUXERA Controlled Change Request Package');
  });
});
