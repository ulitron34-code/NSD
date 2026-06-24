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
