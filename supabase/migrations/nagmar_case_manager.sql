-- NAGMAR Case Manager — tablas para gestionar casos de screening
-- Pegar en Supabase → SQL Editor y ejecutar

-- Casos de screening
CREATE TABLE IF NOT EXISTS nagmar_cases (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  country      TEXT,
  verdict      TEXT        NOT NULL,   -- 'clear' | 'review' | 'block' | 'skipped'
  full_result  JSONB       DEFAULT '{}',
  status       TEXT        NOT NULL DEFAULT 'pending',  -- 'pending' | 'resolved' | 'escalated'
  dictamen     TEXT,                   -- 'APROBADO' | 'RECHAZADO' | 'EN_REVISION' | 'ESCALADO'
  notes        TEXT,
  resolved_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS nagmar_cases_user_id_idx   ON nagmar_cases(user_id);
CREATE INDEX IF NOT EXISTS nagmar_cases_verdict_idx   ON nagmar_cases(verdict);
CREATE INDEX IF NOT EXISTS nagmar_cases_status_idx    ON nagmar_cases(status);
CREATE INDEX IF NOT EXISTS nagmar_cases_created_idx   ON nagmar_cases(created_at DESC);

-- Acciones sobre casos (falso positivo, confirmacion, escalamiento, nota)
CREATE TABLE IF NOT EXISTS nagmar_case_actions (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id      UUID        NOT NULL REFERENCES nagmar_cases(id) ON DELETE CASCADE,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  action       TEXT        NOT NULL,  -- 'false_positive' | 'confirm_hit' | 'escalate' | 'note' | 'resolve'
  source       TEXT,                  -- screener que genero el hit (ofac, interpol, cnbv, etc.)
  entity_name  TEXT,                  -- nombre de la entidad matcheada
  reason       TEXT,                  -- explicacion del analista
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS nagmar_case_actions_case_id_idx ON nagmar_case_actions(case_id);

-- RLS: cada usuario solo ve y opera sus propios casos
ALTER TABLE nagmar_cases        ENABLE ROW LEVEL SECURITY;
ALTER TABLE nagmar_case_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nagmar_cases_select_own"
  ON nagmar_cases FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "nagmar_cases_insert_own"
  ON nagmar_cases FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "nagmar_cases_update_own"
  ON nagmar_cases FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "nagmar_case_actions_select_own"
  ON nagmar_case_actions FOR SELECT
  USING (EXISTS (SELECT 1 FROM nagmar_cases c WHERE c.id = case_id AND c.user_id = auth.uid()));

CREATE POLICY "nagmar_case_actions_insert_own"
  ON nagmar_case_actions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM nagmar_cases c WHERE c.id = case_id AND c.user_id = auth.uid()));
