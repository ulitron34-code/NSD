import { getNuxeraControlledVerificationPlan } from './nuxeraControlledVerificationService.js';

const DEFAULT_SQL_DRAFTS = Object.freeze([
  'backend/sql_migrations_pendientes/2026-07-16_nuxera_workspace_states.sql',
  'backend/sql_migrations_pendientes/2026-07-17_nuxera_evidence_links.sql',
  'backend/sql_migrations_pendientes/2026-07-17_nuxera_admin_controls.sql',
  'backend/sql_migrations_pendientes/2026-07-22_nuxera_notification_outbox.sql'
]);

function asMetadataValue(value, fallback = 'TODO') {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function renderList(items) {
  return items.map((item) => `- ${item}`).join('\n');
}

function renderIdentityRows(identities) {
  return identities
    .map((identity) => {
      const allow = (identity.expectedAllow || []).join('; ') || 'TODO';
      const deny = (identity.expectedDeny || []).join('; ') || 'TODO';
      return `| \`${identity.id}\` | ${identity.identity || identity.id} | TODO | ${allow} | ${deny} | TODO | TODO | TODO |`;
    })
    .join('\n');
}

function renderEndpointRows(endpointChecks, deniedChecks) {
  const allowRows = endpointChecks.map((endpoint) => (
    `| \`${endpoint.method || 'GET'} ${endpoint.path}\` | ${endpoint.actor || 'TODO'} | ${endpoint.expected || 'TODO'} | TODO | ${endpoint.auditLogRequired ? 'Yes' : 'No'} | TODO | TODO |`
  ));
  const deniedRows = deniedChecks.map((check) => (
    `| \`${check.target}\` | ${check.actor || 'TODO'} | ${check.expected || 'Denied without restricted detail'} | TODO | No | TODO | TODO |`
  ));

  return [...allowRows, ...deniedRows].join('\n');
}

function renderRollbackRows(rollbackChecks) {
  return rollbackChecks
    .map((check) => `| ${check} | TODO | TODO | TODO | TODO |`)
    .join('\n');
}

export function getNuxeraControlledEvidenceScaffold(options = {}) {
  const plan = getNuxeraControlledVerificationPlan();
  const generatedAt = options.generatedAt || new Date().toISOString();
  const metadata = {
    verificationDate: asMetadataValue(options.verificationDate, generatedAt.slice(0, 10)),
    environment: asMetadataValue(options.environment, 'TODO: controlled non-production Supabase project'),
    repoCommit: asMetadataValue(options.repoCommit, process.env.NUXERA_VERIFICATION_COMMIT || 'TODO'),
    operator: asMetadataValue(options.operator),
    reviewer: asMetadataValue(options.reviewer),
    featureFlagState: asMetadataValue(options.featureFlagState, 'VITE_NUXERA_EXPERIENCE_ENABLED=true in controlled environment only'),
    priorKnownGoodCommit: asMetadataValue(options.priorKnownGoodCommit),
    rollbackOwner: asMetadataValue(options.rollbackOwner)
  };
  const sqlDrafts = Array.isArray(options.sqlDrafts) && options.sqlDrafts.length
    ? options.sqlDrafts
    : DEFAULT_SQL_DRAFTS;
  const guardrails = [
    'Scaffold only; no endpoint execution, SQL application, RLS mutation or production write.',
    'Use only after SQL drafts are applied to a controlled non-production Supabase project.',
    'Every denied response must avoid restricted row-existence leaks.',
    ...plan.guardrails
  ];

  const markdown = `# NUXERA Controlled RLS and Endpoint Evidence - Scaffold

## Run metadata

| Field | Value |
|---|---|
| Verification date | ${metadata.verificationDate} |
| Environment | ${metadata.environment} |
| Repo commit | ${metadata.repoCommit} |
| Operator | ${metadata.operator} |
| Reviewer | ${metadata.reviewer} |
| Feature flag state | ${metadata.featureFlagState} |
| Prior known-good commit | ${metadata.priorKnownGoodCommit} |
| Rollback owner | ${metadata.rollbackOwner} |

## Required SQL drafts

| Draft | Applied? | Hash/checksum | Notes |
|---|---:|---|---|
${sqlDrafts.map((draft) => `| \`${draft}\` | TODO | TODO | TODO |`).join('\n')}

## Required RLS identities

| Scenario id | Identity | Test user/order | Expected allow | Expected deny | Observed result | Pass/Fail | Evidence link |
|---|---|---|---|---|---|---|---|
${renderIdentityRows(plan.requiredIdentities)}

## Required endpoint evidence

| Endpoint | Actor/scenario | Expected status/body | Observed status/body | Audit log required? | Pass/Fail | Evidence link |
|---|---|---|---|---:|---|---|
${renderEndpointRows(plan.endpointChecks, plan.deniedChecks)}

## No-go criteria

${renderList(plan.noGoCriteria)}

## Rollback rehearsal evidence

| Check | Expected | Observed | Pass/Fail | Notes |
|---|---|---|---|---|
${renderRollbackRows(plan.rollbackChecks)}

## Guardrails

${renderList(guardrails)}

## Decision

| Decision field | Value |
|---|---|
| Controlled RLS pass complete? | TODO |
| Endpoint pass complete? | TODO |
| Rollback rehearsal complete? | TODO |
| Approved to enable applicant checklist writes outside local fallback? | TODO |
| Approver | TODO |
| Approval date | TODO |
| Remaining blockers | TODO |
`;

  return {
    id: 'nuxera-controlled-evidence-scaffold',
    status: 'scaffold-ready-for-controlled-run',
    generatedAt,
    sourcePlanId: plan.id,
    evidenceTemplate: plan.evidenceTemplate,
    metadata,
    summary: {
      identities: plan.requiredIdentities.length,
      endpointRows: plan.endpointChecks.length + plan.deniedChecks.length,
      noGoCriteria: plan.noGoCriteria.length,
      rollbackChecks: plan.rollbackChecks.length,
      sqlDrafts: sqlDrafts.length
    },
    sqlDrafts: [...sqlDrafts],
    guardrails,
    markdown
  };
}
