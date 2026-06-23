-- ══════════════════════════════════════════════════════════════════════
-- NAGMAR / NSD — Expansion multi-pais de Inteligencia Documental
-- Agrega a document_type_catalog los tipos de documento de:
-- Colombia, Ecuador, Argentina, Peru, Chile, Bolivia, Paraguay, Uruguay,
-- USA y Canada.
--
-- IMPORTANTE: esta es la UNICA tabla que de verdad bloquea el flujo, por
-- el foreign key documents.document_type -> document_type_catalog.code.
-- No se tocan ref_validation_rules / ref_expected_fields /
-- ref_financial_benchmarks / ref_country_detection_keywords porque NINGUNA
-- de esas tablas es leida en tiempo de ejecucion por el codigo (el
-- clasificador, el validador y el detector de pais ya tienen toda esa
-- logica hardcodeada en JS, ver backend/src/services/documentIntelligenceService.js,
-- backend/src/agents/agentValidator.js y backend/src/services/countryDetector.js).
--
-- Verificado contra el esquema real de Supabase el 22/06/2026 (no contra
-- el .sql original del zip "nuevos idiomas.zip", que asumia una columna
-- "country" que no existe, y un valor 'Compliance' en regulatory_framework
-- que el CHECK constraint "valid_framework" no permite).
--
-- Columnas reales de document_type_catalog (14):
--   code (PK, NOT NULL), category (NOT NULL, sin CHECK), name_es (NOT NULL),
--   name_en (NOT NULL), requires_ocr, requires_parsing, requires_face_match,
--   typical_format (NOT NULL, CHECK IN image/pdf/excel/word/mixed),
--   expiration_months, is_pii,
--   regulatory_framework (CHECK IN CNBV/SAT/UIF/KYC/KYB/GENERAL/PLD/CONAGUA/SEMARNAT),
--   is_active, created_at, updated_at (estas 3 tienen default, se omiten)
--
-- Categorias reales ya en uso (sin CHECK, pero se respeta el estilo):
-- compliance, corporativo, financiero, fiscal, general, identificacion,
-- legal, proyecto.
-- ══════════════════════════════════════════════════════════════════════

INSERT INTO document_type_catalog
  (code, category, name_es, name_en, requires_ocr, requires_parsing, requires_face_match, typical_format, expiration_months, is_pii, regulatory_framework)
VALUES

-- ═══ COLOMBIA ═══
('CO_CEDULA',          'identificacion', 'Cédula de Ciudadanía',                      'Colombian National ID',                true,  false, true,  'image', 120,  true,  'KYC'),
('CO_CEDULA_EXT',      'identificacion', 'Cédula de Extranjería',                     'Foreign Resident ID',                  true,  false, true,  'image', 36,   true,  'KYC'),
('CO_PASAPORTE',       'identificacion', 'Pasaporte Colombiano',                      'Colombian Passport',                   true,  false, true,  'image', 120,  true,  'KYC'),
('CO_NIT_RUT',         'corporativo',    'RUT / NIT (DIAN)',                          'Colombian Tax Registry',               true,  false, false, 'pdf',   12,   false, 'SAT'),
('CO_CERT_EXISTENCIA', 'corporativo',    'Certificado de Existencia y Representación','Certificate of Existence',             true,  false, false, 'pdf',   1,    false, 'KYB'),
('CO_ESCRITURA',       'corporativo',    'Escritura de Constitución',                 'Incorporation Deed',                   true,  false, false, 'pdf',   NULL, false, 'KYB'),
('CO_EEFF_NIIF',       'financiero',     'Estados Financieros (NIIF)',                'Financial Statements (IFRS)',          false, true,  false, 'excel', 12,   false, 'CNBV'),
('CO_DECL_RENTA',      'fiscal',         'Declaración de Renta (DIAN)',               'Income Tax Return',                    true,  false, false, 'pdf',   12,   false, 'SAT'),
('CO_PAZ_SALVO',       'compliance',     'Paz y Salvo DIAN',                          'DIAN Tax Clearance',                   true,  false, false, 'pdf',   1,    false, 'SAT'),
('CO_DATACREDITO',     'financiero',     'Reporte DataCrédito',                       'DataCredito Credit Report',            false, true,  false, 'pdf',   1,    true,  'CNBV'),
('CO_COMP_DOMICILIO',  'identificacion', 'Recibo de Servicios Públicos',              'Utility Bill',                         true,  false, false, 'pdf',   3,    true,  'KYC'),

