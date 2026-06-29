import { randomUUID } from 'crypto';

// Base de datos de documentos requeridos por país y sector.
// Portado de 08-dynamic-checklist.js (NAGMAR_8_MODULOS_INTEGRACIONES).
const CHECKLIST_DB = {
  MX: {
    realEstate: {
      name: 'Bienes Raíces',
      documentos: [
        { id: 'MX-RE-001', nombre: 'Escritura del Inmueble', criticality: 'CRITICAL', descripcion: 'Título de propiedad registrado ante notario', mintoThreshold: 0 },
        { id: 'MX-RE-002', nombre: 'Avalúo Catastral', criticality: 'CRITICAL', descripcion: 'Avalúo realizado por profesional certificado', mintoThreshold: 1000000 },
        { id: 'MX-RE-003', nombre: 'Permisos de Uso de Suelo', criticality: 'HIGH', descripcion: 'Autorización municipal para el uso actual', mintoThreshold: 0 },
        { id: 'MX-RE-004', nombre: 'Cédula Catastral', criticality: 'HIGH', descripcion: 'Registro ante Catastro Estatal', mintoThreshold: 0 },
        { id: 'MX-RE-005', nombre: 'Certificado de No Adeudo', criticality: 'MEDIUM', descripcion: 'Comprobante de pago de impuestos prediales', mintoThreshold: 500000 },
        { id: 'MX-RE-006', nombre: 'Planos Arquitectónicos', criticality: 'HIGH', descripcion: 'Planos de la construcción o remodelación', mintoThreshold: 0 },
        { id: 'MX-RE-007', nombre: 'Permisos de Construcción', criticality: 'HIGH', descripcion: 'Licencias municipales de construcción', mintoThreshold: 0 },
        { id: 'MX-RE-008', nombre: 'EEFF Auditados (Promotora)', criticality: 'HIGH', descripcion: 'Estados financieros auditados del promotor', mintoThreshold: 5000000 }
      ]
    },
    manufacturing: {
      name: 'Manufactura/Producción',
      documentos: [
        { id: 'MX-MF-001', nombre: 'RFC y Cédula del Negocio', criticality: 'CRITICAL', descripcion: 'Registro Federal de Contribuyentes', mintoThreshold: 0 },
        { id: 'MX-MF-002', nombre: 'Acta Constitutiva', criticality: 'CRITICAL', descripcion: 'Escritura de constitución de la sociedad', mintoThreshold: 0 },
        { id: 'MX-MF-003', nombre: 'EEFF Auditados (últimos 3 años)', criticality: 'CRITICAL', descripcion: 'Estados financieros auditados por contador', mintoThreshold: 0 },
        { id: 'MX-MF-004', nombre: 'Opinión 32-D', criticality: 'CRITICAL', descripcion: 'Opinión de cumplimiento fiscal ante SAT', mintoThreshold: 0 },
        { id: 'MX-MF-005', nombre: 'Registro de Equipos (Activo Fijo)', criticality: 'HIGH', descripcion: 'Inventario y documentación de maquinaria', mintoThreshold: 2000000 },
        { id: 'MX-MF-006', nombre: 'Licencias Sanitarias/Ambientales', criticality: 'HIGH', descripcion: 'Permisos PROFEPA, COFEPRIS o equivalente', mintoThreshold: 0 },
        { id: 'MX-MF-007', nombre: 'Contrato de Arrendamiento', criticality: 'MEDIUM', descripcion: 'Contrato del inmueble donde opera', mintoThreshold: 0 },
        { id: 'MX-MF-008', nombre: 'Seguros de Operación', criticality: 'MEDIUM', descripcion: 'Pólizas de responsabilidad civil', mintoThreshold: 5000000 }
      ]
    },
    servicios: {
      name: 'Servicios / Consultoría',
      documentos: [
        { id: 'MX-SV-001', nombre: 'RFC y Cédula del Negocio', criticality: 'CRITICAL', descripcion: 'Registro Federal de Contribuyentes', mintoThreshold: 0 },
        { id: 'MX-SV-002', nombre: 'Acta Constitutiva', criticality: 'CRITICAL', descripcion: 'Escritura de constitución', mintoThreshold: 0 },
        { id: 'MX-SV-003', nombre: 'EEFF Auditados (últimos 2 años)', criticality: 'CRITICAL', descripcion: 'Estados financieros auditados', mintoThreshold: 0 },
        { id: 'MX-SV-004', nombre: 'Opinión 32-D', criticality: 'HIGH', descripcion: 'Opinión de cumplimiento fiscal', mintoThreshold: 0 },
        { id: 'MX-SV-005', nombre: 'Certificados de Clientes Clave', criticality: 'MEDIUM', descripcion: 'Referencias de clientes principales', mintoThreshold: 1000000 }
      ]
    },
    agricultura: {
      name: 'Agricultura / Ganadería',
      documentos: [
        { id: 'MX-AG-001', nombre: 'RFC y Cédula', criticality: 'CRITICAL', descripcion: 'Registro Federal de Contribuyentes', mintoThreshold: 0 },
        { id: 'MX-AG-002', nombre: 'Acta Constitutiva', criticality: 'CRITICAL', descripcion: 'Escritura de constitución (si es empresa)', mintoThreshold: 0 },
        { id: 'MX-AG-003', nombre: 'Escritura de la Tierra', criticality: 'CRITICAL', descripcion: 'Título de propiedad del terreno', mintoThreshold: 0 },
        { id: 'MX-AG-004', nombre: 'Certificado CONAGUA (Agua)', criticality: 'CRITICAL', descripcion: 'Concesión de derechos de agua', mintoThreshold: 0 },
        { id: 'MX-AG-005', nombre: 'EEFF Auditados', criticality: 'HIGH', descripcion: 'Estados financieros auditados', mintoThreshold: 0 },
        { id: 'MX-AG-006', nombre: 'Análisis de Suelo', criticality: 'HIGH', descripcion: 'Estudio agrológico de la tierra', mintoThreshold: 5000000 },
        { id: 'MX-AG-007', nombre: 'Historial de Cosechas', criticality: 'MEDIUM', descripcion: 'Registro de producción últimos 3 años', mintoThreshold: 0 }
      ]
    }
  },
  US: {
    realEstate: {
      name: 'Real Estate',
      documentos: [
        { id: 'US-RE-001', nombre: 'Deed (Escritura de Propiedad)', criticality: 'CRITICAL', descripcion: 'Title document registrado en County', mintoThreshold: 0 },
        { id: 'US-RE-002', nombre: 'Appraisal Report', criticality: 'CRITICAL', descripcion: 'Avalúo profesional certificado', mintoThreshold: 500000 },
        { id: 'US-RE-003', nombre: 'Survey of Property', criticality: 'HIGH', descripcion: 'Levantamiento topográfico', mintoThreshold: 0 },
        { id: 'US-RE-004', nombre: 'Title Insurance Commitment', criticality: 'CRITICAL', descripcion: 'Seguro de título de propiedad', mintoThreshold: 0 },
        { id: 'US-RE-005', nombre: 'Property Tax Records', criticality: 'HIGH', descripcion: 'Registro de impuestos prediales', mintoThreshold: 0 },
        { id: 'US-RE-006', nombre: 'Building Permits', criticality: 'HIGH', descripcion: 'Permisos de construcción municipales', mintoThreshold: 0 }
      ]
    },
    business: {
      name: 'Business Loan',
      documentos: [
        { id: 'US-BZ-001', nombre: 'EIN (Employer ID Number)', criticality: 'CRITICAL', descripcion: 'Número de identificación fiscal', mintoThreshold: 0 },
        { id: 'US-BZ-002', nombre: 'Articles of Incorporation', criticality: 'CRITICAL', descripcion: 'Certificado de incorporación', mintoThreshold: 0 },
        { id: 'US-BZ-003', nombre: 'Audited Financial Statements', criticality: 'CRITICAL', descripcion: 'Estados financieros auditados (3 años)', mintoThreshold: 0 },
        { id: 'US-BZ-004', nombre: 'Credit Report', criticality: 'CRITICAL', descripcion: 'Reporte de crédito comercial', mintoThreshold: 0 },
        { id: 'US-BZ-005', nombre: 'Business Plan', criticality: 'HIGH', descripcion: 'Plan de negocios para uso de fondos', mintoThreshold: 1000000 },
        { id: 'US-BZ-006', nombre: 'Personal Financial Statements', criticality: 'HIGH', descripcion: 'Estado de situación personal de accionistas', mintoThreshold: 0 }
      ]
    }
  },
  CO: {
    servicios: {
      name: 'Servicios / Empresas',
      documentos: [
        { id: 'CO-SV-001', nombre: 'NIT (Número de Identificación Tributaria)', criticality: 'CRITICAL', descripcion: 'Registro DIAN', mintoThreshold: 0 },
        { id: 'CO-SV-002', nombre: 'Cámara de Comercio', criticality: 'CRITICAL', descripcion: 'Certificado vigente de Cámara de Comercio', mintoThreshold: 0 },
        { id: 'CO-SV-003', nombre: 'Estados Financieros Auditados', criticality: 'CRITICAL', descripcion: 'EEFF auditados últimos 2 años', mintoThreshold: 0 },
        { id: 'CO-SV-004', nombre: 'RUT Actualizado', criticality: 'HIGH', descripcion: 'Registro Único Tributario', mintoThreshold: 0 },
        { id: 'CO-SV-005', nombre: 'Declaración de Renta', criticality: 'HIGH', descripcion: 'Últimas 2 declaraciones de renta', mintoThreshold: 0 }
      ]
    },
    realEstate: {
      name: 'Bienes Raíces',
      documentos: [
        { id: 'CO-RE-001', nombre: 'Escritura Pública del Inmueble', criticality: 'CRITICAL', descripcion: 'Escritura registrada ante notaría', mintoThreshold: 0 },
        { id: 'CO-RE-002', nombre: 'Certificado de Tradición y Libertad', criticality: 'CRITICAL', descripcion: 'Expedido por la SNR, vigencia ≤30 días', mintoThreshold: 0 },
        { id: 'CO-RE-003', nombre: 'Avalúo Comercial', criticality: 'CRITICAL', descripcion: 'Avalúo por perito inscrito en Lonja de Propiedad Raíz', mintoThreshold: 500000000 },
        { id: 'CO-RE-004', nombre: 'Paz y Salvo Predial', criticality: 'HIGH', descripcion: 'Certificado de no adeudo de impuesto predial', mintoThreshold: 0 },
        { id: 'CO-RE-005', nombre: 'NIT o Cédula del Vendedor', criticality: 'CRITICAL', descripcion: 'Identificación del propietario actual', mintoThreshold: 0 },
        { id: 'CO-RE-006', nombre: 'Declaración de Origen de Fondos (UIAF)', criticality: 'CRITICAL', descripcion: 'Formulario SARLAFT — obligatorio para operaciones inmobiliarias según Ley 1762/2015 y Circular UIAF 042', mintoThreshold: 0 },
        { id: 'CO-RE-007', nombre: 'Formulario UIAF de Umbral (si aplica)', criticality: 'HIGH', descripcion: 'Reporte a la UIAF cuando la operación supere el umbral vigente (≥ 410 SMMLV)', mintoThreshold: 0 },
        { id: 'CO-RE-008', nombre: 'Plano Catastral IGAC', criticality: 'HIGH', descripcion: 'Plano del predio expedido por el IGAC o la Curaduría municipal — confirma linderos y área registral', mintoThreshold: 0 },
        { id: 'CO-RE-009', nombre: 'Certificado de Estrato y Uso del Suelo (IGAC/POT)', criticality: 'MEDIUM', descripcion: 'Certifica el uso permitido del inmueble conforme al Plan de Ordenamiento Territorial', mintoThreshold: 0 }
      ]
    }
  },
  AR: {
    servicios: {
      name: 'Servicios / Empresas',
      documentos: [
        { id: 'AR-SV-001', nombre: 'CUIT (Constancia AFIP)', criticality: 'CRITICAL', descripcion: 'Código Único de Identificación Tributaria vigente', mintoThreshold: 0 },
        { id: 'AR-SV-002', nombre: 'Estatuto Social / Contrato Social', criticality: 'CRITICAL', descripcion: 'Escritura con inscripción IGJ o Registro Público', mintoThreshold: 0 },
        { id: 'AR-SV-003', nombre: 'Acta de Asamblea / Directorio vigente', criticality: 'CRITICAL', descripcion: 'Autoridades societarias actuales', mintoThreshold: 0 },
        { id: 'AR-SV-004', nombre: 'Estados Contables Auditados', criticality: 'CRITICAL', descripcion: 'EEFF auditados según RT FACPCE, últimos 2 ejercicios', mintoThreshold: 0 },
        { id: 'AR-SV-005', nombre: 'DDJJ Ganancias (AFIP)', criticality: 'HIGH', descripcion: 'Declaración jurada de impuesto a las ganancias', mintoThreshold: 0 },
        { id: 'AR-SV-006', nombre: 'Certificado de Cumplimiento Fiscal AFIP', criticality: 'HIGH', descripcion: 'Constancia de cumplimiento de obligaciones fiscales', mintoThreshold: 0 },
        { id: 'AR-SV-007', nombre: 'Informe Veraz / Nosis', criticality: 'HIGH', descripcion: 'Reporte de riesgo crediticio comercial', mintoThreshold: 0 },
        { id: 'AR-SV-008', nombre: 'DNI de apoderados y beneficiarios finales', criticality: 'CRITICAL', descripcion: 'Identificación de personas con control real', mintoThreshold: 0 }
      ]
    },
    realEstate: {
      name: 'Bienes Raíces',
      documentos: [
        { id: 'AR-RE-001', nombre: 'Escritura de Dominio', criticality: 'CRITICAL', descripcion: 'Escritura traslativa con inscripción registral', mintoThreshold: 0 },
        { id: 'AR-RE-002', nombre: 'Informe de Dominio (Registro de la Propiedad)', criticality: 'CRITICAL', descripcion: 'Certificación registral actualizada', mintoThreshold: 0 },
        { id: 'AR-RE-003', nombre: 'Tasación Profesional', criticality: 'CRITICAL', descripcion: 'Tasación por martillero o tasador matriculado', mintoThreshold: 0 },
        { id: 'AR-RE-004', nombre: 'CUIT del titular', criticality: 'CRITICAL', descripcion: 'Identificación fiscal del propietario', mintoThreshold: 0 },
        { id: 'AR-RE-005', nombre: 'Libre de Deuda Municipal (ABL)', criticality: 'HIGH', descripcion: 'Alumbrado, barrido y limpieza sin deuda', mintoThreshold: 0 }
      ]
    }
  },
  CL: {
    servicios: {
      name: 'Servicios / Empresas',
      documentos: [
        { id: 'CL-SV-001', nombre: 'RUT Empresa (SII)', criticality: 'CRITICAL', descripcion: 'Rol Único Tributario de la empresa', mintoThreshold: 0 },
        { id: 'CL-SV-002', nombre: 'Escritura de Constitución', criticality: 'CRITICAL', descripcion: 'Escritura con inscripción CBR o RES', mintoThreshold: 0 },
        { id: 'CL-SV-003', nombre: 'Certificado de Vigencia (CBR / RES)', criticality: 'CRITICAL', descripcion: 'Constancia de vigencia societaria, menos de 60 días', mintoThreshold: 0 },
        { id: 'CL-SV-004', nombre: 'Estados Financieros Auditados (NIIF Chile)', criticality: 'CRITICAL', descripcion: 'EEFF auditados, últimos 2 ejercicios', mintoThreshold: 0 },
        { id: 'CL-SV-005', nombre: 'Formulario 22 (SII)', criticality: 'HIGH', descripcion: 'Declaración anual de impuesto a la renta', mintoThreshold: 0 },
        { id: 'CL-SV-006', nombre: 'Certificado de Cumplimiento SII', criticality: 'HIGH', descripcion: 'Constancia de cumplimiento tributario', mintoThreshold: 0 },
        { id: 'CL-SV-007', nombre: 'Informe DICOM / Equifax CL', criticality: 'HIGH', descripcion: 'Reporte de riesgo crediticio comercial', mintoThreshold: 0 },
        { id: 'CL-SV-008', nombre: 'Cédula de Identidad de representantes', criticality: 'CRITICAL', descripcion: 'RUN de los firmantes y beneficiarios finales', mintoThreshold: 0 }
      ]
    },
    realEstate: {
      name: 'Bienes Raíces',
      documentos: [
        { id: 'CL-RE-001', nombre: 'Escritura de Compraventa / Dominio', criticality: 'CRITICAL', descripcion: 'Escritura pública e inscripción CBR', mintoThreshold: 0 },
        { id: 'CL-RE-002', nombre: 'Certificado de Hipotecas y Gravámenes', criticality: 'CRITICAL', descripcion: 'Emitido por CBR, con antigüedad máx 30 días', mintoThreshold: 0 },
        { id: 'CL-RE-003', nombre: 'Tasación Fiscal (SII)', criticality: 'CRITICAL', descripcion: 'Avalúo fiscal SII del inmueble', mintoThreshold: 0 },
        { id: 'CL-RE-004', nombre: 'Certificado de Contribuciones al Día', criticality: 'HIGH', descripcion: 'Pago de contribuciones sin deuda', mintoThreshold: 0 }
      ]
    }
  },
  EC: {
    servicios: {
      name: 'Servicios / Empresas',
      documentos: [
        { id: 'EC-SV-001', nombre: 'RUC (SRI)', criticality: 'CRITICAL', descripcion: 'Registro Único de Contribuyentes vigente', mintoThreshold: 0 },
        { id: 'EC-SV-002', nombre: 'Escritura de Constitución', criticality: 'CRITICAL', descripcion: 'Escritura con aprobación Superintendencia de Compañías', mintoThreshold: 0 },
        { id: 'EC-SV-003', nombre: 'Nombramiento del Representante Legal', criticality: 'CRITICAL', descripcion: 'Nombramiento inscrito y vigente', mintoThreshold: 0 },
        { id: 'EC-SV-004', nombre: 'Certificado Superintendencia de Compañías', criticality: 'HIGH', descripcion: 'Constancia de obligaciones al día', mintoThreshold: 0 },
        { id: 'EC-SV-005', nombre: 'Estados Financieros Auditados (NIIF)', criticality: 'CRITICAL', descripcion: 'EEFF auditados, últimos 2 ejercicios', mintoThreshold: 0 },
        { id: 'EC-SV-006', nombre: 'Declaración Impuesto a la Renta (SRI)', criticality: 'HIGH', descripcion: 'Formulario 101 de los últimos 2 años', mintoThreshold: 0 },
        { id: 'EC-SV-007', nombre: 'Certificado de Cumplimiento Tributario', criticality: 'HIGH', descripcion: 'SRI — sin deuda pendiente', mintoThreshold: 0 },
        { id: 'EC-SV-008', nombre: 'Cédula del representante legal y accionistas', criticality: 'CRITICAL', descripcion: 'Cédulas de identidad ecuatorianas o pasaportes', mintoThreshold: 0 }
      ]
    }
  },
  PE: {
    servicios: {
      name: 'Servicios / Empresas',
      documentos: [
        { id: 'PE-SV-001', nombre: 'RUC (SUNAT)', criticality: 'CRITICAL', descripcion: 'Registro Único de Contribuyentes activo', mintoThreshold: 0 },
        { id: 'PE-SV-002', nombre: 'Ficha RUC (SUNAT)', criticality: 'CRITICAL', descripcion: 'Ficha de información del contribuyente', mintoThreshold: 0 },
        { id: 'PE-SV-003', nombre: 'Partida Registral SUNARP', criticality: 'CRITICAL', descripcion: 'Partida electrónica de la sociedad', mintoThreshold: 0 },
        { id: 'PE-SV-004', nombre: 'Vigencia de Poder (SUNARP)', criticality: 'HIGH', descripcion: 'Certificado de poderes vigentes del representante', mintoThreshold: 0 },
        { id: 'PE-SV-005', nombre: 'Estados Financieros Auditados (NIIF)', criticality: 'CRITICAL', descripcion: 'EEFF auditados, últimos 2 ejercicios', mintoThreshold: 0 },
        { id: 'PE-SV-006', nombre: 'Declaración Jurada Anual (SUNAT)', criticality: 'HIGH', descripcion: 'PDT 710 de los últimos 2 años', mintoThreshold: 0 },
        { id: 'PE-SV-007', nombre: 'Certificado de No Adeudo (SUNAT)', criticality: 'HIGH', descripcion: 'Constancia de sin deuda tributaria', mintoThreshold: 0 },
        { id: 'PE-SV-008', nombre: 'DNI del representante legal y socios', criticality: 'CRITICAL', descripcion: 'Identificación vigente', mintoThreshold: 0 }
      ]
    },
    realEstate: {
      name: 'Bienes Raíces',
      documentos: [
        { id: 'PE-RE-001', nombre: 'Partida Registral SUNARP del Inmueble', criticality: 'CRITICAL', descripcion: 'Partida electrónica actualizada', mintoThreshold: 0 },
        { id: 'PE-RE-002', nombre: 'Tasación Comercial', criticality: 'CRITICAL', descripcion: 'Tasación por perito CREA o equivalente', mintoThreshold: 0 },
        { id: 'PE-RE-003', nombre: 'HR y PU (Hoja de Resumen / Predial Urbano)', criticality: 'HIGH', descripcion: 'Impuesto predial sin deuda', mintoThreshold: 0 },
        { id: 'PE-RE-004', nombre: 'Escritura Pública de Compraventa', criticality: 'CRITICAL', descripcion: 'Escritura con inscripción SUNARP', mintoThreshold: 0 }
      ]
    }
  },
  BO: {
    servicios: {
      name: 'Servicios / Empresas',
      documentos: [
        { id: 'BO-SV-001', nombre: 'NIT (SIN)', criticality: 'CRITICAL', descripcion: 'Número de Identificación Tributaria vigente', mintoThreshold: 0 },
        { id: 'BO-SV-002', nombre: 'Matrícula de Comercio (SEPREC)', criticality: 'CRITICAL', descripcion: 'Inscripción en el Registro de Comercio', mintoThreshold: 0 },
        { id: 'BO-SV-003', nombre: 'Escritura de Constitución', criticality: 'CRITICAL', descripcion: 'Escritura pública protocolizada', mintoThreshold: 0 },
        { id: 'BO-SV-004', nombre: 'Estados Financieros', criticality: 'CRITICAL', descripcion: 'EEFF auditados o revisados, últimos 2 ejercicios', mintoThreshold: 0 },
        { id: 'BO-SV-005', nombre: 'Certificado RUPE', criticality: 'HIGH', descripcion: 'Registro de proveedores del Estado (si aplica)', mintoThreshold: 0 },
        { id: 'BO-SV-006', nombre: 'Cédula de Identidad de representantes', criticality: 'CRITICAL', descripcion: 'CI boliviana vigente', mintoThreshold: 0 }
      ]
    }
  },
  PY: {
    servicios: {
      name: 'Servicios / Empresas',
      documentos: [
        { id: 'PY-SV-001', nombre: 'RUC (SET)', criticality: 'CRITICAL', descripcion: 'Registro Único de Contribuyentes vigente', mintoThreshold: 0 },
        { id: 'PY-SV-002', nombre: 'Escritura de Constitución', criticality: 'CRITICAL', descripcion: 'Escritura protocolizada e inscrita en Registro Público', mintoThreshold: 0 },
        { id: 'PY-SV-003', nombre: 'Patente Comercial Municipal', criticality: 'HIGH', descripcion: 'Habilitación municipal vigente', mintoThreshold: 0 },
        { id: 'PY-SV-004', nombre: 'Estados Financieros', criticality: 'CRITICAL', descripcion: 'EEFF auditados, últimos 2 ejercicios', mintoThreshold: 0 },
        { id: 'PY-SV-005', nombre: 'Certificado de Cumplimiento SET', criticality: 'HIGH', descripcion: 'Sin deuda tributaria pendiente', mintoThreshold: 0 },
        { id: 'PY-SV-006', nombre: 'Informe Informconf', criticality: 'HIGH', descripcion: 'Reporte de riesgo crediticio', mintoThreshold: 0 },
        { id: 'PY-SV-007', nombre: 'Cédula de Identidad de representantes', criticality: 'CRITICAL', descripcion: 'CI paraguaya vigente', mintoThreshold: 0 }
      ]
    }
  },
  UY: {
    servicios: {
      name: 'Servicios / Empresas',
      documentos: [
        { id: 'UY-SV-001', nombre: 'RUT (DGI)', criticality: 'CRITICAL', descripcion: 'Registro Único Tributario vigente', mintoThreshold: 0 },
        { id: 'UY-SV-002', nombre: 'Escritura de Constitución', criticality: 'CRITICAL', descripcion: 'Escritura con inscripción en Registro de Personas Jurídicas', mintoThreshold: 0 },
        { id: 'UY-SV-003', nombre: 'Certificado Único DGI', criticality: 'CRITICAL', descripcion: 'Constancia de cumplimiento tributario', mintoThreshold: 0 },
        { id: 'UY-SV-004', nombre: 'Certificado BPS', criticality: 'HIGH', descripcion: 'Constancia de aportes sociales al día', mintoThreshold: 0 },
        { id: 'UY-SV-005', nombre: 'Estados Financieros Auditados (NIIF)', criticality: 'CRITICAL', descripcion: 'EEFF auditados, últimos 2 ejercicios', mintoThreshold: 0 },
        { id: 'UY-SV-006', nombre: 'Informe Clearing de Informes', criticality: 'HIGH', descripcion: 'Reporte de riesgo crediticio', mintoThreshold: 0 },
        { id: 'UY-SV-007', nombre: 'Cédula de Identidad de representantes y beneficiarios', criticality: 'CRITICAL', descripcion: 'CI uruguaya vigente', mintoThreshold: 0 }
      ]
    }
  },
  PA: {
    servicios: {
      name: 'Servicios / Empresas',
      documentos: [
        { id: 'PA-SV-001', nombre: 'RUC (ANIP)', criticality: 'CRITICAL', descripcion: 'Registro Único de Contribuyente', mintoThreshold: 0 },
        { id: 'PA-SV-002', nombre: 'Aviso de Operación', criticality: 'CRITICAL', descripcion: 'Licencia comercial municipal vigente', mintoThreshold: 0 },
        { id: 'PA-SV-003', nombre: 'Pacto Social / Escritura', criticality: 'CRITICAL', descripcion: 'Documento constitutivo con inscripción Registro Público', mintoThreshold: 0 },
        { id: 'PA-SV-004', nombre: 'Certificado de Registro Público', criticality: 'CRITICAL', descripcion: 'Certificado de vigencia e incumbencia', mintoThreshold: 0 },
        { id: 'PA-SV-005', nombre: 'Estados Financieros Auditados', criticality: 'CRITICAL', descripcion: 'EEFF auditados por CPA panameño, últimos 2 años', mintoThreshold: 0 },
        { id: 'PA-SV-006', nombre: 'Paz y Salvo de la DGI', criticality: 'HIGH', descripcion: 'Constancia de cumplimiento fiscal', mintoThreshold: 0 },
        { id: 'PA-SV-007', nombre: 'Cédula o Pasaporte de directores y accionistas', criticality: 'CRITICAL', descripcion: 'Identificación vigente + UBO Declaration', mintoThreshold: 0 }
      ]
    }
  },
  CA: {
    servicios: {
      name: 'Business / Servicios',
      documentos: [
        { id: 'CA-SV-001', nombre: 'Business Number (CRA)', criticality: 'CRITICAL', descripcion: 'Número de negocio de Canada Revenue Agency', mintoThreshold: 0 },
        { id: 'CA-SV-002', nombre: 'Articles of Incorporation', criticality: 'CRITICAL', descripcion: 'Acta constitutiva federal o provincial', mintoThreshold: 0 },
        { id: 'CA-SV-003', nombre: 'Corporate Registry Extract', criticality: 'CRITICAL', descripcion: 'Extracto del registro provincial actualizado', mintoThreshold: 0 },
        { id: 'CA-SV-004', nombre: 'Financial Statements (IFRS/ASPE)', criticality: 'CRITICAL', descripcion: 'EEFF auditados o revisados, últimos 2 ejercicios', mintoThreshold: 0 },
        { id: 'CA-SV-005', nombre: 'T2 Corporate Tax Return (CRA)', criticality: 'HIGH', descripcion: 'Declaración fiscal corporativa de los últimos 2 años', mintoThreshold: 0 },
        { id: 'CA-SV-006', nombre: 'Certificate of Compliance (CRA)', criticality: 'HIGH', descripcion: 'Certificado de cumplimiento fiscal', mintoThreshold: 0 },
        { id: 'CA-SV-007', nombre: 'Credit Report (Equifax CA / TransUnion CA)', criticality: 'HIGH', descripcion: 'Reporte de riesgo crediticio comercial', mintoThreshold: 0 },
        { id: 'CA-SV-008', nombre: 'Passport o Drivers Licence de directores', criticality: 'CRITICAL', descripcion: 'ID vigente + FINTRAC beneficial ownership', mintoThreshold: 0 }
      ]
    },
    realEstate: {
      name: 'Real Estate',
      documentos: [
        { id: 'CA-RE-001', nombre: 'Title Certificate / Land Title', criticality: 'CRITICAL', descripcion: 'Título de propiedad registrado en Land Registry provincial', mintoThreshold: 0 },
        { id: 'CA-RE-002', nombre: 'Property Appraisal', criticality: 'CRITICAL', descripcion: 'Avalúo por appraiser certificado AACI/CRA', mintoThreshold: 0 },
        { id: 'CA-RE-003', nombre: 'Title Insurance', criticality: 'HIGH', descripcion: 'Seguro de título de propiedad', mintoThreshold: 0 },
        { id: 'CA-RE-004', nombre: 'Property Tax Certificate', criticality: 'HIGH', descripcion: 'Constancia de pago de impuestos municipales', mintoThreshold: 0 },
        { id: 'CA-RE-005', nombre: 'Survey / Building Location Certificate', criticality: 'HIGH', descripcion: 'Plano de ubicación y linderos', mintoThreshold: 0 }
      ]
    }
  }
};

