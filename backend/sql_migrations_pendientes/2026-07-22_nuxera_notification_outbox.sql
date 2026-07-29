-- Migracion pendiente: outbox de notificaciones NUXERA.
-- Fecha: 2026-07-22
-- Correr solo en entorno controlado despues de aprobacion de cambio.
-- No activa envio automatico; solo crea contrato persistente para cola/auditoria.

CREATE TABLE IF NOT EXISTS nuxera_notification_outbox (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            TEXT        NOT NULL,
  audience            TEXT        NOT NULL CHECK (audience IN ('applicant', 'grantor', 'admin')),
  recipient_role      TEXT        NOT NULL,
  recipient_user_id   UUID,
  recipient_email     TEXT,
  order_id            UUID        REFERENCES service_orders(id) ON DELETE CASCADE,
  subject             TEXT        NOT NULL,
  body_preview        TEXT        NOT NULL DEFAULT '',
  channels            TEXT[]      NOT NULL DEFAULT ARRAY['in_app']::TEXT[],
  priority            TEXT        NOT NULL DEFAULT 'normal',
  status              TEXT        NOT NULL DEFAULT 'queued' CHECK (status IN ('preview', 'queued', 'sent', 'failed', 'suppressed')),
  metadata            JSONB       NOT NULL DEFAULT '{}'::JSONB,
  dedupe_key          TEXT        NOT NULL,
  attempts            INTEGER     NOT NULL DEFAULT 0,
  last_error          TEXT,
  scheduled_for       TIMESTAMPTZ,
  sent_at             TIMESTAMPTZ,
  suppressed_at       TIMESTAMPTZ,
  created_by          UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT nuxera_notification_outbox_recipient_required
    CHECK (recipient_user_id IS NOT NULL OR recipient_email IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_nuxera_notification_outbox_dedupe
  ON nuxera_notification_outbox(dedupe_key)
  WHERE status IN ('preview', 'queued', 'sent');

CREATE INDEX IF NOT EXISTS idx_nuxera_notification_outbox_order
  ON nuxera_notification_outbox(order_id);

CREATE INDEX IF NOT EXISTS idx_nuxera_notification_outbox_status
  ON nuxera_notification_outbox(status, scheduled_for, created_at);

CREATE INDEX IF NOT EXISTS idx_nuxera_notification_outbox_recipient_user
  ON nuxera_notification_outbox(recipient_user_id);

ALTER TABLE nuxera_notification_outbox ENABLE ROW LEVEL SECURITY;

-- Lectura owner: solicitante puede ver avisos propios por user_id o email.
CREATE POLICY "nuxera_notification_outbox_recipient_read"
  ON nuxera_notification_outbox FOR SELECT
  USING (
    recipient_user_id = auth.uid()
    OR recipient_email ILIKE (auth.jwt() ->> 'email')
  );

-- Admin/control: usuarios internos con privilegio admin se verifican en backend
-- usando service_role. No se exponen writes directos desde cliente.

-- service_role bypasea RLS para worker/outbox controlado. Todo write debe
-- registrar audit_logs desde backend antes de habilitar delivery real.
