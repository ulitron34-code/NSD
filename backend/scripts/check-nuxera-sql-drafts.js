import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const drafts = [
  {
    label: 'workspace state',
    path: 'sql_migrations_pendientes/2026-07-16_nuxera_workspace_states.sql',
    requiredSnippets: [
      ['table', 'CREATE TABLE IF NOT EXISTS nuxera_workspace_states'],
      ['service order fk', 'order_id        UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE'],
      ['role check', "workspace_role  TEXT NOT NULL CHECK (workspace_role IN ('applicant', 'grantor', 'admin'))"],
      ['surface check', "surface         TEXT NOT NULL CHECK (surface IN ('mission', 'checklist', 'queue', 'workbench', 'memo', 'readiness', 'strategy'))"],
      ['json payload', "payload         JSONB NOT NULL DEFAULT '{}'::jsonb"],
      ['soft archive', 'archived_at     TIMESTAMPTZ NULL'],
      ['active unique index', 'nuxera_workspace_states_active_unique_idx'],
      ['active unique predicate', 'WHERE archived_at IS NULL'],
      ['rls enabled', 'ALTER TABLE nuxera_workspace_states ENABLE ROW LEVEL SECURITY'],
      ['owner select policy', 'owners_select_nuxera_workspace_states'],
      ['owner update policy', 'owners_update_applicant_checklist_states'],
      ['owner insert policy', 'owners_insert_applicant_checklist_states'],
      ['owner check', 'so.user_id = auth.uid()'],
      ['applicant role gate', "workspace_role = 'applicant'"],
      ['checklist surface gate', "surface = 'checklist'"],
    ],
    policyCount: 3,
    customChecks: [
      ['update policy with check', (sql) => /FOR UPDATE[\s\S]+WITH CHECK[\s\S]+surface = 'checklist'/.test(sql)],
      ['insert policy with check', (sql) => /FOR INSERT[\s\S]+WITH CHECK[\s\S]+surface = 'checklist'/.test(sql)],
    ],
  },
  {
    label: 'evidence links',
    path: 'sql_migrations_pendientes/2026-07-17_nuxera_evidence_links.sql',
    requiredSnippets: [
      ['table', 'CREATE TABLE IF NOT EXISTS nuxera_evidence_links'],
      ['workspace state fk', 'workspace_state_id   UUID NULL REFERENCES nuxera_workspace_states(id) ON DELETE SET NULL'],
      ['service order fk', 'order_id             UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE'],
      ['documents fk', 'document_id          UUID NULL REFERENCES documents(id) ON DELETE SET NULL'],
      ['document reviews fk', 'document_review_id   UUID NULL REFERENCES document_reviews(id) ON DELETE SET NULL'],
      ['engine check', "engine               TEXT NOT NULL CHECK (engine IN ('finance', 'intelligence', 'markets', 'strategy', 'admin'))"],
      ['visibility check', "visibility           TEXT NOT NULL CHECK (visibility IN ('owner', 'authorized_grantor', 'internal'))"],
      ['provenance json', "provenance           JSONB NOT NULL DEFAULT '{}'::jsonb"],
      ['soft archive', 'archived_at          TIMESTAMPTZ NULL'],
      ['order index', 'nuxera_evidence_links_order_idx'],
      ['workspace state index', 'nuxera_evidence_links_workspace_state_idx'],
      ['document index', 'nuxera_evidence_links_document_idx'],
      ['engine index', 'nuxera_evidence_links_engine_idx'],
      ['active predicate', 'WHERE archived_at IS NULL'],
      ['rls enabled', 'ALTER TABLE nuxera_evidence_links ENABLE ROW LEVEL SECURITY'],
      ['owner select policy', 'owners_select_nuxera_evidence_links'],
      ['owner visibility gate', "visibility = 'owner'"],
      ['owner order check', 'so.user_id = auth.uid()'],
    ],
    policyCount: 1,
    forbiddenPolicyVerbs: ['FOR INSERT', 'FOR UPDATE', 'FOR DELETE'],
  },
  {
    label: 'admin controls',
    path: 'sql_migrations_pendientes/2026-07-17_nuxera_admin_controls.sql',
    requiredSnippets: [
      ['table', 'create table if not exists public.nuxera_admin_controls'],
      ['type check', "control_type text not null check (control_type in ('release_gate','incident','readiness','policy'))"],
      ['scope check', "scope text not null check (scope in ('global','applicant','grantor','admin','engine'))"],
      ['severity check', "severity text null check (severity in ('low','medium','high','critical'))"],
      ['payload json', "payload jsonb not null default '{}'::jsonb"],
      ['soft archive', 'archived_at timestamptz null'],
      ['type index', 'idx_nuxera_admin_controls_active_type'],
      ['scope index', 'idx_nuxera_admin_controls_active_scope'],
      ['active predicate', 'where archived_at is null'],
      ['rls enabled', 'alter table public.nuxera_admin_controls enable row level security'],
      ['admin select policy', 'create policy nuxera_admin_controls_admin_select'],
      ['admin profile gate', "u.profile_type = 'administrador'"],
    ],
    policyCount: 1,
    forbiddenPolicyVerbs: ['for insert', 'for update', 'for delete'],
  },
  {
    label: 'evidence links grantor policy',
    path: 'sql_migrations_pendientes/2026-07-18_nuxera_evidence_links_grantor_policy.sql',
    requiredSnippets: [
      ['grantor select policy', 'authorized_grantor_select_nuxera_evidence_links'],
      ['grantor visibility gate', "visibility = 'authorized_grantor'"],
      ['data room share anchor', 'FROM data_room_shares drs'],
      ['order match', 'drs.order_id = nuxera_evidence_links.order_id'],
      ['recipient match', 'drs.recipient_user_id = auth.uid()'],
      ['accepted or shared status', "drs.status IN ('accepted', 'shared')"],
    ],
    policyCount: 1,
    forbiddenPolicyVerbs: ['for insert', 'for update', 'for delete'],
  },
  {
    label: 'notification outbox',
    path: 'sql_migrations_pendientes/2026-07-22_nuxera_notification_outbox.sql',
    requiredSnippets: [
      ['table', 'CREATE TABLE IF NOT EXISTS nuxera_notification_outbox'],
      ['event id', 'event_id            TEXT        NOT NULL'],
      ['audience check', "audience            TEXT        NOT NULL CHECK (audience IN ('applicant', 'grantor', 'admin'))"],
      ['service order fk', 'order_id            UUID        REFERENCES service_orders(id) ON DELETE CASCADE'],
      ['channels array', "channels            TEXT[]      NOT NULL DEFAULT ARRAY['in_app']::TEXT[]"],
      ['status check', "status              TEXT        NOT NULL DEFAULT 'queued' CHECK (status IN ('preview', 'queued', 'sent', 'failed', 'suppressed'))"],
      ['metadata json', "metadata            JSONB       NOT NULL DEFAULT '{}'::JSONB"],
      ['dedupe key', 'dedupe_key          TEXT        NOT NULL'],
      ['recipient check', 'nuxera_notification_outbox_recipient_required'],
      ['dedupe index', 'idx_nuxera_notification_outbox_dedupe'],
      ['status index', 'idx_nuxera_notification_outbox_status'],
      ['rls enabled', 'ALTER TABLE nuxera_notification_outbox ENABLE ROW LEVEL SECURITY'],
      ['recipient read policy', 'nuxera_notification_outbox_recipient_read'],
      ['recipient user gate', 'recipient_user_id = auth.uid()'],
      ['recipient email gate', "recipient_email ILIKE (auth.jwt() ->> 'email')"],
    ],
    policyCount: 1,
    forbiddenPolicyVerbs: ['FOR INSERT', 'FOR UPDATE', 'FOR DELETE'],
  },
  {
    label: 'case assignments',
    path: 'sql_migrations_pendientes/2026-07-22_nuxera_case_assignments.sql',
    requiredSnippets: [
      ['table', 'CREATE TABLE IF NOT EXISTS nuxera_case_assignments'],
      ['service order fk', 'order_id              UUID        NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE'],
      ['reviewer role check', "assigned_reviewer_role TEXT       NOT NULL DEFAULT 'analista' CHECK (assigned_reviewer_role IN ('analista', 'agente_interno', 'compliance_officer', 'administrador'))"],
      ['sla tier check', "sla_tier              TEXT        NOT NULL CHECK (sla_tier IN ('committee-ready-24h', 'needs-information-48h', 'watch-7d'))"],
      ['status check', "status                TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed', 'breached', 'reassigned'))"],
      ['active unique index', 'idx_nuxera_case_assignments_active_unique'],
      ['active unique predicate', "WHERE status = 'open'"],
      ['rls enabled', 'ALTER TABLE nuxera_case_assignments ENABLE ROW LEVEL SECURITY'],
      ['owner read policy', 'nuxera_case_assignments_owner_read'],
      ['owner gate', 'so.user_id = auth.uid()'],
      ['grantor read policy', 'nuxera_case_assignments_authorized_grantor_read'],
      ['grantor share gate', "drs.status IN ('accepted', 'shared')"],
    ],
    policyCount: 2,
    forbiddenPolicyVerbs: ['FOR INSERT', 'FOR UPDATE', 'FOR DELETE'],
  },
  {
    label: 'notification approvals',
    path: 'sql_migrations_pendientes/2026-07-23_nuxera_notification_approvals.sql',
    requiredSnippets: [
      ['table', 'CREATE TABLE IF NOT EXISTS nuxera_notification_approvals'],
      ['service order fk', 'order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE'],
      ['outbox fk', 'outbox_id UUID NULL REFERENCES nuxera_notification_outbox(id) ON DELETE SET NULL'],
      ['audience check', "audience TEXT NOT NULL CHECK (audience IN ('applicant','grantor','admin'))"],
      ['template id', 'template_id TEXT NOT NULL'],
      ['approval status check', "approval_status TEXT NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('draft','approved','queued-preview','queued','suppressed','rejected'))"],
      ['delivery enabled flag', 'delivery_enabled_at_approval BOOLEAN NOT NULL DEFAULT false'],
      ['sensitive flag', 'sensitive_content_excluded BOOLEAN NOT NULL DEFAULT true'],
      ['recipient check', 'nuxera_notification_approvals_recipient_required'],
      ['order index', 'idx_nuxera_notification_approvals_order_approved'],
      ['status index', 'idx_nuxera_notification_approvals_status'],
      ['dedupe index', 'idx_nuxera_notification_approvals_dedupe'],
      ['rls enabled', 'ALTER TABLE nuxera_notification_approvals ENABLE ROW LEVEL SECURITY'],
      ['owner read policy', 'nuxera_notification_approvals_owner_read'],
      ['owner gate', 'so.user_id = auth.uid()'],
      ['grantor read policy', 'nuxera_notification_approvals_authorized_grantor_read'],
      ['grantor share gate', "drs.status IN ('accepted', 'shared')"],
      ['admin read policy', 'nuxera_notification_approvals_admin_read'],
      ['admin profile gate', "u.profile_type = 'administrador'"],
    ],
    policyCount: 3,
    forbiddenPolicyVerbs: ['FOR INSERT', 'FOR UPDATE', 'FOR DELETE'],
  },
  {
    label: 'case events',
    path: 'sql_migrations_pendientes/2026-07-23_nuxera_case_events.sql',
    requiredSnippets: [
      ['table', 'CREATE TABLE IF NOT EXISTS nuxera_case_events'],
      ['service order fk', 'order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE'],
      ['event type check', "event_type TEXT NOT NULL CHECK (event_type IN ('order','checklist','evidence','information-request','assignment','notification','audit','conversation','risk','decision'))"],
      ['phase check', "phase TEXT NOT NULL CHECK (phase IN ('intake','evidence','grantor-review','decision-desk','notifications-audit'))"],
      ['sensitive flag', 'sensitive_content_excluded BOOLEAN NOT NULL DEFAULT true'],
      ['human review flag', 'requires_human_review BOOLEAN NOT NULL DEFAULT false'],
      ['order index', 'idx_nuxera_case_events_order_occurred'],
      ['status phase index', 'idx_nuxera_case_events_status_phase'],
      ['rls enabled', 'ALTER TABLE nuxera_case_events ENABLE ROW LEVEL SECURITY'],
      ['owner read policy', 'nuxera_case_events_owner_read'],
      ['owner gate', 'so.user_id = auth.uid()'],
      ['grantor read policy', 'nuxera_case_events_authorized_grantor_read'],
      ['grantor share gate', "drs.status IN ('accepted', 'shared')"],
      ['admin read policy', 'nuxera_case_events_admin_read'],
      ['admin profile gate', "u.profile_type = 'administrador'"],
    ],
    policyCount: 3,
    forbiddenPolicyVerbs: ['FOR INSERT', 'FOR UPDATE', 'FOR DELETE'],
  },
  {
    label: 'evidence provenance columns',
    path: 'sql_migrations_pendientes/2026-07-23_nuxera_evidence_provenance_columns.sql',
    requiredSnippets: [
      ['alter table', 'ALTER TABLE nuxera_evidence_links'],
      ['source type', 'ADD COLUMN IF NOT EXISTS source_type TEXT NULL'],
      ['source page', 'ADD COLUMN IF NOT EXISTS source_page INTEGER NULL'],
      ['source section', 'ADD COLUMN IF NOT EXISTS source_section TEXT NULL'],
      ['extraction id', 'ADD COLUMN IF NOT EXISTS extraction_id TEXT NULL'],
      ['confidence check', 'ADD COLUMN IF NOT EXISTS confidence NUMERIC(5,4) NULL CHECK'],
      ['review status check', "review_status TEXT NULL CHECK (review_status IS NULL OR review_status IN ('unreviewed','ai_extracted','human_reviewed','rejected','needs_more_info'))"],
      ['provenance version', 'ADD COLUMN IF NOT EXISTS provenance_version INTEGER NOT NULL DEFAULT 1'],
      ['source index', 'idx_nuxera_evidence_links_provenance_source'],
      ['review index', 'idx_nuxera_evidence_links_review_status'],
    ],
    policyCount: 0,
  },
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

function countPolicies(sql) {
  return (sql.match(/create\s+policy/gi) || []).length;
}

function assertDraft(draft) {
  const sqlPath = resolve(process.cwd(), draft.path);
  if (!existsSync(sqlPath)) {
    fail(`${draft.label}: missing ${sqlPath}`);
    return;
  }

  const sql = readFileSync(sqlPath, 'utf8');
  const comparableSql = sql.toLowerCase();

  for (const [label, snippet] of draft.requiredSnippets) {
    if (!comparableSql.includes(snippet.toLowerCase())) {
      fail(`${draft.label}: missing ${label}: ${snippet}`);
    }
  }

  for (const [pattern, label] of forbiddenPatterns) {
    if (pattern.test(sql)) fail(`${draft.label}: contains forbidden destructive operation: ${label}`);
  }

  const policyCount = countPolicies(sql);
  if (policyCount !== draft.policyCount) {
    fail(`${draft.label}: expected exactly ${draft.policyCount} policies, found ${policyCount}`);
  }

  for (const verb of draft.forbiddenPolicyVerbs || []) {
    if (comparableSql.includes(verb.toLowerCase())) {
      fail(`${draft.label}: should not expose policy verb ${verb} in this read-only slice`);
    }
  }

  for (const [label, check] of draft.customChecks || []) {
    if (!check(sql)) fail(`${draft.label}: failed custom check ${label}`);
  }
}

for (const draft of drafts) assertDraft(draft);

if (process.exitCode) process.exit();

console.log('OK - NUXERA SQL drafts are additive, RLS-gated and free of destructive operations.');