// Mapa de serviceType del expediente a sector del checklist.
const SERVICE_TYPE_MAP = {
  'business_plan': 'servicios',
  'financial_analysis': 'servicios',
  'complete_package': 'servicios',
  'real_estate': 'realEstate',
  'manufacturing': 'manufacturing',
  'agriculture': 'agricultura',
  'business': 'business'
};

export function generateChecklist({ country = 'MX', sector, serviceType, monto = 0 }) {
  const resolvedSector = sector || SERVICE_TYPE_MAP[serviceType] || 'servicios';
  const countryDB = CHECKLIST_DB[country] || CHECKLIST_DB.MX;
  const sectorTemplate = countryDB[resolvedSector] || countryDB.servicios;

  const filteredDocs = sectorTemplate.documentos.filter(
    (doc) => !doc.mintoThreshold || monto >= doc.mintoThreshold
  );

  const total = filteredDocs.length;
  const critical = filteredDocs.filter((d) => d.criticality === 'CRITICAL').length;
  const high = filteredDocs.filter((d) => d.criticality === 'HIGH').length;
  const medium = filteredDocs.filter((d) => d.criticality === 'MEDIUM').length;

  return {
    checklistId: randomUUID(),
    country,
    sector: resolvedSector,
    sectorName: sectorTemplate.name,
    monto,
    generatedAt: new Date().toISOString(),
    summary: { total, critical, high, medium },
    documentos: filteredDocs.map((doc) => ({
      id: doc.id,
      nombre: doc.nombre,
      descripcion: doc.descripcion,
      criticality: doc.criticality
    }))
  };
}

