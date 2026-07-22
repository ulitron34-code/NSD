const VERIFICATION_IDENTITIES = Object.freeze([
  {
    id: 'applicant-owner',
    identity: 'Applicant owner',
    expectedAllow: ['Own applicant/checklist state', 'Owner-visible evidence links'],
    expectedDeny: ['Foreign orders', 'Grantor/admin state', 'Document visibility changes']
  },
  {
    id: 'different-applicant',
    identity: 'Different applicant',
    expectedAllow: [],
    expectedDeny: ['Foreign order state', 'Checklist writes', 'Evidence visibility', 'Admin controls']
  },
  {
    id: 'authorized-grantor',
    identity: 'Authorized grantor',
    expectedAllow: ['Authorized summaries after existing data-room authorization check'],
    expectedDeny: ['Applicant checklist writes', 'Owner-only evidence', 'Hidden documents', 'Document grants']
  },
  {
    id: 'admin-internal',
    identity: 'Admin/internal',
    expectedAllow: ['Admin controls and backend readiness with admin-read permission'],
    expectedDeny: ['Feature flag mutation', 'Automation activation', 'Document grant mutation']
  }
]);

const ENDPOINT_CHECKS = Object.freeze([
  { id: 'get-state-owner', method: 'GET', path: '/api/nuxera/orders/:orderId/state', actor: 'applicant-owner', expected: 'Own applicant state only', auditLogRequired: false },
  { id: 'patch-checklist-owner', method: 'PATCH', path: '/api/nuxera/orders/:orderId/state/checklist', actor: 'applicant-owner', expected: 'Checklist-only write after gates pass', auditLogRequired: true },
  { id: 'get-evidence-owner', method: 'GET', path: '/api/nuxera/orders/:orderId/evidence', actor: 'applicant-owner', expected: 'Owner-visible evidence only', auditLogRequired: false },
  { id: 'get-evidence-grantor', method: 'GET', path: '/api/nuxera/orders/:orderId/grantor-evidence', actor: 'authorized-grantor', expected: 'Authorized-grantor evidence only after accepted data_room_shares check and audited read event', auditLogRequired: true },
  { id: 'get-admin-controls', method: 'GET', path: '/api/nuxera/admin/controls', actor: 'admin-internal', expected: 'Read-only admin controls with admin-read permission', auditLogRequired: false },
  { id: 'get-admin-readiness', method: 'GET', path: '/api/nuxera/admin/readiness', actor: 'admin-internal', expected: 'Read-only backend readiness with admin-read permission', auditLogRequired: false }
]);

const DENIED_CHECKS = Object.freeze([
  { id: 'state-foreign-denied', actor: 'different-applicant', target: '/api/nuxera/orders/:orderId/state', expected: '403/404 without row-existence leak' },
  { id: 'admin-controls-applicant-denied', actor: 'applicant-owner', target: '/api/nuxera/admin/controls', expected: 'Denied without admin control details' },
  { id: 'admin-readiness-applicant-denied', actor: 'applicant-owner', target: '/api/nuxera/admin/readiness', expected: 'Denied without backend inventory details' }
]);

const NO_GO_CRITERIA = Object.freeze([
  'Any actor reads or writes a foreign order unexpectedly.',
  'Applicant checklist writes affect grantor, admin or evidence records.',
  'Grantor accesses owner-only evidence or hidden documents without explicit authorization.',
  'Admin readiness or controls work without admin-read permission.',
  'Denied responses leak restricted row existence.',
  'Any enabled write lacks audit_logs evidence.',
  'Feature flag off still allows NUXERA UI reads or writes.',
  'Rollback cannot hide or archive NUXERA state without deleting audit history.'
]);

const ROLLBACK_CHECKS = Object.freeze([
  'Feature flag off hides NUXERA UI reads/writes.',
  'Legacy service order flow ignores nuxera_* tables.',
  'nuxera_* records can be hidden or archived without audit deletion.',
  'Prior known-good commit is recorded.',
  'Rollback owner is recorded.'
]);

export function getNuxeraControlledVerificationPlan() {
  return {
    id: 'nuxera-controlled-rls-endpoint-evidence',
    status: 'template-required-before-controlled-run',
    evidenceTemplate: {
      path: 'docs/nuxera-migration/docs/migration/NUXERA_CONTROLLED_RLS_ENDPOINT_EVIDENCE_TEMPLATE.md',
      status: 'template-required-before-production-decision',
      requiredSections: ['run metadata', 'RLS identities', 'endpoint evidence', 'no-go criteria', 'rollback rehearsal', 'decision']
    },
    requiredIdentities: VERIFICATION_IDENTITIES.map((identity) => ({ ...identity })),
    endpointChecks: ENDPOINT_CHECKS.map((endpoint) => ({ ...endpoint })),
    deniedChecks: DENIED_CHECKS.map((check) => ({ ...check })),
    noGoCriteria: [...NO_GO_CRITERIA],
    rollbackChecks: [...ROLLBACK_CHECKS],
    summary: {
      identities: VERIFICATION_IDENTITIES.length,
      endpoints: ENDPOINT_CHECKS.length,
      deniedChecks: DENIED_CHECKS.length,
      noGoCriteria: NO_GO_CRITERIA.length,
      rollbackChecks: ROLLBACK_CHECKS.length
    },
    guardrails: [
      'Read-only verification plan; no ejecuta endpoints ni aplica SQL.',
      'Usar solo en Supabase no productivo con identidades controladas antes de produccion.',
      'Cualquier no-go mantiene NUXERA en fallback local/read-only.'
    ]
  };
}