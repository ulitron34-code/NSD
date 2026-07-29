import { getNuxeraControlledEvidenceScaffold } from './nuxeraControlledEvidenceScaffoldService.js';

const REQUIRED_METADATA = Object.freeze([
  'environment',
  'repoCommit',
  'operator',
  'reviewer',
  'priorKnownGoodCommit',
  'rollbackOwner'
]);

function isMissingValue(value) {
  if (typeof value !== 'string') return true;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;

  return [
    'todo',
    'pending',
    'tbd',
    'unknown',
    'not-assigned',
    'not_assigned',
    'unassigned'
  ].some((placeholder) => normalized.includes(placeholder));
}

function isInvalidMetadata(key, value) {
  if (isMissingValue(value)) return true;
  if (key !== 'environment') return false;

  const normalized = value.trim().toLowerCase();
  return normalized === 'production'
    || normalized === 'prod'
    || (!normalized.includes('non-production') && !normalized.includes('nonproduction'));
}

function buildMissingMetadata(metadata) {
  return REQUIRED_METADATA
    .filter((key) => isInvalidMetadata(key, metadata[key]))
    .map((key) => ({
      id: key,
      label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase()),
      requiredFor: 'controlled-supabase-run'
    }));
}

export function getNuxeraControlledRunbook(options = {}) {
  const scaffold = getNuxeraControlledEvidenceScaffold(options);
  const missingMetadata = buildMissingMetadata(scaffold.metadata);
  const readyForRun = missingMetadata.length === 0;

  return {
    id: 'nuxera-controlled-runbook',
    status: readyForRun ? 'ready-for-controlled-supabase-run' : 'blocked-by-run-metadata',
    readyForRun,
    sourceScaffoldId: scaffold.id,
    sourcePlanId: scaffold.sourcePlanId,
    generatedAt: scaffold.generatedAt,
    missingMetadata,
    summary: {
      identities: scaffold.summary.identities,
      endpointRows: scaffold.summary.endpointRows,
      noGoCriteria: scaffold.summary.noGoCriteria,
      rollbackChecks: scaffold.summary.rollbackChecks,
      sqlDrafts: scaffold.summary.sqlDrafts,
      missingMetadata: missingMetadata.length
    },
    commands: [
      {
        id: 'generate-scaffold-markdown',
        command: 'npm run scaffold:nuxera-evidence -- --environment=<non-prod> --commit=<commit> --operator=<operator> --reviewer=<reviewer> --prior-known-good=<commit> --rollback-owner=<owner>',
        purpose: 'Generate the evidence Markdown before the controlled run.'
      },
      {
        id: 'verify-local-guards',
        command: 'npm run check:nuxera-verification-plan && npm run check:nuxera-sql',
        purpose: 'Confirm local verification plan and SQL drafts remain structurally ready.'
      }
    ],
    operatorSteps: [
      'Confirm the Supabase target is non-production and isolated from customer data.',
      'Apply only the approved NUXERA SQL drafts in dependency order.',
      'Exercise each required identity and endpoint row from the scaffold.',
      'Record observed allow/deny results and attach evidence links.',
      'Stop immediately if any no-go criterion is observed.',
      'Complete rollback rehearsal before any production write decision.'
    ],
    acceptanceGates: [
      'All required metadata is filled before the run starts.',
      'All four RLS identities have observed pass/fail evidence.',
      'All endpoint rows have observed status/body evidence.',
      'Denied responses do not leak restricted row existence.',
      'Audit evidence exists for any checklist write exercised in the controlled run.',
      'Rollback owner and prior known-good commit are recorded.'
    ],
    nextDecision: readyForRun
      ? 'Run controlled non-production Supabase verification and fill the scaffold.'
      : 'Fill missing run metadata before attempting controlled Supabase verification.',
    guardrails: [
      'Runbook is read-only; it does not execute endpoints, apply SQL, change RLS or enable writes.',
      'Production rollout remains blocked until observed evidence is attached and reviewed.',
      ...scaffold.guardrails
    ]
  };
}