-- ═══ ECUADOR ═══
('EC_CEDULA',     'identificacion', 'Cédula de Identidad',                    'Ecuadorian National ID',           true,  false, true,  'image', 120,  true,  'KYC'),
('EC_PASAPORTE',  'identificacion', 'Pasaporte Ecuatoriano',                  'Ecuadorian Passport',              true,  false, true,  'image', 120,  true,  'KYC'),
('EC_RUC',        'corporativo',    'RUC (SRI)',                              'Ecuadorian Tax ID',                true,  false, false, 'pdf',   NULL, false, 'SAT'),
('EC_ESCRITURA',  'corporativo',    'Escritura de Constitución',              'Incorporation Deed',               true,  false, false, 'pdf',   NULL, false, 'KYB'),
('EC_NOMBRAMIENTO','corporativo',   'Nombramiento de Representante Legal',    'Legal Representative Appointment', true,  false, false, 'pdf',   NULL, false, 'KYB'),
('EC_EEFF_NIIF',  'financiero',     'Estados Financieros (NIIF)',             'Financial Statements (IFRS)',      false, true,  false, 'excel', 12,   false, 'CNBV'),
('EC_DECL_SRI',   'fiscal',         'Declaración Impuesto Renta (SRI)',       'SRI Tax Return',                   true,  false, false, 'pdf',   12,   false, 'SAT'),
('EC_CERT_CUMPL', 'compliance',     'Certificado de Cumplimiento Tributario', 'Tax Compliance Certificate',       true,  false, false, 'pdf',   1,    false, 'SAT'),
('EC_SUPER_CIAS', 'corporativo',    'Certificado Superintendencia Compañías', 'Companies Superintendency Cert',   true,  false, false, 'pdf',   12,   false, 'KYB'),

-- ═══ ARGENTINA ═══
('AR_DNI',            'identificacion', 'DNI (Documento Nacional de Identidad)', 'Argentine National ID',            true,  false, true,  'image', 180,  true,  'KYC'),
('AR_PASAPORTE',      'identificacion', 'Pasaporte Argentino',                   'Argentine Passport',               true,  false, true,  'image', 120,  true,  'KYC'),
('AR_CUIT',           'corporativo',    'CUIT / Constancia AFIP',                'Argentine Tax ID (CUIT)',           true,  false, false, 'pdf',   NULL, false, 'SAT'),
('AR_CUIL',           'identificacion', 'CUIL (persona física)',                 'Individual Tax ID (CUIL)',          true,  false, false, 'pdf',   NULL, true,  'SAT'),
('AR_ESTATUTO',       'corporativo',    'Estatuto Social / Contrato Social',     'Articles of Association',          true,  false, false, 'pdf',   NULL, false, 'KYB'),
('AR_IGJ_INSCRIPCION','corporativo',    'Inscripción IGJ / Registro Público',    'IGJ Registration',                  true,  false, false, 'pdf',   NULL, false, 'KYB'),
('AR_EEFF',           'financiero',     'Estados Contables (RT FACPCE)',         'Financial Statements (AR GAAP)',    false, true,  false, 'excel', 12,   false, 'CNBV'),
('AR_DDJJ_GANANCIAS', 'fiscal',         'DDJJ Impuesto a las Ganancias (AFIP)',  'Income Tax Return (AFIP)',          true,  false, false, 'pdf',   12,   false, 'SAT'),
('AR_CERT_FISCAL',    'compliance',     'Certificado de Cumplimiento Fiscal AFIP','AFIP Tax Compliance Certificate', true,  false, false, 'pdf',   1,    false, 'SAT'),
('AR_VERAZ',          'financiero',     'Informe Veraz / Nosis',                 'Argentine Credit Report',           false, true,  false, 'pdf',   1,    true,  'CNBV'),
('AR_PODER',          'legal',          'Poder General/Especial',                'Power of Attorney',                 true,  false, false, 'pdf',   12,   false, 'KYB'),

