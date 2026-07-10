-- Migración: Row Level Security en las tablas núcleo del expediente
-- (sección 29.1 del plan PLAN_INTEGRACION_MODULO_READINESS_CUMPLIMIENTO.md —
-- "RLS en Supabase", "Separación solicitante/otorgante/admin").
--
-- CONTEXTO IMPORTANTE — por qué esto es seguro de correr y qué NO cambia:
-- El backend (Express) usa EXCLUSIVAMENTE `supabaseAdmin` (service-role key)
-- para consultar estas tablas -- confirmado por grep exhaustivo, 0 archivos
-- usan la anon key. La service-role key de Supabase IGNORA RLS por diseño,
-- así que esta migración NO cambia ningún comportamiento de la app hoy: el
-- backend sigue filtrando manualmente por user_id/data_room_shares en cada
-- ruta, exactamente igual que antes.
--
-- Lo que SÍ cambia: hoy, si alguien obtuviera la anon key (pública en el
-- frontend por diseño) e hiciera queries directas a Supabase saltándose el
-- backend, o si en el futuro alguna feature conecta el frontend directo a
-- Supabase, no habría ningún límite a nivel de base de datos -- RLS
-- deshabilitado en estas tablas significa acceso total con la anon key
-- (confirmado: hoy NINGUNA de estas 5 tablas tiene RLS). Esta migración
-- agrega esa segunda capa de defensa, reflejando exactamente las mismas
-- reglas que ya aplica el código (middleware/auth.js, readinessChecklist.js
-- assertReadinessAccess, otorgante.js) -- no es una regla nueva, es la
-- misma regla ahora también a nivel de base de datos.
--
-- Alcance: service_orders, documents, document_reviews, users,
-- document_type_catalog, data_room_shares (esta última porque las políticas
-- de acceso de otorgante dependen de ella). Fuera de alcance: tablas que ya
-- tenían RLS (api_keys, messages, document_review_notes, reference_sources,
-- audit_logs, nagmar_cases) y tablas satélite no auditadas todavía
-- (funder_interests, cross_references) -- quedan para una siguiente ronda.
--
-- Fecha: 2026-07-10
-- Correr en: Supabase > SQL Editor

-- 1. Funciones helper (SECURITY DEFINER: corren con los privilegios del
-- dueño de la función, no del usuario que llama, para poder leer `users`
-- dentro de la política sin que la propia RLS de `users` interfiera y sin
-- riesgo de recursión entre políticas).

CREATE OR REPLACE FUNCTION rls_is_internal_reviewer(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Mismo criterio que isInternalReviewerRole() en backend/src/middleware/auth.js
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = uid
      AND profile_type IN ('analista', 'administrador', 'agente_interno', 'compliance_officer', 'auditor_interno')
  );
$$;

CREATE OR REPLACE FUNCTION rls_is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = uid AND profile_type = 'administrador');
$$;

CREATE OR REPLACE FUNCTION rls_has_accepted_data_room_share(uid UUID, target_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Mismo criterio que assertReadinessAccess() en backend/src/routes/readinessChecklist.js
  -- y GET /otorgante/pipeline en backend/src/routes/otorgante.js
  SELECT EXISTS (
    SELECT 1 FROM data_room_shares s
    JOIN users u ON u.id = uid
    WHERE s.order_id = target_order_id
      AND s.status IN ('accepted', 'shared')
      AND (s.recipient_user_id = uid OR s.recipient_email ILIKE u.email)
  );
$$;

-- 2. service_orders

ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_orders_select_owner_or_authorized"
  ON service_orders FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR rls_is_internal_reviewer(auth.uid())
    OR rls_has_accepted_data_room_share(auth.uid(), id)
  );

CREATE POLICY "service_orders_insert_own"
  ON service_orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "service_orders_update_owner_or_internal"
  ON service_orders FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR rls_is_internal_reviewer(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR rls_is_internal_reviewer(auth.uid()));

-- Sin política de DELETE: el backend nunca borra service_orders; el default
-- de RLS (sin policy = denegado) es el comportamiento correcto aquí.

