-- NUXERA controlled migration draft only.
-- Additive case event ledger for review. Do not run in production without approval.

CREATE TABLE IF NOT EXISTS nuxera_case_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('order','checklist','evidence','information-request','assignment','notification','audit','conversation','risk','decision')),
  phase TEXT NOT NULL CHECK (phase IN ('intake','evidence','grantor-review','decision-desk','notifications-audit')),
  status TEXT NOT NULL DEFAULT 'observed',
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','success','warning','critical')),
  actor_role TEXT NOT NULL CHECK (actor_role IN ('applicant','grantor','admin','system')),
  source_table TEXT NULL,
  source_id TEXT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  summary TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  sensitive_content_excluded BOOLEAN NOT NULL DEFAULT true,
  requires_human_review BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_nuxera_case_events_order_occurred
  ON nuxera_case_events (order_id, occurred_at DESC)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_nuxera_case_events_status_phase
  ON nuxera_case_events (status, phase)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_nuxera_case_events_source
  ON nuxera_case_events (source_table, source_id)
  WHERE archived_at IS NULL;

ALTER TABLE nuxera_case_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY nuxera_case_events_owner_read
  ON nuxera_case_events
  FOR SELECT
  USING (
    sensitive_content_excluded = true
    AND EXISTS (
      SELECT 1
      FROM service_orders so
      WHERE so.id = nuxera_case_events.order_id
        AND so.user_id = auth.uid()
    )
  );

CREATE POLICY nuxera_case_events_authorized_grantor_read
  ON nuxera_case_events
  FOR SELECT
  USING (
    sensitive_content_excluded = true
    AND EXISTS (
      SELECT 1
      FROM data_room_shares drs
      WHERE drs.order_id = nuxera_case_events.order_id
        AND drs.recipient_user_id = auth.uid()
        AND drs.status IN ('accepted', 'shared')
    )
  );

CREATE POLICY nuxera_case_events_admin_read
  ON nuxera_case_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.profile_type = 'administrador'
    )
  );