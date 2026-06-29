import { supabaseAdmin } from '../config/supabase.js';

// Catálogo de tipos de documento, por país.
// Estos codigos deben coincidir EXACTAMENTE con document_type_catalog.code en
// Supabase (documents.document_type tiene foreign key a esa tabla). Antes de
// agregar o renombrar un codigo aqui, agregar/confirmar la fila correspondiente
// en document_type_catalog primero, o cada clasificacion con ese codigo
// fallara con "violates foreign key constraint documents_document_type_fkey".
const DOCUMENT_TYPES = [
  // México (sin prefijo de país, códigos históricos)
  { code: 'INE_FRENTE', name: 'INE Frente', category: 'Identidad', country: 'MX' },
  { code: 'INE_REVERSO', name: 'INE Reverso', category: 'Identidad', country: 'MX' },
  { code: 'RFC_CSF', name: 'Constancia de Situación Fiscal (CSF)', category: 'Fiscal', country: 'MX' },
  { code: 'OPINION_32D', name: 'Opinión de Cumplimiento 32-D', category: 'Fiscal', country: 'MX' },
  { code: 'COMP_DOMICILIO', name: 'Comprobante de Domicilio', category: 'Identidad', country: 'MX' },
  { code: 'ACTA_CONST', name: 'Acta Constitutiva', category: 'Legal', country: 'MX' },
  { code: 'EDOS_FINANCIEROS', name: 'Estados Financieros', category: 'Financiero', country: 'MX' },
  { code: 'DECL_ANUAL', name: 'Declaración Anual', category: 'Fiscal', country: 'MX' },
  { code: 'DECL_MENSUAL', name: 'Declaración Mensual', category: 'Fiscal', country: 'MX' },
  { code: 'AVALUO', name: 'Avalúo Comercial', category: 'Garantías', country: 'MX' },
  { code: 'BURO_CREDITO', name: 'Reporte de Buró de Crédito', category: 'Riesgo', country: 'MX' },
  { code: 'CONTRATO_ARREND', name: 'Contrato de Arrendamiento', category: 'Legal', country: 'MX' },
  { code: 'CEDULA_PROFESIONAL', name: 'Cédula Profesional', category: 'Identidad', country: 'MX' },
  { code: 'CURP_DOC', name: 'CURP', category: 'Identidad', country: 'MX' },
  { code: 'CFDI_FACTURA', name: 'Factura / CFDI', category: 'Fiscal', country: 'MX' },
  { code: 'EDO_CUENTA_BANC', name: 'Estado de Cuenta Bancario', category: 'Financiero', country: 'MX' },
  { code: 'PODER_NOTARIAL', name: 'Poder Notarial', category: 'Legal', country: 'MX' },
  { code: 'COMPROBANTE_PAGO', name: 'Comprobante de Pago / SPEI', category: 'Financiero', country: 'MX' },
  { code: 'ACTA_ASAMBLEA', name: 'Acta de Asamblea', category: 'Legal', country: 'MX' },
  { code: 'DIOT', name: 'Declaración Informativa de Operaciones con Terceros (DIOT)', category: 'Fiscal', country: 'MX' },
  // Colombia
  { code: 'CO_CEDULA', name: 'Cédula de Ciudadanía', category: 'Identidad', country: 'CO' },
  { code: 'CO_CEDULA_EXT', name: 'Cédula de Extranjería', category: 'Identidad', country: 'CO' },
  { code: 'CO_PASAPORTE', name: 'Pasaporte Colombiano', category: 'Identidad', country: 'CO' },
  { code: 'CO_NIT_RUT', name: 'RUT / NIT (DIAN)', category: 'Corporativo', country: 'CO' },
  { code: 'CO_CERT_EXISTENCIA', name: 'Certificado de Existencia y Representación', category: 'Corporativo', country: 'CO' },
  { code: 'CO_ESCRITURA', name: 'Escritura de Constitución', category: 'Corporativo', country: 'CO' },
  { code: 'CO_EEFF_NIIF', name: 'Estados Financieros (NIIF)', category: 'Financiero', country: 'CO' },
  { code: 'CO_DECL_RENTA', name: 'Declaración de Renta (DIAN)', category: 'Fiscal', country: 'CO' },
  { code: 'CO_PAZ_SALVO', name: 'Paz y Salvo DIAN', category: 'Compliance', country: 'CO' },
  { code: 'CO_DATACREDITO', name: 'Reporte DataCrédito', category: 'Riesgo', country: 'CO' },
  { code: 'CO_COMP_DOMICILIO', name: 'Recibo de Servicios Públicos', category: 'Identidad', country: 'CO' },
  // Ecuador
  { code: 'EC_CEDULA', name: 'Cédula de Identidad', category: 'Identidad', country: 'EC' },
  { code: 'EC_PASAPORTE', name: 'Pasaporte Ecuatoriano', category: 'Identidad', country: 'EC' },
  { code: 'EC_RUC', name: 'RUC (SRI)', category: 'Corporativo', country: 'EC' },
  { code: 'EC_ESCRITURA', name: 'Escritura de Constitución', category: 'Corporativo', country: 'EC' },
  { code: 'EC_NOMBRAMIENTO', name: 'Nombramiento de Representante Legal', category: 'Corporativo', country: 'EC' },
  { code: 'EC_EEFF_NIIF', name: 'Estados Financieros (NIIF)', category: 'Financiero', country: 'EC' },
  { code: 'EC_DECL_SRI', name: 'Declaración Impuesto Renta (SRI)', category: 'Fiscal', country: 'EC' },
  { code: 'EC_CERT_CUMPL', name: 'Certificado de Cumplimiento Tributario', category: 'Compliance', country: 'EC' },
  { code: 'EC_SUPER_CIAS', name: 'Certificado Superintendencia de Compañías', category: 'Corporativo', country: 'EC' },
  // Argentina
  { code: 'AR_DNI', name: 'DNI (Documento Nacional de Identidad)', category: 'Identidad', country: 'AR' },
  { code: 'AR_PASAPORTE', name: 'Pasaporte Argentino', category: 'Identidad', country: 'AR' },
  { code: 'AR_CUIT', name: 'CUIT / Constancia AFIP', category: 'Corporativo', country: 'AR' },
  { code: 'AR_CUIL', name: 'CUIL (persona física)', category: 'Identidad', country: 'AR' },
  { code: 'AR_ESTATUTO', name: 'Estatuto Social / Contrato Social', category: 'Corporativo', country: 'AR' },
  { code: 'AR_IGJ_INSCRIPCION', name: 'Inscripción IGJ / Registro Público', category: 'Corporativo', country: 'AR' },
  { code: 'AR_EEFF', name: 'Estados Contables (RT FACPCE)', category: 'Financiero', country: 'AR' },
  { code: 'AR_DDJJ_GANANCIAS', name: 'DDJJ Impuesto a las Ganancias (AFIP)', category: 'Fiscal', country: 'AR' },
  { code: 'AR_CERT_FISCAL', name: 'Certificado de Cumplimiento Fiscal AFIP', category: 'Compliance', country: 'AR' },
  { code: 'AR_VERAZ', name: 'Informe Veraz / Nosis', category: 'Riesgo', country: 'AR' },
  { code: 'AR_PODER', name: 'Poder General/Especial', category: 'Legal', country: 'AR' },
  // Perú
  { code: 'PE_DNI', name: 'DNI (RENIEC)', category: 'Identidad', country: 'PE' },
  { code: 'PE_CARNET_EXT', name: 'Carné de Extranjería', category: 'Identidad', country: 'PE' },
  { code: 'PE_PASAPORTE', name: 'Pasaporte Peruano', category: 'Identidad', country: 'PE' },
  { code: 'PE_RUC', name: 'RUC (SUNAT)', category: 'Corporativo', country: 'PE' },
  { code: 'PE_FICHA_RUC', name: 'Ficha RUC (SUNAT)', category: 'Corporativo', country: 'PE' },
  { code: 'PE_PART_REGISTRAL', name: 'Partida Registral (SUNARP)', category: 'Corporativo', country: 'PE' },
  { code: 'PE_ESCRITURA', name: 'Escritura Pública de Constitución', category: 'Corporativo', country: 'PE' },
  { code: 'PE_VIGENCIA_PODER', name: 'Vigencia de Poder (SUNARP)', category: 'Legal', country: 'PE' },
  { code: 'PE_EEFF_NIIF', name: 'Estados Financieros (NIIF)', category: 'Financiero', country: 'PE' },
  { code: 'PE_DDJJ_SUNAT', name: 'Declaración Jurada Anual (SUNAT)', category: 'Fiscal', country: 'PE' },
  { code: 'PE_CERT_NO_ADEUDO', name: 'Certificado de No Adeudo (SUNAT)', category: 'Compliance', country: 'PE' },
  { code: 'PE_SENTINEL', name: 'Reporte Sentinel / Equifax PE', category: 'Riesgo', country: 'PE' },
  // Chile
  { code: 'CL_CEDULA_RUN', name: 'Cédula de Identidad / RUN', category: 'Identidad', country: 'CL' },
  { code: 'CL_PASAPORTE', name: 'Pasaporte Chileno', category: 'Identidad', country: 'CL' },
  { code: 'CL_RUT', name: 'RUT Empresa (SII)', category: 'Corporativo', country: 'CL' },
  { code: 'CL_ESCRITURA', name: 'Escritura de Constitución', category: 'Corporativo', country: 'CL' },
  { code: 'CL_CERT_VIGENCIA', name: 'Certificado de Vigencia (CBR)', category: 'Corporativo', country: 'CL' },
  { code: 'CL_EEFF_NIIF', name: 'Estados Financieros (NIIF Chile)', category: 'Financiero', country: 'CL' },
  { code: 'CL_F22', name: 'Formulario 22 (Renta Anual SII)', category: 'Fiscal', country: 'CL' },
  { code: 'CL_CERT_CUMPL_SII', name: 'Certificado de Cumplimiento SII', category: 'Compliance', country: 'CL' },
  { code: 'CL_DICOM', name: 'Informe DICOM / Equifax CL', category: 'Riesgo', country: 'CL' },
  // Bolivia
  { code: 'BO_CEDULA', name: 'Cédula de Identidad', category: 'Identidad', country: 'BO' },
  { code: 'BO_NIT', name: 'NIT (SIN)', category: 'Corporativo', country: 'BO' },
  { code: 'BO_MATRICULA_COM', name: 'Matrícula de Comercio (SEPREC)', category: 'Corporativo', country: 'BO' },
  { code: 'BO_ESCRITURA', name: 'Escritura de Constitución', category: 'Corporativo', country: 'BO' },
  { code: 'BO_EEFF', name: 'Estados Financieros', category: 'Financiero', country: 'BO' },
  { code: 'BO_RUPE', name: 'Certificado RUPE', category: 'Compliance', country: 'BO' },
  // Paraguay
  { code: 'PY_CEDULA', name: 'Cédula de Identidad', category: 'Identidad', country: 'PY' },
  { code: 'PY_RUC', name: 'RUC (SET)', category: 'Corporativo', country: 'PY' },
  { code: 'PY_ESCRITURA', name: 'Escritura de Constitución', category: 'Corporativo', country: 'PY' },
  { code: 'PY_PATENTE_COM', name: 'Patente Comercial Municipal', category: 'Corporativo', country: 'PY' },
  { code: 'PY_EEFF', name: 'Estados Financieros', category: 'Financiero', country: 'PY' },
  { code: 'PY_CERT_CUMPL_SET', name: 'Certificado de Cumplimiento SET', category: 'Compliance', country: 'PY' },
  { code: 'PY_INFORMCONF', name: 'Informe Informconf', category: 'Riesgo', country: 'PY' },
  // Uruguay
  { code: 'UY_CEDULA', name: 'Cédula de Identidad', category: 'Identidad', country: 'UY' },
  { code: 'UY_RUT', name: 'RUT (DGI)', category: 'Corporativo', country: 'UY' },
  { code: 'UY_ESCRITURA', name: 'Escritura de Constitución', category: 'Corporativo', country: 'UY' },
  { code: 'UY_CERT_DGI', name: 'Certificado Único DGI', category: 'Compliance', country: 'UY' },
  { code: 'UY_CERT_BPS', name: 'Certificado BPS', category: 'Compliance', country: 'UY' },
  { code: 'UY_EEFF', name: 'Estados Financieros (NIIF)', category: 'Financiero', country: 'UY' },
  { code: 'UY_CLEARING', name: 'Informe Clearing de Informes', category: 'Riesgo', country: 'UY' },
  // USA
  { code: 'US_DRIVERS_LIC', name: 'Licencia de Conducir USA', category: 'Identidad', country: 'US' },
  { code: 'US_STATE_ID', name: 'State ID', category: 'Identidad', country: 'US' },
  { code: 'US_PASSPORT', name: 'Pasaporte USA', category: 'Identidad', country: 'US' },
  { code: 'US_SSN_CARD', name: 'Tarjeta Social Security', category: 'Identidad', country: 'US' },
  { code: 'US_EIN', name: 'EIN Confirmation (IRS)', category: 'Corporativo', country: 'US' },
  { code: 'US_ARTICLES_INC', name: 'Articles of Incorporation', category: 'Corporativo', country: 'US' },
  { code: 'US_CERT_GOOD_STAND', name: 'Certificate of Good Standing', category: 'Corporativo', country: 'US' },
  { code: 'US_OPERATING_AGR', name: 'Operating Agreement (LLC)', category: 'Corporativo', country: 'US' },
  { code: 'US_BYLAWS', name: 'Bylaws (Corporation)', category: 'Corporativo', country: 'US' },
  { code: 'US_EEFF_GAAP', name: 'Financial Statements (US GAAP)', category: 'Financiero', country: 'US' },
  { code: 'US_TAX_RETURN', name: 'Tax Return (Form 1120/1040)', category: 'Fiscal', country: 'US' },
  { code: 'US_W9', name: 'Formulario W-9', category: 'Compliance', country: 'US' },
  { code: 'US_W8BEN', name: 'Formulario W-8BEN', category: 'Compliance', country: 'US' },
  { code: 'US_CREDIT_REPORT', name: 'Credit Report (Experian/Equifax/TU)', category: 'Riesgo', country: 'US' },
  { code: 'US_BANK_STATEMENT', name: 'Bank Statement', category: 'Financiero', country: 'US' },
  // Canadá
  { code: 'CA_DRIVERS_LIC', name: 'Licencia de Conducir Canadá', category: 'Identidad', country: 'CA' },
  { code: 'CA_PASSPORT', name: 'Pasaporte Canadiense', category: 'Identidad', country: 'CA' },
  { code: 'CA_PR_CARD', name: 'Tarjeta de Residencia Permanente', category: 'Identidad', country: 'CA' },
  { code: 'CA_SIN', name: 'Social Insurance Number', category: 'Identidad', country: 'CA' },
  { code: 'CA_BN', name: 'Business Number (CRA)', category: 'Corporativo', country: 'CA' },
  { code: 'CA_ARTICLES_INC', name: 'Articles of Incorporation', category: 'Corporativo', country: 'CA' },
  { code: 'CA_CORP_REGISTRY', name: 'Corporate Registry Extract', category: 'Corporativo', country: 'CA' },
  { code: 'CA_EEFF_IFRS', name: 'Financial Statements (IFRS/ASPE)', category: 'Financiero', country: 'CA' },
  { code: 'CA_T2_RETURN', name: 'T2 Corporate Return (CRA)', category: 'Fiscal', country: 'CA' },
  { code: 'CA_T1_RETURN', name: 'T1 Personal Return (CRA)', category: 'Fiscal', country: 'CA' },
  { code: 'CA_CERT_COMPLIANCE', name: 'Certificate of Compliance (CRA)', category: 'Compliance', country: 'CA' },
  { code: 'CA_CREDIT_REPORT', name: 'Credit Report (Equifax CA/TU CA)', category: 'Riesgo', country: 'CA' }
];

