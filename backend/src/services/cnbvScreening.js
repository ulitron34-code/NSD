// Screening contra el Padron de Entidades Supervisadas de la CNBV
// (Comision Nacional Bancaria y de Valores) — regulador financiero de Mexico.
// Fuentes publicas:
//   - Padron: https://portafolioinfo.cnbv.gob.mx/Paginas/Inicio.aspx
//   - Sanciones admin: https://www.cnbv.gob.mx/CNBV/Paginas/Sanciones.aspx
// La CNBV no tiene API publica documentada; se descarga y parsea HTML.
// Retorna 'skipped' si las paginas cambian de estructura — nunca un falso 'clear'.
const CNBV_SANCIONES_URL = 'https://www.cnbv.gob.mx/CNBV/Paginas/Sanciones.aspx';
const CNBV_PORTAFOLIO_URL = 'https://portafolioinfo.cnbv.gob.mx/Paginas/Inicio.aspx';
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 20_000;
const MATCH_THRESHOLD = 78;

import { normalizeName, matchName } from './matchingEngine.js';
import { createEntityRecord } from './entityModel.js';

const state = { entries: null, loadedAt: null, loading: null, error: null };

// Extrae nombres de entidades/personas de paginas HTML de la CNBV.
// Los patrones cubren la estructura tipica de portales .gob.mx (SharePoint/ASP.NET).
function extractNamesFromHtml(html, sourceLabel) {
  const entries = [];
  if (!html) return entries;

  const patterns = [
    // Celdas de tabla (sanciones tipicamente estan en tablas)
    /<td[^>]*>\s*([A-ZÁÉÍÓÚÑa-záéíóúñ][^<\n]{3,100})\s*<\/td>/g,
    // Encabezados de articulos
    /<h[23][^>]*>\s*([^<]{4,100})\s*<\/h[23]>/gi,
    // Links con nombre de entidad (padron)
    /<a[^>]+>\s*([A-ZÁÉÍÓÚÑ][^<]{4,80}(?:S\.A\.|S\.A\. DE C\.V\.|SOFOM|BANCO|CASA DE BOLSA|ASEGURADORA|AFIANZADORA)[^<]{0,40})\s*<\/a>/gi
  ];

  const stopWords = new Set(['inicio', 'home', 'cnbv', 'siguiente', 'anterior', 'pagina', 'buscar', 'busqueda', 'sector', 'informacion', 'menu', 'inicio de sesion']);

  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(html)) !== null) {
      const raw = m[1]
        .replace(/&[a-záéíóúñ]+;/gi, ' ')
        .replace(/&#\d+;/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .trim();
      if (raw.length < 4 || raw.length > 120) continue;
      const lower = raw.toLowerCase();
      if (stopWords.has(lower)) continue;
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
      'Accept-Language': 'es-MX,es;q=0.9'
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });
  if (!res.ok) throw new Error(`CNBV ${url} respondio ${res.status}`);
  return res.text();
}

async function fetchCnbvLists() {
  const entries = [];
  const errors = [];

  for (const { url, label } of [
    { url: CNBV_SANCIONES_URL,   label: 'CNBV_SANCION' },
    { url: CNBV_PORTAFOLIO_URL,  label: 'CNBV_PADRON' }
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
        ? `CNBV no disponible: ${errors.join('; ')}`
        : 'CNBV: ninguna pagina devolvio registros parseables — la estructura puede haber cambiado'
    );
  }
  return entries;
}

function isStale() {
  return !state.loadedAt || (Date.now() - state.loadedAt) > REFRESH_INTERVAL_MS;
}

export function primeCnbvList() {
  if (state.loading || (!isStale() && state.entries)) return state.loading;
  state.loading = fetchCnbvLists()
    .then((entries) => { state.entries = entries; state.loadedAt = Date.now(); state.error = null; })
    .catch((err) => { state.error = err.message; })
    .finally(() => { state.loading = null; });
  return state.loading;
}

export function screenNameAgainstCnbv(name) {
  primeCnbvList();
  const trimmed = String(name || '').trim();
  if (!trimmed) return { status: 'skipped', detail: 'Sin nombre para verificar contra CNBV', matches: [], listEntries: null, listLoadedAt: null };
  if (!state.entries) {
    return {
      status: 'skipped',
      detail: state.error
        ? `CNBV no disponible: ${state.error}`
        : 'Registros CNBV aun se estan descargando',
      matches: [], listEntries: null, listLoadedAt: null
    };
  }

  const hits = matchName(trimmed, state.entries).filter((m) => m.score >= MATCH_THRESHOLD);

  const matches = hits.slice(0, 5).map((h) =>
    createEntityRecord({
      name: h.name,
      type: 'entity',
      program: h.sourceLabel || 'CNBV_REGULATORY',
      authority: 'CNBV (Comision Nacional Bancaria y de Valores, Mexico)',
      reason: h.sourceLabel === 'CNBV_SANCION'
        ? 'Sancion administrativa CNBV'
        : 'Entidad supervisada CNBV — verificar estado de licencia',
      jurisdiction: 'Mexico',
      source: 'cnbvScreening',
      sourceUrl: h.sourceLabel === 'CNBV_SANCION' ? CNBV_SANCIONES_URL : CNBV_PORTAFOLIO_URL,
      score: h.score,
      confidence: h.confidence
    })
  );

  return {
    status: hits.length ? 'hit' : 'clear',
    detail: hits.length
      ? `${hits.length} coincidencia(s) en registros CNBV: ${hits.map((m) => `${m.name} (${m.score}%)`).join('; ')}. Verificar estado de licencia y sanciones. Requiere revision manual.`
      : `Sin coincidencias en registros CNBV (${state.entries.length} registros, ${new Date(state.loadedAt).toISOString().slice(0, 10)})`,
    matches,
    listEntries: state.entries.length,
    listLoadedAt: new Date(state.loadedAt).toISOString()
  };
}

export function getCnbvListStatus() {
  return { loaded: Boolean(state.entries), entries: state.entries?.length ?? null, loadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null, error: state.error };
}

export function _resetCnbvStateForTests() {
  state.entries = null; state.loadedAt = null; state.loading = null; state.error = null;
}
