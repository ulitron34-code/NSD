// Screening contra el listado de personas buscadas del FBI (API publica).
// Principalmente util para expedientes con contraparte en EE.UU.
// La API del FBI es publica y no requiere API key; retorna JSON paginado.
const FBI_API_URL = 'https://api.fbi.gov/wanted/v1/list';
const FBI_PAGE_SIZE = 50;
const FBI_MAX_PAGES = 5;
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

async function fetchFbiPage(page) {
  const url = `${FBI_API_URL}?pageSize=${FBI_PAGE_SIZE}&page=${page}`;
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`FBI API respondio con estatus ${response.status} en pagina ${page}`);
  return response.json();
}

async function fetchFbiList() {
  const entries = [];
  let page = 1;
  let total = null;

  while (page <= FBI_MAX_PAGES) {
    const data = await fetchFbiPage(page);
    if (!data || !Array.isArray(data.items)) break;
    if (total === null) total = data.total || 0;

    for (const item of data.items) {
      const name = (item.title || item.subject || '').trim();
      if (!name) continue;
      entries.push({ name, list: 'FBI_WANTED', normalizedName: normalizeName(name) });

      // Incluir aliases cuando esten disponibles
      if (Array.isArray(item.aliases)) {
        for (const alias of item.aliases) {
          const a = String(alias || '').trim();
          if (a) entries.push({ name: a, list: 'FBI_WANTED_ALIAS', normalizedName: normalizeName(a) });
        }
      }
    }

    if (data.items.length < FBI_PAGE_SIZE || entries.length >= total) break;
    page++;
  }

  if (!entries.length) throw new Error('FBI API retorno lista vacia o con formato inesperado');
  return entries;
}

function isStale() {
  return !state.loadedAt || (Date.now() - state.loadedAt) > REFRESH_INTERVAL_MS;
}

export function primeFbiList() {
  if (state.loading || (!isStale() && state.entries)) return state.loading;
  state.loading = fetchFbiList()
    .then((entries) => { state.entries = entries; state.loadedAt = Date.now(); state.error = null; })
    .catch((err) => { state.error = err.message; })
    .finally(() => { state.loading = null; });
  return state.loading;
}

export function screenNameAgainstFbi(name) {
  primeFbiList();
  const trimmed = String(name || '').trim();
  if (!trimmed) return { status: 'skipped', detail: 'Sin nombre para verificar contra lista FBI', matches: [] };
  if (!state.entries) {
    return {
      status: 'skipped',
      detail: state.error ? `No se pudo descargar la lista FBI: ${state.error}` : 'Lista FBI aun se esta descargando',
      matches: []
    };
  }
  const target = normalizeName(trimmed);
  const matches = [];
  for (const entry of state.entries) {
    const score = fuzzyScore(target, entry.normalizedName);
    if (score >= MATCH_THRESHOLD) matches.push({ name: entry.name, list: entry.list, score });
  }
  matches.sort((a, b) => b.score - a.score);
  return {
    status: matches.length ? 'hit' : 'clear',
    detail: matches.length
      ? `${matches.length} coincidencia(s) en lista FBI Wanted: ${matches.map((m) => `${m.name} (${m.score}%)`).join('; ')}. Requiere revision manual.`
      : `Sin coincidencias en lista FBI Wanted (${state.entries.length} registros, ${new Date(state.loadedAt).toISOString().slice(0, 10)})`,
    matches: matches.slice(0, 5),
    listEntries: state.entries.length,
    listLoadedAt: new Date(state.loadedAt).toISOString()
  };
}

export function getFbiListStatus() {
  return { loaded: Boolean(state.entries), entries: state.entries?.length ?? null, loadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null, error: state.error };
}

export function _resetFbiStateForTests() {
  state.entries = null; state.loadedAt = null; state.loading = null; state.error = null;
}