// Reglas de clasificación por keywords, agrupadas por país. El país de cada
// expediente se declara en service_orders.metadata.country (ver getOrderCountry
// mas abajo); eso decide que bucket de keywords se usa, evitando que terminos
// genericos compartidos entre paises (p.ej. "escritura de constitucion") se
// confundan entre si. MX se mantiene intacto como bucket por defecto.
const COUNTRY_CLASSIFICATION_KEYWORDS = {
  MX: {
    INE_FRENTE: [/credencial para votar/i, /instituto nacional electoral/i, /clave de elector/i, /registro federal de electores/i],
    INE_REVERSO: [/elecciones federales/i, /firma del elector/i, /indice derecho/i],
    RFC_CSF: [/constancia de situacion fiscal/i, /registro federal de contribuyentes/i, /cedula de identificacion fiscal/i, /regimen simplificado de confianza/i, /actividad economica/i],
    OPINION_32D: [/opinion del cumplimiento/i, /opinion de cumplimiento/i, /sat/i, /32-d/i, /sentido de la opinion/i],
    COMP_DOMICILIO: [/comprobante de domicilio/i, /recibo de luz/i, /recibo de agua/i, /telmex/i, /cfe/i, /servicio de energia/i, /totalplay/i],
    ACTA_CONST: [/acta constitutiva/i, /notario publico/i, /notaria/i, /escritura numero/i, /sociedad mercantil/i, /denominacion o razon social/i],
    EDOS_FINANCIEROS: [/estado de situacion financiera/i, /balance general/i, /estado de resultados/i, /activo total/i, /pasivo/i, /capital contable/i, /utilidad neta/i, /ingresos/i],
    DECL_ANUAL: [/declaracion anual/i, /ejercicio fiscal/i, /impuesto sobre la renta/i, /ingresos acumulables/i, /total de deducciones/i],
    DECL_MENSUAL: [/pago provisional/i, /declaracion mensual/i, /declaracion de impuestos/i, /impuesto al valor agregado/i],
    AVALUO: [/avaluo/i, /perito valuador/i, /valor comercial/i, /descripcion del inmueble/i],
    BURO_CREDITO: [/buro de credito/i, /reporte de credito/i, /circulo de credito/i, /comportamiento de pago/i],
    CONTRATO_ARREND: [/contrato de arrendamiento/i, /arrendador/i, /arrendatario/i, /renta mensual/i, /inmueble arrendado/i],
    CEDULA_PROFESIONAL: [/cedula profesional/i, /secretaria de educacion publica/i, /registro nacional de profesionistas/i],
    CURP_DOC: [/clave unica de registro de poblacion/i, /curp/i, /gobierno de mexico/i],
    CFDI_FACTURA: [/comprobante fiscal digital/i, /factura/i, /cfdi/i, /folio fiscal/i, /uuid/i, /emisor/i, /receptor/i],
    EDO_CUENTA_BANC: [/estado de cuenta/i, /cuenta bancaria/i, /clabe/i, /saldo/i, /transacciones/i, /deposito/i],
    PODER_NOTARIAL: [/poder notarial/i, /apoderado/i, /mandato/i, /poder general/i],
    COMPROBANTE_PAGO: [/comprobante de pago/i, /transferencia/i, /spei/i, /clave de rastreo/i],
    ACTA_ASAMBLEA: [/acta de asamblea/i, /asamblea general/i, /socios/i, /capital social/i],
    DIOT: [/declaracion informativa operaciones terceros/i, /diot/i, /iva retenido/i]
  },
  CO: {
    CO_CEDULA: [/cedula de ciudadania/i, /registraduria nacional/i, /numero de identificacion personal/i],
    CO_CEDULA_EXT: [/cedula de extranjeria/i, /migracion colombia/i],
    CO_PASAPORTE: [/pasaporte/i, /republica de colombia/i],
    CO_NIT_RUT: [/registro unico tributario/i, /\bnit\b/i, /direccion de impuestos y aduanas nacionales/i, /\bdian\b/i],
    CO_CERT_EXISTENCIA: [/certificado de existencia y representacion/i, /camara de comercio/i],
    CO_ESCRITURA: [/escritura de constitucion/i, /notaria/i],
    CO_EEFF_NIIF: [/estados financieros/i, /\bniif\b/i, /balance general/i, /estado de resultados/i],
    CO_DECL_RENTA: [/declaracion de renta/i, /\bdian\b/i],
    CO_PAZ_SALVO: [/paz y salvo/i, /\bdian\b/i],
    CO_DATACREDITO: [/datacredito/i, /reporte de credito/i],
    CO_COMP_DOMICILIO: [/recibo de servicios publicos/i, /factura de servicios/i]
  },
  EC: {
    EC_CEDULA: [/cedula de identidad/i, /registro civil/i, /republica del ecuador/i],
    EC_PASAPORTE: [/pasaporte/i, /republica del ecuador/i],
    EC_RUC: [/\bruc\b/i, /servicio de rentas internas/i, /\bsri\b/i],
    EC_ESCRITURA: [/escritura de constitucion/i, /notaria/i],
    EC_NOMBRAMIENTO: [/nombramiento de representante legal/i, /representante legal/i],
    EC_EEFF_NIIF: [/estados financieros/i, /\bniif\b/i, /balance general/i],
    EC_DECL_SRI: [/declaracion del impuesto a la renta/i, /\bsri\b/i],
    EC_CERT_CUMPL: [/certificado de cumplimiento tributario/i, /\bsri\b/i],
    EC_SUPER_CIAS: [/superintendencia de companias/i]
  },
  AR: {
    AR_DNI: [/documento nacional de identidad/i, /\bdni\b/i, /renaper/i],
    AR_PASAPORTE: [/pasaporte/i, /republica argentina/i],
    AR_CUIT: [/\bcuit\b/i, /administracion federal de ingresos publicos/i, /\bafip\b/i],
    AR_CUIL: [/\bcuil\b/i],
    AR_ESTATUTO: [/estatuto social/i, /contrato social/i],
    AR_IGJ_INSCRIPCION: [/inspeccion general de justicia/i, /\bigj\b/i],
    AR_EEFF: [/estados contables/i, /balance general/i, /facpce/i],
    AR_DDJJ_GANANCIAS: [/impuesto a las ganancias/i, /\bafip\b/i, /declaracion jurada/i],
    AR_CERT_FISCAL: [/certificado de cumplimiento fiscal/i, /\bafip\b/i],
    AR_VERAZ: [/informe veraz/i, /\bnosis\b/i],
    AR_PODER: [/poder general/i, /poder especial/i]
  },
  PE: {
    PE_DNI: [/documento nacional de identidad/i, /\bdni\b/i, /reniec/i],
    PE_CARNET_EXT: [/carne de extranjeria/i],
    PE_PASAPORTE: [/pasaporte/i, /republica del peru/i],
    PE_RUC: [/\bruc\b/i, /\bsunat\b/i],
    PE_FICHA_RUC: [/ficha ruc/i, /\bsunat\b/i],
    PE_PART_REGISTRAL: [/partida registral/i, /\bsunarp\b/i],
    PE_ESCRITURA: [/escritura publica de constitucion/i, /notaria/i],
    PE_VIGENCIA_PODER: [/vigencia de poder/i, /\bsunarp\b/i],
    PE_EEFF_NIIF: [/estados financieros/i, /\bniif\b/i],
    PE_DDJJ_SUNAT: [/declaracion jurada anual/i, /\bsunat\b/i],
    PE_CERT_NO_ADEUDO: [/certificado de no adeudo/i, /\bsunat\b/i],
    PE_SENTINEL: [/\bsentinel\b/i, /equifax/i]
  },
  CL: {
    CL_CEDULA_RUN: [/cedula de identidad/i, /\brun\b/i, /republica de chile/i],
    CL_PASAPORTE: [/pasaporte/i, /republica de chile/i],
    CL_RUT: [/\brut\b/i, /servicio de impuestos internos/i, /\bsii\b/i],
    CL_ESCRITURA: [/escritura de constitucion/i, /notaria/i],
    CL_CERT_VIGENCIA: [/certificado de vigencia/i, /conservador de bienes raices/i],
    CL_EEFF_NIIF: [/estados financieros/i, /\bniif\b/i],
    CL_F22: [/formulario 22/i, /\bsii\b/i],
    CL_CERT_CUMPL_SII: [/certificado de cumplimiento/i, /\bsii\b/i],
    CL_DICOM: [/\bdicom\b/i, /equifax/i]
  },
  BO: {
    BO_CEDULA: [/cedula de identidad/i, /estado plurinacional de bolivia/i],
    BO_NIT: [/\bnit\b/i, /servicio de impuestos nacionales/i],
    BO_MATRICULA_COM: [/matricula de comercio/i, /\bseprec\b/i],
    BO_ESCRITURA: [/escritura de constitucion/i, /notaria/i],
    BO_EEFF: [/estados financieros/i],
    BO_RUPE: [/\brupe\b/i, /certificado rupe/i]
  },
  PY: {
    PY_CEDULA: [/cedula de identidad/i, /republica del paraguay/i],
    PY_RUC: [/\bruc\b/i, /subsecretaria de estado de tributacion/i, /\bset\b/i],
    PY_ESCRITURA: [/escritura de constitucion/i, /notaria/i],
    PY_PATENTE_COM: [/patente comercial/i, /municipal/i],
    PY_EEFF: [/estados financieros/i],
    PY_CERT_CUMPL_SET: [/certificado de cumplimiento/i, /\bset\b/i],
    PY_INFORMCONF: [/informconf/i]
  },
  UY: {
    UY_CEDULA: [/cedula de identidad/i, /republica oriental del uruguay/i],
    UY_RUT: [/\brut\b/i, /direccion general impositiva/i, /\bdgi\b/i],
    UY_ESCRITURA: [/escritura de constitucion/i, /notaria/i],
    UY_CERT_DGI: [/certificado unico/i, /\bdgi\b/i],
    UY_CERT_BPS: [/banco de prevision social/i, /\bbps\b/i],
    UY_EEFF: [/estados financieros/i, /\bniif\b/i],
    UY_CLEARING: [/clearing de informes/i]
  },
  US: {
    US_DRIVERS_LIC: [/driver.?s licen[sc]e/i, /department of motor vehicles/i, /\bdmv\b/i],
    US_STATE_ID: [/state id/i, /identification card/i],
    US_PASSPORT: [/passport/i, /united states of america/i, /department of state/i],
    US_SSN_CARD: [/social security/i, /\bssn\b/i],
    US_EIN: [/employer identification number/i, /\bein\b/i, /internal revenue service/i, /\birs\b/i],
    US_ARTICLES_INC: [/articles of incorporation/i, /secretary of state/i],
    US_CERT_GOOD_STAND: [/certificate of good standing/i],
    US_OPERATING_AGR: [/operating agreement/i, /\bllc\b/i],
    US_BYLAWS: [/bylaws/i, /corporate bylaws/i],
    US_EEFF_GAAP: [/balance sheet/i, /generally accepted accounting principles/i, /\bgaap\b/i, /profit and loss/i],
    US_TAX_RETURN: [/form 1120/i, /form 1040/i, /federal tax return/i],
    US_W9: [/form w-9/i, /\bw-9\b/i],
    US_W8BEN: [/w-8ben/i],
    US_CREDIT_REPORT: [/credit report/i, /experian|equifax|transunion/i],
    US_BANK_STATEMENT: [/bank statement/i, /account summary/i]
  },
  CA: {
    CA_DRIVERS_LIC: [/driver.?s licen[sc]e/i, /service ontario|icbc|service canada/i],
    CA_PASSPORT: [/canadian passport/i, /passeport canadien/i],
    CA_PR_CARD: [/permanent resident card/i, /carte de resident permanent/i],
    CA_SIN: [/social insurance number/i, /\bsin\b/i],
    CA_BN: [/business number/i, /canada revenue agency/i, /\bcra\b/i],
    CA_ARTICLES_INC: [/articles of incorporation/i, /corporations canada/i],
    CA_CORP_REGISTRY: [/corporate registry/i, /provincial corporate registry/i],
    CA_EEFF_IFRS: [/financial statements/i, /\bifrs\b|\baspe\b/i],
    CA_T2_RETURN: [/\bt2\b/i, /corporate income tax return/i],
    CA_T1_RETURN: [/\bt1\b/i, /personal income tax return/i],
    CA_CERT_COMPLIANCE: [/certificate of compliance/i, /\bcra\b/i],
    CA_CREDIT_REPORT: [/credit report/i, /equifax canada|transunion canada/i]
  }
};

