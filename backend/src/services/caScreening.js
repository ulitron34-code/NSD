// Screening contra la Lista Consolidada de Sanciones de Canada
// (Global Affairs Canada / Loi sur les mesures economiques speciales — SEMA).
// Fuente oficial gratuita en formato CSV. No requiere API key.
const CA_LIST_URL = 'https://www.international.gc.ca/world-monde/assets/office_docs/international_relations-relations_internationales/sanctions/sema-lmes.csv';
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

// La lista SEMA tiene columnas variables. Busca columnas de nombre por keyword:
// "last name" / "last_name", "given name" / "given_names", "entity" / "name".
function parseCaCsv(text) {
  const lines = text.split(/\r?\n/);
  if (!lines.length) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim().replace(/[^a-z0-9]/g, '_'));
  const lastIdx = header.findIndex((h) => h.includes('last') && h.includes('name'));
  const firstIdx = header.findIndex((h) => (h.includes('given') || h.includes('first')) && h.includes('name'));
  const entityIdx = header.findIndex((h) => h === 'entity' || (h.includes('entity') && h.includes('name')) || h === 'name');

  const entries = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const fields = parseCsvLine(line);

    let name = '';
    if (lastIdx >= 0 && fields[lastIdx]) {
      const parts = [firstIdx >= 0 ? fields[firstIdx] : '', fields[lastIdx]].filter(Boolean);
      name = parts.join(' ');
    } else if (entityIdx >= 0 && fields[entityIdx]) {
      name = fields[entityIdx];
    } else {
      // Fallback: primer campo no vacio
      name = fields.find((f) => f && f.length > 2) || '';
    }

    if (!name) continue;
    entries.push({ name, list: 'CA_SEMA', normalizedName: normalizeName(name) });
  }
  return entries;
}

async function fetchCaList() {
  const response = await fetch(CA_LIST_URL, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Lista Canada SEMA respondio con estatus ${response.status}`);
  const text = await response.text();
  const entries = parseCaCsv(text);
  if (!entries.length) throw new Error('Lista Canada SEMA se descargo vacia o con formato inesperado');
  return entries;
}

function isStale() {
  return !state.loadedAt || (Date.now() - state.loadedAt) > REFRESH_INTERVAL_MS;
}

export function primeCaList() {
  if (state.loading || (!isStale() && state.entries)) return state.loading;
  state.loading = fetchCaList()
    .then((entries) => { state.entries = entries; state.loadedAt = Date.now(); state.error = null; })
    .catch((err) => { state.error = err.message; })
    .finally(() => { state.loading = null; });
  return state.loading;
}

export function screenNameAgainstCa(name) {
  primeCaList();
  const trimmed = String(name || '').trim();
  if (!trimmed) return { status: 'skipped', detail: 'Sin nombre para verificar contra lista Canada SEMA', matches: [] };
  if (!state.entries) {
    return {
      status: 'skipped',
      detail: state.error ? `No se pudo descargar la lista Canada SEMA: ${state.error}` : 'Lista Canada SEMA aun se esta descargando',
      matches: []
    };
  }
  const target = normalizeName(trimmed);
  const matches = [];
  for (const entry of state.entries) {
    const score = fuzzyScore(target, entry.normalizedName);
    if (score >= MATCH_THRESHOLD) matches.push({ name: entry.name, list: 'CA_SEMA', score });
  }
  matches.sort((a, b) => b.score - a.score);
  return {
    status: matches.length ? 'hit' : 'clear',
    detail: matches.length
      ? `${matches.length} coincidencia(s) en lista Canada SEMA: ${matches.map((m) => `${m.name} (${m.score}%)`).join('; ')}. Requiere revision manual.`
      : `Sin coincidencias en lista Canada SEMA (${state.entries.length} registros, ${new Date(state.loadedAt).toISOString().slice(0, 10)})`,
    matches: matches.slice(0, 5),
    listEntries: state.entries.length,
    listLoadedAt: new Date(state.loadedAt).toISOString()
  };
}

export function getCaListStatus() {
  return { loaded: Boolean(state.entries), entries: state.entries?.length ?? null, loadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null, error: state.error };
}

export function _resetCaStateForTests() {
  state.entries = null; state.loadedAt = null; state.loading = null; state.error = null;
}
