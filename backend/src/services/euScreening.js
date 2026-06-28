// Screening contra la Lista Consolidada de Sanciones Financieras de la Union Europea
// (Financial Sanctions Files, DG FISMA). Formato XML oficial. No requiere API key.
const EU_LIST_URL = 'https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content?token=dG9rZW4tMjAxNw';
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const MATCH_THRESHOLD = 85;

const state = { entries: null, loadedAt: null, loading: null, error: null };

function normalizeName(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fuzzyScore(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 85;
  const wordsA = a.split(' ');
  const wordsB = b.split(' ');
  const common = wordsA.filter((w) => wordsB.includes(w));
  return Math.round(((common.length * 2) / (wordsA.length + wordsB.length)) * 100);
}

// La lista EU FSF XML tiene elementos <nameAlias wholeName="..."> con el nombre
// completo como atributo. Tambien puede tener <wholeName>...</wholeName> como elemento.
function parseEuXml(xml) {
  const entries = [];
  const seen = new Set();

  // Atributo wholeName en nameAlias
  const attrMatches = [...xml.matchAll(/wholeName="([^"]+)"/gi)];
  for (const [, name] of attrMatches) {
    const n = name.trim();
    if (!n || seen.has(n)) continue;
    seen.add(n);
    entries.push({ name: n, list: 'EU_FSF', normalizedName: normalizeName(n) });
  }

  // Elemento <wholeName> como fallback
  const elemMatches = [...xml.matchAll(/<wholeName>([^<]+)<\/wholeName>/gi)];
  for (const [, name] of elemMatches) {
    const n = name.trim();
    if (!n || seen.has(n)) continue;
    seen.add(n);
    entries.push({ name: n, list: 'EU_FSF', normalizedName: normalizeName(n) });
  }

  return entries;
}

async function fetchEuList() {
  const response = await fetch(EU_LIST_URL, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Lista EU FSF respondio con estatus ${response.status}`);
  const xml = await response.text();
  const entries = parseEuXml(xml);
  if (!entries.length) throw new Error('Lista EU FSF se descargo vacia o con formato inesperado');
  return entries;
}

function isStale() {
  return !state.loadedAt || (Date.now() - state.loadedAt) > REFRESH_INTERVAL_MS;
}

export function primeEuList() {
  if (state.loading || (!isStale() && state.entries)) return state.loading;
  state.loading = fetchEuList()
    .then((entries) => { state.entries = entries; state.loadedAt = Date.now(); state.error = null; })
    .catch((err) => { state.error = err.message; })
    .finally(() => { state.loading = null; });
  return state.loading;
}

export function screenNameAgainstEu(name) {
  primeEuList();
  const trimmed = String(name || '').trim();
  if (!trimmed) return { status: 'skipped', detail: 'Sin nombre para verificar contra lista EU FSF', matches: [] };
  if (!state.entries) {
    return {
      status: 'skipped',
      detail: state.error ? `No se pudo descargar la lista EU FSF: ${state.error}` : 'Lista EU FSF aun se esta descargando',
      matches: []
    };
  }
  const target = normalizeName(trimmed);
  const matches = [];
  for (const entry of state.entries) {
    const score = fuzzyScore(target, entry.normalizedName);
    if (score >= MATCH_THRESHOLD) matches.push({ name: entry.name, list: 'EU_FSF', score });
  }
  matches.sort((a, b) => b.score - a.score);
  return {
    status: matches.length ? 'hit' : 'clear',
    detail: matches.length
      ? `${matches.length} coincidencia(s) en lista EU FSF: ${matches.map((m) => `${m.name} (${m.score}%)`).join('; ')}. Requiere revision manual.`
      : `Sin coincidencias en lista EU FSF (${state.entries.length} registros, ${new Date(state.loadedAt).toISOString().slice(0, 10)})`,
    matches: matches.slice(0, 5),
    listEntries: state.entries.length,
    listLoadedAt: new Date(state.loadedAt).toISOString()
  };
}

export function getEuListStatus() {
  return { loaded: Boolean(state.entries), entries: state.entries?.length ?? null, loadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null, error: state.error };
}

export function _resetEuStateForTests() {
  state.entries = null; state.loadedAt = null; state.loading = null; state.error = null;
}
