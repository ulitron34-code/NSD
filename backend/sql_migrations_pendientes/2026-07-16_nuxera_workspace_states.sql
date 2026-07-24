-- Draft SQL for NU-BE-002. Do not apply to production before schema review.
-- Purpose: persist applicant checklist state for the NUXERA experience while
-- preserving legacy service_orders/documents/document_reviews/audit_logs.

CREATE TABLE IF NOT EXISTS nuxera_workspace_states (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  workspace_role  TEXT NOT NULL CHECK (workspace_role IN ('applicant', 'grantor', 'admin')),
  surface         TEXT NOT NULL CHECK (surface IN ('mission', 'checklist', 'queue', 'workbench', 'memo', 'readiness', 'strategy')),
  status          TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  version         INTEGER NOT NULL DEFAULT 1,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at     TIMESTAMPTZ NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS nuxera_workspace_states_active_unique_idx
  ON nuxera_workspace_states(order_id, workspace_role, surface)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS nuxera_workspace_states_order_idx
  ON nuxera_workspace_states(order_id);

CREATE INDEX IF NOT EXISTS nuxera_workspace_states_updated_idx
  ON nuxera_workspace_states(updated_at DESC);

ALTER TABLE nuxera_workspace_states ENABLE ROW LEVEL SECURITY;

-- RLS draft only. Backend service-role authorization remains the first
-- implementation gate until production schema and data-room policies are reviewed.
-- Scoped to workspace_role = 'applicant': only applicant-owned surfaces (e.g.
-- checklist) are readable by the order owner. Grantor/admin surfaces such as
-- 'memo' or 'workbench' are internal-only until a dedicated grantor/admin
-- read policy is designed and reviewed alongside their write paths -- without
-- this filter, the order owner could read the grantor's internal decision
-- memo for their own case the moment that surface is persisted here.
CREATE POLICY "owners_select_nuxera_workspace_states"
  ON nuxera_workspace_states FOR SELECT
  USING (
    workspace_role = 'applicant'
    AND EXISTS (
      SELECT 1 FROM service_orders so
      WHERE so.id = order_id AND so.user_id = auth.uid()
    )
  );

CREATE POLICY "owners_update_applicant_checklist_states"
  ON nuxera_workspace_states FOR UPDATE
  USING (
    workspace_role = 'applicant'
    AND surface = 'checklist'
    AND EXISTS (
      SELECT 1 FROM service_orders so
      WHERE so.id = order_id AND so.user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_role = 'applicant'
    AND surface = 'checklist'
    AND EXISTS (
      SELECT 1 FROM service_orders so
      WHERE so.id = order_id AND so.user_id = auth.uid()
    )
  );

CREATE POLICY "owners_insert_applicant_checklist_states"
  ON nuxera_workspace_states FOR INSERT
  WITH CHECK (
    workspace_role = 'applicant'
    AND surface = 'checklist'
    AND EXISTS (
      SELECT 1 FROM service_orders so
      WHERE so.id = order_id AND so.user_id = auth.uid()
    )
  );
