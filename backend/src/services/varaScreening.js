// Screening contra el registro publico y decisiones de enforcement de VARA
// (Virtual Assets Regulatory Authority) — regulador de activos virtuales de Dubai.
// Fuentes publicas:
//   - Registro publico: https://www.vara.ae/en/licenses-and-register/public-register/
//   - Enforcement:      https://www.vara.ae/en/regulatory/regulatory-actions/enforcement-decisions/
// No requiere API key. Retorna 'skipped' si el HTML cambia de estructura.
const VARA_REGISTER_URL = 'https://www.vara.ae/en/licenses-and-register/public-register/';
const VARA_ENFORCEMENT_URL = 'https://www.vara.ae/en/regulatory/regulatory-actions/enforcement-decisions/';
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 15_000;
const MATCH_THRESHOLD = 78;

import { normalizeName, matchName } from './matchingEngine.js';
import { createEntityRecord } from './entityModel.js';

const state = { entries: null, loadedAt: null, loading: null, error: null };

function extractNamesFromHtml(html, sourceLabel) {
  const entries = [];
  if (!html) return entries;

  // VARA usa estructura de tarjetas/articulos con nombres de entidades
  const patterns = [
    // Encabezados h2-h4
    /<h[234][^>]*>\s*([^<]{3,80})\s*<\/h[234]>/gi,
    // Celdas de tabla
    /<td[^>]*>\s*([A-Za-z][^<]{3,79})\s*<\/td>/gi,
    // Anchor links con nombres de entidades (comun en registros paginados)
    /<a[^>]+class="[^"]*(?:entity|firm|company|name)[^"]*"[^>]*>\s*([^<]{3,80})\s*<\/a>/gi,
    // Parrafos con nombre de entidad seguido de tipo de licencia
    /(?:Entity|Company|Firm|VASP)[:\s]+([A-Za-z][^<\n]{3,60})/gi
  ];

  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(html)) !== null) {
      const raw = m[1]
        .replace(/&[a-z]+;/gi, ' ')
        .replace(/&#\d+;/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .trim();
      if (raw.length < 3 || raw.length > 80) continue;
      if (/^(home|vara|dubai|register|public|virtual|asset|regulatory|action|back|next|read|more|all|click|here|learn|about|page)$/i.test(raw)) continue;
      entries.push({ name: raw, normalizedName: normalizeName(raw), sourceLabel });
    }
  }

  const seen = new Set();
  return entries.filter((e) => {
    if (seen.has(e.normalizedName)) return false;
    seen.add(e.normalizedName);
    return true;
  });
}

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: { 'Accept': 'text/html', 'User-Agent': 'NSD-Compliance-Gateway/1.0 contact@nsd.mx' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });
  if (!res.ok) throw new Error(`VARA ${url} respondio ${res.status}`);
  return res.text();
}

async function fetchVaraLists() {
  const entries = [];
  const errors = [];

  for (const { url, label } of [
    { url: VARA_REGISTER_URL,    label: 'VARA_REGISTER' },
    { url: VARA_ENFORCEMENT_URL, label: 'VARA_ENFORCEMENT' }
  ]) {
    try {
      const html = await fetchPage(url);
      entries.push(...extractNamesFromHtml(html, label));
    } catch (err) {
      errors.push(`${label}: ${err.message}`);
    }
  }

  if (!entries.length) {
    throw new Error(errors.length ? errors.join('; ') : 'VARA: ninguna pagina devolvio registros parseables');
  }
  return entries;
}

function isStale() {
  return !state.loadedAt || (Date.now() - state.loadedAt) > REFRESH_INTERVAL_MS;
}

export function primeVaraList() {
  if (state.loading || (!isStale() && state.entries)) return state.loading;
  state.loading = fetchVaraLists()
    .then((entries) => { state.entries = entries; state.loadedAt = Date.now(); state.error = null; })
    .catch((err) => { state.error = err.message; })
    .finally(() => { state.loading = null; });
  return state.loading;
}

export function screenNameAgainstVara(name) {
  primeVaraList();
  const trimmed = String(name || '').trim();
  if (!trimmed) return { status: 'skipped', detail: 'Sin nombre para verificar contra VARA', matches: [], listEntries: null, listLoadedAt: null };
  if (!state.entries) {
    return {
      status: 'skipped',
      detail: state.error
        ? `VARA no disponible: ${state.error}`
        : 'Registros VARA aun se estan descargando',
      matches: [], listEntries: null, listLoadedAt: null
    };
  }

  const hits = matchName(trimmed, state.entries).filter((m) => m.score >= MATCH_THRESHOLD);

  const matches = hits.slice(0, 5).map((h) =>
    createEntityRecord({
      name: h.name,
      type: 'entity',
      program: h.sourceLabel || 'VARA_REGULATORY',
      authority: 'VARA (Virtual Assets Regulatory Authority, Dubai)',
      reason: h.sourceLabel === 'VARA_ENFORCEMENT'
        ? 'Enforcement Decision VARA'
        : 'Entidad en registro publico VARA',
      jurisdiction: 'UAE / Dubai',
      source: 'varaScreening',
      sourceUrl: h.sourceLabel === 'VARA_ENFORCEMENT' ? VARA_ENFORCEMENT_URL : VARA_REGISTER_URL,
      score: h.score,
      confidence: h.confidence
    })
  );

  return {
    status: hits.length ? 'hit' : 'clear',
    detail: hits.length
      ? `${hits.length} coincidencia(s) en registros VARA: ${hits.map((m) => `${m.name} (${m.score}%)`).join('; ')}. Requiere revision manual.`
      : `Sin coincidencias en registros VARA (${state.entries.length} registros, ${new Date(state.loadedAt).toISOString().slice(0, 10)})`,
    matches,
    listEntries: state.entries.length,
    listLoadedAt: new Date(state.loadedAt).toISOString()
  };
}

export function getVaraListStatus() {
  return { loaded: Boolean(state.entries), entries: state.entries?.length ?? null, loadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null, error: state.error };
}

export function _resetVaraStateForTests() {
  state.entries = null; state.loadedAt = null; state.loading = null; state.error = null;
}
