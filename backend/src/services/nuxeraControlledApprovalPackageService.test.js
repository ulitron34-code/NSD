import { describe, expect, it } from 'vitest';
import { getNuxeraControlledApprovalPackage } from './nuxeraControlledApprovalPackageService.js';

const READY_REVIEW = Object.freeze({
  id: 'nuxera-controlled-evidence-review',
  readyForHumanReview: true,
  sourcePlanId: 'nuxera-controlled-rls-endpoint-evidence',
  blockers: []
});

describe('nuxeraControlledApprovalPackageService', () => {
  it('blocks approval package when evidence review is not ready', () => {
    const approvalPackage = getNuxeraControlledApprovalPackage({
      evidenceReview: {
        id: 'nuxera-controlled-evidence-review',
        readyForHumanReview: false,
        blockers: ['Evidence still contains TODO.']
      },
      approver: 'Compliance lead',
      approvalDate: '2026-07-17',
      approvalScope: 'controlled applicant checklist write review',
      evidenceHash: 'sha256-test',
      decision: 'approve'
    });

    expect(approvalPackage.status).toBe('blocked-by-approval-gates');
    expect(approvalPackage.readyForReleaseDecision).toBe(false);
    expect(approvalPackage.summary).toMatchObject({
      evidenceReady: false,
      evidenceBlockers: 1,
      approvalMetadataMissing: 0,
      decisionAccepted: true
    });
    expect(approvalPackage.blockers).toEqual(
      expect.arrayContaining(['Evidence review is not ready for human approval review.'])
    );
  });

  it('blocks approval package when human approval metadata is missing', () => {
    const approvalPackage = getNuxeraControlledApprovalPackage({
      evidenceReview: READY_REVIEW,
      decision: 'approve'
    });

    expect(approvalPackage.status).toBe('blocked-by-approval-gates');
    expect(approvalPackage.summary.approvalMetadataMissing).toBe(4);
    expect(approvalPackage.missingApprovalMetadata.map((item) => item.id)).toEqual([
      'approver',
      'approvalDate',
      'approvalScope',
      'evidenceHash'
    ]);
    expect(approvalPackage.blockers.join(' ')).toContain('Missing approval metadata');
  });

  it('marks the package ready only for human release decision', () => {
    const approvalPackage = getNuxeraControlledApprovalPackage({
      evidenceReview: READY_REVIEW,
      approver: 'Compliance lead',
      approvalDate: '2026-07-17',
      approvalScope: 'controlled applicant checklist write review',
      evidenceHash: 'sha256-test',
      decision: 'approve-controlled-write-review'
    });

    expect(approvalPackage).toMatchObject({
      id: 'nuxera-controlled-approval-package',
      status: 'ready-for-human-release-decision',
      readyForReleaseDecision: true,
      summary: {
        evidenceReady: true,
        approvalMetadataMissing: 0,
        decisionAccepted: true,
        blockers: 0
      }
    });
    expect(approvalPackage.nextDecision).toContain('do not enable writes automatically');
    expect(approvalPackage.guardrails.join(' ')).toContain('not automatic production approval');
  });
});
