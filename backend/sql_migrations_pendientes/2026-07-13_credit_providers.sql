-- Migración: Credit Intelligence Provider Layer
-- (a partir de listado_buros_credito_apis_internacional.md, sección 11
-- "Modelo de datos recomendado" -- adaptada a las convenciones ya usadas en
-- este repo: gen_random_uuid(), TIMESTAMPTZ, FK a service_orders en vez de
-- project_id/applicant_id sueltos, RLS con el mismo patrón que
-- 2026-07-10_core_tables_rls.sql).
--
-- Qué resuelve: antes de esto, la única integración de buró de crédito era
-- un solo servicio hardcodeado para México (bureauCreditService.js, ahora
-- migrado a backend/src/services/creditProviders/connectors/buroCreditoMx.connector.js).
-- Estas tablas dejan lista la capa de homologación para cuando se contrate
-- Círculo de Crédito, Buró de Crédito, Equifax, Serasa, Nosis, etc. --
-- agregar un país nuevo es escribir un conector + una fila en
-- credit_providers, no rediseñar el sistema.
--
-- Fecha: 2026-07-13
-- Correr en: Supabase > SQL Editor (después de 2026-07-10_core_tables_rls.sql,
-- reusa rls_is_internal_reviewer/rls_has_accepted_data_room_share).

-- 1. Catálogo de proveedores (mismo espíritu que reference_sources.sql, pero
-- para burós/centrales de crédito).

CREATE TABLE IF NOT EXISTS credit_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_code TEXT NOT NULL UNIQUE,
  provider_name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  region TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  api_status TEXT NOT NULL DEFAULT 'not_connected' CHECK (api_status IN ('connected', 'not_connected', 'mock')),
  access_model TEXT,
  developer_portal_url TEXT,
  commercial_contact_url TEXT,
  regulatory_notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Reportes normalizados por expediente (order_id, no project_id/applicant_id
-- sueltos -- consistente con documents/document_reviews).

CREATE TABLE IF NOT EXISTS credit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES service_orders(id),
  provider_id UUID REFERENCES credit_providers(id),
  country_code TEXT NOT NULL,
  subject_identifier TEXT NOT NULL,
  subject_type TEXT NOT NULL DEFAULT 'company',
  score NUMERIC,
  risk_band TEXT,
  normalized_payload JSONB,
  raw_payload_reference TEXT,
  report_date TIMESTAMPTZ,
  retrieved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bitácora de consultas (éxito/error por proveedor, para auditoría y para
-- detectar cuándo un proveedor empieza a fallar).

CREATE TABLE IF NOT EXISTS credit_provider_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES credit_providers(id),
  order_id UUID REFERENCES service_orders(id),
  request_status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Seed del catálogo -- ranking práctico de listado_buros_credito_apis_internacional.md
-- (sección 7), api_status='not_connected' salvo México (que ya tiene conector
-- mock/real listo en código, marcado como 'mock' hasta que se configure
-- BURO_API_URL/BURO_API_KEY).

INSERT INTO credit_providers (provider_code, provider_name, country_code, region, provider_type, api_status, access_model, developer_portal_url, regulatory_notes)
VALUES
  ('buro_credito_mx', 'Buró de Crédito', 'MX', 'LATAM', 'sociedad_informacion_crediticia', 'mock', 'B2B contractual', 'https://apif.burodecredito.com.mx/pages/bc/nuestras-apis.html', 'Conector listo en código (buroCreditoMx.connector.js); falta contrato + BURO_API_URL/BURO_API_KEY.'),
  ('circulo_credito_mx', 'Círculo de Crédito', 'MX', 'LATAM', 'sociedad_informacion_crediticia', 'not_connected', 'API Hub con sandbox y producción', 'https://developer.circulodecredito.com.mx/', 'Recomendado como primer proveedor a integrar en México (API Hub más amigable).'),
  ('equifax_us', 'Equifax', 'US', 'Norteamérica', 'buro_nacional', 'not_connected', 'Portal developer, productos públicos/partner/privados', 'https://developer.equifax.com/products/apiproducts/credit-reports', NULL),
  ('microbilt_us', 'MicroBilt', 'US', 'Norteamérica', 'agregador', 'not_connected', 'Portal developer', 'https://developer.microbilt.com/api/Equifax', 'Agregador recomendado para evitar negociar con Equifax/Experian/TransUnion por separado en la fase inicial.'),
  ('equifax_ca', 'Equifax Canada', 'CA', 'Norteamérica', 'buro_nacional', 'not_connected', 'Portal developer empresarial', 'https://developer.equifax.ca/', NULL),
  ('serasa_experian_br', 'Serasa Experian', 'BR', 'LATAM', 'buro_principal', 'not_connected', 'Developer Portal oficial', 'https://developer.serasaexperian.com.br/', NULL),
  ('nosis_ar', 'Nosis', 'AR', 'LATAM', 'informes_comerciales', 'not_connected', 'Web services (Nosis Manager API)', 'https://www.nosis.com/es/informes-comerciales/api', 'Combina información comercial, crediticia, compliance e identidad.'),
  ('datacredito_experian_co', 'Datacrédito Experian', 'CO', 'LATAM', 'central_riesgo', 'not_connected', 'Contrato B2B', 'https://www.datacredito.com.co/', NULL),
  ('infocorp_pe', 'Infocorp / Equifax Perú', 'PE', 'LATAM', 'buro_central_privada', 'not_connected', 'Contrato B2B', 'https://www.equifax.pe/personas/productos/reporte-infocorp-credito/', NULL)
ON CONFLICT (provider_code) DO NOTHING;

-- 5. RLS
-- credit_providers: catálogo de referencia sin dueño, mismo criterio que
-- document_type_catalog -- cualquier usuario autenticado lo puede leer.

ALTER TABLE credit_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_providers_select_authenticated"
  ON credit_providers FOR SELECT
  TO authenticated
  USING (true);

-- credit_reports / credit_provider_audit_logs: mismo criterio que
-- document_reviews -- solo dueño del expediente, internos o data room
-- compartido pueden leer; solo el backend (service-role) escribe.

ALTER TABLE credit_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_reports_select_owner_or_authorized"
  ON credit_reports FOR SELECT
  TO authenticated
  USING (
    order_id IS NULL AND rls_is_internal_reviewer(auth.uid())
    OR EXISTS (
      SELECT 1 FROM service_orders o
      WHERE o.id = credit_reports.order_id
        AND (
          o.user_id = auth.uid()
          OR rls_is_internal_reviewer(auth.uid())
          OR rls_has_accepted_data_room_share(auth.uid(), o.id)
        )
    )
  );

ALTER TABLE credit_provider_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_provider_audit_logs_select_internal"
  ON credit_provider_audit_logs FOR SELECT
  TO authenticated
  USING (rls_is_internal_reviewer(auth.uid()));
