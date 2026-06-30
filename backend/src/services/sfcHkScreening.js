// Screening contra la SFC (Securities and Futures Commission) de Hong Kong.
// La SFC publica un registro de intermediarios autorizados, acciones disciplinarias
// y una lista de empresas no autorizadas bajo investigacion.
// Regulatory actions: https://www.sfc.hk/en/News-and-announcements/Enforcement-news/Regulatory-actions
// Non-authorized firms: https://www.sfc.hk/en/Alert-list-of-unlicensed-persons
// No requiere API key. HTML scraping, cache 24h.
const SFC_ALERTS_URL  = 'https://www.sfc.hk/en/Alert-list-of-unlicensed-persons';
const SFC_ACTIONS_URL = 'https://www.sfc.hk/en/News-and-announcements/Enforcement-news/Regulatory-actions';
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 18_000;
const MATCH_THRESHOLD = 78;

import { normalizeName, matchName } from './matchingEngine.js';
import { createEntityRecord } from './entityModel.js';

const state = { entries: null, loadedAt: null, loading: null, error: null };

const SFC_STOP_WORDS = new Set([
  'sfc', 'securities', 'futures', 'commission', 'hong kong', 'enforcement',
  'regulatory', 'alert', 'list', 'next', 'previous', 'search', 'home',
  'news', 'announcements', 'warning', 'page'
]);

function extractNamesFromHtml(html, sourceLabel) {
  const entries = [];
  if (!html) return entries;

  const patterns = [
    // Tabla de entidades no autorizadas
    /<td[^>]*>\s*([A-Z][A-Za-z0-9\s&\-\.'()]{3,100})\s*<\/td>/g,
    // Titulos de acciones disciplinarias (suelen ser "Fined: Company Name")
    /<h[234][^>]*>\s*([^<]{4,120})\s*<\/h[234]>/gi,
    // Links con nombres de entidades
    /<a[^>]*href="[^"]*(?:enforcement|action|discipline)[^"]*"[^>]*>\s*([^<]{4,120})\s*<\/a>/gi,
    // Spans con nombres de firmas
    /<li[^>]*>\s*([A-Z][^<\n]{3,100})\s*(?:<\/li>|<br>)/gi
  ];

  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(html)) !== null) {
      const raw = m[1].replace(/&[^;]+;/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (raw.length < 4 || raw.length > 130) continue;
      if (SFC_STOP_WORDS.has(raw.toLowerCase())) continue;
      if (/^\d+$/.test(raw)) continue;
      entries.push({ name: raw, normalizedName: normalizeName(raw), sourceLabel });
    }
  }

  const seen = new Set();
  return entries.filter((e) => { if (seen.has(e.normalizedName)) return false; seen.add(e.normalizedName); return true; });
}

async function fetchSfcHkLists() {
  const entries = [];
  const errors = [];

  for (const { url, label } of [
    { url: SFC_ALERTS_URL,  label: 'SFC_HK_ALERT' },
    { url: SFC_ACTIONS_URL, label: 'SFC_HK_ACTION' }
  ]) {
    try {
      const res = await fetch(url, {
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'NSD-Compliance-Gateway/1.0 contact@nsd.mx',
          'Accept-Language': 'en-HK,en;q=0.9'
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
      });
      if (!res.ok) throw new Error(`SFC HK ${label} respondio ${res.status}`);
      const html = await res.text();
      entries.push(...extractNamesFromHtml(html, label));
    } catch (err) {
      errors.push(`${label}: ${err.message}`);
    }
  }

  if (!entries.length) {
    throw new Error(errors.length ? `SFC Hong Kong no disponible: ${errors.join('; ')}` : 'SFC HK: sin registros parseables');
  }
  return entries;
}

function isStale() {
  return !state.loadedAt || (Date.now() - state.loadedAt) > REFRESH_INTERVAL_MS;
}

export function primeSfcHkList() {
  if (state.loading || (!isStale() && state.entries)) return state.loading;
  state.loading = fetchSfcHkLists()
    .then((entries) => { state.entries = entries; state.loadedAt = Date.now(); state.error = null; })
    .catch((err) => { state.error = err.message; })
    .finally(() => { state.loading = null; });
  return state.loading;
}

export function screenNameAgainstSfcHk(name) {
  primeSfcHkList();
  const trimmed = String(name || '').trim();
  if (!trimmed) return { status: 'skipped', detail: 'Sin nombre para verificar contra SFC Hong Kong', matches: [], listEntries: null, listLoadedAt: null };
  if (!state.entries) {
    return {
      status: 'skipped',
      detail: state.error
        ? `SFC Hong Kong no disponible: ${state.error}`
        : 'Registros SFC HK aun se estan descargando',
      matches: [], listEntries: null, listLoadedAt: null
    };
  }

  const hits = matchName(trimmed, state.entries).filter((m) => m.score >= MATCH_THRESHOLD);

  const matches = hits.slice(0, 5).map((h) =>
    createEntityRecord({
      name: h.name,
      type: 'entity',
      program: h.sourceLabel || 'SFC_HK_REGULATORY',
      authority: 'SFC (Securities and Futures Commission, Hong Kong)',
      reason: h.sourceLabel === 'SFC_HK_ALERT'
        ? 'Empresa en lista de alerta de la SFC Hong Kong — no autorizada o bajo investigacion'
        : 'Empresa con accion regulatoria de la SFC Hong Kong',
      jurisdiction: 'Hong Kong',
      source: 'sfcHkScreening',
      sourceUrl: h.sourceLabel === 'SFC_HK_ALERT' ? SFC_ALERTS_URL : SFC_ACTIONS_URL,
      score: h.score,
      confidence: h.confidence
    })
  );

  return {
    status: hits.length ? 'hit' : 'clear',
    detail: hits.length
      ? `${hits.length} coincidencia(s) en registros SFC Hong Kong: ${hits.map((m) => `${m.name} (${m.score}%)`).join('; ')}. Requiere revision.`
      : `Sin coincidencias en registros SFC Hong Kong (${state.entries.length} registros, ${new Date(state.loadedAt).toISOString().slice(0, 10)})`,
    matches,
    listEntries: state.entries.length,
    listLoadedAt: new Date(state.loadedAt).toISOString()
  };
}

export function getSfcHkListStatus() {
  return { loaded: Boolean(state.entries), entries: state.entries?.length ?? null, loadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null, error: state.error };
}

export function _resetSfcHkStateForTests() {
  state.entries = null; state.loadedAt = null; state.loading = null; state.error = null;
}
