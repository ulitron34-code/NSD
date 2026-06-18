// Screening contra la lista SDN (Specially Designated Nationals) de OFAC.
// Fuente oficial y gratuita del Tesoro de EE.UU. Se descarga en segundo plano
// y se cachea en memoria del proceso; no requiere API key.
const OFAC_SDN_CSV_URL = 'https://sanctionslistservice.ofac.treas.gov/api/publicationpreview/exports/sdn.csv';
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const MATCH_THRESHOLD = 85;

const state = {
  entries: null,
  loadedAt: null,
  loading: null,
  error: null
};

function normalizeName(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Mismo criterio de comparacion heuristica usado en agentCrossRef.js: exacto,
// contencion de substring, o porcentaje de palabras en comun.
function fuzzyScore(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 85;
  const wordsA = a.split(' ');
  const wordsB = b.split(' ');
  const common = wordsA.filter((w) => wordsB.includes(w));
  return Math.round(((common.length * 2) / (wordsA.length + wordsB.length)) * 100);
}

// Parser minimo de CSV con campos entre comillas, suficiente para el formato
// oficial de SDN.CSV (sin saltos de linea dentro de campos).
function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

// Columnas oficiales: ent_num, SDN_Name, SDN_Type, Program, Title, Call_Sign,
// Vess_type, Tonnage, GRT, Vess_flag, Vess_owner, Remarks. Los campos vacios
// vienen como "-0-".
function parseSdnCsv(text) {
  const entries = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const fields = parseCsvLine(line);
    const name = fields[1];
    if (!name || name === '-0-') continue;
    const type = fields[2] === '-0-' ? null : fields[2];
    const program = fields[3] === '-0-' ? null : fields[3];
    entries.push({ name, type, program, normalizedName: normalizeName(name) });
  }
  return entries;
}

async function fetchSdnList() {
  const response = await fetch(OFAC_SDN_CSV_URL, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`La lista SDN de OFAC respondio con estatus ${response.status}`);
  }
  const text = await response.text();
  const entries = parseSdnCsv(text);
  if (!entries.length) {
    throw new Error('La lista SDN de OFAC se descargo vacia o con formato inesperado');
  }
  return entries;
}

function isStale() {
  return !state.loadedAt || (Date.now() - state.loadedAt) > REFRESH_INTERVAL_MS;
}

// Dispara la descarga en segundo plano si hace falta. No bloquea al
// llamador: validateRegulatoryProfile sigue siendo sincrono.
export function primeOfacList() {
  if (state.loading || (!isStale() && state.entries)) return state.loading;
  state.loading = fetchSdnList()
    .then((entries) => {
      state.entries = entries;
      state.loadedAt = Date.now();
      state.error = null;
    })
    .catch((err) => {
      state.error = err.message;
    })
    .finally(() => {
      state.loading = null;
    });
  return state.loading;
}

export function screenNameAgainstOfac(name) {
  primeOfacList();

  const trimmedName = String(name || '').trim();
  if (!trimmedName) {
    return {
      status: 'skipped',
      detail: 'Sin nombre o razon social para verificar contra la lista OFAC',
      matches: []
    };
  }

  if (!state.entries) {
    return {
      status: 'skipped',
      detail: state.error
        ? `No se pudo descargar la lista SDN de OFAC: ${state.error}`
        : 'La lista SDN de OFAC aun se esta descargando, reintenta en unos segundos',
      matches: []
    };
  }

  const target = normalizeName(trimmedName);
  const matches = [];
  for (const entry of state.entries) {
    const score = fuzzyScore(target, entry.normalizedName);
    if (score >= MATCH_THRESHOLD) {
      matches.push({ name: entry.name, type: entry.type, program: entry.program, score });
    }
  }
  matches.sort((a, b) => b.score - a.score);

  return {
    status: matches.length ? 'hit' : 'clear',
    detail: matches.length
      ? `${matches.length} coincidencia(s) potencial(es) en la lista SDN de OFAC: ${matches
          .map((m) => `${m.name} (${m.score}%)`)
          .join('; ')}. Comparacion heuristica por nombre; requiere revision manual antes de actuar.`
      : `Sin coincidencias en la lista SDN de OFAC (${state.entries.length} registros, actualizada ${new Date(state.loadedAt)
          .toISOString()
          .slice(0, 10)})`,
    matches: matches.slice(0, 5),
    listEntries: state.entries.length,
    listLoadedAt: new Date(state.loadedAt).toISOString()
  };
}

export function getOfacListStatus() {
  return {
    loaded: Boolean(state.entries),
    entries: state.entries ? state.entries.length : null,
    loadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null,
    error: state.error
  };
}

export function _resetOfacStateForTests() {
  state.entries = null;
  state.loadedAt = null;
  state.loading = null;
  state.error = null;
}
