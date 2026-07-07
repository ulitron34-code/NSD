-- Migración: catálogo de fuentes oficiales de referencia (sección 5.2 y 6 del
-- plan PLAN_INTEGRACION_MODULO_READINESS_CUMPLIMIENTO.md — "Estas fuentes
-- deben guardarse en una tabla reference_sources para trazabilidad").
-- No reemplaza ninguna integración real ya existente (SAT/OFAC/INEGI/Banxico/
-- CNBV/Companies House/GLEIF/SEC EDGAR siguen viviendo en sus propios
-- servicios) -- esta tabla es solo el catálogo/trazabilidad de fuentes,
-- incluyendo las que hoy son "consulta manual" (NAFIN, Bancomext, CONDUSEF,
-- RPC/SIGER, SEMARNAT) para que quede documentado qué se usa y qué no.
-- Fecha: 2026-07-06
-- Correr en: Supabase > SQL Editor

CREATE TABLE IF NOT EXISTS reference_sources (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT        NOT NULL,
  source_type       TEXT        NOT NULL, -- financiamiento, regulatorio, mercado, fiscal, esg, corporativo, ambiental
  country_code      TEXT,                 -- NULL = fuente global
  url               TEXT,
  integration_status TEXT       NOT NULL DEFAULT 'manual' CHECK (integration_status IN ('real_api', 'real_scraping', 'rule_based', 'manual', 'named_only')),
  update_frequency  TEXT,
  reliability_level TEXT        NOT NULL DEFAULT 'official',
  notes             TEXT,
  is_active         BOOLEAN     NOT NULL DEFAULT true,
  last_checked_at   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reference_sources_country ON reference_sources(country_code);
CREATE INDEX IF NOT EXISTS idx_reference_sources_type    ON reference_sources(source_type);

ALTER TABLE reference_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reference_sources_read_authenticated"
  ON reference_sources FOR SELECT
  TO authenticated
  USING (true);

INSERT INTO reference_sources (name, source_type, country_code, url, integration_status, notes) VALUES
('NAFIN Financiamiento Empresarial', 'financiamiento', 'MX', 'https://www.nafin.com/portalnf/content/financiamiento/empresarial.html', 'named_only', 'Sin API pública; criterios básicos (antigüedad, buró, flujos) se referencian solo como guía, no se valida contra NAFIN en tiempo real.'),
('NAFIN Impulso NAFIN + Estados', 'financiamiento', 'MX', 'https://www.nafin.com/portalnf/content/financiamiento/impulso-nafin-estados.html', 'named_only', NULL),
('Bancomext', 'financiamiento', 'MX', 'https://www.bancomext.com/', 'named_only', 'Sin integración; referencia para empresas exportadoras/turismo si se retoma.'),
('CNBV Padrón de Entidades Supervisadas', 'regulatorio', 'MX', 'https://www.gob.mx/cnbv/acciones-y-programas/padron-de-entidades-supervisadas-y-autorizadas-para-captar', 'real_scraping', 'cnbvScreening.js hace fetch+parse real de las páginas de CNBV; cnbvService.js cae a verificación manual si no hay proveedor configurado.'),
('CNBV búsqueda de entidades', 'regulatorio', 'MX', 'https://www.cnbv.gob.mx/paginas/busquedaentidades.aspx', 'real_scraping', NULL),
('CONDUSEF Portal Único de Registros', 'regulatorio', 'MX', 'https://pur.condusef.gob.mx/', 'manual', 'Sin integración automatizada; verificación manual si se requiere.'),
('CONDUSEF SIPRES', 'regulatorio', 'MX', 'https://webapps.condusef.gob.mx/SIPRES/', 'manual', NULL),
('INEGI DENUE', 'mercado', 'MX', 'https://www.inegi.org.mx/app/mapa/denue/default.aspx', 'real_api', 'inegiService.js — API real con INEGI_API_TOKEN.'),
('INEGI API DENUE', 'mercado', 'MX', 'https://www.inegi.org.mx/servicios/api_denue.html', 'real_api', NULL),
('Banxico SIE API', 'mercado', 'MX', 'https://www.banxico.org.mx/SieAPIRest/', 'real_api', 'banxicoService.js — API real, series SF43718/SF61745/SP1.'),
('SAT Datos Abiertos Art. 69, 69-B, 69-B Bis', 'fiscal', 'MX', 'https://www.sat.gob.mx/minisitio/DatosAbiertos/contribuyentes_publicados.html', 'real_scraping', 'satBlacklistScreening.js descarga y parsea el CSV oficial completo de la lista 69-B.'),
('RPC/SIGER', 'corporativo', 'MX', 'https://rpc.economia.gob.mx/siger2/xhtml/login/login.xhtml', 'manual', 'Sin API pública; registro mercantil se verifica manualmente.'),
('SAT Beneficiario Controlador', 'regulatorio', 'MX', 'https://wwwnp.sat.gob.mx/minisitio/ActividadesVulnerables/documentos/formato_identificacion_beneficiario_controlador.pdf', 'rule_based', 'beneficiaryOwners.js cruza cada beneficiario declarado contra OFAC/PEP; no consulta el SAT directamente.'),
('CNBV PEP nacionales', 'regulatorio', 'MX', 'https://www.gob.mx/cnbv/documentos/personas-politicamente-expuestas-nacionales', 'rule_based', 'pepScreening.js — catálogo estático de cargos LFPIORPI (no hay base de nombres PEP pública en México).'),
('OFAC Sanctions List Service', 'regulatorio', NULL, 'https://ofac.treasury.gov/sanctions-list-service', 'real_api', 'ofacScreening.js descarga el CSV oficial de la lista SDN.'),
('OFAC SLS API', 'regulatorio', NULL, 'https://sanctionslist.ofac.treas.gov/', 'real_api', NULL),
('SHCP Taxonomía Sostenible de México', 'esg', 'MX', 'https://www.finanzassostenibles.hacienda.gob.mx/es/finanzassostenibles/taxonomia', 'named_only', 'Referenciada por nombre en la rúbrica ESG; verificación por mención de keywords, no clasificación real contra la taxonomía.'),
('SEMARNAT impacto ambiental', 'ambiental', 'MX', 'https://www.gob.mx/semarnat/acciones-y-programas/tramites-relacionados-al-tema-de-impacto-ambiental', 'rule_based', 'Regla condicional por sector en la rúbrica ESIA recuerda verificar si aplica MIA; no consulta a SEMARNAT.'),
('OpenCorporates', 'corporativo', NULL, 'https://opencorporates.com/', 'named_only', 'Sin integración; requiere plan pagado para uso comercial a volumen.'),
('GLEIF API', 'corporativo', NULL, 'https://www.gleif.org/en/lei-data/gleif-api', 'real_api', 'gleifService.js — API pública gratuita de LEI, sin key.'),
('SEC EDGAR APIs', 'corporativo', 'US', 'https://www.sec.gov/search-filings/edgar-application-programming-interfaces', 'real_api', 'secScreening.js ya usa EDGAR full-text search para antecedentes de cumplimiento (AP/LR), no para filings 10-K/10-Q/XBRL.'),
('Companies House API', 'corporativo', 'UK', 'https://developer.company-information.service.gov.uk/', 'real_api', 'companiesHouseService.js — API real con COMPANIES_HOUSE_API_KEY.'),
('IFC Performance Standards', 'esg', NULL, 'https://www.ifc.org/en/insights-reports/2012/ifc-performance-standards', 'named_only', 'Referenciado en rúbricas ESG/ESIA; verificación por mención de keywords.'),
('Equator Principles', 'esg', NULL, 'https://equator-principles.com/', 'named_only', NULL),
('World Bank ESF', 'esg', NULL, 'https://www.worldbank.org/en/projects-operations/environmental-and-social-framework', 'named_only', NULL),
('UN SDGs', 'esg', NULL, 'https://sdgs.un.org/goals', 'named_only', 'Frontend tiene el catálogo completo de los 17 ODS (requisitosMinimos.js); rúbrica ODS verifica mención, no integración con fuente oficial ONU.'),
('IFRS ISSB', 'esg', NULL, 'https://www.ifrs.org/sustainability/knowledge-hub/introduction-to-issb-and-ifrs-sustainability-disclosure-standards/', 'named_only', NULL),
('GRI Standards', 'esg', NULL, 'https://www.globalreporting.org/standards/', 'named_only', NULL),
('SASB Standards', 'esg', NULL, 'https://navigator.sasb.ifrs.org/', 'named_only', NULL)
ON CONFLICT DO NOTHING;
