import { reviewNuxeraControlledEvidence } from './nuxeraControlledEvidenceReviewService.js';

const REQUIRED_APPROVAL_METADATA = Object.freeze([
  'approver',
  'approvalDate',
  'approvalScope',
  'evidenceHash'
]);

function isMissingValue(value) {
  return typeof value !== 'string' || !value.trim() || value.trim().startsWith('TODO');
}

function normalizeDecision(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function buildMissingApprovalMetadata(input) {
  return REQUIRED_APPROVAL_METADATA
    .filter((key) => isMissingValue(input[key]))
    .map((key) => ({
      id: key,
      label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase()),
      requiredFor: 'human-release-decision'
    }));
}

export function getNuxeraControlledApprovalPackage(input = {}) {
  const evidenceReview = input.evidenceReview && typeof input.evidenceReview === 'object'
    ? input.evidenceReview
    : reviewNuxeraControlledEvidence({ markdown: input.markdown });
  const missingApprovalMetadata = buildMissingApprovalMetadata(input);
  const decision = normalizeDecision(input.decision);
  const decisionAccepted = ['approve', 'approved', 'aprobado', 'approve-controlled-write-review'].includes(decision);
  const blockers = [];

  if (!evidenceReview.readyForHumanReview) {
    blockers.push('Evidence review is not ready for human approval review.');
  }
  blockers.push(...missingApprovalMetadata.map((item) => `Missing approval metadata: ${item.label}.`));
  if (!decisionAccepted) {
    blockers.push('Approval decision must explicitly approve controlled write review.');
  }

  const readyForReleaseDecision = blockers.length === 0;

  return {
    id: 'nuxera-controlled-approval-package',
    status: readyForReleaseDecision ? 'ready-for-human-release-decision' : 'blocked-by-approval-gates',
    readyForReleaseDecision,
    sourceReviewId: evidenceReview.id || 'nuxera-controlled-evidence-review',
    sourcePlanId: evidenceReview.sourcePlanId || 'nuxera-controlled-rls-endpoint-evidence',
    approvalMetadata: {
      approver: input.approver || 'TODO',
      approvalDate: input.approvalDate || 'TODO',
      approvalScope: input.approvalScope || 'TODO',
      evidenceHash: input.evidenceHash || 'TODO',
      decision: input.decision || 'TODO'
    },
    missingApprovalMetadata,
    summary: {
      evidenceReady: Boolean(evidenceReview.readyForHumanReview),
      evidenceBlockers: Array.isArray(evidenceReview.blockers) ? evidenceReview.blockers.length : 0,
      approvalMetadataMissing: missingApprovalMetadata.length,
      decisionAccepted,
      blockers: blockers.length
    },
    blockers,
    releaseChecklist: [
      'Human approver reviewed completed controlled evidence.',
      'Evidence hash and approval scope are recorded.',
      'No-go indicators are absent from the evidence review.',
      'Rollback owner and prior known-good commit remain available.',
      'Production writes require a separate deploy/change-control action.'
    ],
    nextDecision: readyForReleaseDecision
      ? 'Route to human release decision; do not enable writes automatically.'
      : 'Resolve approval blockers before any release decision.',
    guardrails: [
      'Approval package is read-only; it does not persist approvals, execute endpoints, apply SQL or enable writes.',
      'Ready-for-human-release-decision is not automatic production approval.',
      'A separate deployment/change-control step is required before any production write path.'
    ]
  };
}
