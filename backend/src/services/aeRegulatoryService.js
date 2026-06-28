// Integración con APIs de verificación regulatoria de los Emiratos Arabes Unidos.
// Emirates ID: emitida por la Federal Authority for Identity and Citizenship (ICA).
// Trade Licence: emitida por el Department of Economic Development (DED) de cada emirato.
// Las URLs y credenciales de ambas APIs se configuran via variables de entorno en Render.
const TIMEOUT_MS = 8000;

function env(name) { return process.env[name] || ''; }

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ── Emirates ID ──────────────────────────────────────────────────────────────
// Formato: 784-AAAA-BBBBBBB-C (15 digitos con guiones, donde 784 = codigo AE)
// Retorna: { valid, emiratesId, name, nationality, expiryDate, status, error }
export async function verifyEmiratesId(emiratesId) {
  if (!emiratesId) return { valid: false, error: 'Emirates ID requerido' };

  const apiUrl  = env('DUBAI_EMIRATES_ID_API_URL');
  const apiKey  = env('DUBAI_EMIRATES_ID_API_KEY');

  if (!apiUrl) {
    return {
      valid: null,
      skipped: true,
      formatCheck: /^784-\d{4}-\d{7}-\d$/.test(String(emiratesId).trim()),
      error: 'DUBAI_EMIRATES_ID_API_URL no configurada — solo se valida el formato'
    };
  }

  const id = String(emiratesId).trim();
  const url = `${apiUrl.replace(/\/$/, '')}/verify`;

  try {
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'x-api-key': apiKey, Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({ emiratesId: id }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { valid: false, error: `API Emirates ID respondio ${res.status}: ${body.slice(0, 120)}` };
    }

    const data = await res.json();
    // Normalizamos la respuesta independientemente del formato exacto del proveedor.
    return {
      valid: data.valid ?? data.isValid ?? data.verified ?? true,
      emiratesId: id,
      name:         data.name        || data.fullName     || data.holderName || null,
      nationality:  data.nationality || data.country       || null,
      expiryDate:   data.expiryDate  || data.expiry        || data.validUntil || null,
      status:       data.status      || data.idStatus      || 'verified',
      raw:          data,
    };
  } catch (err) {
    if (err.name === 'AbortError') return { valid: null, error: 'Timeout al consultar Emirates ID API (>8s)' };
    return { valid: null, error: `Error de red: ${err.message}` };
  }
}

// ── Trade Licence ────────────────────────────────────────────────────────────
// El numero de licencia tiene formato variable segun el emirato:
//   Dubai DED: 6-7 digitos  |  Abu Dhabi DED: alfanumerico  |  JAFZA/DAFZA: alfanumerico
// Retorna: { valid, licenseNumber, businessName, legalForm, activities, status,
//            issueDate, expiryDate, emirate, error }
export async function verifyTradeLicense(licenseNumber) {
  if (!licenseNumber) return { valid: false, error: 'Numero de licencia requerido' };

  const apiUrl = env('DUBAI_TRADE_LICENSE_API_URL');
  const apiKey = env('DUBAI_TRADE_LICENSE_API_KEY') || env('DUBAI_EMIRATES_ID_API_KEY');

  if (!apiUrl) {
    return {
      valid: null,
      skipped: true,
      formatCheck: /^[A-Z0-9]{4,20}$/i.test(String(licenseNumber).trim()),
      error: 'DUBAI_TRADE_LICENSE_API_URL no configurada — solo se valida el formato'
    };
  }

  const number = String(licenseNumber).trim();
  const url = `${apiUrl.replace(/\/$/, '')}/verify`;

  try {
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'x-api-key': apiKey, Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({ licenseNumber: number }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { valid: false, error: `API Trade License respondio ${res.status}: ${body.slice(0, 120)}` };
    }

    const data = await res.json();
    return {
      valid:         data.valid        ?? data.isValid    ?? data.active    ?? true,
      licenseNumber: number,
      businessName:  data.businessName ?? data.name       ?? data.tradeName ?? null,
      legalForm:     data.legalForm    ?? data.companyType ?? null,
      activities:    data.activities   ?? data.businessActivities ?? [],
      status:        data.status       ?? data.licenseStatus ?? 'verified',
      issueDate:     data.issueDate    ?? data.issuedDate  ?? null,
      expiryDate:    data.expiryDate   ?? data.expiry      ?? null,
      emirate:       data.emirate      ?? data.jurisdiction ?? 'Dubai',
      raw:           data,
    };
  } catch (err) {
    if (err.name === 'AbortError') return { valid: null, error: 'Timeout al consultar Trade License API (>8s)' };
    return { valid: null, error: `Error de red: ${err.message}` };
  }
}

export function isEmiratesIdConfigured()   { return Boolean(env('DUBAI_EMIRATES_ID_API_URL')); }
export function isTradeLicenseConfigured() { return Boolean(env('DUBAI_TRADE_LICENSE_API_URL')); }