-- ═══ PERÚ ═══
('PE_DNI',           'identificacion', 'DNI (RENIEC)',                          'Peruvian National ID',           true,  false, true,  'image', 96,   true,  'KYC'),
('PE_CARNET_EXT',    'identificacion', 'Carné de Extranjería',                  'Foreign Resident Card',          true,  false, true,  'image', 60,   true,  'KYC'),
('PE_PASAPORTE',     'identificacion', 'Pasaporte Peruano',                     'Peruvian Passport',              true,  false, true,  'image', 120,  true,  'KYC'),
('PE_RUC',           'corporativo',    'RUC (SUNAT)',                           'Peruvian Tax ID (RUC)',          true,  false, false, 'pdf',   NULL, false, 'SAT'),
('PE_FICHA_RUC',     'corporativo',    'Ficha RUC (SUNAT)',                     'RUC Certificate',                true,  false, false, 'pdf',   3,    false, 'SAT'),
('PE_PART_REGISTRAL','corporativo',    'Partida Registral (SUNARP)',            'Registry Entry',                 true,  false, false, 'pdf',   NULL, false, 'KYB'),
('PE_ESCRITURA',     'corporativo',    'Escritura Pública de Constitución',     'Incorporation Deed',             true,  false, false, 'pdf',   NULL, false, 'KYB'),
('PE_VIGENCIA_PODER','legal',          'Vigencia de Poder (SUNARP)',            'Power of Attorney Certificate',  true,  false, false, 'pdf',   1,    false, 'KYB'),
('PE_EEFF_NIIF',     'financiero',     'Estados Financieros (NIIF)',            'Financial Statements (IFRS)',    false, true,  false, 'excel', 12,   false, 'CNBV'),
('PE_DDJJ_SUNAT',    'fiscal',         'Declaración Jurada Anual (SUNAT)',      'Annual Tax Return (SUNAT)',      true,  false, false, 'pdf',   12,   false, 'SAT'),
('PE_CERT_NO_ADEUDO','compliance',     'Certificado de No Adeudo (SUNAT)',      'SUNAT No-Debt Certificate',      true,  false, false, 'pdf',   1,    false, 'SAT'),
('PE_SENTINEL',      'financiero',     'Reporte Sentinel / Equifax PE',         'Peruvian Credit Report',         false, true,  false, 'pdf',   1,    true,  'CNBV'),

-- ═══ CHILE ═══
('CL_CEDULA_RUN',    'identificacion', 'Cédula de Identidad / RUN',           'Chilean National ID (RUN)',       true,  false, true,  'image', 120,  true,  'KYC'),
('CL_PASAPORTE',     'identificacion', 'Pasaporte Chileno',                   'Chilean Passport',                true,  false, true,  'image', 120,  true,  'KYC'),
('CL_RUT',           'corporativo',    'RUT Empresa (SII)',                   'Chilean Tax ID (RUT)',            true,  false, false, 'pdf',   NULL, false, 'SAT'),
('CL_ESCRITURA',     'corporativo',    'Escritura de Constitución',           'Incorporation Deed',              true,  false, false, 'pdf',   NULL, false, 'KYB'),
('CL_CERT_VIGENCIA', 'corporativo',    'Certificado de Vigencia (CBR)',       'Certificate of Good Standing',    true,  false, false, 'pdf',   1,    false, 'KYB'),
('CL_EEFF_NIIF',     'financiero',     'Estados Financieros (NIIF Chile)',    'Financial Statements (IFRS)',     false, true,  false, 'excel', 12,   false, 'CNBV'),
('CL_F22',           'fiscal',         'Formulario 22 (Renta Anual SII)',     'Annual Tax Return (F22)',         true,  false, false, 'pdf',   12,   false, 'SAT'),
('CL_CERT_CUMPL_SII','compliance',     'Certificado de Cumplimiento SII',     'SII Tax Compliance',              true,  false, false, 'pdf',   1,    false, 'SAT'),
('CL_DICOM',         'financiero',     'Informe DICOM / Equifax CL',          'Chilean Credit Report',           false, true,  false, 'pdf',   1,    true,  'CNBV'),

