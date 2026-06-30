// Screening contra la Investor Alert List de la MAS (Monetary Authority of Singapore).
// La MAS publica una lista de empresas no autorizadas o bajo investigacion activa.
// URL Alerts: https://www.mas.gov.sg/regulation/enforcement/investor-alerts-list
// URL Acciones: https://www.mas.gov.sg/regulation/enforcement
// No requiere API key. HTML scraping, cache 24h.
const MAS_ALERTS_URL   = 'https://www.mas.gov.sg/regulation/enforcement/investor-alerts-list';
const MAS_ACTIONS_URL  = 'https://www.mas.gov.sg/regulation/enforcement';
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 18_000;
const MATCH_THRESHOLD = 78;

import { normalizeName, matchName } from './matchingEngine.js';
import { createEntityRecord } from './entityModel.js';

const state = { entries: null, loadedAt: null, loading: null, error: null };

const MAS_STOP_WORDS = new Set([
  'monetary authority', 'singapore', 'mas', 'investor alert', 'warning',
  'next', 'previous', 'search', 'filter', 'result', 'page', 'home'
]);

function extractNamesFromHtml(html, sourceLabel) {
  const entries = [];
  if (!html) return entries;

  const patterns = [
    // Listas desordenadas con firmas (formato tipico de MAS alerts)
    /<li[^>]*>\s*<a[^>]*>\s*([^<]{4,120})\s*<\/a>/gi,
    // Celdas de tabla con nombres de empresas (mayusculas iniciales)
    /<td[^>]*>\s*([A-Z][^<\n]{3,100})\s*<\/td>/g,
    // Titulos de enforcement actions
    /<h[234][^>]*>\s*([^<]{4,100})\s*<\/h[234]>/gi,
    // Spans con nombres de firmas
    /<span[^>]*class="[^"]*(?:entity|firm|name|company)[^"]*"[^>]*>\s*([^<]{4,100})\s*<\/span>/gi
  ];

  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(html)) !== null) {
      const raw = m[1].replace(/&[^;]+;/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (raw.length < 4 || raw.length > 130) continue;
      if (MAS_STOP_WORDS.has(raw.toLowerCase())) continue;
      if (/^\d+$/.test(raw)) continue;
      entries.push({ name: raw, normalizedName: normalizeName(raw), sourceLabel });
    }
  }

  const seen = new Set();
  return entries.filter((e) => { if (seen.has(e.normalizedName)) return false; seen.add(e.normalizedName); return true; });
}

async function fetchMasLists() {
  const entries = [];
  const errors = [];

  for (const { url, label } of [
    { url: MAS_ALERTS_URL,  label: 'MAS_ALERT' },
    { url: MAS_ACTIONS_URL, label: 'MAS_ENFORCEMENT' }
  ]) {
    try {
      const res = await fetch(url, {
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'NSD-Compliance-Gateway/1.0 contact@nsd.mx',
          'Accept-Language': 'en-SG,en;q=0.9'
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
      });
      if (!res.ok) throw new Error(`MAS ${label} respondio ${res.status}`);
      const html = await res.text();
      entries.push(...extractNamesFromHtml(html, label));
    } catch (err) {
      errors.push(`${label}: ${err.message}`);
    }
  }

  if (!entries.length) {
    throw new Error(errors.length ? `MAS Singapore no disponible: ${errors.join('; ')}` : 'MAS: sin registros parseables');
  }
  return entries;
}

function isStale() {
  return !state.loadedAt || (Date.now() - state.loadedAt) > REFRESH_INTERVAL_MS;
}

export function primeMasList() {
  if (state.loading || (!isStale() && state.entries)) return state.loading;
  state.loading = fetchMasLists()
    .then((entries) => { state.entries = entries; state.loadedAt = Date.now(); state.error = null; })
    .catch((err) => { state.error = err.message; })
    .finally(() => { state.loading = null; });
  return state.loading;
}

export function screenNameAgainstMas(name) {
  primeMasList();
  const trimmed = String(name || '').trim();
  if (!trimmed) return { status: 'skipped', detail: 'Sin nombre para verificar contra MAS Singapore', matches: [], listEntries: null, listLoadedAt: null };
  if (!state.entries) {
    return {
      status: 'skipped',
      detail: state.error
        ? `MAS Singapore no disponible: ${state.error}`
        : 'Registros MAS aun se estan descargando',
      matches: [], listEntries: null, listLoadedAt: null
    };
  }

  const hits = matchName(trimmed, state.entries).filter((m) => m.score >= MATCH_THRESHOLD);

  const matches = hits.slice(0, 5).map((h) =>
    createEntityRecord({
      name: h.name,
      type: 'entity',
      program: h.sourceLabel || 'MAS_REGULATORY',
      authority: 'MAS (Monetary Authority of Singapore)',
      reason: h.sourceLabel === 'MAS_ALERT'
        ? 'Empresa en lista de alertas de inversores de la MAS — no autorizada o bajo investigacion'
        : 'Empresa con accion de enforcement de la MAS',
      jurisdiction: 'Singapore',
      source: 'masScreening',
      sourceUrl: h.sourceLabel === 'MAS_ALERT' ? MAS_ALERTS_URL : MAS_ACTIONS_URL,
      score: h.score,
      confidence: h.confidence
    })
  );

  return {
    status: hits.length ? 'hit' : 'clear',
    detail: hits.length
      ? `${hits.length} coincidencia(s) en registros MAS Singapore: ${hits.map((m) => `${m.name} (${m.score}%)`).join('; ')}. Requiere revision.`
      : `Sin coincidencias en registros MAS Singapore (${state.entries.length} registros, ${new Date(state.loadedAt).toISOString().slice(0, 10)})`,
    matches,
    listEntries: state.entries.length,
    listLoadedAt: new Date(state.loadedAt).toISOString()
  };
}

export function getMasListStatus() {
  return { loaded: Boolean(state.entries), entries: state.entries?.length ?? null, loadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null, error: state.error };
}

export function _resetMasStateForTests() {
  state.entries = null; state.loadedAt = null; state.loading = null; state.error = null;
}
