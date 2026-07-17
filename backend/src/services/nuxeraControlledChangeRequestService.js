import { getNuxeraControlledWriteGate } from './nuxeraControlledWriteGateService.js';

const REQUIRED_CHANGE_METADATA = Object.freeze([
  'deploymentWindow',
  'rollbackOwner',
  'releaseReviewer'
]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isMissingValue(value) {
  return typeof value !== 'string' || !value.trim() || value.trim().startsWith('TODO');
}

function buildMissingChangeMetadata(input) {
  return REQUIRED_CHANGE_METADATA
    .filter((key) => isMissingValue(input[key]))
    .map((key) => ({
      id: key,
      label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase()),
      requiredFor: 'separate-change-control'
    }));
}

function buildChangeRequestMarkdown(changeRequest) {
  const metadata = changeRequest.changeMetadata;
  const lines = [
    '# NUXERA Controlled Change Request Package',
    '',
    `Status: ${changeRequest.status}`,
    `Ready for change review: ${changeRequest.readyForChangeReview ? 'yes' : 'no'}`,
    `Change ticket: ${metadata.changeTicket}`,
    `Requested scope: ${metadata.requestedScope}`,
    `Requested environment: ${metadata.requestedEnvironment}`,
    `Deployment window: ${metadata.deploymentWindow}`,
    `Rollback owner: ${metadata.rollbackOwner}`,
    `Release reviewer: ${metadata.releaseReviewer}`,
    '',
    '## Blockers',
    ...(changeRequest.blockers.length ? changeRequest.blockers.map((item) => `- ${item}`) : ['- None']),
    '',
    '## Review Checklist',
    ...changeRequest.reviewChecklist.map((item) => `- ${item}`),
    '',
    '## Rollback Plan',
    ...changeRequest.rollbackPlan.map((item) => `- ${item}`),
    '',
    '## Guardrails',
    ...changeRequest.guardrails.map((item) => `- ${item}`)
  ];

  return lines.join('\n');
}

export function getNuxeraControlledChangeRequest(input = {}) {
  const writeGate = input.writeGate && typeof input.writeGate === 'object'
    ? input.writeGate
    : getNuxeraControlledWriteGate(input);
  const missingChangeMetadata = buildMissingChangeMetadata(input);
  const blockers = [];

  if (!writeGate.readyForControlledWriteChange) {
    blockers.push('Write gate is not ready for controlled write change review.');
    blockers.push(...asArray(writeGate.blockers));
  }
  blockers.push(...missingChangeMetadata.map((item) => `Missing change metadata: ${item.label}.`));

  const readyForChangeReview = blockers.length === 0;
  const changeRequest = {
    id: 'nuxera-controlled-change-request',
    status: readyForChangeReview ? 'ready-for-separate-change-review' : 'blocked-by-change-request-gates',
    readyForChangeReview,
    sourceWriteGateId: writeGate.id || 'nuxera-controlled-write-gate',
    changeMetadata: {
      changeTicket: input.changeTicket || writeGate.changeTicket || 'TODO',
      requestedScope: input.requestedScope || writeGate.requestedScope || 'applicant-checklist-controlled-write',
      requestedEnvironment: input.requestedEnvironment || writeGate.requestedEnvironment || 'TODO',
      deploymentWindow: input.deploymentWindow || 'TODO',
      rollbackOwner: input.rollbackOwner || 'TODO',
      releaseReviewer: input.releaseReviewer || 'TODO'
    },
    missingChangeMetadata,
    summary: {
      writeGateReady: Boolean(writeGate.readyForControlledWriteChange),
      changeMetadataMissing: missingChangeMetadata.length,
      blockers: blockers.length,
      reviewChecklist: 7,
      rollbackSteps: 5
    },
    blockers,
    reviewChecklist: [
      'Change ticket references completed evidence review, approval package and write gate output.',
      'Deployment window is approved for the requested environment.',
      'Rollback owner is reachable during the deployment window.',
      'Feature flag rollback path is documented.',
      'Audit log expectation is confirmed before any write path is enabled.',
      'No SQL, RLS or permission mutation is bundled into this package.',
      'Production change requires separate deploy/change-control approval.'
    ],
    rollbackPlan: [
      'Disable NUXERA experience flag if UI behavior degrades.',
      'Revert to prior known-good commit if controlled write path fails.',
      'Keep nuxera_* records hidden or archived without deleting audit history.',
      'Confirm legacy service order flow remains unaffected.',
      'Record rollback outcome in the same change ticket.'
    ],
    nextDecision: readyForChangeReview
      ? 'Submit this package to separate change-control review; do not enable writes from this endpoint.'
      : 'Resolve change-request blockers before submitting to change control.',
    guardrails: [
      'Change request package is read-only; it does not persist tickets, execute endpoints, apply SQL, change RLS or enable writes.',
      'Ready-for-separate-change-review is not deployment approval.',
      'Any write enablement must happen in a separate reviewed deploy/change-control action.'
    ]
  };

  return {
    ...changeRequest,
    markdown: buildChangeRequestMarkdown(changeRequest)
  };
}
