import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const requiredFiles = [
  {
    label: 'controlled RLS/endpoint evidence template',
    path: '../docs/nuxera-migration/docs/migration/NUXERA_CONTROLLED_RLS_ENDPOINT_EVIDENCE_TEMPLATE.md',
    snippets: [
      'applicant-owner',
      'different-applicant',
      'authorized-grantor',
      'admin-internal',
      'GET /api/nuxera/orders/:orderId/state',
      'PATCH /api/nuxera/orders/:orderId/state/checklist',
      'GET /api/nuxera/orders/:orderId/evidence',
      'GET /api/nuxera/admin/controls',
      'GET /api/nuxera/admin/readiness',
      'No-go criteria',
      'Rollback rehearsal evidence',
      'Decision',
    ],
  },

  {
    label: 'SQL/RLS readiness checklist',
    path: '../docs/nuxera-migration/docs/migration/NUXERA_SQL_RLS_READINESS_CHECKLIST.md',
    snippets: [
      'Apply drafts in dependency order',
      'Applicant owner',
      'Different applicant',
      'Grantor/otorgante',
      'Admin/internal',
      'GET /api/nuxera/orders/:orderId/state',
      'PATCH /api/nuxera/orders/:orderId/state/checklist',
      'GET /api/nuxera/orders/:orderId/evidence',
      'GET /api/nuxera/admin/controls',
      'GET /api/nuxera/admin/readiness',
    ],
  },
  {
    label: 'workspace states SQL draft',
    path: 'sql_migrations_pendientes/2026-07-16_nuxera_workspace_states.sql',
    snippets: [
      'CREATE TABLE IF NOT EXISTS nuxera_workspace_states',
      'ALTER TABLE nuxera_workspace_states ENABLE ROW LEVEL SECURITY',
      'owners_select_nuxera_workspace_states',
      'owners_update_applicant_checklist_states',
      'owners_insert_applicant_checklist_states',
    ],
  },
  {
    label: 'evidence links SQL draft',
    path: 'sql_migrations_pendientes/2026-07-17_nuxera_evidence_links.sql',
    snippets: [
      'CREATE TABLE IF NOT EXISTS nuxera_evidence_links',
      'ALTER TABLE nuxera_evidence_links ENABLE ROW LEVEL SECURITY',
      'owners_select_nuxera_evidence_links',
      "visibility           TEXT NOT NULL CHECK (visibility IN ('owner', 'authorized_grantor', 'internal'))",
    ],
  },
  {
    label: 'admin controls SQL draft',
    path: 'sql_migrations_pendientes/2026-07-17_nuxera_admin_controls.sql',
    snippets: [
      'create table if not exists public.nuxera_admin_controls',
      'alter table public.nuxera_admin_controls enable row level security',
      'create policy nuxera_admin_controls_admin_select',
      "control_type text not null check (control_type in ('release_gate','incident','readiness','policy'))",
    ],
  },
  {
    label: 'backend readiness service',
    path: 'src/services/nuxeraBackendReadinessService.js',
    snippets: [
      'nuxera_workspace_states',
      'nuxera_evidence_links',
      'nuxera_admin_controls',
      'summary:',
      'unavailable',
      'readiness',
    ],
  },
  {
    label: 'admin readiness adapter',
    path: '../src/nuxera/admin/backendReadinessAdapter.js',
    snippets: [
      'rlsVerificationMatrix',
      'backendReadinessHandoff',
      'rls-verification-matrix',
      'Verificar RLS controlado:',
    ],
  },
];

const verificationScenarios = [
  {
    id: 'applicant-owner',
    actor: 'Applicant owner',
    mustAllow: [
      'Read own applicant/checklist workspace state.',
      'Patch own applicant checklist after feature and contract gates pass.',
    ],
    mustDeny: [
      'Foreign orders.',
      'Grantor/admin workspace state.',
      'Non-owner evidence rows.',
    ],
  },
  {
    id: 'different-applicant',
    actor: 'Different applicant',
    mustAllow: ['No access for another applicant order.'],
    mustDeny: [
      'Any read for foreign order state.',
      'Any checklist write for foreign order state.',
      'Any evidence or admin-control visibility.',
    ],
  },
  {
    id: 'authorized-grantor',
    actor: 'Authorized grantor',
    mustAllow: ['Only authorized summaries after the existing data-room authorization check is implemented.'],
    mustDeny: [
      'Applicant checklist writes.',
      'Owner-only evidence links.',
      'Hidden documents or document grant changes.',
    ],
  },
  {
    id: 'admin-internal',
    actor: 'Admin/internal',
    mustAllow: ['Read admin controls and backend readiness only with admin-read permission.'],
    mustDeny: [
      'Feature flag mutation from this slice.',
      'Automation activation.',
      'Document grant mutation.',
    ],
  },
];

const endpointChecks = [
  'GET /api/nuxera/orders/:orderId/state',
  'PATCH /api/nuxera/orders/:orderId/state/checklist',
  'GET /api/nuxera/orders/:orderId/evidence',
  'GET /api/nuxera/admin/controls',
  'GET /api/nuxera/admin/readiness',
];

function fail(message) {
  console.error(`ERROR - ${message}`);
  process.exitCode = 1;
}

function assertRequiredFile({ label, path, snippets }) {
  const filePath = resolve(process.cwd(), path);
  if (!existsSync(filePath)) {
    fail(`${label}: missing ${path}`);
    return;
  }

  const content = readFileSync(filePath, 'utf8');
  const comparableContent = content.toLowerCase();

  for (const snippet of snippets) {
    if (!comparableContent.includes(snippet.toLowerCase())) {
      fail(`${label}: missing required evidence "${snippet}"`);
    }
  }
}

for (const file of requiredFiles) assertRequiredFile(file);

if (verificationScenarios.length !== 4) {
  fail(`expected 4 controlled RLS verification scenarios, found ${verificationScenarios.length}`);
}

if (endpointChecks.length !== 5) {
  fail(`expected 5 endpoint checks, found ${endpointChecks.length}`);
}

if (process.exitCode) process.exit();

console.log('OK - NUXERA controlled RLS/endpoint verification plan is complete.');
console.log(`Scenarios: ${verificationScenarios.map((scenario) => scenario.id).join(', ')}`);
console.log(`Endpoints: ${endpointChecks.join(' | ')}`);