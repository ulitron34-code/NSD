// Verificacion de paises en lista FATF Grey List y Black List (OECD/GAFI).
// Fuente: https://www.fatf-gafi.org/en/publications/high-risk-and-other-monitored-jurisdictions.html
// A diferencia de los demas screeners, este NO busca por nombre de persona sino por
// pais/jurisdiccion. Se usa como contexto de riesgo de contraparte.
// La lista se actualiza ~3 veces al año (feb, jun, oct). Se cachea 30 dias.
const FATF_URL = 'https://www.fatf-gafi.org/en/publications/high-risk-and-other-monitored-jurisdictions.html';
const REFRESH_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

// Lista de respaldo con la publicacion de junio 2025 (actualizacion mas reciente al momento de desarrollo).
// Si el fetch falla usamos esta lista hardcoded hasta la proxima renovacion.
const FALLBACK_GREY_LIST = [
  'Bulgaria', 'Burkina Faso', 'Cameroon', 'Côte d\'Ivoire', 'Croatia',
  'Democratic Republic of the Congo', 'Haiti', 'Kenya', 'Mali', 'Monaco',
  'Mozambique', 'Namibia', 'Nigeria', 'Philippines', 'Senegal',
  'South Africa', 'South Sudan', 'Syria', 'Tanzania', 'Venezuela',
  'Vietnam', 'Yemen'
];

const FALLBACK_BLACK_LIST = [
  'Iran', 'North Korea', 'Myanmar'
];

import { normalizeName } from './matchingEngine.js';

const state = {
  greyList: null,
  blackList: null,
  loadedAt: null,
  loading: null,
  error: null
};

// Extrae paises de la pagina FATF buscando patrones conocidos del HTML.
// No necesita cheerio — la pagina tiene una estructura de lista reconocible.
function parseCountriesFromHtml(html) {
  const grey = [];
  const black = [];

  // Las secciones de la pagina FATF tienen encabezados reconocibles.
  const greySection = html.match(/jurisdictions under increased monitoring[\s\S]*?(<ul[\s\S]*?<\/ul>)/i);
  const blackSection = html.match(/high-risk jurisdictions[\s\S]*?(<ul[\s\S]*?<\/ul>)/i);

  const extractItems = (htmlChunk) => {
    if (!htmlChunk) return [];
    const matches = [...(htmlChunk.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi))];
    return matches
      .map((m) => m[1].replace(/<[^>]+>/g, '').trim())
      .filter((t) => t.length > 2 && t.length < 80);
  };

  if (greySection) grey.push(...extractItems(greySection[1]));
  if (blackSection) black.push(...extractItems(blackSection[1]));

  return { grey, black };
}

async function fetchFatfList() {
  const res = await fetch(FATF_URL, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`FATF respondio ${res.status}`);
  const html = await res.text();
  const { grey, black } = parseCountriesFromHtml(html);

  // Si el parsing no produjo nada (cambio de estructura), usar fallback
  const greyList = grey.length ? grey : FALLBACK_GREY_LIST;
  const blackList = black.length ? black : FALLBACK_BLACK_LIST;

  return { greyList, blackList };
}

function isStale() {
  return !state.loadedAt || (Date.now() - state.loadedAt) > REFRESH_INTERVAL_MS;
}

export function primeFatfList() {
  if (state.loading || (!isStale() && state.greyList)) return state.loading;

  // Mientras se descarga, cargar el fallback inmediatamente
  if (!state.greyList) {
    state.greyList = [...FALLBACK_GREY_LIST];
    state.blackList = [...FALLBACK_BLACK_LIST];
    state.loadedAt = Date.now();
  }

  state.loading = fetchFatfList()
    .then(({ greyList, blackList }) => {
      state.greyList = greyList;
      state.blackList = blackList;
      state.loadedAt = Date.now();
      state.error = null;
    })
    .catch((err) => {
      state.error = err.message;
      // Mantener fallback — no borrar la lista si habia algo
    })
    .finally(() => { state.loading = null; });
  return state.loading;
}

// Verifica si un pais esta en lista FATF.
// country: nombre del pais en cualquier idioma/forma (se normaliza).
// Retorna: { status: 'black_list'|'grey_list'|'clear'|'skipped', detail, riskLevel }
export function checkCountryFatfRisk(country) {
  primeFatfList();

  const trimmed = String(country || '').trim();
  if (!trimmed) return { status: 'skipped', detail: 'Sin pais para verificar FATF', riskLevel: null };

  const normalizedInput = normalizeName(trimmed);

  const inBlack = (state.blackList || FALLBACK_BLACK_LIST).some(
    (c) => normalizeName(c) === normalizedInput || normalizeName(c).includes(normalizedInput) || normalizedInput.includes(normalizeName(c))
  );
  if (inBlack) {
    return {
      status: 'black_list',
      detail: `${trimmed} esta en la Black List FATF (Jurisdicciones de Alto Riesgo). Requiere diligencia debida reforzada conforme a reglamentacion AML/CFT aplicable.`,
      riskLevel: 'CRITICAL',
      listLoadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null
    };
  }

  const inGrey = (state.greyList || FALLBACK_GREY_LIST).some(
    (c) => normalizeName(c) === normalizedInput || normalizeName(c).includes(normalizedInput) || normalizedInput.includes(normalizeName(c))
  );
  if (inGrey) {
    return {
      status: 'grey_list',
      detail: `${trimmed} esta en la Grey List FATF (Jurisdicciones Bajo Monitoreo Intensificado). Diligencia debida reforzada recomendada.`,
      riskLevel: 'HIGH',
      listLoadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null
    };
  }

  return {
    status: 'clear',
    detail: `${trimmed} no aparece en listas FATF de jurisdicciones de alto riesgo.`,
    riskLevel: 'NORMAL',
    listLoadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null
  };
}

export function getFatfListStatus() {
  return {
    loaded: Boolean(state.greyList),
    greyListCount: state.greyList?.length ?? null,
    blackListCount: state.blackList?.length ?? null,
    loadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null,
    usingFallback: state.error ? true : false,
    error: state.error
  };
}

export function _resetFatfStateForTests() {
  state.greyList = null; state.blackList = null; state.loadedAt = null;
  state.loading = null; state.error = null;
}