// Cruza la lista requerida contra los documentos reales subidos al expediente.
// Usa coincidencia aproximada por nombre o type para marcar los que ya están cargados.
export function crossCheckWithUploads(checklist, uploadedDocuments = []) {
  const uploadedNames = uploadedDocuments.map((d) =>
    (d.filename || d.document_type || '').toLowerCase()
  );

  const items = checklist.documentos.map((req) => {
    const reqName = req.nombre.toLowerCase();
    const matched = uploadedDocuments.find((doc) => {
      const fname = (doc.filename || '').toLowerCase();
      const dtype = (doc.document_type || '').toLowerCase();
      return fname.includes(reqName.split(' ')[0]) || dtype.includes(reqName.split(' ')[0]);
    });

    return {
      ...req,
      status: matched ? 'uploaded' : 'pending',
      documentId: matched?.id || null,
      uploadedAt: matched?.created_at || null
    };
  });

  const uploaded = items.filter((i) => i.status === 'uploaded').length;
  const pending = items.filter((i) => i.status === 'pending').length;
  const missingCritical = items.filter((i) => i.status === 'pending' && i.criticality === 'CRITICAL').length;

  const completionPct = checklist.documentos.length > 0
    ? Math.round((uploaded / checklist.documentos.length) * 100)
    : 0;

  const readiness = missingCritical === 0 && completionPct >= 80
    ? 'listo'
    : missingCritical === 0
    ? 'incompleto'
    : 'bloqueado';

  return {
    ...checklist,
    documentos: items,
    completion: { uploaded, pending, missingCritical, completionPct, readiness }
  };
}

