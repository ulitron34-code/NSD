// Screening contra la FINMA (Eidgenössische Finanzmarktaufsicht / Swiss Financial Market
// Supervisory Authority). Regula bancos, aseguradoras y gestoras de fondos en Suiza.
// Enforcement actions: https://www.finma.ch/en/news/enforcement-actions/
// Unauthorized entities: https://www.finma.ch/en/finma-public/authorisations/warnings/
// No requiere API key. HTML scraping, cache 24h.
const FINMA_ENFORCEMENT_URL = 'https://www.finma.ch/en/news/enforcement-actions/';
const FINMA_WARNINGS_URL    = 'https://www.finma.ch/en/finma-public/authorisations/warnings/';
const REFRESH_INTERVAL_MS   = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS      = 18_000;
const MATCH_THRESHOLD       = 78;

import { normalizeName, matchName } from './matchingEngine.js';
import { createEntityRecord } from './entityModel.js';

const state = { entries: null, loadedAt: null, loading: null, error: null };

const FINMA_STOP_WORDS = new Set([
  'finma', 'swiss', 'switzerland', 'financial market', 'supervisory',
  'authority', 'enforcement', 'warning', 'action', 'next', 'previous',
  'home', 'search', 'news', 'publication', 'press release', 'page'
]);

function extractFromHtml(html, sourceLabel) {
  const entries = [];
  if (!html) return entries;

  const patterns = [
    // Titulos de enforcement actions — formato tipico FINMA: "Enforcement against XYZ SA"
    /<h[1234][^>]*>\s*([^<]{4,160})\s*<\/h[1234]>/gi,
    // Celdas de tabla con nombres de entidades sancionadas
    /<td[^>]*>\s*([A-Z][^<\n]{3,120})\s*<\/td>/g,
    // Items de lista
    /<li[^>]*>\s*([A-Z][^<\n]{3,120})\s*<\/li>/gi,
    // Links a enforcement actions con descripcion
    /<a[^>]*href="[^"]*enforcement[^"]*"[^>]*>\s*([^<]{4,120})\s*<\/a>/gi
  ];

  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(html)) !== null) {
      const raw = m[1].replace(/&[^;]+;/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (raw.length < 4 || raw.length > 160) continue;
      if (FINMA_STOP_WORDS.has(raw.toLowerCase())) continue;
      if (/^\d/.test(raw)) continue;
      if (/^(the|a |an |to |of |for |in |at |by )/i.test(raw)) continue;
      entries.push({ name: raw, normalizedName: normalizeName(raw), sourceLabel });
    }
  }

  const seen = new Set();
  return entries.filter((e) => { if (seen.has(e.normalizedName)) return false; seen.add(e.normalizedName); return true; });
}

async function fetchFinmaLists() {
  const entries = [];
  const errors = [];

  for (const { url, label } of [
    { url: FINMA_WARNINGS_URL,    label: 'FINMA_WARNING' },
    { url: FINMA_ENFORCEMENT_URL, label: 'FINMA_ENFORCEMENT' }
  ]) {
    try {
      const res = await fetch(url, {
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'NSD-Compliance-Gateway/1.0 contact@nsd.mx',
          'Accept-Language': 'en-CH,en;q=0.9'
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
      });
      if (!res.ok) throw new Error(`FINMA ${label} respondio ${res.status}`);
      entries.push(...extractFromHtml(await res.text(), label));
    } catch (err) {
      errors.push(`${label}: ${err.message}`);
    }
  }

  if (!entries.length) throw new Error(errors.length ? `FINMA no disponible: ${errors.join('; ')}` : 'FINMA: sin registros parseables');
  return entries;
}

function isStale() {
  return !state.loadedAt || (Date.now() - state.loadedAt) > REFRESH_INTERVAL_MS;
}

export function primeFinmaList() {
  if (state.loading || (!isStale() && state.entries)) return state.loading;
  state.loading = fetchFinmaLists()
    .then((entries) => { state.entries = entries; state.loadedAt = Date.now(); state.error = null; })
    .catch((err) => { state.error = err.message; })
    .finally(() => { state.loading = null; });
  return state.loading;
}

export function screenNameAgainstFinma(name) {
  primeFinmaList();
  const trimmed = String(name || '').trim();
  if (!trimmed) return { status: 'skipped', detail: 'Sin nombre para verificar contra FINMA Suiza', matches: [], listEntries: null, listLoadedAt: null };
  if (!state.entries) {
    return {
      status: 'skipped',
      detail: state.error ? `FINMA no disponible: ${state.error}` : 'Registros FINMA aun se estan descargando',
      matches: [], listEntries: null, listLoadedAt: null
    };
  }

  const hits = matchName(trimmed, state.entries).filter((m) => m.score >= MATCH_THRESHOLD);

  const matches = hits.slice(0, 5).map((h) =>
    createEntityRecord({
      name: h.name,
      type: 'entity',
      program: h.sourceLabel || 'FINMA_REGULATORY',
      authority: 'FINMA (Swiss Financial Market Supervisory Authority)',
      reason: h.sourceLabel === 'FINMA_WARNING'
        ? 'Empresa en lista de advertencias de la FINMA — sin autorizacion para operar en Suiza'
        : 'Empresa sujeta a accion de enforcement de la FINMA',
      jurisdiction: 'Switzerland',
      source: 'finmaScreening',
      sourceUrl: h.sourceLabel === 'FINMA_WARNING' ? FINMA_WARNINGS_URL : FINMA_ENFORCEMENT_URL,
      score: h.score,
      confidence: h.confidence
    })
  );

  return {
    status: hits.length ? 'hit' : 'clear',
    detail: hits.length
      ? `${hits.length} coincidencia(s) en registros FINMA Suiza: ${hits.map((m) => `${m.name} (${m.score}%)`).join('; ')}. Requiere revision.`
      : `Sin coincidencias en registros FINMA Suiza (${state.entries.length} registros, ${new Date(state.loadedAt).toISOString().slice(0, 10)})`,
    matches,
    listEntries: state.entries.length,
    listLoadedAt: new Date(state.loadedAt).toISOString()
  };
}

export function getFinmaListStatus() {
  return { loaded: Boolean(state.entries), entries: state.entries?.length ?? null, loadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null, error: state.error };
}

export function _resetFinmaStateForTests() {
  state.entries = null; state.loadedAt = null; state.loading = null; state.error = null;
}
