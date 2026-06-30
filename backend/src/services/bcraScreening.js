// Screening contra el BCRA (Banco Central de la República Argentina).
// El BCRA mantiene un registro de entidades financieras autorizadas y canceladas.
// La cancelacion de una entidad es una señal de riesgo.
// Entidades activas: https://www.bcra.gob.ar/SistemasFinancierosYdePagos/entidades_financieras.asp
// Entidades canceladas: https://www.bcra.gob.ar/SistemasFinancierosYdePagos/EntidadesFinancieras_Canceladas.asp
// Entidades inhabilitadas: https://www.bcra.gob.ar/SistemasFinancierosYdePagos/Inhabilitaciones.asp
// No requiere API key. HTML scraping, cache 24h.
const BCRA_CANCELED_URL     = 'https://www.bcra.gob.ar/SistemasFinancierosYdePagos/EntidadesFinancieras_Canceladas.asp';
const BCRA_PROHIBITED_URL   = 'https://www.bcra.gob.ar/SistemasFinancierosYdePagos/Inhabilitaciones.asp';
const BCRA_ENTITIES_URL     = 'https://www.bcra.gob.ar/SistemasFinancierosYdePagos/entidades_financieras.asp';
const REFRESH_INTERVAL_MS   = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS      = 18_000;
const MATCH_THRESHOLD       = 78;

import { normalizeName, matchName } from './matchingEngine.js';
import { createEntityRecord } from './entityModel.js';

const state = { entries: null, loadedAt: null, loading: null, error: null };

const BCRA_STOP_WORDS = new Set([
  'bcra', 'banco central', 'argentina', 'republica argentina',
  'siguiente', 'anterior', 'buscar', 'inicio', 'volver',
  'entidad', 'tipo', 'nombre', 'estado', 'domicilio',
  'home', 'search', 'page', 'result'
]);

function extractFromHtml(html, sourceLabel) {
  const entries = [];
  if (!html) return entries;

  const patterns = [
    // Tablas BCRA — celdas con nombres de entidades financieras
    /<td[^>]*>\s*([A-ZÁÉÍÓÚÑ][^<\n]{3,120})\s*<\/td>/g,
    // Links con nombres de entidades dentro de tablas
    /<a[^>]*href="[^"]*(?:entidad|banco|financiera)[^"]*"[^>]*>\s*([^<]{4,120})\s*<\/a>/gi,
    // Listas de entidades inhabilitadas
    /<li[^>]*>\s*([A-ZÁÉÍÓÚÑ][^<\n]{3,120})\s*<\/li>/gi
  ];

  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(html)) !== null) {
      const raw = m[1].replace(/&[^;]+;/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (raw.length < 4 || raw.length > 130) continue;
      if (BCRA_STOP_WORDS.has(raw.toLowerCase())) continue;
      if (/^\d/.test(raw)) continue;
      entries.push({ name: raw, normalizedName: normalizeName(raw), sourceLabel });
    }
  }

  const seen = new Set();
  return entries.filter((e) => { if (seen.has(e.normalizedName)) return false; seen.add(e.normalizedName); return true; });
}

async function fetchBcraLists() {
  const entries = [];
  const errors = [];

  // Prioridad: canceladas e inhabilitadas son las de mayor riesgo
  for (const { url, label } of [
    { url: BCRA_CANCELED_URL,   label: 'BCRA_CANCELADA' },
    { url: BCRA_PROHIBITED_URL, label: 'BCRA_INHABILITADA' },
    { url: BCRA_ENTITIES_URL,   label: 'BCRA_ENTIDAD' }
  ]) {
    try {
      const res = await fetch(url, {
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'NSD-Compliance-Gateway/1.0 contact@nsd.mx',
          'Accept-Language': 'es-AR,es;q=0.9'
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
      });
      if (!res.ok) throw new Error(`BCRA ${label} respondio ${res.status}`);
      entries.push(...extractFromHtml(await res.text(), label));
    } catch (err) {
      errors.push(`${label}: ${err.message}`);
    }
  }

  if (!entries.length) throw new Error(errors.length ? `BCRA no disponible: ${errors.join('; ')}` : 'BCRA: sin registros parseables');
  return entries;
}

