import { screenNameAgainstOfac } from './ofacScreening.js';

const configured = (name) => Boolean(process.env[name]?.trim());
const KNOWN_COUNTRIES = ['MX', 'US', 'AE', 'UK'];

function normalizeCountry(country = 'MX') {
  const value = String(country).trim().toUpperCase();
  if (['MX', 'MEXICO', 'MÉXICO'].includes(value)) return 'MX';
  if (['US', 'USA', 'UNITED_STATES'].includes(value)) return 'US';
  if (['AE', 'UAE', 'DUBAI'].includes(value)) return 'AE';
  if (['UK', 'GB', 'UNITED_KINGDOM'].includes(value)) return 'UK';
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
      label: 'Emirates ID',
      value: applicant.emiratesId || order?.metadata?.emiratesId,
      pattern: /^784-\d{4}-\d{7}-\d$/
    }));
    addCheck(checks, optionalProviderCheck({
      provider: 'dubai',
      label: 'Dubai Emirates ID API',
      envUrl: 'DUBAI_EMIRATES_ID_API_URL',
      envKey: 'DUBAI_EMIRATES_ID_API_KEY'
    }));
    addCheck(checks, optionalProviderCheck({
      provider: 'dubai',
      label: 'Dubai Trade License API',
      envUrl: 'DUBAI_TRADE_LICENSE_API_URL',
      envKey: 'DUBAI_TRADE_LICENSE_API_KEY'
    }));
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
      status: configured('COMPANIES_HOUSE_API_KEY') ? 'configured' : 'skipped',
      detail: configured('COMPANIES_HOUSE_API_KEY')
        ? 'Proveedor configurado para consulta'
        : 'Pendiente configurar COMPANIES_HOUSE_API_KEY',
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
