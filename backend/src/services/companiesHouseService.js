// Integración con UK Companies House API para verificación de empresas.
// También sirve para due diligence de contrapartes canadienses incorporadas
// en UK (holding companies, subsidiarias). Para empresas incorporadas en
// Canadá directamente, se usa el BN (Business Number) de la CRA.
// Doc: https://developer-specs.company-information.service.gov.uk/
const CH_BASE_URL = 'https://api.company-information.service.gov.uk';
const TIMEOUT_MS = 8000;

function getApiKey() {
  return process.env.COMPANIES_HOUSE_API_KEY || '';
}

function buildAuthHeader() {
  const key = getApiKey();
  if (!key) return {};
  // Companies House usa Basic auth: API key como usuario, contraseña vacía.
  const encoded = Buffer.from(`${key}:`).toString('base64');
  return { Authorization: `Basic ${encoded}` };
}

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

// Busca una empresa por numero de registro Companies House (8 caracteres).
// Retorna: { found, companyNumber, name, status, type, incorporationDate, address, jurisdiction, rawStatus }
export async function lookupCompany(companyNumber) {
  if (!companyNumber) return { found: false, error: 'Numero de empresa requerido' };

  const key = getApiKey();
  if (!key) {
    return {
      found: false,
      skipped: true,
      error: 'COMPANIES_HOUSE_API_KEY no configurada — verificacion omitida'
    };
  }

  const number = String(companyNumber).trim().toUpperCase().padStart(8, '0');
  const url = `${CH_BASE_URL}/company/${encodeURIComponent(number)}`;

  try {
    const res = await fetchWithTimeout(url, { headers: buildAuthHeader() });

    if (res.status === 404) {
      return { found: false, error: `Empresa ${number} no encontrada en Companies House` };
    }
    if (!res.ok) {
      return { found: false, error: `Companies House respondio ${res.status}` };
    }

    const data = await res.json();
    return {
      found: true,
      companyNumber: data.company_number,
      name: data.company_name,
      status: data.company_status,       // 'active' | 'dissolved' | 'liquidation' | etc.
      type: data.type,                   // 'ltd' | 'plc' | 'llp' | etc.
      incorporationDate: data.date_of_creation,
      address: data.registered_office_address
        ? [
            data.registered_office_address.address_line_1,
            data.registered_office_address.locality,
            data.registered_office_address.country,
            data.registered_office_address.postal_code,
          ].filter(Boolean).join(', ')
        : null,
      jurisdiction: data.jurisdiction,
      canFile: data.can_file,
      rawStatus: data.company_status,
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { found: false, error: 'Timeout al consultar Companies House (>8s)' };
    }
    return { found: false, error: `Error de red: ${err.message}` };
  }
}

// Busca empresas por nombre (hasta 10 resultados).
// Util para onboarding cuando el usuario no conoce el numero exacto.
export async function searchCompanies(query, items = 10) {
  if (!query) return { results: [], error: 'Termino de busqueda requerido' };

  const key = getApiKey();
  if (!key) return { results: [], skipped: true, error: 'COMPANIES_HOUSE_API_KEY no configurada' };

  const url = `${CH_BASE_URL}/search/companies?q=${encodeURIComponent(query)}&items_per_page=${items}`;
  try {
    const res = await fetchWithTimeout(url, { headers: buildAuthHeader() });
    if (!res.ok) return { results: [], error: `Companies House respondio ${res.status}` };
    const data = await res.json();
    return {
      results: (data.items || []).map((item) => ({
        companyNumber: item.company_number,
        name: item.title,
        status: item.company_status,
        type: item.company_type,
        address: item.address_snippet,
      })),
      totalResults: data.total_results,
    };
  } catch (err) {
    if (err.name === 'AbortError') return { results: [], error: 'Timeout al buscar en Companies House' };
    return { results: [], error: `Error de red: ${err.message}` };
  }
}

export function isConfigured() {
  return Boolean(getApiKey());
}
