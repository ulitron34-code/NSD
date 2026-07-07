import { screenNameAgainstOfac } from './ofacScreening.js';
import { screenCargoAgainstPepCatalog } from './pepScreening.js';
import { isConfigured as chConfigured } from './companiesHouseService.js';
import { isEmiratesIdConfigured, isTradeLicenseConfigured } from './aeRegulatoryService.js';

const configured = (name) => Boolean(process.env[name]?.trim());
const KNOWN_COUNTRIES = ['MX', 'US', 'AE', 'UK', 'CA', 'CO', 'EC', 'AR', 'PE', 'CL', 'BO', 'PY', 'UY'];

// Formato del identificador fiscal por pais (solo formato -- no valida contra
// una autoridad real, igual que ya hace el bloque de MX/US/AE con RFC/EIN/
// Emirates ID). Sin buro de credito ni blacklist fiscal local todavia (esos
// requieren contrato comercial, igual que BURO_API_URL para Mexico).
const TAX_ID_FORMATS = {
  CO: { label: 'NIT/RUT Colombia', pattern: /^\d{9,10}-?\d?$/ },
  EC: { label: 'RUC Ecuador', pattern: /^\d{13}$/ },
  AR: { label: 'CUIT Argentina', pattern: /^\d{2}-?\d{8}-?\d{1}$/ },
  PE: { label: 'RUC Peru', pattern: /^\d{11}$/ },
  CL: { label: 'RUT Chile', pattern: /^\d{7,8}-[\dkK]$/ },
  BO: { label: 'NIT Bolivia', pattern: /^\d{7,13}$/ },
  PY: { label: 'RUC Paraguay', pattern: /^\d{6,8}-\d$/ },
  UY: { label: 'RUT Uruguay', pattern: /^\d{12}$/ }
};

function normalizeCountry(country = 'MX') {
  const value = String(country).trim().toUpperCase();
  if (['MX', 'MEXICO', 'MÉXICO'].includes(value)) return 'MX';
  if (['US', 'USA', 'UNITED_STATES'].includes(value)) return 'US';
  if (['AE', 'UAE', 'DUBAI'].includes(value)) return 'AE';
  if (['UK', 'GB', 'UNITED_KINGDOM'].includes(value)) return 'UK';
  if (['CA', 'CANADA', 'CANADÁ'].includes(value)) return 'CA';
  if (TAX_ID_FORMATS[value]) return value;
  return value || 'MX';
}

function addCheck(checks, check) {
  checks.push({
    provider: check.provider,
    status: check.status,
    label: check.label,
    detail: check.detail || '',
    severity: check.severity || 'info'
  });
}

function formatCheck({ provider, label, value, pattern }) {
  const valid = Boolean(value && pattern.test(String(value).trim()));
  return {
    provider,
    label,
    status: valid ? 'pass' : 'fail',
    detail: valid ? 'Formato valido' : 'Formato ausente o invalido',
    severity: valid ? 'info' : 'medium'
  };
}

function optionalProviderCheck({ provider, label, envUrl, envKey }) {
  const hasUrl = configured(envUrl);
  const hasKey = envKey ? configured(envKey) : true;

  if (hasUrl && hasKey) {
    return {
      provider,
      label,
      status: 'configured',
      detail: 'Proveedor configurado para ejecucion externa',
      severity: 'info'
    };
  }

  return {
    provider,
    label,
    status: 'skipped',
    detail: `Pendiente configurar ${envUrl}${envKey ? ` y ${envKey}` : ''}`,
    severity: 'low'
  };
}

