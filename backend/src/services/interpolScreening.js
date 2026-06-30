// Screening contra avisos publicos de INTERPOL (Red Notices y otros).
// Usa la API REST publica de INTERPOL que devuelve JSON sin autenticacion.
// IMPORTANTE: solo cubre avisos que INTERPOL ha decidido publicar abiertamente.
// No accede a I-24/7 ni a bases policiales restringidas.
// Referencia: https://www.interpol.int/How-we-work/Notices/Red-Notices
const INTERPOL_API_URL = 'https://ws-public.interpol.int/notices/v1/red';
const INTERPOL_PAGE_SIZE = 20;
const INTERPOL_MAX_PAGES = 10;
const REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12h — las notices cambian con mas frecuencia
const MATCH_THRESHOLD = 80;

import { normalizeName, matchName } from './matchingEngine.js';
import { createEntityRecord } from './entityModel.js';

const state = { entries: null, loadedAt: null, loading: null, error: null };

async function fetchInterpolPage(page) {
  const url = `${INTERPOL_API_URL}?page=${page}&resultPerPage=${INTERPOL_PAGE_SIZE}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000)
  });
  if (!res.ok) throw new Error(`INTERPOL API respondio ${res.status} en pagina ${page}`);
  return res.json();
}

async function fetchInterpolList() {
  const entries = [];
  let page = 1;

  while (page <= INTERPOL_MAX_PAGES) {
    let data;
    try {
      data = await fetchInterpolPage(page);
    } catch {
      break; // timeout o error de red — usamos lo que ya tenemos
    }

    const notices = data?._embedded?.notices;
    if (!Array.isArray(notices) || !notices.length) break;

    for (const notice of notices) {
      const forename  = (notice.forename  || '').trim();
      const name      = (notice.name      || '').trim();
      const fullName  = [forename, name].filter(Boolean).join(' ');
      if (!fullName) continue;

      entries.push({
        name: fullName,
        normalizedName: normalizeName(fullName),
        entityId: notice.entity_id || null,
        nationality: notice.nationalities?.[0] || null,
        dateOfBirth: notice.date_of_birth || null,
        notice: 'RED_NOTICE',
        source: 'INTERPOL',
        sourceUrl: `https://www.interpol.int/en/How-we-work/Notices/Red-Notices/View-Red-Notices/${notice.entity_id || ''}`
      });
    }

    const totalPages = data?.query?.page ? Math.ceil((data?.total || 0) / INTERPOL_PAGE_SIZE) : 1;
    if (page >= totalPages) break;
    page++;
  }

  if (!entries.length) throw new Error('INTERPOL API retorno lista vacia');
  return entries;
}

function isStale() {
  return !state.loadedAt || (Date.now() - state.loadedAt) > REFRESH_INTERVAL_MS;
}

export function primeInterpolList() {
  if (state.loading || (!isStale() && state.entries)) return state.loading;
  state.loading = fetchInterpolList()
    .then((entries) => { state.entries = entries; state.loadedAt = Date.now(); state.error = null; })
    .catch((err) => { state.error = err.message; })
    .finally(() => { state.loading = null; });
  return state.loading;
}

export function screenNameAgainstInterpol(name) {
  primeInterpolList();
  const trimmed = String(name || '').trim();
  if (!trimmed) return { status: 'skipped', detail: 'Sin nombre para verificar contra INTERPOL', matches: [], listEntries: null, listLoadedAt: null };
  if (!state.entries) {
    return {
      status: 'skipped',
      detail: state.error
        ? `No se pudo descargar avisos INTERPOL: ${state.error}`
        : 'Avisos INTERPOL aun se estan descargando',
      matches: [],
      listEntries: null,
      listLoadedAt: null
    };
  }

  const hits = matchName(trimmed, state.entries).filter((m) => m.score >= MATCH_THRESHOLD);

  const entityRecords = hits.slice(0, 5).map((h) =>
    createEntityRecord({
      name: h.name,
      type: 'individual',
      program: 'INTERPOL_RED_NOTICE',
      authority: 'INTERPOL',
      nationality: h.nationality,
      source: 'interpolScreening',
      sourceUrl: h.sourceUrl,
      score: h.score,
      confidence: h.confidence,
    })
  );

  return {
    status: hits.length ? 'hit' : 'clear',
    detail: hits.length
      ? `${hits.length} Red Notice(s) publica(s) INTERPOL: ${hits.map((m) => `${m.name} (${m.score}%)`).join('; ')}. Requiere corroboracion de identidad y revision humana. Solo cubre avisos publicos.`
      : `Sin coincidencias en avisos publicos INTERPOL (${state.entries.length} registros, ${new Date(state.loadedAt).toISOString().slice(0, 10)})`,
    matches: entityRecords,
    listEntries: state.entries.length,
    listLoadedAt: new Date(state.loadedAt).toISOString()
  };
}

export function getInterpolListStatus() {
  return {
    loaded: Boolean(state.entries),
    entries: state.entries?.length ?? null,
    loadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null,
    error: state.error
  };
}

export function _resetInterpolStateForTests() {
  state.entries = null; state.loadedAt = null; state.loading = null; state.error = null;
}
