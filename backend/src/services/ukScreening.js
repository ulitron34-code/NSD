// Screening contra la lista consolidada de sanciones financieras del Reino Unido
// (OFSI — Office of Financial Sanctions Implementation, HM Treasury).
// Fuente oficial gratuita en formato CSV. No requiere API key.
const UK_LIST_URL = 'https://ofsistorage.blob.core.windows.net/publishlive/2022format/ConList.csv';
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

// Parser CSV minimo con soporte de comillas (igual al de ofacScreening).
function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') { if (line[i + 1] === '"') { current += '"'; i++; } else { inQuotes = false; } }
      else current += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(current.trim()); current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

// La lista OFSI tiene cabecera variable. Las columnas clave son:
// "Name 1".."Name 6", "Group Type" (Individual/Entity), "Name Type" (Primary Name/AKA).
function parseUkCsv(text) {
  const lines = text.split(/\r?\n/);
  if (!lines.length) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const nameIdxs = [1, 2, 3, 4, 5, 6].map((n) => header.indexOf(`name ${n}`));
  const typeIdx = header.indexOf('group type');

  const entries = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const fields = parseCsvLine(line);
    const nameParts = nameIdxs.map((idx) => (idx >= 0 && fields[idx] ? fields[idx] : '')).filter(Boolean);
    if (!nameParts.length) continue;
    const name = nameParts.join(' ');
    const type = typeIdx >= 0 ? (fields[typeIdx] || '').toLowerCase() : 'unknown';
    entries.push({ name, type, list: 'UK_OFSI', normalizedName: normalizeName(name) });
  }
  return entries;
}

async function fetchUkList() {
  const response = await fetch(UK_LIST_URL, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Lista UK OFSI respondio con estatus ${response.status}`);
  const text = await response.text();
  const entries = parseUkCsv(text);
  if (!entries.length) throw new Error('Lista UK OFSI se descargo vacia o con formato inesperado');
  return entries;
}

function isStale() {
  return !state.loadedAt || (Date.now() - state.loadedAt) > REFRESH_INTERVAL_MS;
}

export function primeUkList() {
  if (state.loading || (!isStale() && state.entries)) return state.loading;
  state.loading = fetchUkList()
    .then((entries) => { state.entries = entries; state.loadedAt = Date.now(); state.error = null; })
    .catch((err) => { state.error = err.message; })
    .finally(() => { state.loading = null; });
  return state.loading;
}

export function screenNameAgainstUk(name) {
  primeUkList();
  const trimmed = String(name || '').trim();
  if (!trimmed) return { status: 'skipped', detail: 'Sin nombre para verificar contra lista UK OFSI', matches: [] };
  if (!state.entries) {
    return {
      status: 'skipped',
      detail: state.error ? `No se pudo descargar la lista UK OFSI: ${state.error}` : 'Lista UK OFSI aun se esta descargando',
      matches: []
    };
  }
  const target = normalizeName(trimmed);
  const matches = [];
  for (const entry of state.entries) {
    const score = fuzzyScore(target, entry.normalizedName);
    if (score >= MATCH_THRESHOLD) matches.push({ name: entry.name, type: entry.type, list: 'UK_OFSI', score });
  }
  matches.sort((a, b) => b.score - a.score);
  return {
    status: matches.length ? 'hit' : 'clear',
    detail: matches.length
      ? `${matches.length} coincidencia(s) en lista UK OFSI: ${matches.map((m) => `${m.name} (${m.score}%)`).join('; ')}. Requiere revision manual.`
      : `Sin coincidencias en lista UK OFSI (${state.entries.length} registros, ${new Date(state.loadedAt).toISOString().slice(0, 10)})`,
    matches: matches.slice(0, 5),
    listEntries: state.entries.length,
    listLoadedAt: new Date(state.loadedAt).toISOString()
  };
}

export function getUkListStatus() {
  return { loaded: Boolean(state.entries), entries: state.entries?.length ?? null, loadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null, error: state.error };
}

export function _resetUkStateForTests() {
  state.entries = null; state.loadedAt = null; state.loading = null; state.error = null;
}
