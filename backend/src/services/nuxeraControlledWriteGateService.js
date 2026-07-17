import { getNuxeraControlledApprovalPackage } from './nuxeraControlledApprovalPackageService.js';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeBackendReadiness(readiness) {
  const value = asObject(readiness);
  const summary = asObject(value.summary);

  return {
    id: 'backend-readiness',
    ready: Boolean(value.ready),
    status: value.status || 'readiness-unverified',
    summary: {
      total: Number.isFinite(summary.total) ? summary.total : 0,
      available: Number.isFinite(summary.available) ? summary.available : 0,
      unavailable: Number.isFinite(summary.unavailable) ? summary.unavailable : 0,
      readiness: Number.isFinite(summary.readiness) ? summary.readiness : 0
    },
    blockers: asArray(value.signals)
      .filter((signal) => !signal?.ready)
      .map((signal) => `Backend readiness unavailable: ${signal.table || signal.id || 'unknown'}.`)
  };
}

export function getNuxeraControlledWriteGate(input = {}) {
  const backendReadiness = normalizeBackendReadiness(input.backendReadiness);
  const approvalPackage = input.approvalPackage && typeof input.approvalPackage === 'object'
    ? input.approvalPackage
    : getNuxeraControlledApprovalPackage(input);
  const requestedScope = typeof input.requestedScope === 'string' && input.requestedScope.trim()
    ? input.requestedScope.trim()
    : 'applicant-checklist-controlled-write';
  const requestedEnvironment = typeof input.requestedEnvironment === 'string' && input.requestedEnvironment.trim()
    ? input.requestedEnvironment.trim()
    : 'TODO';
  const changeTicket = typeof input.changeTicket === 'string' && input.changeTicket.trim()
    ? input.changeTicket.trim()
    : 'TODO';
  const blockers = [];

  if (!backendReadiness.ready) {
    blockers.push('Backend readiness is not fully visible.');
    blockers.push(...backendReadiness.blockers);
  }
  if (!approvalPackage.readyForReleaseDecision) {
    blockers.push('Approval package is not ready for human release decision.');
    blockers.push(...asArray(approvalPackage.blockers));
  }
  if (requestedEnvironment === 'TODO') {
    blockers.push('Requested environment is required before controlled write gate review.');
  }
  if (changeTicket === 'TODO') {
    blockers.push('Change-control ticket is required before controlled write gate review.');
  }

  const readyForControlledWriteChange = blockers.length === 0;

  return {
    id: 'nuxera-controlled-write-gate',
    status: readyForControlledWriteChange ? 'ready-for-controlled-write-change' : 'blocked-by-write-gates',
    readyForControlledWriteChange,
    requestedScope,
    requestedEnvironment,
    changeTicket,
    sourceApprovalPackageId: approvalPackage.id || 'nuxera-controlled-approval-package',
    summary: {
      backendReady: backendReadiness.ready,
      backendReadiness: backendReadiness.summary.readiness,
      approvalReady: Boolean(approvalPackage.readyForReleaseDecision),
      blockers: blockers.length,
      releaseChecklist: 6
    },
    blockers,
    releaseChecklist: [
      'Backend readiness is fully visible for required NUXERA tables.',
      'Controlled evidence review is clean and approval package is ready.',
      'Requested environment is non-production or explicitly covered by separate production change control.',
      'Change-control ticket is recorded.',
      'Feature flag rollback path remains available.',
      'Write enablement requires a separate deploy/change-control action.'
    ],
    nextDecision: readyForControlledWriteChange
      ? 'Prepare a separate controlled change request; do not enable writes automatically.'
      : 'Resolve write gate blockers before any controlled write change request.',
    guardrails: [
      'Write gate is read-only; it does not execute endpoints, apply SQL, change RLS, persist approvals or enable writes.',
      'Ready-for-controlled-write-change is not automatic production approval.',
      'Production write enablement requires a separate reviewed deploy/change-control action.'
    ]
  };
}
