// Screening contra el listado publico del articulo 69-B del CFF (SAT):
// contribuyentes con operaciones presuntamente inexistentes (EFOS), en
// estatus Presunto, Definitivo, Desvirtuado o Sentencia favorable.
// Fuente oficial y gratuita del SAT. Se descarga en segundo plano y se
// cachea en memoria del proceso; no requiere API key ni contrato comercial.
const SAT_69B_CSV_URL = 'http://omawww.sat.gob.mx/cifras_sat/Documents/Listado_Completo_69-B.csv';
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const NAME_MATCH_THRESHOLD = 85;

const state = {
  entries: null,
  loadedAt: null,
  loading: null,
  error: null
};

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeRfc(value = '') {
  return String(value).toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
}

// Mismo criterio heuristico usado en ofacScreening.js: exacto, contencion de
// substring, o porcentaje de palabras en comun.
function fuzzyScore(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 85;
  const wordsA = a.split(' ');
  const wordsB = b.split(' ');
  const common = wordsA.filter((w) => wordsB.includes(w));
  return Math.round(((common.length * 2) / (wordsA.length + wordsB.length)) * 100);
}

// Parser minimo de CSV con campos entre comillas, igual al de ofacScreening.js.
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

function findColumnIndex(headerFields, candidates) {
  const normalizedHeaders = headerFields.map((h) => normalizeText(h));
  for (const candidate of candidates) {
    const normalizedCandidate = normalizeText(candidate);
    const idx = normalizedHeaders.findIndex((h) => h.includes(normalizedCandidate));
    if (idx !== -1) return idx;
  }
  return -1;
}

// El SAT no documenta un contrato de columnas estable, asi que se ubican por
// nombre de encabezado en vez de posicion fija. Ademas el archivo trae 1-2
// filas de aviso legal/titulo antes del encabezado real, asi que se busca
// la fila de encabezado entre las primeras N lineas en vez de asumir que es
// la primera.
const HEADER_SEARCH_LIMIT = 10;

function parseSat69bCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];

  let headerLineIndex = -1;
  let rfcIdx = -1;
  let nameIdx = -1;
  let situacionIdx = -1;

  for (let i = 0; i < Math.min(HEADER_SEARCH_LIMIT, lines.length); i++) {
    const candidate = parseCsvLine(lines[i]);
    const candidateRfcIdx = findColumnIndex(candidate, ['RFC']);
    const candidateNameIdx = findColumnIndex(candidate, ['CONTRIBUYENTE', 'NOMBRE', 'RAZON SOCIAL']);
    if (candidateRfcIdx !== -1 && candidateNameIdx !== -1) {
      headerLineIndex = i;
      rfcIdx = candidateRfcIdx;
      nameIdx = candidateNameIdx;
      situacionIdx = findColumnIndex(candidate, ['SITUACION']);
      break;
    }
  }

  if (headerLineIndex === -1) {
    throw new Error('El listado 69-B del SAT vino con un formato de columnas inesperado');
  }

  const entries = [];
  for (let i = headerLineIndex + 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    const rfc = fields[rfcIdx];
    const name = fields[nameIdx];
    if (!rfc && !name) continue;
    entries.push({
      rfc: normalizeRfc(rfc),
      name: name || '',
      normalizedName: normalizeText(name),
      situacion: situacionIdx !== -1 ? (fields[situacionIdx] || '') : ''
    });
  }
  return entries;
}

async function fetchSat69bList() {
  const response = await fetch(SAT_69B_CSV_URL, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`El listado 69-B del SAT respondio con estatus ${response.status}`);
  }
  // El SAT publica el CSV en Windows-1252, no UTF-8 (sin charset declarado en
  // Content-Type); decodificar como UTF-8 corrompe acentos y rompe la
  // deteccion del encabezado "Situacion del contribuyente".
  const buffer = await response.arrayBuffer();
  const text = new TextDecoder('windows-1252').decode(buffer);
  const entries = parseSat69bCsv(text);
  if (!entries.length) {
    throw new Error('El listado 69-B del SAT se descargo vacio o con formato inesperado');
  }
  return entries;
}

function isStale() {
  return !state.loadedAt || (Date.now() - state.loadedAt) > REFRESH_INTERVAL_MS;
}

// Dispara la descarga en segundo plano si hace falta. No bloquea al llamador.
export function primeSat69bList() {
  if (state.loading || (!isStale() && state.entries)) return state.loading;
  state.loading = fetchSat69bList()
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

export function screenRfcAgainstSat69b(rfc, razonSocial) {
  primeSat69bList();

  const trimmedRfc = normalizeRfc(rfc);
  const trimmedName = String(razonSocial || '').trim();
  if (!trimmedRfc && !trimmedName) {
    return {
      status: 'skipped',
      detail: 'Sin RFC ni razon social para verificar contra el listado 69-B del SAT',
      matches: []
    };
  }

  if (!state.entries) {
    return {
      status: 'skipped',
      detail: state.error
        ? `No se pudo descargar el listado 69-B del SAT: ${state.error}`
        : 'El listado 69-B del SAT aun se esta descargando, reintenta en unos segundos',
      matches: []
    };
  }

  const targetName = normalizeText(trimmedName);
  const matches = [];
  for (const entry of state.entries) {
    const rfcHit = trimmedRfc && entry.rfc && entry.rfc === trimmedRfc;
    const nameScore = targetName ? fuzzyScore(targetName, entry.normalizedName) : 0;
    if (rfcHit || nameScore >= NAME_MATCH_THRESHOLD) {
      matches.push({
        rfc: entry.rfc,
        name: entry.name,
        situacion: entry.situacion,
        matchType: rfcHit ? 'rfc' : 'name',
        score: rfcHit ? 100 : nameScore
      });
    }
  }
  matches.sort((a, b) => b.score - a.score);

  return {
    status: matches.length ? 'hit' : 'clear',
    detail: matches.length
      ? `${matches.length} coincidencia(s) en el listado 69-B del SAT: ${matches
          .map((m) => `${m.name || m.rfc} (${m.situacion || 'sin situacion'})`)
          .join('; ')}. Requiere revision manual antes de actuar.`
      : `Sin coincidencias en el listado 69-B del SAT (${state.entries.length} registros, actualizado ${new Date(state.loadedAt)
          .toISOString()
          .slice(0, 10)})`,
    matches: matches.slice(0, 5),
    listEntries: state.entries.length,
    listLoadedAt: new Date(state.loadedAt).toISOString()
  };
}

export function getSat69bListStatus() {
  return {
    loaded: Boolean(state.entries),
    entries: state.entries ? state.entries.length : null,
    loadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null,
    error: state.error
  };
}

export function _resetSat69bStateForTests() {
  state.entries = null;
  state.loadedAt = null;
  state.loading = null;
  state.error = null;
}
