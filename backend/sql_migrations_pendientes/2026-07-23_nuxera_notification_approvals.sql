-- NUXERA controlled migration draft only.
-- Additive notification approval ledger. Do not run in production without approval.
-- Does not send notifications; records human approval metadata for outbox queue preparation.

CREATE TABLE IF NOT EXISTS nuxera_notification_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  outbox_id UUID NULL REFERENCES nuxera_notification_outbox(id) ON DELETE SET NULL,
  event_id TEXT NOT NULL,
  audience TEXT NOT NULL CHECK (audience IN ('applicant','grantor','admin')),
  recipient_role TEXT NOT NULL,
  recipient_user_id UUID NULL,
  recipient_email TEXT NULL,
  template_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_preview TEXT NOT NULL DEFAULT '',
  channels TEXT[] NOT NULL DEFAULT ARRAY['in_app']::TEXT[],
  priority TEXT NOT NULL DEFAULT 'normal',
  approval_status TEXT NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('draft','approved','queued-preview','queued','suppressed','rejected')),
  approval_reason TEXT NULL,
  approved_by UUID NULL,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  queued_at TIMESTAMPTZ NULL,
  delivery_enabled_at_approval BOOLEAN NOT NULL DEFAULT false,
  dedupe_key TEXT NOT NULL,
  source_rule_id TEXT NULL,
  source_event_id TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  sensitive_content_excluded BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ NULL,
  CONSTRAINT nuxera_notification_approvals_recipient_required
    CHECK (recipient_user_id IS NOT NULL OR recipient_email IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_nuxera_notification_approvals_order_approved
  ON nuxera_notification_approvals (order_id, approved_at DESC)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_nuxera_notification_approvals_status
  ON nuxera_notification_approvals (approval_status, approved_at DESC)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_nuxera_notification_approvals_outbox
  ON nuxera_notification_approvals (outbox_id)
  WHERE outbox_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_nuxera_notification_approvals_dedupe
  ON nuxera_notification_approvals (dedupe_key)
  WHERE archived_at IS NULL AND approval_status IN ('approved','queued-preview','queued');

ALTER TABLE nuxera_notification_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY nuxera_notification_approvals_owner_read
  ON nuxera_notification_approvals
  FOR SELECT
  USING (
    sensitive_content_excluded = true
    AND EXISTS (
      SELECT 1
      FROM service_orders so
      WHERE so.id = nuxera_notification_approvals.order_id
        AND so.user_id = auth.uid()
    )
  );

CREATE POLICY nuxera_notification_approvals_authorized_grantor_read
  ON nuxera_notification_approvals
  FOR SELECT
  USING (
    sensitive_content_excluded = true
    AND EXISTS (
      SELECT 1
      FROM data_room_shares drs
      WHERE drs.order_id = nuxera_notification_approvals.order_id
        AND drs.recipient_user_id = auth.uid()
        AND drs.status IN ('accepted', 'shared')
    )
  );

CREATE POLICY nuxera_notification_approvals_admin_read
  ON nuxera_notification_approvals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
        AND u.profile_type = 'administrador'
    )
  );

-- Writes remain backend service_role only after controlled SQL/RLS evidence and change approval.