// Obtiene el pais declarado por el solicitante al crear el expediente
// (service_orders.metadata.country, ver routes/orders.js). Es la fuente de
// verdad principal para decidir que catalogo de documentos usar; el usuario
// ya lo declaro de entrada, asi que no hay que adivinarlo por OCR salvo como
// señal de cruce (ver countryDetector.js).
export async function getOrderCountry(orderId) {
  if (!orderId) return 'MX';
  const { data } = await supabaseAdmin
    .from('service_orders')
    .select('metadata')
    .eq('id', orderId)
    .maybeSingle();
  return data?.metadata?.country || 'MX';
}

// 1. Clasificación por keywords
export function classifyDocument(filename, textContent = '', country = 'MX') {
  const keywordSet = COUNTRY_CLASSIFICATION_KEYWORDS[country] || COUNTRY_CLASSIFICATION_KEYWORDS.MX;
  const normalizedFilename = String(filename || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  
  const normalizedText = String(textContent || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  let matchedType = 'OTRO';
  let maxMatchedCount = 0;
  let matchedBy = 'none';

  // Primero buscar por coincidencia en el nombre de archivo (peso alto)
  for (const [code, patterns] of Object.entries(keywordSet)) {
    const codeLower = code.toLowerCase();
    const hasNameMatch = normalizedFilename.includes(codeLower) || 
      (codeLower === 'comp_domicilio' && (normalizedFilename.includes('domicilio') || normalizedFilename.includes('recibo') || normalizedFilename.includes('cfe') || normalizedFilename.includes('luz')));
    
    if (hasNameMatch) {
      matchedType = code;
      matchedBy = 'filename';
      maxMatchedCount = 1;
      break;
    }
  }

  // Si no se clasificó por nombre de archivo o se quiere corroborar con texto
  if (matchedBy === 'none' && normalizedText.length > 0) {
    for (const [code, patterns] of Object.entries(keywordSet)) {
      let count = 0;
      patterns.forEach(pattern => {
        if (pattern.test(normalizedText)) {
          count++;
        }
      });

      if (count > maxMatchedCount) {
        maxMatchedCount = count;
        matchedType = code;
        matchedBy = 'content';
      }
    }
  }

  // Si hubo al menos una coincidencia en texto
  const confidence = matchedBy === 'filename' ? 95 : (maxMatchedCount > 0 ? Math.min(50 + maxMatchedCount * 15, 99) : 10);

  return {
    document_type_code: matchedType,
    confidence,
    matched_by: matchedBy,
    matched_count: maxMatchedCount
  };
}

// 2. Operaciones con Extractions
//
// document_extractions (NAGMAR_SCHEMA_V3_FINAL.sql) requiere
// extraction_method (NOT NULL + CHECK de valores fijos) y processed_by (NOT
// NULL), y usa extraction_confidence (no confidence_score, ni existe
// extracted_at). Tampoco hay constraint UNIQUE sobre document_id, asi que el
// upsert(onConflict:'document_id') original no era una operacion valida.
const EXTRACTION_METHOD_BY_EXT = {
  pdf: 'pdf_text',
  xlsx: 'excel_parser',
  xls: 'excel_parser',
  csv: 'excel_parser',
  png: 'ocr_tesseract',
  jpg: 'ocr_tesseract',
  jpeg: 'ocr_tesseract',
  webp: 'ocr_tesseract',
  tiff: 'ocr_tesseract',
  doc: 'word_parser',
  docx: 'word_parser'
};

function guessExtractionMethod(filename = '') {
  const ext = String(filename).split('.').pop()?.toLowerCase();
  return EXTRACTION_METHOD_BY_EXT[ext] || 'manual';
}

function fromDbExtractionRow(row) {
  if (!row) return row;
  return {
    ...row,
    confidence_score: row.extraction_confidence
  };
}

export async function saveExtraction(documentId, extractedData, confidence, processedBy = 'AgentClassifier') {
  await supabaseAdmin
    .from('document_extractions')
    .delete()
    .eq('document_id', documentId);

  const { data, error } = await supabaseAdmin
    .from('document_extractions')
    .insert({
      document_id: documentId,
      extraction_method: guessExtractionMethod(extractedData?.filename),
      extraction_confidence: confidence ?? null,
      extracted_data: extractedData || {},
      processed_by: processedBy,
      completed_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return fromDbExtractionRow(data);
}

export async function getExtraction(documentId) {
  const { data, error } = await supabaseAdmin
    .from('document_extractions')
    .select()
    .eq('document_id', documentId)
    .maybeSingle();

  if (error) throw error;
  return fromDbExtractionRow(data);
}

// 3. Operaciones con Verifications
// La tabla document_verifications (NAGMAR_SCHEMA_V3_FINAL.sql) usa columnas
// distintas a las que maneja el resto del codigo internamente
// (rule_code/status/severity/findings): el nombre real es result, no status,
// y no existe una columna findings (se guarda en details/message_es). Estos
// helpers traducen entre el shape interno usado por los agentes y el shape
// real de la tabla, sin tener que tocar agentValidator/agentFinancial ni el
// frontend que ya esperan {status, findings}.
// document_verifications.severity tiene CHECK (severity IN ('info','low',
// 'medium','high','critical','blocker')); los agentes internamente usan
// 'warning'/'error' (entre otros), que no son valores validos ahi.
const SEVERITY_TO_DB = { warning: 'medium', error: 'high' };
function toDbSeverity(severity) {
  return SEVERITY_TO_DB[severity] || severity || 'info';
}

// red_flag_category CHECK (NULL o 'fraud','inconsistency','expired','missing','suspicious','regulatory')
// rule_code tiene FK a ref_validation_rules — se deja NULL para evitar violaciones de FK.
// verification_type (sin FK) es la fuente del código de regla en escritura y lectura.
const RED_FLAG_CATEGORY_MAP = {
  // Formato de identificadores fiscales / corporativos
  RFC_FORMAT: 'regulatory', CURP_FORMAT: 'regulatory',
  CSF_ESTATUS_ACTIVO: 'regulatory', OPINION_32D_POSITIVA: 'regulatory',
  CO_NIT_FORMAT: 'regulatory', EC_CEDULA_FORMAT: 'regulatory', EC_RUC_FORMAT: 'regulatory',
  AR_CUIT_FORMAT: 'regulatory', AR_CUIL_FORMAT: 'regulatory', AR_DNI_FORMAT: 'regulatory',
  PE_RUC_FORMAT: 'regulatory', PE_DNI_FORMAT: 'regulatory',
  CL_RUT_FORMAT: 'regulatory', CL_RUN_FORMAT: 'regulatory',
  BO_NIT_FORMAT: 'regulatory', PY_RUC_FORMAT: 'regulatory', UY_RUT_FORMAT: 'regulatory',
  US_EIN_FORMAT: 'regulatory', US_SSN_FORMAT: 'regulatory',
  CA_SIN_FORMAT: 'regulatory', CA_BN_FORMAT: 'regulatory',
  // Vigencia
  VIGENCIA_NO_VENCIDA: 'expired',
  // Inconsistencias contables / financieras
  BALANCE_CUADRA: 'inconsistency', UTILIDAD_COHERENTE: 'inconsistency',
  COUNTRY_MISMATCH: 'inconsistency',
  BENCHMARK_MARGEN_NETO: 'inconsistency', BENCHMARK_APALANCAMIENTO: 'inconsistency',
  BENCHMARK_DSCR: 'inconsistency',
  // Señales sospechosas
  NUMEROS_REDONDOS: 'suspicious', FORENSE_ROE_ANOMALO: 'suspicious',
  FORENSE_ROA_ANOMALO: 'suspicious',
  // Fraude
  FRAUD_METADATA_EDIT: 'fraud', FORENSE_BENFORD_LAW: 'fraud',
  // Incompleto
  COMPLETITUD_GENERAL: 'missing',
};

function toDbVerificationRow(documentId, v, agentName) {
  const isRedFlag = v.status === 'fail' || v.status === 'warning';
  return {
    document_id: documentId,
    verification_type: v.rule_code || 'general',
    rule_code: null,
    result: v.status,
    severity: toDbSeverity(v.severity),
    details: { findings: v.findings || '' },
    message_es: v.findings || '',
    is_red_flag: isRedFlag,
    red_flag_category: isRedFlag ? (RED_FLAG_CATEGORY_MAP[v.rule_code] || null) : null,
    verified_by: agentName || 'Sistema',
    verified_at: new Date().toISOString()
  };
}

function fromDbVerificationRow(row) {
  return {
    ...row,
    rule_code: row.verification_type,
    status: row.result,
    findings: row.details?.findings || row.message_es || ''
  };
}

export async function saveVerifications(documentId, verifications = [], agentName = 'Sistema') {
  if (!verifications.length) return [];

  // Borrar previas para este doc
  await supabaseAdmin
    .from('document_verifications')
    .delete()
    .eq('document_id', documentId);

  const { data, error } = await supabaseAdmin
    .from('document_verifications')
    .insert(verifications.map((v) => toDbVerificationRow(documentId, v, agentName)))
    .select();

  if (error) throw error;
  return (data || []).map(fromDbVerificationRow);
}

export async function getVerifications(documentId) {
  const { data, error } = await supabaseAdmin
    .from('document_verifications')
    .select()
    .eq('document_id', documentId);

  if (error) throw error;
  return (data || []).map(fromDbVerificationRow);
}

export async function getDocumentRedFlags(documentId) {
  const { data, error } = await supabaseAdmin
    .from('document_verifications')
    .select()
    .eq('document_id', documentId)
    .in('result', ['fail', 'warning'])
    .order('severity', { ascending: false });

  if (error) throw error;
  return (data || []).map(fromDbVerificationRow);
}

// 4. Operaciones con Scores
//
// document_scores (NAGMAR_SCHEMA_V3_FINAL.sql) requiere expediente_id (NOT
// NULL, el codigo nunca lo mandaba), usa overall_score (no composite_score)
// y recency_score (no validity_score). Tampoco tiene una constraint UNIQUE
// sobre document_id, asi que upsert(onConflict: 'document_id') fallaba
// ("no unique or exclusion constraint"); se reemplaza por borrar+insertar,
// igual que el resto de tablas operativas de este servicio.
function fromDbScoreRow(row) {
  if (!row) return row;
  return {
    ...row,
    composite_score: row.overall_score,
    validity_score: row.recency_score
  };
}

export async function saveScore(documentId, scoreData) {
  // scoreData: { completeness, authenticity, consistency, quality, validity }
  const completeness = scoreData.completeness ?? 100;
  const authenticity = scoreData.authenticity ?? 100;
  const consistency = scoreData.consistency ?? 100;
  const quality = scoreData.quality ?? 100;
  const validity = scoreData.validity ?? 100;

  // Fórmula ponderada:
  // Complejidad/Completitud 30%, Autenticidad 25%, Consistencia 20%, Calidad 15%, Vigencia 10%
  const compositeScore = Math.round(
    completeness * 0.30 +
    authenticity * 0.25 +
    consistency * 0.20 +
    quality * 0.15 +
    validity * 0.10
  );

  let trafficLight = 'green';
  if (compositeScore < 50) trafficLight = 'red';
  else if (compositeScore < 75) trafficLight = 'yellow';

  const { data: documentRow, error: docError } = await supabaseAdmin
    .from('documents')
    .select('order_id')
    .eq('id', documentId)
    .single();
  if (docError) throw docError;

  await supabaseAdmin
    .from('document_scores')
    .delete()
    .eq('document_id', documentId);

  const { data, error } = await supabaseAdmin
    .from('document_scores')
    .insert({
      document_id: documentId,
      expediente_id: documentRow.order_id,
      overall_score: compositeScore,
      completeness_score: completeness,
      authenticity_score: authenticity,
      consistency_score: consistency,
      quality_score: quality,
      recency_score: validity,
      traffic_light: trafficLight,
      scored_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return fromDbScoreRow(data);
}

export async function getScore(documentId) {
  const { data, error } = await supabaseAdmin
    .from('document_scores')
    .select()
    .eq('document_id', documentId)
    .maybeSingle();

  if (error) throw error;
  return fromDbScoreRow(data);
}

// 5. Bitácora de agentes
// agent_review_log (NAGMAR_SCHEMA_V3_FINAL.sql) no tiene columnas details ni
// cost_usd (es estimated_cost_usd), y exige document_id/expediente_id NOT
// NULL que esta funcion nunca recibio (varias llamadas son a nivel de lote,
// sin un solo documento). Es puro telemetria/auditoria de costo -- nunca debe
// tumbar la operacion real del agente, asi que cualquier error se atrapa y
// solo se reporta a consola en vez de propagarse al llamador.
export async function logAgentAction(agentName, action, details = {}, cost = 0.0) {
  try {
    const { data, error } = await supabaseAdmin
      .from('agent_review_log')
      .insert([{
        document_id: details?.documentId || details?.targetDocumentId || null,
        expediente_id: details?.expedienteId || null,
        agent_name: agentName,
        action,
        output_summary: JSON.stringify(details).slice(0, 2000),
        estimated_cost_usd: cost,
        completed_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`logAgentAction fallo (no bloquea la operacion real): ${error.message}`);
    return null;
  }
}

// 6. Cruce de Referencias
// Igual que document_verifications, la tabla cross_references
// (NAGMAR_SCHEMA_V3_FINAL.sql) usa columnas distintas a las que maneja
// agentCrossRef.js/agentRiskScorer.js internamente:
// expediente_id (no order_id), document_a_id/document_b_id (no
// source_document_id/target_document_id), field_name (no
// cross_reference_type), match_result (no status), similarity_score (no
// confidence_score), message_es (no details).
function toDbCrossReferenceRow(c) {
  return {
    expediente_id: c.order_id,
    document_a_id: c.source_document_id,
    document_b_id: c.target_document_id,
    field_name: c.cross_reference_type,
    match_result: c.status, // 'pass', 'fail', 'warning'
    similarity_score: c.confidence_score ?? null,
    is_critical: c.status === 'fail',
    message_es: c.details || '',
    created_by: 'agent_cross_ref'
  };
}

function fromDbCrossReferenceRow(row) {
  return {
    ...row,
    order_id: row.expediente_id,
    cross_reference_type: row.field_name,
    status: row.match_result,
    confidence_score: row.similarity_score,
    details: row.message_es || ''
  };
}

export async function saveCrossReferences(expedienteId, crossReferences = []) {
  await supabaseAdmin
    .from('cross_references')
    .delete()
    .eq('expediente_id', expedienteId);

  if (!crossReferences.length) return [];

  const { data, error } = await supabaseAdmin
    .from('cross_references')
    .insert(crossReferences.map(toDbCrossReferenceRow))
    .select();

  if (error) throw error;
  return (data || []).map(fromDbCrossReferenceRow);
}

export async function getCrossReferences(expedienteId) {
  const { data, error } = await supabaseAdmin
    .from('cross_references')
    .select()
    .eq('expediente_id', expedienteId);

  if (error) throw error;
  return (data || []).map(fromDbCrossReferenceRow);
}

// 7. Resúmenes de expediente
export async function getExpedienteSummary(expedienteId) {
  // Obtenemos los documentos del expediente
  const { data: documents, error: docError } = await supabaseAdmin
    .from('documents')
    .select('id, filename, document_type, review_status')
    .eq('order_id', expedienteId);

  if (docError) throw docError;
  if (!documents || !documents.length) {
    return {
      total_documents: 0,
      analyzed_documents: 0,
      average_score: null,
      red_flags_count: 0,
      traffic_light: 'white'
    };
  }

  const documentIds = documents.map(d => d.id);

  // Obtener scores
  const { data: rawScores, error: scoreError } = await supabaseAdmin
    .from('document_scores')
    .select()
    .in('document_id', documentIds);

  if (scoreError) throw scoreError;
  const scores = (rawScores || []).map(fromDbScoreRow);

  // Obtener red flags (verificaciones fallidas o con warning)
  const { data: verifications, error: verError } = await supabaseAdmin
    .from('document_verifications')
    .select()
    .in('document_id', documentIds)
    .in('result', ['fail', 'warning']);

  if (verError) throw verError;

  const analyzedCount = scores ? scores.length : 0;
  const avgScore = analyzedCount > 0 
    ? Math.round(scores.reduce((acc, s) => acc + s.composite_score, 0) / analyzedCount) 
    : null;

  let finalTrafficLight = 'green';
  if (scores && scores.some(s => s.traffic_light === 'red')) {
    finalTrafficLight = 'red';
  } else if (scores && scores.some(s => s.traffic_light === 'yellow')) {
    finalTrafficLight = 'yellow';
  } else if (analyzedCount === 0) {
    finalTrafficLight = 'white';
  }

  return {
    total_documents: documents.length,
    analyzed_documents: analyzedCount,
    average_score: avgScore,
    red_flags_count: verifications ? verifications.length : 0,
    traffic_light: finalTrafficLight
  };
}

export async function getExpedienteRedFlags(expedienteId) {
  const { data: documents, error: docError } = await supabaseAdmin
    .from('documents')
    .select('id, filename')
    .eq('order_id', expedienteId);

  if (docError) throw docError;
  if (!documents || !documents.length) return [];

  const documentMap = {};
  documents.forEach(d => { documentMap[d.id] = d.filename; });

  const { data: verifications, error: verError } = await supabaseAdmin
    .from('document_verifications')
    .select()
    .in('document_id', Object.keys(documentMap))
    .in('result', ['fail', 'warning']);

  if (verError) throw verError;

  return (verifications || []).map(v => ({
    ...fromDbVerificationRow(v),
    filename: documentMap[v.document_id]
  })).sort((a, b) => {
    const severityOrder = { critical: 4, error: 3, warning: 2, info: 1 };
    return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
  });
}

// 8. Métodos de catálogos
export function getDocumentTypes() {
  return DOCUMENT_TYPES;
}

export async function getValidationRules(typeCode = null) {
  // Usar fallback de datos simulados en memoria o consultar tabla si existe
  const { data, error } = await supabaseAdmin
    .from('ref_validation_rules')
    .select();

  if (error || !data) {
    // Si la tabla no responde o no existe, retornamos un catálogo básico para validar local
    return [
      { rule_code: 'RFC_FORMAT', document_type_code: 'RFC_CSF', name: 'Formato RFC válido' },
      { rule_code: 'CURP_FORMAT', document_type_code: 'CURP_DOC', name: 'Formato CURP válido' },
      { rule_code: 'OPINION_POSITIVA', document_type_code: 'OPINION_32D', name: 'Opinión Positiva SAT' },
      { rule_code: 'BALANCE_CUADRA', document_type_code: 'EDOS_FINANCIEROS', name: 'Activo = Pasivo + Capital' }
    ].filter(r => !typeCode || r.document_type_code === typeCode);
  }

  return typeCode ? data.filter(r => r.document_type_code === typeCode) : data;
}

export async function getBenchmarks(sector) {
  const { data, error } = await supabaseAdmin
    .from('ref_financial_benchmarks')
    .select()
    .eq('sector', sector);

  if (error) throw error;
  return data;
}

export async function getFraudPatterns() {
  const { data, error } = await supabaseAdmin
    .from('ref_fraud_patterns')
    .select();

  if (error) throw error;
  return data;
}

// 9. Pipeline general: clasificar y procesar
export async function processDocument(documentId, filename, textContent = '', country = 'MX') {
  // Clasificar
  const classification = classifyDocument(filename, textContent, country);

  // Actualizar tabla principal `documents`
  const { error: updateError } = await supabaseAdmin
    .from('documents')
    .update({
      document_type: classification.document_type_code,
      review_status: 'in_review'
    })
    .eq('id', documentId);

  if (updateError) throw updateError;

  // Guardar extracción preliminar
  const extractedData = {
    filename,
    classification_method: classification.matched_by,
    matched_keywords_count: classification.matched_count,
    raw_snippet: textContent.slice(0, 1000)
  };
  await saveExtraction(documentId, extractedData, classification.confidence);

  // Log de la acción
  await logAgentAction(
    'AgentClassifier',
    'classify',
    { documentId, filename, type: classification.document_type_code, confidence: classification.confidence },
    0.0
  );

  return {
    documentId,
    classification
  };
}
