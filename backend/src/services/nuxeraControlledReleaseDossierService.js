import { getNuxeraControlledChangeRequest } from './nuxeraControlledChangeRequestService.js';

const REQUIRED_DOSSIER_METADATA = Object.freeze([
  'dossierOwner',
  'dossierDate',
  'finalReviewer'
]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isMissingValue(value) {
  return typeof value !== 'string' || !value.trim() || value.trim().startsWith('TODO');
}

function labelFor(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
}

function buildMissingDossierMetadata(input) {
  return REQUIRED_DOSSIER_METADATA
    .filter((key) => isMissingValue(input[key]))
    .map((key) => ({ id: key, label: labelFor(key), requiredFor: 'release-dossier-review' }));
}

function buildReleaseDossierMarkdown(dossier) {
  const metadata = dossier.dossierMetadata;
  const lines = [
    '# NUXERA Controlled Release Readiness Dossier',
    '',
    `Status: ${dossier.status}`,
    `Ready for release review: ${dossier.readyForReleaseReview ? 'yes' : 'no'}`,
    `Dossier owner: ${metadata.dossierOwner}`,
    `Dossier date: ${metadata.dossierDate}`,
    `Final reviewer: ${metadata.finalReviewer}`,
    `Source change request: ${dossier.sourceChangeRequestId}`,
    '',
    '## Blockers',
    ...(dossier.blockers.length ? dossier.blockers.map((item) => `- ${item}`) : ['- None']),
    '',
    '## Evidence Chain',
    ...dossier.evidenceChain.map((item) => `- ${item.label}: ${item.status}`),
    '',
    '## Final Review Checklist',
    ...dossier.finalReviewChecklist.map((item) => `- ${item}`),
    '',
    '## Guardrails',
    ...dossier.guardrails.map((item) => `- ${item}`)
  ];

  return lines.join('\n');
}

export function getNuxeraControlledReleaseDossier(input = {}) {
  const changeRequest = input.changeRequest && typeof input.changeRequest === 'object'
    ? input.changeRequest
    : getNuxeraControlledChangeRequest(input);
  const missingDossierMetadata = buildMissingDossierMetadata(input);
  const blockers = [];

  if (!changeRequest.readyForChangeReview) {
    blockers.push('Change request package is not ready for separate change-control review.');
    blockers.push(...asArray(changeRequest.blockers));
  }
  blockers.push(...missingDossierMetadata.map((item) => `Missing dossier metadata: ${item.label}.`));

  const readyForReleaseReview = blockers.length === 0;
  const dossier = {
    id: 'nuxera-controlled-release-dossier',
    status: readyForReleaseReview ? 'ready-for-release-readiness-review' : 'blocked-by-release-dossier-gates',
    readyForReleaseReview,
    sourceChangeRequestId: changeRequest.id || 'nuxera-controlled-change-request',
    dossierMetadata: {
      dossierOwner: input.dossierOwner || 'TODO',
      dossierDate: input.dossierDate || 'TODO',
      finalReviewer: input.finalReviewer || 'TODO',
      changeTicket: input.changeTicket || changeRequest.changeMetadata?.changeTicket || 'TODO',
      requestedEnvironment: input.requestedEnvironment || changeRequest.changeMetadata?.requestedEnvironment || 'TODO'
    },
    missingDossierMetadata,
    summary: {
      changeRequestReady: Boolean(changeRequest.readyForChangeReview),
      dossierMetadataMissing: missingDossierMetadata.length,
      blockers: blockers.length,
      evidenceChain: 6,
      finalReviewChecklist: 8
    },
    evidenceChain: [
      { id: 'verification-plan', label: 'Controlled verification plan', status: 'required-before-run' },
      { id: 'evidence-scaffold', label: 'Evidence scaffold', status: 'operator-filled-observed-results-required' },
      { id: 'evidence-review', label: 'Evidence review', status: 'must-be-ready-for-human-review' },
      { id: 'approval-package', label: 'Approval package', status: 'must-be-ready-for-human-release-decision' },
      { id: 'write-gate', label: 'Write gate', status: 'must-be-ready-for-controlled-write-change' },
      { id: 'change-request', label: 'Change request package', status: changeRequest.status || 'unverified' }
    ],
    blockers,
    finalReviewChecklist: [
      'Evidence scaffold contains observed non-production Supabase results.',
      'Evidence review has no missing sections, TODO markers, missing decisions or no-go indicators.',
      'Human approval package has approver, approval date, approval scope, evidence hash and explicit decision.',
      'Write gate confirms backend readiness, approval readiness, requested environment and change ticket.',
      'Change request records deployment window, rollback owner and release reviewer.',
      'Rollback plan is rehearsable without deleting audit history.',
      'No document grants, data-room permission changes or production writes are bundled into this dossier.',
      'Final reviewer understands this dossier is not deployment approval.'
    ],
    nextDecision: readyForReleaseReview
      ? 'Route dossier to final release-readiness review; deployment remains a separate change-control action.'
      : 'Resolve release dossier blockers before final release-readiness review.',
    guardrails: [
      'Release dossier is read-only; it does not persist approvals, tickets or deployment windows.',
      'Release dossier does not execute endpoints, apply SQL, change RLS, grant document access or enable writes.',
      'Ready-for-release-readiness-review is not deployment approval.'
    ]
  };

  return {
    ...dossier,
    markdown: buildReleaseDossierMarkdown(dossier)
  };
}
