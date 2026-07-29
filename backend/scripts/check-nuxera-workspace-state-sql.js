import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sqlPath = resolve(process.cwd(), 'sql_migrations_pendientes/2026-07-16_nuxera_workspace_states.sql');

const requiredSnippets = [
  ['table', 'CREATE TABLE IF NOT EXISTS nuxera_workspace_states'],
  ['id primary key', 'id              UUID PRIMARY KEY DEFAULT gen_random_uuid()'],
  ['service order fk', 'order_id        UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE'],
  ['role check', "workspace_role  TEXT NOT NULL CHECK (workspace_role IN ('applicant', 'grantor', 'admin'))"],
  ['surface check', "surface         TEXT NOT NULL CHECK (surface IN ('mission', 'checklist', 'queue', 'workbench', 'memo', 'readiness', 'strategy'))"],
  ['json payload', "payload         JSONB NOT NULL DEFAULT '{}'::jsonb"],
  ['soft archive', 'archived_at     TIMESTAMPTZ NULL'],
  ['active unique index', 'nuxera_workspace_states_active_unique_idx'],
  ['active unique predicate', 'WHERE archived_at IS NULL'],
  ['order index', 'nuxera_workspace_states_order_idx'],
  ['updated index', 'nuxera_workspace_states_updated_idx'],
  ['rls enabled', 'ALTER TABLE nuxera_workspace_states ENABLE ROW LEVEL SECURITY'],
  ['owner select policy', 'owners_select_nuxera_workspace_states'],
  ['owner update policy', 'owners_update_applicant_checklist_states'],
  ['owner insert policy', 'owners_insert_applicant_checklist_states'],
  ['owner check', 'so.user_id = auth.uid()'],
  ['applicant role gate', "workspace_role = 'applicant'"],
  ['checklist surface gate', "surface = 'checklist'"],
];

const forbiddenPatterns = [
  [/DROP\s+TABLE/i, 'DROP TABLE'],
  [/TRUNCATE\s+/i, 'TRUNCATE'],
  [/DELETE\s+FROM\s+service_orders/i, 'DELETE FROM service_orders'],
  [/ALTER\s+TABLE\s+service_orders\s+DROP/i, 'ALTER TABLE service_orders DROP'],
  [/ALTER\s+TABLE\s+documents\s+DROP/i, 'ALTER TABLE documents DROP'],
  [/ALTER\s+TABLE\s+document_reviews\s+DROP/i, 'ALTER TABLE document_reviews DROP'],
  [/ALTER\s+TABLE\s+audit_logs\s+DROP/i, 'ALTER TABLE audit_logs DROP'],
];

function fail(message) {
  console.error(`ERROR - ${message}`);
  process.exitCode = 1;
}

if (!existsSync(sqlPath)) {
  fail(`missing ${sqlPath}`);
  process.exit();
}

const sql = readFileSync(sqlPath, 'utf8');

for (const [label, snippet] of requiredSnippets) {
  if (!sql.includes(snippet)) fail(`NUXERA SQL missing ${label}: ${snippet}`);
}

for (const [pattern, label] of forbiddenPatterns) {
  if (pattern.test(sql)) fail(`NUXERA SQL contains forbidden destructive operation: ${label}`);
}

const policyCount = (sql.match(/CREATE POLICY/g) || []).length;
if (policyCount !== 3) fail(`expected exactly 3 NUXERA policies, found ${policyCount}`);

const hasUpdateWithCheck = /FOR UPDATE[\s\S]+WITH CHECK[\s\S]+surface = 'checklist'/.test(sql);
if (!hasUpdateWithCheck) fail('update policy must include WITH CHECK for applicant checklist');

const hasInsertWithCheck = /FOR INSERT[\s\S]+WITH CHECK[\s\S]+surface = 'checklist'/.test(sql);
if (!hasInsertWithCheck) fail('insert policy must include WITH CHECK for applicant checklist');

if (process.exitCode) process.exit();

console.log('OK - NUXERA workspace state SQL draft keeps additive table, owner-scoped applicant checklist RLS and no destructive operations.');