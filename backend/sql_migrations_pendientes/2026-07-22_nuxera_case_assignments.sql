-- Migracion pendiente: asignacion de revisor y SLA real por expediente NUXERA.
-- Fecha: 2026-07-22
-- Correr solo en entorno controlado despues de aprobacion de cambio.
-- Propuesta, no aplicada: hasta hoy caseQueue.js deriva triage.sla/triage.owner
-- como etiquetas de politica estaticas por prioridad (24h/48h/7d, "Analista senior",
-- etc.), no de un dato real por expediente. Esta tabla es additiva; no modifica
-- service_orders ni ninguna tabla existente.

CREATE TABLE IF NOT EXISTS nuxera_case_assignments (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID        NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  assigned_reviewer_id  UUID,
  assigned_reviewer_role TEXT       NOT NULL DEFAULT 'analista' CHECK (assigned_reviewer_role IN ('analista', 'agente_interno', 'compliance_officer', 'administrador')),
  sla_tier              TEXT        NOT NULL CHECK (sla_tier IN ('committee-ready-24h', 'needs-information-48h', 'watch-7d')),
  sla_due_at            TIMESTAMPTZ NOT NULL,
  status                TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed', 'breached', 'reassigned')),
  reason                TEXT        NOT NULL DEFAULT '',
  metadata              JSONB       NOT NULL DEFAULT '{}'::JSONB,
  created_by            UUID,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nuxera_case_assignments_order
  ON nuxera_case_assignments(order_id);

CREATE INDEX IF NOT EXISTS idx_nuxera_case_assignments_status
  ON nuxera_case_assignments(status, sla_due_at);

-- Solo el ultimo assignment activo por expediente importa para UI; el
-- historial (reassigned/completed) se conserva para auditoria, no se borra.
CREATE UNIQUE INDEX IF NOT EXISTS idx_nuxera_case_assignments_active_unique
  ON nuxera_case_assignments(order_id)
  WHERE status = 'open';

ALTER TABLE nuxera_case_assignments ENABLE ROW LEVEL SECURITY;

-- Lectura owner: el solicitante dueno del expediente puede ver quien lo
-- tiene asignado y el SLA vigente (sin ver otros expedientes).
CREATE POLICY "nuxera_case_assignments_owner_read"
  ON nuxera_case_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM service_orders so
      WHERE so.id = nuxera_case_assignments.order_id
        AND so.user_id = auth.uid()
    )
  );

-- Lectura otorgante autorizado: mismo criterio que data_room_shares aceptado
-- ya usado por /otorgante/pipeline y nuxera_evidence_links de grantor.
CREATE POLICY "nuxera_case_assignments_authorized_grantor_read"
  ON nuxera_case_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM data_room_shares drs
      WHERE drs.order_id = nuxera_case_assignments.order_id
        AND drs.status IN ('accepted', 'shared')
        AND (drs.recipient_user_id = auth.uid() OR drs.recipient_email ILIKE (auth.jwt() ->> 'email'))
    )
  );

-- Admin/internal: solo service_role (backend) puede escribir. No se expone
-- ningun write directo desde cliente; el backend debe registrar audit_logs
-- en cada creacion/reasignacion antes de habilitarse.
