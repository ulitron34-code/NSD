-- Migración: Row Level Security en las tablas satélite que quedaron fuera
-- de 2026-07-10_core_tables_rls.sql (ese archivo lo señalaba explícitamente
-- en su comentario de alcance: "funder_interests, cross_references -- quedan
-- para una siguiente ronda"). Esta es esa siguiente ronda.
--
-- Mismo contexto de seguridad que la migración anterior: el backend usa
-- exclusivamente supabaseAdmin (service-role key), que ignora RLS, así que
-- esto no cambia ningún comportamiento de la app hoy -- es una segunda capa
-- de defensa para el día que se filtre la anon key o el frontend conecte
-- directo a Supabase.
--
-- Fecha: 2026-07-13
-- Correr en: Supabase > SQL Editor (después de 2026-07-10_core_tables_rls.sql,
-- ya que reusa las funciones helper rls_is_internal_reviewer/rls_is_admin
-- creadas ahí).

-- 1. funder_interests
-- Columnas reales (backend/scripts/check-supabase-schema.js,
-- backend/src/routes/otorgante.js): id, order_id, funder_user_id, status,
-- notes, created_at. El "dueño" del registro es el otorgante que declaró
-- interés (funder_user_id); el solicitante dueño del expediente también debe
-- poder ver quién declaró interés en su proyecto.

ALTER TABLE funder_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "funder_interests_select_related"
  ON funder_interests FOR SELECT
  TO authenticated
  USING (
    funder_user_id = auth.uid()
    OR rls_is_internal_reviewer(auth.uid())
    OR EXISTS (
      SELECT 1 FROM service_orders o
      WHERE o.id = funder_interests.order_id
        AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "funder_interests_insert_own"
  ON funder_interests FOR INSERT
  TO authenticated
  WITH CHECK (funder_user_id = auth.uid());

CREATE POLICY "funder_interests_update_own_or_internal"
  ON funder_interests FOR UPDATE
  TO authenticated
  USING (funder_user_id = auth.uid() OR rls_is_internal_reviewer(auth.uid()))
  WITH CHECK (funder_user_id = auth.uid() OR rls_is_internal_reviewer(auth.uid()));

-- Sin política de DELETE: el backend nunca borra funder_interests.

-- 2. cross_references
-- OJO: las columnas reales de esta tabla (ver comentario en
-- backend/src/services/documentIntelligenceService.js sobre
-- NAGMAR_SCHEMA_V3_FINAL.sql) NO son las que usan los agentes en memoria --
-- la FK al expediente aquí se llama expediente_id, no order_id. Es una tabla
-- satélite del expediente (sin columna de usuario dueño); solo los agentes
-- de auditoría cruzada (vía service-role) escriben en ella, igual que
-- document_reviews -- por eso solo lleva política de SELECT.

ALTER TABLE cross_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cross_references_select_owner_or_authorized"
  ON cross_references FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_orders o
      WHERE o.id = cross_references.expediente_id
        AND (
          o.user_id = auth.uid()
          OR rls_is_internal_reviewer(auth.uid())
          OR rls_has_accepted_data_room_share(auth.uid(), o.id)
        )
    )
  );
