-- Draft SQL for NU-BE-EVID-001. Do not apply to production before schema review.
-- Purpose: normalize read-only references from NUXERA surfaces to existing evidence
-- without granting document access or changing data-room permissions.

CREATE TABLE IF NOT EXISTS nuxera_evidence_links (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_state_id   UUID NULL REFERENCES nuxera_workspace_states(id) ON DELETE SET NULL,
  order_id             UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  document_id          UUID NULL REFERENCES documents(id) ON DELETE SET NULL,
  document_review_id   UUID NULL REFERENCES document_reviews(id) ON DELETE SET NULL,
  engine               TEXT NOT NULL CHECK (engine IN ('finance', 'intelligence', 'markets', 'strategy', 'admin')),
  label                TEXT NOT NULL,
  visibility           TEXT NOT NULL CHECK (visibility IN ('owner', 'authorized_grantor', 'internal')),
  provenance           JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at          TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS nuxera_evidence_links_order_idx
  ON nuxera_evidence_links(order_id)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS nuxera_evidence_links_workspace_state_idx
  ON nuxera_evidence_links(workspace_state_id)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS nuxera_evidence_links_document_idx
  ON nuxera_evidence_links(document_id)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS nuxera_evidence_links_engine_idx
  ON nuxera_evidence_links(engine)
  WHERE archived_at IS NULL;

ALTER TABLE nuxera_evidence_links ENABLE ROW LEVEL SECURITY;

-- RLS draft only. This first slice supports owner read-only access.
-- Grantor/internal visibility requires a dedicated data-room authorization review.
CREATE POLICY "owners_select_nuxera_evidence_links"
  ON nuxera_evidence_links FOR SELECT
  USING (
    visibility = 'owner'
    AND EXISTS (
      SELECT 1 FROM service_orders so
      WHERE so.id = order_id AND so.user_id = auth.uid()
    )
  );