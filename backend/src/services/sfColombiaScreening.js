// Screening contra registros de la Superintendencia Financiera de Colombia (SFC).
// Verifica entidades supervisadas y sanciones publicadas en el portal de la SFC.
// Fuentes publicas:
//   - Entidades supervisadas: https://www.superfinanciera.gov.co/inicio/entidades-supervisadas
//   - Sanciones: https://www.superfinanciera.gov.co/inicio/sistema-de-reporte-sanciones-y-multas
// No requiere API key. Retorna 'skipped' si el HTML cambia de estructura.
const SFC_ENTITIES_URL = 'https://www.superfinanciera.gov.co/inicio/entidades-supervisadas';
const SFC_SANCIONES_URL = 'https://www.superfinanciera.gov.co/inicio/sistema-de-reporte-sanciones-y-multas';
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 20_000;
const MATCH_THRESHOLD = 78;

import { normalizeName, matchName } from './matchingEngine.js';
import { createEntityRecord } from './entityModel.js';

const state = { entries: null, loadedAt: null, loading: null, error: null };

function extractNamesFromHtml(html, sourceLabel) {
  const entries = [];
  if (!html) return entries;

  const patterns = [
    // Celdas de tabla — las sanciones de la SFC estan en tablas HTML
    /<td[^>]*>\s*([A-ZÁÉÍÓÚÑ][^<\n]{3,100})\s*<\/td>/g,
    // Encabezados de seccion
    /<h[234][^>]*>\s*([^<]{4,80})\s*<\/h[234]>/gi,
    // Items de lista con nombres de entidades
    /<li[^>]*>\s*<(?:a|span)[^>]*>\s*([A-ZÁÉÍÓÚÑ][^<]{4,80})\s*<\/(?:a|span)>/gi
  ];

  const stopWords = new Set([
    'inicio', 'home', 'superfinanciera', 'siguiente', 'anterior', 'buscar',
    'entidades supervisadas', 'sistema de reporte', 'sanciones', 'menu',
    'colombia', 'superintendencia', 'financiera'
  ]);

  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(html)) !== null) {
      const raw = m[1]
        .replace(/&[^;]+;/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .trim();
      if (raw.length < 4 || raw.length > 120) continue;
      if (stopWords.has(raw.toLowerCase())) continue;
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
    headers: {
      'Accept': 'text/html',
      'User-Agent': 'NSD-Compliance-Gateway/1.0 contact@nsd.mx',
      'Accept-Language': 'es-CO,es;q=0.9'
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });
  if (!res.ok) throw new Error(`SFC ${url} respondio ${res.status}`);
  return res.text();
}

async function fetchSfcLists() {
  const entries = [];
  const errors = [];

  for (const { url, label } of [
    { url: SFC_SANCIONES_URL, label: 'SFC_SANCION' },
    { url: SFC_ENTITIES_URL,  label: 'SFC_SUPERVISADA' }
  ]) {
    try {
      const html = await fetchPage(url);
      entries.push(...extractNamesFromHtml(html, label));
    } catch (err) {
      errors.push(`${label}: ${err.message}`);
    }
  }

  if (!entries.length) {
    throw new Error(
      errors.length
        ? `SFC Colombia no disponible: ${errors.join('; ')}`
        : 'SFC Colombia: ninguna pagina devolvio registros parseables'
    );
  }
  return entries;
}

function isStale() {
  return !state.loadedAt || (Date.now() - state.loadedAt) > REFRESH_INTERVAL_MS;
}

export function primeSfColombiaList() {
  if (state.loading || (!isStale() && state.entries)) return state.loading;
  state.loading = fetchSfcLists()
    .then((entries) => { state.entries = entries; state.loadedAt = Date.now(); state.error = null; })
    .catch((err) => { state.error = err.message; })
    .finally(() => { state.loading = null; });
  return state.loading;
}

export function screenNameAgainstSfColombia(name) {
  primeSfColombiaList();
  const trimmed = String(name || '').trim();
  if (!trimmed) return { status: 'skipped', detail: 'Sin nombre para verificar contra SFC Colombia', matches: [], listEntries: null, listLoadedAt: null };
  if (!state.entries) {
    return {
      status: 'skipped',
      detail: state.error
        ? `SFC Colombia no disponible: ${state.error}`
        : 'Registros SFC Colombia aun se estan descargando',
      matches: [], listEntries: null, listLoadedAt: null
    };
  }

  const hits = matchName(trimmed, state.entries).filter((m) => m.score >= MATCH_THRESHOLD);

  const matches = hits.slice(0, 5).map((h) =>
    createEntityRecord({
      name: h.name,
      type: 'entity',
      program: h.sourceLabel || 'SFC_REGULATORY',
      authority: 'SFC (Superintendencia Financiera de Colombia)',
      reason: h.sourceLabel === 'SFC_SANCION'
        ? 'Sancion SFC Colombia'
        : 'Entidad supervisada por SFC Colombia',
      jurisdiction: 'Colombia',
      source: 'sfColombiaScreening',
      sourceUrl: h.sourceLabel === 'SFC_SANCION' ? SFC_SANCIONES_URL : SFC_ENTITIES_URL,
      score: h.score,
      confidence: h.confidence
    })
  );

  return {
    status: hits.length ? 'hit' : 'clear',
    detail: hits.length
      ? `${hits.length} coincidencia(s) en registros SFC Colombia: ${hits.map((m) => `${m.name} (${m.score}%)`).join('; ')}. Requiere revision manual.`
      : `Sin coincidencias en registros SFC Colombia (${state.entries.length} registros, ${new Date(state.loadedAt).toISOString().slice(0, 10)})`,
    matches,
    listEntries: state.entries.length,
    listLoadedAt: new Date(state.loadedAt).toISOString()
  };
}

export function getSfColombiaListStatus() {
  return { loaded: Boolean(state.entries), entries: state.entries?.length ?? null, loadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null, error: state.error };
}

export function _resetSfColombiaStateForTests() {
  state.entries = null; state.loadedAt = null; state.loading = null; state.error = null;
}
