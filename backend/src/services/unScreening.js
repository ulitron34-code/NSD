// Screening contra la Lista Consolidada del Consejo de Seguridad de la ONU.
// Fuente oficial y gratuita. Formato XML descargado en segundo plano y
// cacheado en memoria; no requiere API key.
const UN_LIST_URL = 'https://scsanctions.un.org/resources/xml/en/consolidated.xml';
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

function extractTagContent(block, tag) {
  const match = block.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i'));
  return match ? match[1].trim() : '';
}

function parseUnXml(xml) {
  const entries = [];

  // Extraer bloques INDIVIDUAL
  const individualBlocks = [...xml.matchAll(/<INDIVIDUAL>([\s\S]*?)<\/INDIVIDUAL>/gi)];
  for (const [, block] of individualBlocks) {
    const parts = [
      extractTagContent(block, 'FIRST_NAME'),
      extractTagContent(block, 'SECOND_NAME'),
      extractTagContent(block, 'THIRD_NAME'),
      extractTagContent(block, 'FOURTH_NAME'),
    ].filter(Boolean);
    if (!parts.length) continue;
    const name = parts.join(' ');
    entries.push({ name, type: 'individual', list: 'UN_SC', normalizedName: normalizeName(name) });

    // AKA aliases del mismo bloque
    const akaBlocks = [...block.matchAll(/<ALIAS>([\s\S]*?)<\/ALIAS>/gi)];
    for (const [, aka] of akaBlocks) {
      const akaParts = [
        extractTagContent(aka, 'FIRST_NAME'),
        extractTagContent(aka, 'SECOND_NAME'),
        extractTagContent(aka, 'THIRD_NAME'),
        extractTagContent(aka, 'FOURTH_NAME'),
      ].filter(Boolean);
      if (!akaParts.length) continue;
      const akaName = akaParts.join(' ');
      entries.push({ name: akaName, type: 'individual_alias', list: 'UN_SC', normalizedName: normalizeName(akaName) });
    }
  }

  // Extraer bloques ENTITY
  const entityBlocks = [...xml.matchAll(/<ENTITY>([\s\S]*?)<\/ENTITY>/gi)];
  for (const [, block] of entityBlocks) {
    const name = extractTagContent(block, 'FIRST_NAME');
    if (!name) continue;
    entries.push({ name, type: 'entity', list: 'UN_SC', normalizedName: normalizeName(name) });

    const akaBlocks = [...block.matchAll(/<ALIAS>([\s\S]*?)<\/ALIAS>/gi)];
    for (const [, aka] of akaBlocks) {
      const akaName = extractTagContent(aka, 'FIRST_NAME');
      if (!akaName) continue;
      entries.push({ name: akaName, type: 'entity_alias', list: 'UN_SC', normalizedName: normalizeName(akaName) });
    }
  }

  return entries;
}

async function fetchUnList() {
  const response = await fetch(UN_LIST_URL, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Lista ONU respondio con estatus ${response.status}`);
  const xml = await response.text();
  const entries = parseUnXml(xml);
  if (!entries.length) throw new Error('Lista ONU se descargo vacia o con formato inesperado');
  return entries;
}

function isStale() {
  return !state.loadedAt || (Date.now() - state.loadedAt) > REFRESH_INTERVAL_MS;
}

export function primeUnList() {
  if (state.loading || (!isStale() && state.entries)) return state.loading;
  state.loading = fetchUnList()
    .then((entries) => { state.entries = entries; state.loadedAt = Date.now(); state.error = null; })
    .catch((err) => { state.error = err.message; })
    .finally(() => { state.loading = null; });
  return state.loading;
}

export function screenNameAgainstUn(name) {
  primeUnList();
  const trimmed = String(name || '').trim();
  if (!trimmed) return { status: 'skipped', detail: 'Sin nombre para verificar contra lista ONU', matches: [] };
  if (!state.entries) {
    return {
      status: 'skipped',
      detail: state.error ? `No se pudo descargar la lista ONU: ${state.error}` : 'Lista ONU aun se esta descargando',
      matches: []
    };
  }
  const target = normalizeName(trimmed);
  const matches = [];
  for (const entry of state.entries) {
    const score = fuzzyScore(target, entry.normalizedName);
    if (score >= MATCH_THRESHOLD) matches.push({ name: entry.name, type: entry.type, list: 'UN_SC', score });
  }
  matches.sort((a, b) => b.score - a.score);
  return {
    status: matches.length ? 'hit' : 'clear',
    detail: matches.length
      ? `${matches.length} coincidencia(s) en Lista Consolidada ONU: ${matches.map((m) => `${m.name} (${m.score}%)`).join('; ')}. Requiere revision manual.`
      : `Sin coincidencias en Lista Consolidada ONU (${state.entries.length} registros, ${new Date(state.loadedAt).toISOString().slice(0, 10)})`,
    matches: matches.slice(0, 5),
    listEntries: state.entries.length,
    listLoadedAt: new Date(state.loadedAt).toISOString()
  };
}

export function getUnListStatus() {
  return { loaded: Boolean(state.entries), entries: state.entries?.length ?? null, loadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null, error: state.error };
}

export function _resetUnStateForTests() {
  state.entries = null; state.loadedAt = null; state.loading = null; state.error = null;
}