export function validateRegulatoryProfile({ country = 'MX', applicant = {}, order = null } = {}) {
  const normalizedCountry = normalizeCountry(country || applicant.country || order?.metadata?.country);
  const checks = [];

  if (normalizedCountry === 'MX') {
    addCheck(checks, formatCheck({
      provider: 'format',
      label: 'RFC Mexico',
      value: applicant.rfc || order?.metadata?.rfc,
      pattern: /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/
    }));
    addCheck(checks, optionalProviderCheck({
      provider: 'sat',
      label: 'Validacion SAT/RFC',
      envUrl: 'MEXICO_RFC_API_URL',
      envKey: 'MEXICO_RFC_API_KEY'
    }));
    addCheck(checks, optionalProviderCheck({
      provider: 'uif',
      label: 'Screening UIF',
      envUrl: 'MEXICO_UIF_API_URL',
      envKey: 'MEXICO_UIF_API_KEY'
    }));
  }

  if (normalizedCountry === 'US') {
    addCheck(checks, formatCheck({
      provider: 'format',
      label: 'EIN USA',
      value: applicant.ein || order?.metadata?.ein,
      pattern: /^\d{2}-\d{7}$/
    }));
    addCheck(checks, optionalProviderCheck({
      provider: 'equifax',
      label: 'Credit report USA',
      envUrl: 'EQUIFAX_API_URL',
      envKey: 'EQUIFAX_API_KEY'
    }));
  }

  if (normalizedCountry === 'AE') {
    addCheck(checks, formatCheck({
      provider: 'format',
      label: 'Emirates ID (formato 784-XXXX-XXXXXXX-X)',
      value: applicant.emiratesId || order?.metadata?.emiratesId,
      pattern: /^784-\d{4}-\d{7}-\d$/
    }));
    addCheck(checks, formatCheck({
      provider: 'format',
      label: 'TRN (Tax Registration Number, 15 digitos)',
      value: applicant.trn || order?.metadata?.trn,
      pattern: /^\d{15}$/
    }));
    addCheck(checks, {
      provider: 'dubai_eid',
      label: 'Emirates ID API (ICA)',
      status: isEmiratesIdConfigured() ? 'configured' : 'skipped',
      detail: isEmiratesIdConfigured()
        ? 'Configurada — usar POST /api/regulatory/ae/emirates-id para verificacion en tiempo real'
        : 'Pendiente configurar DUBAI_EMIRATES_ID_API_URL',
      severity: 'low'
    });
    addCheck(checks, {
      provider: 'dubai_tl',
      label: 'Trade Licence API (DED Dubai)',
      status: isTradeLicenseConfigured() ? 'configured' : 'skipped',
      detail: isTradeLicenseConfigured()
        ? 'Configurada — usar POST /api/regulatory/ae/trade-license para verificacion en tiempo real'
        : 'Pendiente configurar DUBAI_TRADE_LICENSE_API_URL',
      severity: 'low'
    });
  }

  if (normalizedCountry === 'UK') {
    addCheck(checks, formatCheck({
      provider: 'format',
      label: 'UK company number',
      value: applicant.companyNumber || order?.metadata?.companyNumber,
      pattern: /^[A-Z0-9]{8}$/
    }));
    addCheck(checks, {
      provider: 'companies_house',
      label: 'Companies House API',
      status: chConfigured() ? 'configured' : 'skipped',
      detail: chConfigured()
        ? 'Configurada — usar GET /api/regulatory/ca/company/:number para verificacion en tiempo real'
        : 'Pendiente configurar COMPANIES_HOUSE_API_KEY',
      severity: 'low'
    });
  }

  if (normalizedCountry === 'CA') {
    // Canada: Business Number (BN) de la CRA — 9 digitos numericos (formato basico).
    addCheck(checks, formatCheck({
      provider: 'format',
      label: 'Canada Business Number (BN)',
      value: applicant.businessNumber || applicant.bn || order?.metadata?.businessNumber,
      pattern: /^\d{9}$/
    }));
    // Para entidades incorporadas en UK / con registro en Companies House:
    addCheck(checks, {
      provider: 'companies_house',
      label: 'Companies House (entidades con registro UK)',
      status: chConfigured() ? 'configured' : 'skipped',
      detail: chConfigured()
        ? 'Configurada — usar GET /api/regulatory/ca/company/:number para verificacion en tiempo real'
        : 'Pendiente configurar COMPANIES_HOUSE_API_KEY',
      severity: 'low'
    });
    // FINTRAC beneficial ownership — requerimiento clave para Canada.
    addCheck(checks, {
      provider: 'fintrac',
      label: 'FINTRAC: beneficiario final (UBO)',
      status: (applicant.ubo || order?.metadata?.ubo) ? 'pass' : 'fail',
      detail: (applicant.ubo || order?.metadata?.ubo)
        ? 'Beneficiario final declarado conforme a FINTRAC'
        : 'FINTRAC requiere identificacion del 25%+ de propiedad o control efectivo',
      severity: (applicant.ubo || order?.metadata?.ubo) ? 'info' : 'medium'
    });
  }

  if (TAX_ID_FORMATS[normalizedCountry]) {
    const { label, pattern } = TAX_ID_FORMATS[normalizedCountry];
    addCheck(checks, formatCheck({
      provider: 'format',
      label,
      value: applicant.taxId || order?.metadata?.taxId,
      pattern
    }));
    addCheck(checks, {
      provider: 'buro_local',
      label: `Buró de crédito / autoridad fiscal local (${normalizedCountry})`,
      status: 'skipped',
      detail: `Sin integración automatizada de buró de crédito ni blacklist fiscal para ${normalizedCountry} todavía — requiere contrato comercial con el proveedor local, igual que Buró de Crédito en México.`,
      severity: 'low'
    });
  }

  if (!KNOWN_COUNTRIES.includes(normalizedCountry)) {
    addCheck(checks, {
      provider: 'nsd',
      label: 'Pais no soportado',
      status: 'skipped',
      detail: `No hay matriz regulatoria activa para ${normalizedCountry}`,
      severity: 'low'
    });
  }

  // OFAC es una lista de sanciones global (no especifica de un pais), asi que
  // se revisa siempre, independientemente de la matriz regulatoria del pais.
  const ofacSubjectName = applicant.companyName || applicant.name || applicant.fullName
    || order?.metadata?.companyName;
  const ofacResult = screenNameAgainstOfac(ofacSubjectName);
  addCheck(checks, {
    provider: 'ofac',
    label: 'OFAC sanctions screening (SDN list)',
    status: ofacResult.status === 'hit' ? 'fail' : ofacResult.status === 'clear' ? 'pass' : 'skipped',
    detail: ofacResult.detail,
    severity: ofacResult.status === 'hit' ? 'high' : ofacResult.status === 'clear' ? 'info' : 'low'
  });

  // PEP (Persona Politicamente Expuesta): Mexico no publica una lista de
  // nombres gratuita, asi que se compara el cargo publico autodeclarado
  // (propio o de beneficiarios controladores/relacionados) contra el
  // catalogo de cargos del Anexo PEP (LFPIORPI). Se revisa para cualquier
  // pais, igual que OFAC, porque el cliente puede declarar un cargo en
  // cualquier jurisdiccion.
  const declaredCargo = applicant.declaredPublicPosition || order?.metadata?.declaredPublicPosition;
  const declaredCargoRelationship = applicant.declaredPublicPositionRelationship
    || order?.metadata?.declaredPublicPositionRelationship;
  const pepResult = screenCargoAgainstPepCatalog(declaredCargo, { relationship: declaredCargoRelationship });
  addCheck(checks, {
    provider: 'pep',
    label: 'PEP screening (catalogo de cargos LFPIORPI)',
    status: pepResult.status === 'hit' ? 'fail' : pepResult.status === 'clear' ? 'pass' : 'skipped',
    detail: pepResult.detail,
    severity: pepResult.status === 'hit' ? 'high' : pepResult.status === 'clear' ? 'info' : 'low'
  });

  const failed = checks.filter((check) => check.status === 'fail');
  const configuredChecks = checks.filter((check) => check.status === 'configured');
  const skipped = checks.filter((check) => check.status === 'skipped');

  return {
    country: normalizedCountry,
    status: failed.length ? 'review_required' : 'clear',
    summary: {
      total: checks.length,
      passed: checks.filter((check) => check.status === 'pass').length,
      configured: configuredChecks.length,
      skipped: skipped.length,
      failed: failed.length
    },
    checks
  };
}