function isStale() {
  return !state.loadedAt || (Date.now() - state.loadedAt) > REFRESH_INTERVAL_MS;
}

export function primeBcraList() {
  if (state.loading || (!isStale() && state.entries)) return state.loading;
  state.loading = fetchBcraLists()
    .then((entries) => { state.entries = entries; state.loadedAt = Date.now(); state.error = null; })
    .catch((err) => { state.error = err.message; })
    .finally(() => { state.loading = null; });
  return state.loading;
}

export function screenNameAgainstBcra(name) {
  primeBcraList();
  const trimmed = String(name || '').trim();
  if (!trimmed) return { status: 'skipped', detail: 'Sin nombre para verificar contra BCRA Argentina', matches: [], listEntries: null, listLoadedAt: null };
  if (!state.entries) {
    return {
      status: 'skipped',
      detail: state.error ? `BCRA no disponible: ${state.error}` : 'Registros BCRA aun se estan descargando',
      matches: [], listEntries: null, listLoadedAt: null
    };
  }

  const hits = matchName(trimmed, state.entries).filter((m) => m.score >= MATCH_THRESHOLD);

  const reasonMap = {
    BCRA_CANCELADA:    'Entidad financiera con autorizacion CANCELADA por BCRA Argentina',
    BCRA_INHABILITADA: 'Persona/entidad INHABILITADA por el BCRA Argentina para operar en sistema financiero',
    BCRA_ENTIDAD:      'Entidad registrada en el sistema financiero argentino (BCRA)'
  };

  const urlMap = {
    BCRA_CANCELADA:    BCRA_CANCELED_URL,
    BCRA_INHABILITADA: BCRA_PROHIBITED_URL,
    BCRA_ENTIDAD:      BCRA_ENTITIES_URL
  };

  const matches = hits.slice(0, 5).map((h) =>
    createEntityRecord({
      name: h.name,
      type: 'entity',
      program: h.sourceLabel || 'BCRA_REGULATORY',
      authority: 'BCRA (Banco Central de la Republica Argentina)',
      reason: reasonMap[h.sourceLabel] || 'Registro en BCRA Argentina',
      status: h.sourceLabel === 'BCRA_CANCELADA' || h.sourceLabel === 'BCRA_INHABILITADA' ? 'removed' : 'active',
      jurisdiction: 'Argentina',
      source: 'bcraScreening',
      sourceUrl: urlMap[h.sourceLabel] || BCRA_CANCELED_URL,
      score: h.score,
      confidence: h.confidence
    })
  );

  // Canceladas e inhabilitadas = hit real; entidades activas = informativo (no hit)
  const riskHits = hits.filter((h) => h.sourceLabel === 'BCRA_CANCELADA' || h.sourceLabel === 'BCRA_INHABILITADA');

  return {
    status: riskHits.length ? 'hit' : (hits.length ? 'clear' : 'clear'),
    detail: riskHits.length
      ? `${riskHits.length} entidad(es) CANCELADA(S)/INHABILITADA(S) por BCRA Argentina: ${riskHits.map((m) => `${m.name} (${m.score}%)`).join('; ')}. Requiere verificacion.`
      : hits.length
        ? `${hits.length} entidad(es) en BCRA Argentina (estado vigente — informativo): ${hits.map((m) => m.name).join(', ')}`
        : `Sin coincidencias en registros BCRA Argentina (${state.entries.length} registros, ${new Date(state.loadedAt).toISOString().slice(0, 10)})`,
    matches,
    listEntries: state.entries.length,
    listLoadedAt: new Date(state.loadedAt).toISOString()
  };
}

export function getBcraListStatus() {
  return { loaded: Boolean(state.entries), entries: state.entries?.length ?? null, loadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null, error: state.error };
}

export function _resetBcraStateForTests() {
  state.entries = null; state.loadedAt = null; state.loading = null; state.error = null;
}