-- ═══ BOLIVIA ═══
('BO_CEDULA',        'identificacion', 'Cédula de Identidad',                 'Bolivian National ID',            true,  false, true,  'image', 120,  true,  'KYC'),
('BO_NIT',           'corporativo',    'NIT (SIN)',                            'Bolivian Tax ID (NIT)',           true,  false, false, 'pdf',   NULL, false, 'SAT'),
('BO_MATRICULA_COM', 'corporativo',    'Matrícula de Comercio (SEPREC)',       'Commercial Registration',         true,  false, false, 'pdf',   12,   false, 'KYB'),
('BO_ESCRITURA',     'corporativo',    'Escritura de Constitución',           'Incorporation Deed',              true,  false, false, 'pdf',   NULL, false, 'KYB'),
('BO_EEFF',          'financiero',     'Estados Financieros',                 'Financial Statements',            false, true,  false, 'excel', 12,   false, 'CNBV'),
('BO_RUPE',          'compliance',     'Certificado RUPE',                    'RUPE Certificate',                true,  false, false, 'pdf',   12,   false, 'GENERAL'),

-- ═══ PARAGUAY ═══
('PY_CEDULA',        'identificacion', 'Cédula de Identidad',                 'Paraguayan National ID',          true,  false, true,  'image', 120,  true,  'KYC'),
('PY_RUC',           'corporativo',    'RUC (SET)',                            'Paraguayan Tax ID (RUC)',         true,  false, false, 'pdf',   NULL, false, 'SAT'),
('PY_ESCRITURA',     'corporativo',    'Escritura de Constitución',           'Incorporation Deed',              true,  false, false, 'pdf',   NULL, false, 'KYB'),
('PY_PATENTE_COM',   'corporativo',    'Patente Comercial Municipal',         'Municipal Commercial License',    true,  false, false, 'pdf',   12,   false, 'GENERAL'),
('PY_EEFF',          'financiero',     'Estados Financieros',                 'Financial Statements',            false, true,  false, 'excel', 12,   false, 'CNBV'),
('PY_CERT_CUMPL_SET','compliance',     'Certificado de Cumplimiento SET',     'SET Tax Compliance',              true,  false, false, 'pdf',   1,    false, 'SAT'),
('PY_INFORMCONF',    'financiero',     'Informe Informconf',                  'Paraguayan Credit Report',        false, true,  false, 'pdf',   1,    true,  'CNBV'),

-- ═══ URUGUAY ═══
('UY_CEDULA',     'identificacion', 'Cédula de Identidad',                 'Uruguayan National ID',           true,  false, true,  'image', 120,  true,  'KYC'),
('UY_RUT',        'corporativo',    'RUT (DGI)',                            'Uruguayan Tax ID (RUT)',          true,  false, false, 'pdf',   NULL, false, 'SAT'),
('UY_ESCRITURA',  'corporativo',    'Escritura de Constitución',           'Incorporation Deed',              true,  false, false, 'pdf',   NULL, false, 'KYB'),
('UY_CERT_DGI',   'compliance',     'Certificado Único DGI',               'DGI Tax Compliance',              true,  false, false, 'pdf',   1,    false, 'SAT'),
('UY_CERT_BPS',   'compliance',     'Certificado BPS',                      'BPS Social Security Certificate', true,  false, false, 'pdf',   1,    false, 'GENERAL'),
('UY_EEFF',       'financiero',     'Estados Financieros (NIIF)',           'Financial Statements (IFRS)',     false, true,  false, 'excel', 12,   false, 'CNBV'),
('UY_CLEARING',   'financiero',     'Informe Clearing de Informes',        'Uruguayan Credit Report',          false, true,  false, 'pdf',   1,    true,  'CNBV'),