-- 3. documents

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_select_owner_or_authorized"
  ON documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_orders o
      WHERE o.id = documents.order_id
        AND (
          o.user_id = auth.uid()
          OR rls_is_internal_reviewer(auth.uid())
          OR rls_has_accepted_data_room_share(auth.uid(), o.id)
        )
    )
  );

CREATE POLICY "documents_insert_owner_or_internal"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM service_orders o WHERE o.id = documents.order_id AND o.user_id = auth.uid())
    OR rls_is_internal_reviewer(auth.uid())
  );

CREATE POLICY "documents_update_owner_or_internal"
  ON documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM service_orders o WHERE o.id = documents.order_id AND o.user_id = auth.uid())
    OR rls_is_internal_reviewer(auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM service_orders o WHERE o.id = documents.order_id AND o.user_id = auth.uid())
    OR rls_is_internal_reviewer(auth.uid())
  );

-- 4. document_reviews -- solo lectura para usuarios normales. Hoy SOLO los
-- agentes de IA (corriendo con la service-role key, que ignora RLS) escriben
-- en esta tabla; ningún usuario autenticado debe poder insertar/editar una
-- revisión directamente, por eso no hay política de INSERT/UPDATE.

ALTER TABLE document_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_reviews_select_owner_or_authorized"
  ON document_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_orders o
      WHERE o.id = document_reviews.order_id
        AND (
          o.user_id = auth.uid()
          OR rls_is_internal_reviewer(auth.uid())
          OR rls_has_accepted_data_room_share(auth.uid(), o.id)
        )
    )
  );

-- 5. document_type_catalog -- catálogo de referencia, sin dueño. Cualquier
-- usuario autenticado lo puede leer (mismo criterio que /reference-sources);
-- solo se administra vía migraciones/backend con service-role.

ALTER TABLE document_type_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_type_catalog_select_authenticated"
  ON document_type_catalog FOR SELECT
  TO authenticated
  USING (true);

-- 6. users -- cada quien ve su propia fila; roles internos ven todas (lo
-- necesitan para paneles de administración y para resolver nombres en
-- reviewer_user_id, etc.). Sin política de INSERT/UPDATE/DELETE: el alta de
-- usuarios (signup) y el cambio de profile_type (PATCH /admin/users/:id/role)
-- corren exclusivamente vía backend con service-role key -- ningún usuario
-- debe poder auto-asignarse un rol distinto directamente contra la base.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_self_or_internal"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR rls_is_internal_reviewer(auth.uid()));

-- 7. data_room_shares -- requerida por rls_has_accepted_data_room_share()
-- de arriba (aunque esa función es SECURITY DEFINER y no depende de esta
-- RLS para funcionar), y porque el dueño/destinatario de una invitación
-- deben poder verla igual que hoy permite el backend.

ALTER TABLE data_room_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "data_room_shares_select_related"
  ON data_room_shares FOR SELECT
  TO authenticated
  USING (
    owner_user_id = auth.uid()
    OR recipient_user_id = auth.uid()
    OR rls_is_internal_reviewer(auth.uid())
  );

CREATE POLICY "data_room_shares_insert_owner"
  ON data_room_shares FOR INSERT
  TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "data_room_shares_update_related"
  ON data_room_shares FOR UPDATE
  TO authenticated
  USING (owner_user_id = auth.uid() OR recipient_user_id = auth.uid() OR rls_is_internal_reviewer(auth.uid()))
  WITH CHECK (owner_user_id = auth.uid() OR recipient_user_id = auth.uid() OR rls_is_internal_reviewer(auth.uid()));

-- Nota (no cubierto aquí a propósito): el flujo de "acceso por access_token"
-- (backend/src/routes/shares.js, ruta con :token) es para invitaciones antes
-- de que el destinatario tenga sesión -- hoy ese flujo corre 100% por el
-- backend con service-role, nunca directo contra Supabase, así que no
-- necesita política RLS. Si en el futuro se mueve a un cliente Supabase
-- directo, haría falta una policy adicional basada en access_token en vez
-- de auth.uid().
