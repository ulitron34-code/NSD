-- Tabla de auditoría para acciones sobre API Keys y recursos del sistema
-- Pegar en Supabase → SQL Editor y ejecutar

CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  action        TEXT        NOT NULL,
  resource_type TEXT,
  resource_id   TEXT,
  details       JSONB       DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx     ON audit_logs(action);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at DESC);

-- RLS: cada usuario solo ve sus propios logs; service role bypasa RLS en insert
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_audit_logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);
