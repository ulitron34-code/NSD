-- Migración: tabla de API keys para clientes enterprise
-- Fecha: 2026-06-24
-- Correr en: Supabase > SQL Editor

CREATE TABLE IF NOT EXISTS api_keys (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  key_hash      TEXT        NOT NULL UNIQUE,   -- SHA-256 del key, nunca el key en claro
  key_prefix    TEXT        NOT NULL,           -- primeros 12 chars para mostrar en UI (ej: nag_a1b2c3d4...)
  permissions   TEXT[]      NOT NULL DEFAULT ARRAY['*'],
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  last_used_at  TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id  ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active   ON api_keys(is_active) WHERE is_active = TRUE;

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Usuarios solo ven y gestionan sus propias keys
CREATE POLICY "api_keys_own_user"
  ON api_keys FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- El backend (service_role) puede leer todas para validar requests entrantes
-- No necesita policy explícita: service_role bypasea RLS automáticamente.