-- ═══ USA ═══
('US_DRIVERS_LIC',     'identificacion', 'Licencia de Conducir USA',            'US Drivers License',              true,  false, true,  'image', 60,   true,  'KYC'),
('US_STATE_ID',        'identificacion', 'State ID',                            'US State ID Card',                true,  false, true,  'image', 120,  true,  'KYC'),
('US_PASSPORT',        'identificacion', 'Pasaporte USA',                       'US Passport',                      true,  false, true,  'image', 120,  true,  'KYC'),
('US_SSN_CARD',        'identificacion', 'Tarjeta Social Security',             'Social Security Card',            true,  false, false, 'image', NULL, true,  'KYC'),
('US_EIN',             'corporativo',    'EIN Confirmation (IRS)',              'EIN Confirmation Letter',         true,  false, false, 'pdf',   NULL, false, 'SAT'),
('US_ARTICLES_INC',    'corporativo',    'Articles of Incorporation',          'Articles of Incorporation',       true,  false, false, 'pdf',   NULL, false, 'KYB'),
('US_CERT_GOOD_STAND', 'corporativo',    'Certificate of Good Standing',        'Certificate of Good Standing',    true,  false, false, 'pdf',   12,   false, 'KYB'),
('US_OPERATING_AGR',   'corporativo',    'Operating Agreement (LLC)',           'LLC Operating Agreement',         true,  true,  false, 'pdf',   NULL, false, 'KYB'),
('US_BYLAWS',          'corporativo',    'Bylaws (Corporation)',                'Corporate Bylaws',                true,  true,  false, 'pdf',   NULL, false, 'KYB'),
('US_EEFF_GAAP',       'financiero',     'Financial Statements (US GAAP)',      'Financial Statements (US GAAP)',  false, true,  false, 'excel', 12,   false, 'CNBV'),
('US_TAX_RETURN',      'fiscal',         'Tax Return (Form 1120/1040)',         'Federal Tax Return',              true,  false, false, 'pdf',   12,   false, 'SAT'),
('US_W9',              'compliance',     'Formulario W-9',                      'W-9 Form',                         true,  false, false, 'pdf',   NULL, false, 'SAT'),
('US_W8BEN',           'compliance',     'Formulario W-8BEN',                   'W-8BEN Form',                      true,  false, false, 'pdf',   NULL, false, 'SAT'),
('US_CREDIT_REPORT',   'financiero',     'Credit Report (Experian/Equifax/TU)', 'US Credit Report',                false, true,  false, 'pdf',   1,    true,  'CNBV'),
('US_BANK_STATEMENT',  'financiero',     'Bank Statement',                      'US Bank Statement',               false, true,  false, 'pdf',   3,    true,  'CNBV'),

-- ═══ CANADÁ ═══
('CA_DRIVERS_LIC',     'identificacion', 'Licencia de Conducir Canadá',         'Canadian Drivers License',        true,  false, true,  'image', 60,   true,  'KYC'),
('CA_PASSPORT',        'identificacion', 'Pasaporte Canadiense',                'Canadian Passport',               true,  false, true,  'image', 120,  true,  'KYC'),
('CA_PR_CARD',         'identificacion', 'Tarjeta de Residencia Permanente',    'Permanent Resident Card',         true,  false, true,  'image', 60,   true,  'KYC'),
('CA_SIN',             'identificacion', 'Social Insurance Number',             'SIN Card/Letter',                 true,  false, false, 'pdf',   NULL, true,  'KYC'),
('CA_BN',              'corporativo',    'Business Number (CRA)',               'CRA Business Number',             true,  false, false, 'pdf',   NULL, false, 'SAT'),
('CA_ARTICLES_INC',    'corporativo',    'Articles of Incorporation',          'Canadian Articles of Inc.',       true,  false, false, 'pdf',   NULL, false, 'KYB'),
('CA_CORP_REGISTRY',   'corporativo',    'Corporate Registry Extract',          'Provincial Corporate Registry',   true,  false, false, 'pdf',   12,   false, 'KYB'),
('CA_EEFF_IFRS',       'financiero',     'Financial Statements (IFRS/ASPE)',    'Canadian Financial Statements',   false, true,  false, 'excel', 12,   false, 'CNBV'),
('CA_T2_RETURN',       'fiscal',         'T2 Corporate Return (CRA)',           'T2 Corporate Tax Return',         true,  false, false, 'pdf',   12,   false, 'SAT'),
('CA_T1_RETURN',       'fiscal',         'T1 Personal Return (CRA)',            'T1 Personal Tax Return',          true,  false, false, 'pdf',   12,   false, 'SAT'),
('CA_CERT_COMPLIANCE', 'compliance',     'Certificate of Compliance (CRA)',      'CRA Compliance Certificate',      true,  false, false, 'pdf',   1,    false, 'SAT'),
('CA_CREDIT_REPORT',   'financiero',     'Credit Report (Equifax CA/TU CA)',    'Canadian Credit Report',          false, true,  false, 'pdf',   1,    true,  'CNBV')

ON CONFLICT (code) DO NOTHING;

-- Verificacion: deberian aparecer 99 filas nuevas (44 MX existentes + 99 = 143 total)
SELECT count(*) AS total_document_types FROM document_type_catalog;
