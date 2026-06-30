// Screening contra la BaFin (Bundesanstalt für Finanzdienstleistungsaufsicht),
// reguladora financiera de Alemania. Publica advertencias de empresas no autorizadas
// y acciones de enforcement.
// Warnings (EN): https://www.bafin.de/SiteGlobals/Forms/Suche/Warnliste_Formular_en.html
// Warnings list: https://www.bafin.de/EN/Verbraucher/Warnungen/warnungen_node.html
// No requiere API key. HTML scraping, cache 24h.
const BAFIN_WARNINGS_EN = 'https://www.bafin.de/EN/Verbraucher/Warnungen/warnungen_node.html';
const BAFIN_WARNINGS_DE = 'https://www.bafin.de/DE/Verbraucher/Warnungen/warnungen_node.html';
const BAFIN_ENFORCE_URL = 'https://www.bafin.de/EN/PublikationenDaten/oeffentlicheBekanntmachungen/oeffentliche_bekanntmachungen_node.html';
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS    = 18_000;
const MATCH_THRESHOLD     = 78;

import { normalizeName, matchName } from './matchingEngine.js';
import { createEntityRecord } from './entityModel.js';

const state = { entries: null, loadedAt: null, loading: null, error: null };

const BAFIN_STOP_WORDS = new Set([
  'bafin', 'bundesanstalt', 'finanzdienstleistungsaufsicht', 'bundesaufsicht',
  'germany', 'deutschland', 'warning', 'consumer', 'next', 'previous',
  'home', 'search', 'publication', 'page', 'result', 'filter',
  'weiter', 'zuruck', 'suche', 'ergebnis'
]);

function extractFromHtml(html, sourceLabel) {
  const entries = [];
  if (!html) return entries;

  const patterns = [
    // Advertencias de la BaFin suelen venir en formato "XYZ GmbH" en tablas
    /<td[^>]*>\s*([A-ZÁÄÖÜ][^<\n]{3,120})\s*<\/td>/g,
    // Titulos de advertencias
    /<h[1234][^>]*>\s*([^<]{4,160})\s*<\/h[1234]>/gi,
    // Items de lista con nombres de firmas no autorizadas
    /<li[^>]*>\s*([A-ZÁÄÖÜ][^<\n]{3,120})\s*<\/li>/gi,
    // Links con nombres de empresas sancionadas
    /<a[^>]*class="[^"]*RichText[^"]*"[^>]*>\s*([^<]{4,120})\s*<\/a>/gi
  ];

  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(html)) !== null) {
      const raw = m[1]
        .replace(/&[^;]+;/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (raw.length < 4 || raw.length > 160) continue;
      if (BAFIN_STOP_WORDS.has(raw.toLowerCase())) continue;
      if (/^\d/.test(raw)) continue;
      entries.push({ name: raw, normalizedName: normalizeName(raw), sourceLabel });
    }
  }

  const seen = new Set();
  return entries.filter((e) => { if (seen.has(e.normalizedName)) return false; seen.add(e.normalizedName); return true; });
}

async function fetchBafinLists() {
  const entries = [];
  const errors = [];

  for (const { url, label } of [
    { url: BAFIN_WARNINGS_EN, label: 'BAFIN_WARNING' },
    { url: BAFIN_WARNINGS_DE, label: 'BAFIN_WARNING' },
    { url: BAFIN_ENFORCE_URL, label: 'BAFIN_ENFORCEMENT' }
  ]) {
    try {
      const res = await fetch(url, {
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'NSD-Compliance-Gateway/1.0 contact@nsd.mx',
          'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8'
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
      });
      if (!res.ok) throw new Error(`BaFin ${label} respondio ${res.status}`);
      entries.push(...extractFromHtml(await res.text(), label));
    } catch (err) {
      errors.push(`${label}: ${err.message}`);
    }
  }

  if (!entries.length) throw new Error(errors.length ? `BaFin no disponible: ${errors.join('; ')}` : 'BaFin: sin registros parseables');
  return entries;
}

function isStale() {
  return !state.loadedAt || (Date.now() - state.loadedAt) > REFRESH_INTERVAL_MS;
}

export function primeBafinList() {
  if (state.loading || (!isStale() && state.entries)) return state.loading;
  state.loading = fetchBafinLists()
    .then((entries) => { state.entries = entries; state.loadedAt = Date.now(); state.error = null; })
    .catch((err) => { state.error = err.message; })
    .finally(() => { state.loading = null; });
  return state.loading;
}

export function screenNameAgainstBafin(name) {
  primeBafinList();
  const trimmed = String(name || '').trim();
  if (!trimmed) return { status: 'skipped', detail: 'Sin nombre para verificar contra BaFin Alemania', matches: [], listEntries: null, listLoadedAt: null };
  if (!state.entries) {
    return {
      status: 'skipped',
      detail: state.error ? `BaFin no disponible: ${state.error}` : 'Registros BaFin aun se estan descargando',
      matches: [], listEntries: null, listLoadedAt: null
    };
  }

  const hits = matchName(trimmed, state.entries).filter((m) => m.score >= MATCH_THRESHOLD);

  const matches = hits.slice(0, 5).map((h) =>
    createEntityRecord({
      name: h.name,
      type: 'entity',
      program: h.sourceLabel || 'BAFIN_REGULATORY',
      authority: 'BaFin (Bundesanstalt fur Finanzdienstleistungsaufsicht, Germany)',
      reason: h.sourceLabel === 'BAFIN_WARNING'
        ? 'Empresa en lista de advertencias de la BaFin — opera sin autorizacion en Alemania'
        : 'Empresa con accion de enforcement publicada por la BaFin',
      jurisdiction: 'Germany',
      source: 'bafinScreening',
      sourceUrl: h.sourceLabel === 'BAFIN_WARNING' ? BAFIN_WARNINGS_EN : BAFIN_ENFORCE_URL,
      score: h.score,
      confidence: h.confidence
    })
  );

  return {
    status: hits.length ? 'hit' : 'clear',
    detail: hits.length
      ? `${hits.length} coincidencia(s) en registros BaFin Alemania: ${hits.map((m) => `${m.name} (${m.score}%)`).join('; ')}. Requiere revision.`
      : `Sin coincidencias en registros BaFin Alemania (${state.entries.length} registros, ${new Date(state.loadedAt).toISOString().slice(0, 10)})`,
    matches,
    listEntries: state.entries.length,
    listLoadedAt: new Date(state.loadedAt).toISOString()
  };
}

export function getBafinListStatus() {
  return { loaded: Boolean(state.entries), entries: state.entries?.length ?? null, loadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null, error: state.error };
}

export function _resetBafinStateForTests() {
  state.entries = null; state.loadedAt = null; state.loading = null; state.error = null;
}
