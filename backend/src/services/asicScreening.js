// Screening contra registros de la ASIC (Australian Securities and Investments Commission).
// La ASIC publica banning orders, enforcment actions y una lista de empresas bajo alerta.
// Banning orders: https://asic.gov.au/regulatory-resources/find-a-document/banning-orders/
// Infringement orders: https://asic.gov.au/regulatory-resources/find-a-document/infringement-orders/
// Alert list: https://asic.gov.au/check-and-report/companies-and-people-to-avoid/
// No requiere API key. HTML scraping, cache 24h.
const ASIC_BANNING_URL     = 'https://asic.gov.au/regulatory-resources/find-a-document/banning-orders/';
const ASIC_ALERT_URL       = 'https://asic.gov.au/check-and-report/companies-and-people-to-avoid/';
const ASIC_ENFORCEMENT_URL = 'https://asic.gov.au/about-asic/news-centre/enforcement-news/';
const REFRESH_INTERVAL_MS  = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS     = 18_000;
const MATCH_THRESHOLD      = 78;

import { normalizeName, matchName } from './matchingEngine.js';
import { createEntityRecord } from './entityModel.js';

const state = { entries: null, loadedAt: null, loading: null, error: null };

const ASIC_STOP_WORDS = new Set([
  'asic', 'australian', 'securities', 'investments', 'commission',
  'banning', 'order', 'enforcement', 'news', 'search', 'home',
  'next', 'previous', 'page', 'result', 'filter', 'warning'
]);

function extractNamesFromHtml(html, sourceLabel) {
  const entries = [];
  if (!html) return entries;

  const patterns = [
    // Titulos de banning orders (suelen ser "Mr John Smith banned from...")
    /<h[1234][^>]*>\s*([^<]{4,160})\s*<\/h[1234]>/gi,
    // Celdas de tabla con nombres de personas/empresas baneadas
    /<td[^>]*>\s*([A-Z][^<\n]{3,100})\s*<\/td>/g,
    // Items de lista con banning details
    /<li[^>]*>\s*<strong[^>]*>\s*([^<]{4,100})\s*<\/strong>/gi,
    // Links a enforcement actions con nombre en texto
    /<a[^>]*href="[^"]*(?:banning|infringement|enforcement)[^"]*"[^>]*>\s*([^<]{4,100})\s*<\/a>/gi
  ];

  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(html)) !== null) {
      const raw = m[1].replace(/&[^;]+;/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (raw.length < 4 || raw.length > 160) continue;
      if (ASIC_STOP_WORDS.has(raw.toLowerCase())) continue;
      if (/^\d+$/.test(raw)) continue;
      // Filtrar frases de navegación o boilerplate
      if (/^(?:click here|read more|learn more|see all|view all)/i.test(raw)) continue;
      entries.push({ name: raw, normalizedName: normalizeName(raw), sourceLabel });
    }
  }

  const seen = new Set();
  return entries.filter((e) => { if (seen.has(e.normalizedName)) return false; seen.add(e.normalizedName); return true; });
}

async function fetchAsicLists() {
  const entries = [];
  const errors = [];

  for (const { url, label } of [
    { url: ASIC_BANNING_URL,     label: 'ASIC_BANNING' },
    { url: ASIC_ALERT_URL,       label: 'ASIC_ALERT' },
    { url: ASIC_ENFORCEMENT_URL, label: 'ASIC_ENFORCEMENT' }
  ]) {
    try {
      const res = await fetch(url, {
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'NSD-Compliance-Gateway/1.0 contact@nsd.mx',
          'Accept-Language': 'en-AU,en;q=0.9'
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
      });
      if (!res.ok) throw new Error(`ASIC ${label} respondio ${res.status}`);
      const html = await res.text();
      entries.push(...extractNamesFromHtml(html, label));
    } catch (err) {
      errors.push(`${label}: ${err.message}`);
    }
  }

  if (!entries.length) {
    throw new Error(errors.length ? `ASIC Australia no disponible: ${errors.join('; ')}` : 'ASIC: sin registros parseables');
  }
  return entries;
}

function isStale() {
  return !state.loadedAt || (Date.now() - state.loadedAt) > REFRESH_INTERVAL_MS;
}

export function primeAsicList() {
  if (state.loading || (!isStale() && state.entries)) return state.loading;
  state.loading = fetchAsicLists()
    .then((entries) => { state.entries = entries; state.loadedAt = Date.now(); state.error = null; })
    .catch((err) => { state.error = err.message; })
    .finally(() => { state.loading = null; });
  return state.loading;
}

export function screenNameAgainstAsic(name) {
  primeAsicList();
  const trimmed = String(name || '').trim();
  if (!trimmed) return { status: 'skipped', detail: 'Sin nombre para verificar contra ASIC Australia', matches: [], listEntries: null, listLoadedAt: null };
  if (!state.entries) {
    return {
      status: 'skipped',
      detail: state.error
        ? `ASIC Australia no disponible: ${state.error}`
        : 'Registros ASIC aun se estan descargando',
      matches: [], listEntries: null, listLoadedAt: null
    };
  }

  const hits = matchName(trimmed, state.entries).filter((m) => m.score >= MATCH_THRESHOLD);

  const reasonMap = {
    ASIC_BANNING:     'Orden de inhabilitacion (banning order) emitida por la ASIC Australia',
    ASIC_ALERT:       'Empresa en lista de alerta de la ASIC — no autorizada o fraudulenta',
    ASIC_ENFORCEMENT: 'Sujeto de accion de enforcement de la ASIC Australia'
  };

  const urlMap = {
    ASIC_BANNING:     ASIC_BANNING_URL,
    ASIC_ALERT:       ASIC_ALERT_URL,
    ASIC_ENFORCEMENT: ASIC_ENFORCEMENT_URL
  };

  const matches = hits.slice(0, 5).map((h) =>
    createEntityRecord({
      name: h.name,
      type: 'entity',
      program: h.sourceLabel || 'ASIC_REGULATORY',
      authority: 'ASIC (Australian Securities and Investments Commission)',
      reason: reasonMap[h.sourceLabel] || 'Registro en ASIC Australia',
      jurisdiction: 'Australia',
      source: 'asicScreening',
      sourceUrl: urlMap[h.sourceLabel] || ASIC_BANNING_URL,
      score: h.score,
      confidence: h.confidence
    })
  );

  return {
    status: hits.length ? 'hit' : 'clear',
    detail: hits.length
      ? `${hits.length} coincidencia(s) en registros ASIC Australia: ${hits.map((m) => `${m.name} (${m.score}%)`).join('; ')}. Requiere revision.`
      : `Sin coincidencias en registros ASIC Australia (${state.entries.length} registros, ${new Date(state.loadedAt).toISOString().slice(0, 10)})`,
    matches,
    listEntries: state.entries.length,
    listLoadedAt: new Date(state.loadedAt).toISOString()
  };
}

export function getAsicListStatus() {
  return { loaded: Boolean(state.entries), entries: state.entries?.length ?? null, loadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null, error: state.error };
}

export function _resetAsicStateForTests() {
  state.entries = null; state.loadedAt = null; state.loading = null; state.error = null;
}
