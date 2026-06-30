// Screening contra el registro publico y acciones regulatorias de la DFSA
// (Dubai Financial Services Authority) — regulador del DIFC, Emiratos Arabes Unidos.
// Fuentes publicas:
//   - Enforcement actions: https://www.dfsa.ae/regulatory-actions/enforcement-actions
//   - Warning notices:     https://www.dfsa.ae/regulatory-actions/regulatory-warnings
// No requiere API key. La estructura HTML puede cambiar; si el parse falla,
// el screener retorna 'skipped' en lugar de error.
const DFSA_ENFORCEMENT_URL = 'https://www.dfsa.ae/regulatory-actions/enforcement-actions';
const DFSA_WARNINGS_URL = 'https://www.dfsa.ae/regulatory-actions/regulatory-warnings';
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 15_000;
const MATCH_THRESHOLD = 78;

import { normalizeName, matchName } from './matchingEngine.js';
import { createEntityRecord } from './entityModel.js';

const state = { entries: null, loadedAt: null, loading: null, error: null };

// Extrae nombres de entidades de paginas HTML de la DFSA.
// Busca patrones comunes: <h3>, <h4>, <strong>, <td> con nombres de firmas/personas.
function extractNamesFromHtml(html, sourceLabel) {
  const entries = [];
  if (!html) return entries;

  // Encabezados de articulos (estructura tipica DFSA)
  const headingPattern = /<(?:h[234]|strong|b)[^>]*>([^<]{3,80})<\/(?:h[234]|strong|b)>/gi;
  let m;
  while ((m = headingPattern.exec(html)) !== null) {
    const raw = m[1].replace(/&[a-z]+;/gi, ' ').replace(/&#\d+;/gi, ' ').trim();
    // Filtra lineas de navegacion / etiquetas genericas
    if (raw.length < 4 || raw.length > 80) continue;
    if (/^(home|menu|search|back|next|regulatory|dfsa|difc|enforcement|action|warning|notice|read more|more|all)$/i.test(raw)) continue;
    entries.push({ name: raw, normalizedName: normalizeName(raw), sourceLabel });
  }

  // Celdas de tabla (algunos registros estan en tablas HTML)
  const tdPattern = /<td[^>]*>([^<]{4,80})<\/td>/gi;
  while ((m = tdPattern.exec(html)) !== null) {
    const raw = m[1].replace(/&[a-z]+;/gi, ' ').trim();
    if (raw.length < 4 || /^\d+$/.test(raw)) continue;
    entries.push({ name: raw, normalizedName: normalizeName(raw), sourceLabel });
  }

  return entries;
}

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: { 'Accept': 'text/html', 'User-Agent': 'NSD-Compliance-Gateway/1.0 contact@nsd.mx' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });
  if (!res.ok) throw new Error(`DFSA ${url} respondio ${res.status}`);
  return res.text();
}

async function fetchDfsaLists() {
  const entries = [];
  const errors = [];

  for (const { url, label } of [
    { url: DFSA_ENFORCEMENT_URL, label: 'DFSA_ENFORCEMENT' },
    { url: DFSA_WARNINGS_URL,   label: 'DFSA_WARNING' }
  ]) {
    try {
      const html = await fetchPage(url);
      entries.push(...extractNamesFromHtml(html, label));
    } catch (err) {
      errors.push(`${label}: ${err.message}`);
    }
  }

  if (!entries.length) {
    throw new Error(errors.length ? errors.join('; ') : 'DFSA: ninguna pagina devolvio registros parseables');
  }
  // Deduplicar por normalizedName
  const seen = new Set();
  return entries.filter((e) => {
    if (seen.has(e.normalizedName)) return false;
    seen.add(e.normalizedName);
    return true;
  });
}

function isStale() {
  return !state.loadedAt || (Date.now() - state.loadedAt) > REFRESH_INTERVAL_MS;
}

export function primeDfsaList() {
  if (state.loading || (!isStale() && state.entries)) return state.loading;
  state.loading = fetchDfsaLists()
    .then((entries) => { state.entries = entries; state.loadedAt = Date.now(); state.error = null; })
    .catch((err) => { state.error = err.message; })
    .finally(() => { state.loading = null; });
  return state.loading;
}

export function screenNameAgainstDfsa(name) {
  primeDfsaList();
  const trimmed = String(name || '').trim();
  if (!trimmed) return { status: 'skipped', detail: 'Sin nombre para verificar contra DFSA', matches: [], listEntries: null, listLoadedAt: null };
  if (!state.entries) {
    return {
      status: 'skipped',
      detail: state.error
        ? `DFSA no disponible: ${state.error}`
        : 'Registros DFSA aun se estan descargando',
      matches: [], listEntries: null, listLoadedAt: null
    };
  }

  const hits = matchName(trimmed, state.entries).filter((m) => m.score >= MATCH_THRESHOLD);

  const matches = hits.slice(0, 5).map((h) =>
    createEntityRecord({
      name: h.name,
      type: 'individual_or_entity',
      program: h.sourceLabel || 'DFSA_REGULATORY',
      authority: 'DFSA (Dubai Financial Services Authority)',
      reason: h.sourceLabel === 'DFSA_WARNING' ? 'Warning Notice DFSA' : 'Enforcement Action DFSA',
      jurisdiction: 'UAE / DIFC',
      source: 'dfsaScreening',
      sourceUrl: h.sourceLabel === 'DFSA_WARNING' ? DFSA_WARNINGS_URL : DFSA_ENFORCEMENT_URL,
      score: h.score,
      confidence: h.confidence
    })
  );

  return {
    status: hits.length ? 'hit' : 'clear',
    detail: hits.length
      ? `${hits.length} coincidencia(s) en registros regulatorios DFSA: ${hits.map((m) => `${m.name} (${m.score}%)`).join('; ')}. Requiere revision manual.`
      : `Sin coincidencias en registros DFSA (${state.entries.length} registros, ${new Date(state.loadedAt).toISOString().slice(0, 10)})`,
    matches,
    listEntries: state.entries.length,
    listLoadedAt: new Date(state.loadedAt).toISOString()
  };
}

export function getDfsaListStatus() {
  return { loaded: Boolean(state.entries), entries: state.entries?.length ?? null, loadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null, error: state.error };
}

export function _resetDfsaStateForTests() {
  state.entries = null; state.loadedAt = null; state.loading = null; state.error = null;
}
