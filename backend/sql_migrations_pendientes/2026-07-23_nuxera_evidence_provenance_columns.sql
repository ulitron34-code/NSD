-- NUXERA controlled migration draft only.
-- Additive provenance columns for nuxera_evidence_links. Do not run in production without approval.

ALTER TABLE nuxera_evidence_links
  ADD COLUMN IF NOT EXISTS source_type TEXT NULL,
  ADD COLUMN IF NOT EXISTS source_page INTEGER NULL,
  ADD COLUMN IF NOT EXISTS source_section TEXT NULL,
  ADD COLUMN IF NOT EXISTS extraction_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  ADD COLUMN IF NOT EXISTS review_status TEXT NULL CHECK (review_status IS NULL OR review_status IN ('unreviewed','ai_extracted','human_reviewed','rejected','needs_more_info')),
  ADD COLUMN IF NOT EXISTS provenance_version INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_nuxera_evidence_links_provenance_source
  ON nuxera_evidence_links (source_type, extraction_id)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_nuxera_evidence_links_review_status
  ON nuxera_evidence_links (review_status, confidence)
  WHERE archived_at IS NULL;