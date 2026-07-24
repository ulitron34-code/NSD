import { describe, expect, it } from 'vitest';
import { getNuxeraControlledReleaseDossier } from './nuxeraControlledReleaseDossierService.js';

const READY_CHANGE_REQUEST = Object.freeze({
  id: 'nuxera-controlled-change-request',
  status: 'ready-for-separate-change-review',
  readyForChangeReview: true,
  changeMetadata: {
    changeTicket: 'CHG-NUXERA-001',
    requestedEnvironment: 'controlled-non-production'
  },
  blockers: []
});

describe('nuxeraControlledReleaseDossierService', () => {
  it('blocks release dossier when change request is not ready', () => {
    const dossier = getNuxeraControlledReleaseDossier({
      changeRequest: {
        id: 'nuxera-controlled-change-request',
        readyForChangeReview: false,
        blockers: ['Missing change metadata: Deployment Window.']
      },
      dossierOwner: 'Compliance PMO',
      dossierDate: '2026-07-17',
      finalReviewer: 'Release board'
    });

    expect(dossier.status).toBe('blocked-by-release-dossier-gates');
    expect(dossier.readyForReleaseReview).toBe(false);
    expect(dossier.summary.changeRequestReady).toBe(false);
    expect(dossier.blockers).toEqual(
      expect.arrayContaining(['Change request package is not ready for separate change-control review.'])
    );
  });

  it('blocks release dossier when final dossier metadata is missing', () => {
    const dossier = getNuxeraControlledReleaseDossier({
      changeRequest: READY_CHANGE_REQUEST,
      dossierOwner: 'TODO'
    });

    expect(dossier.readyForReleaseReview).toBe(false);
    expect(dossier.summary.dossierMetadataMissing).toBe(3);
    expect(dossier.missingDossierMetadata.map((item) => item.id)).toEqual([
      'dossierOwner',
      'dossierDate',
      'finalReviewer'
    ]);
  });

  it('builds a read-only release readiness dossier', () => {
    const dossier = getNuxeraControlledReleaseDossier({
      changeRequest: READY_CHANGE_REQUEST,
      dossierOwner: 'Compliance PMO',
      dossierDate: '2026-07-17',
      finalReviewer: 'Release board'
    });

    expect(dossier).toMatchObject({
      id: 'nuxera-controlled-release-dossier',
      status: 'ready-for-release-readiness-review',
      readyForReleaseReview: true,
      sourceChangeRequestId: 'nuxera-controlled-change-request',
      summary: {
        changeRequestReady: true,
        dossierMetadataMissing: 0,
        blockers: 0,
        evidenceChain: 6,
        finalReviewChecklist: 8
      }
    });
    expect(dossier.blockers).toEqual([]);
    expect(dossier.evidenceChain.map((item) => item.id)).toContain('write-gate');
    expect(dossier.nextDecision).toContain('deployment remains a separate change-control action');
    expect(dossier.guardrails.join(' ')).toContain('does not execute endpoints');
    expect(dossier.markdown).toContain('# NUXERA Controlled Release Readiness Dossier');
  });
});