// Lógica de detección de cambios sospechosos entre dos versiones financieras.
// Portado de 04-version-tracking.js (compareVersions + detectSuspiciousPatterns).
const CHANGE_THRESHOLDS = { asset: 0.10, liability: 0.10, revenue: 0.15, expense: 0.15 };
const FINANCIAL_METRICS = [
  { key: 'totalAssets', label: 'Activos Totales', type: 'asset' },
  { key: 'totalLiabilities', label: 'Pasivos Totales', type: 'liability' },
  { key: 'totalRevenue', label: 'Ingresos Totales', type: 'revenue' },
  { key: 'totalExpenses', label: 'Gastos Totales', type: 'expense' },
  { key: 'netIncome', label: 'Ingreso Neto', type: 'revenue' },
  { key: 'debtToEquity', label: 'Deuda/Patrimonio', type: 'liability' }
];

export function compareFinancialVersions(currentData = {}, previousData = {}) {
  const changes = [];
  for (const metric of FINANCIAL_METRICS) {
    const cur = currentData[metric.key];
    const prev = previousData[metric.key];
    if (cur == null || prev == null || prev === 0) continue;

    const pct = ((cur - prev) / Math.abs(prev)) * 100;
    const threshold = CHANGE_THRESHOLDS[metric.type] * 100;
    changes.push({
      metric: metric.label,
      key: metric.key,
      previousValue: prev,
      currentValue: cur,
      percentChange: parseFloat(pct.toFixed(2)),
      isMaterial: Math.abs(pct) > threshold,
      threshold
    });
  }

  const suspicious = [];
  const extremes = changes.filter((c) => Math.abs(c.percentChange) > 50);
  if (extremes.length > 0) {
    suspicious.push({
      pattern: 'EXTREME_CHANGES',
      severity: 'high',
      description: `${extremes.length} métrica(s) cambiaron más del 50%.`,
      metrics: extremes.map((c) => c.metric)
    });
  }

  const assetsUp = changes.find((c) => c.key === 'totalAssets' && c.percentChange > 0);
  const liabDown = changes.find((c) => c.key === 'totalLiabilities' && c.percentChange < 0);
  if (assetsUp && liabDown) {
    suspicious.push({
      pattern: 'SELECTIVE_CHANGES',
      severity: 'medium',
      description: 'Activos subieron mientras pasivos bajaron — posible embellecimiento del balance.',
    });
  }

  const riskLevel = suspicious.some((s) => s.severity === 'high')
    ? 'high'
    : suspicious.length > 0
    ? 'medium'
    : 'low';

  return { changes, suspicious, riskLevel };
}
