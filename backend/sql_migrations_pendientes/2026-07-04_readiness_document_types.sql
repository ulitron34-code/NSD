-- ══════════════════════════════════════════════════════════════════════
-- NSD/NEXUS — Tipos documentales para el checklist de 12 Requisitos Mínimos
-- (módulo Readiness/Financial Readiness & Due Diligence Scoring Engine)
--
-- Agrega a document_type_catalog un código por cada item de
-- REQUISITOS_MINIMOS (frontend/src/data/requisitosMinimos.js), para que la
-- carga real de documentos (documents.js) y la revisión IA cascada
-- (aiEngine.js runAIReviewCascaded) puedan asociarse a cada uno de los 12
-- requisitos en vez de solo a los tipos genéricos de identidad/fiscal/legal
-- que ya existían.
--
-- Mismo patrón/columnas que 2026-06-22_document_type_catalog_multipais.sql.
-- Categorías reales ya en uso: compliance, corporativo, financiero, fiscal,
-- general, identificacion, legal, proyecto.
-- regulatory_framework CHECK IN (CNBV/SAT/UIF/KYC/KYB/GENERAL/PLD/CONAGUA/SEMARNAT).
-- ══════════════════════════════════════════════════════════════════════

INSERT INTO document_type_catalog
  (code, category, name_es, name_en, requires_ocr, requires_parsing, requires_face_match, typical_format, expiration_months, is_pii, regulatory_framework)
VALUES
('READY_DOC_CORPORATIVA',          'legal',      'Documentación Corporativa',                    'Corporate Documentation',            true, true, false, 'pdf', null, false, 'GENERAL'),
('READY_DOC_KYC',                  'compliance', 'Documentación KYC y de Cumplimiento',          'KYC and Compliance Documentation',   true, true, false, 'pdf', null, true,  'KYC'),
('READY_MARCO_RIESGOS',            'proyecto',   'Marco de Gestión de Riesgos',                  'Risk Management Framework',          true, true, false, 'pdf', null, false, 'GENERAL'),
('READY_ESTUDIO_VIABILIDAD',       'proyecto',   'Estudio de Viabilidad',                        'Feasibility Study',                  true, true, false, 'pdf', null, false, 'GENERAL'),
('READY_ESTUDIO_MERCADO',          'proyecto',   'Estudio de Mercado y Marketing',                'Market and Marketing Study',         true, true, false, 'pdf', null, false, 'GENERAL'),
('READY_PLAN_NEGOCIOS',            'proyecto',   'Plan de Negocios',                             'Business Plan',                      true, true, false, 'pdf', null, false, 'GENERAL'),
('READY_MODELO_FINANCIERO',        'financiero', 'Modelo Financiero y Proyecciones',              'Financial Model and Projections',    true, true, false, 'pdf', null, false, 'GENERAL'),
('READY_VIABILIDAD_FINANCIERA',    'financiero', 'Revisión de Viabilidad Financiera',            'Financial Viability Review',         true, true, false, 'pdf', null, false, 'GENERAL'),
('READY_TRANSPARENCIA_DOCUMENTAL', 'general',    'Transparencia Documental',                     'Documentary Transparency',           true, true, false, 'pdf', null, false, 'GENERAL'),
('READY_ODS',                      'general',    'Alineación con ODS de la ONU',                 'UN SDG Alignment',                   true, true, false, 'pdf', null, false, 'GENERAL'),
('READY_ESG',                      'general',    'Apartado ESG & Impact Financing',              'ESG & Impact Financing',             true, true, false, 'pdf', null, false, 'GENERAL'),
('READY_ESIA',                     'general',    'Impacto Ambiental, Social y de Gobernanza',    'Environmental, Social and Governance Impact', true, true, false, 'pdf', null, false, 'SEMARNAT')
ON CONFLICT (code) DO NOTHING;
