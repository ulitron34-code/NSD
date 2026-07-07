-- Migración: workflow humano de revisión sobre evaluaciones de IA (sección 7
-- del plan: "Workflow humano: revisión, aprobación, comentarios, versiones y
-- excepciones"). El rol `analista` ya existe en backend/src/middleware/auth.js
-- (permisos score:read/score:update/report:create) pero ninguna ruta lo usaba
-- hasta ahora -- esta tabla es el historial de decisiones/comentarios que un
-- analista deja sobre un document_review real, sin tocar el esquema de
-- document_reviews (que ya escriben documents.js/readinessRubricAgent.js en
-- producción; no se le agregan columnas para no arriesgar ese flujo).
-- Mismo patrón que nagmar_case_actions (historial insert-only + tabla padre
-- sin campo de estado propio -- el estado vigente es la última nota).
-- Fecha: 2026-07-06
-- Correr en: Supabase > SQL Editor

CREATE TABLE IF NOT EXISTS document_review_notes (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_review_id  UUID        NOT NULL REFERENCES document_reviews(id) ON DELETE CASCADE,
  document_id         UUID        NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  order_id            UUID        NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  reviewer_user_id    UUID        NOT NULL,
  decision            TEXT        NOT NULL CHECK (decision IN ('approved', 'rejected', 'needs_more_info', 'note')),
  comment             TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_review_notes_review ON document_review_notes(document_review_id);
CREATE INDEX IF NOT EXISTS idx_document_review_notes_order   ON document_review_notes(order_id);
CREATE INDEX IF NOT EXISTS idx_document_review_notes_document ON document_review_notes(document_id);

ALTER TABLE document_review_notes ENABLE ROW LEVEL SECURITY;

-- El dueño del expediente puede ver las notas de revisión de su propio caso
-- (transparencia hacia el solicitante de por qué se aprobó/rechazó).
CREATE POLICY "document_review_notes_order_owner_read"
  ON document_review_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM service_orders
      WHERE service_orders.id = document_review_notes.order_id
        AND service_orders.user_id = auth.uid()
    )
  );

-- El propio analista puede ver e insertar sus notas (el backend usa la
-- service key y de todas formas hace el chequeo de permisos por rol antes de
-- llegar aqui; esta politica es defensa en profundidad para acceso directo).
CREATE POLICY "document_review_notes_reviewer_all"
  ON document_review_notes FOR ALL
  USING (reviewer_user_id = auth.uid())
  WITH CHECK (reviewer_user_id = auth.uid());
