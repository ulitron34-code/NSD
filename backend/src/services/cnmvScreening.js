// Screening contra la CNMV (Comision Nacional del Mercado de Valores) de España.
// La CNMV publica una lista de entidades no autorizadas (chiringuitos financieros)
// y acciones de enforcement contra intermediarios.
// API alertas: https://www.cnmv.es/portal/alts/CNMV-Public-API/api/alts/Avisos
// Advertencias web: https://www.cnmv.es/portal/Inversor/Alertas-Entidades-No-Autorizadas.aspx
// No requiere API key. Intenta API JSON primero, fallback HTML. Cache 24h.
const CNMV_API_ALERTS  = 'https://www.cnmv.es/portal/alts/CNMV-Public-API/api/alts/Avisos?page=0&pageSize=2000';
const CNMV_WEB_ALERTS  = 'https://www.cnmv.es/portal/Inversor/Alertas-Entidades-No-Autorizadas.aspx';
const CNMV_SANCTIONS   = 'https://www.cnmv.es/portal/Supervision/Sanciones.aspx';
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS    = 18_000;
const MATCH_THRESHOLD     = 78;

import { normalizeName, matchName } from './matchingEngine.js';
import { createEntityRecord } from './entityModel.js';

const state = { entries: null, loadedAt: null, loading: null, error: null };

// El API CNMV puede devolver objetos con denominacion/nombre de la entidad
function parseApiJson(data) {
  const items = data?.data || data?.items || data?.avisos || data?.entidades || (Array.isArray(data) ? data : []);
  return items
    .map((r) => {
      const raw = (r.denominacion || r.nombre || r.name || r.razonSocial || r.entidad || '').trim();
      if (!raw || raw.length < 2) return null;
      return { name: raw, normalizedName: normalizeName(raw), sourceLabel: 'CNMV_ALERT' };
    })
    .filter(Boolean);
}

const CNMV_STOP_WORDS = new Set([
  'cnmv', 'comision nacional', 'mercado de valores', 'espana', 'spain',
  'siguiente', 'anterior', 'buscar', 'inicio', 'home', 'page', 'filter',
  'advertencia', 'entidad', 'sancion', 'resultado', 'pagina'
]);

function extractFromHtml(html, sourceLabel) {
  const entries = [];
  if (!html) return entries;

  const patterns = [
    // La pagina CNMV usa tablas con nombres de entidades
    /<td[^>]*>\s*([A-ZÁÉÍÓÚÑÜ][^<\n]{3,120})\s*<\/td>/g,
    /<h[234][^>]*>\s*([^<]{4,120})\s*<\/h[234]>/gi,
    /<li[^>]*>\s*([A-ZÁÉÍÓÚÑ][^<\n]{3,120})\s*<\/li>/gi
  ];

  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(html)) !== null) {
      const raw = m[1].replace(/&[^;]+;/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (raw.length < 4 || raw.length > 130) continue;
      if (CNMV_STOP_WORDS.has(raw.toLowerCase())) continue;
      if (/^\d/.test(raw)) continue;
      entries.push({ name: raw, normalizedName: normalizeName(raw), sourceLabel });
    }
  }

  const seen = new Set();
  return entries.filter((e) => { if (seen.has(e.normalizedName)) return false; seen.add(e.normalizedName); return true; });
}

async function fetchCnmvLists() {
  const entries = [];
  const errors = [];

  // 1. Intentar API JSON de alertas CNMV
  try {
    const res = await fetch(CNMV_API_ALERTS, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NSD-Compliance-Gateway/1.0 contact@nsd.mx'
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    });
    if (res.ok) {
      const data = await res.json();
      const parsed = parseApiJson(data);
      if (parsed.length) entries.push(...parsed);
    }
  } catch (err) {
    errors.push(`CNMV API: ${err.message}`);
  }

  // 2. HTML scraping si no hubo datos via API
  if (!entries.length) {
    for (const { url, label } of [
      { url: CNMV_WEB_ALERTS, label: 'CNMV_ALERT' },
      { url: CNMV_SANCTIONS,  label: 'CNMV_SANCION' }
    ]) {
      try {
        const res = await fetch(url, {
          headers: {
            'Accept': 'text/html',
            'User-Agent': 'NSD-Compliance-Gateway/1.0 contact@nsd.mx',
            'Accept-Language': 'es-ES,es;q=0.9'
          },
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
        });
        if (!res.ok) throw new Error(`CNMV ${label} respondio ${res.status}`);
        entries.push(...extractFromHtml(await res.text(), label));
      } catch (err) {
        errors.push(`${label}: ${err.message}`);
      }
    }
  }

  if (!entries.length) throw new Error(errors.length ? `CNMV no disponible: ${errors.join('; ')}` : 'CNMV: sin registros parseables');
  return entries;
}

function isStale() {
  return !state.loadedAt || (Date.now() - state.loadedAt) > REFRESH_INTERVAL_MS;
}

export function primeCnmvList() {
  if (state.loading || (!isStale() && state.entries)) return state.loading;
  state.loading = fetchCnmvLists()
    .then((entries) => { state.entries = entries; state.loadedAt = Date.now(); state.error = null; })
    .catch((err) => { state.error = err.message; })
    .finally(() => { state.loading = null; });
  return state.loading;
}

export function screenNameAgainstCnmv(name) {
  primeCnmvList();
  const trimmed = String(name || '').trim();
  if (!trimmed) return { status: 'skipped', detail: 'Sin nombre para verificar contra CNMV España', matches: [], listEntries: null, listLoadedAt: null };
  if (!state.entries) {
    return {
      status: 'skipped',
      detail: state.error ? `CNMV no disponible: ${state.error}` : 'Registros CNMV aun se estan descargando',
      matches: [], listEntries: null, listLoadedAt: null
    };
  }

  const hits = matchName(trimmed, state.entries).filter((m) => m.score >= MATCH_THRESHOLD);

  const matches = hits.slice(0, 5).map((h) =>
    createEntityRecord({
      name: h.name,
      type: 'entity',
      program: h.sourceLabel || 'CNMV_REGULATORY',
      authority: 'CNMV (Comision Nacional del Mercado de Valores, Spain)',
      reason: h.sourceLabel === 'CNMV_ALERT'
        ? 'Empresa en lista de entidades no autorizadas de la CNMV ("chiringuito financiero")'
        : 'Empresa sancionada por la CNMV de España',
      jurisdiction: 'Spain',
      source: 'cnmvScreening',
      sourceUrl: h.sourceLabel === 'CNMV_ALERT' ? CNMV_WEB_ALERTS : CNMV_SANCTIONS,
      score: h.score,
      confidence: h.confidence
    })
  );

  return {
    status: hits.length ? 'hit' : 'clear',
    detail: hits.length
      ? `${hits.length} coincidencia(s) en registros CNMV España: ${hits.map((m) => `${m.name} (${m.score}%)`).join('; ')}. Requiere revision.`
      : `Sin coincidencias en registros CNMV España (${state.entries.length} registros, ${new Date(state.loadedAt).toISOString().slice(0, 10)})`,
    matches,
    listEntries: state.entries.length,
    listLoadedAt: new Date(state.loadedAt).toISOString()
  };
}

export function getCnmvListStatus() {
  return { loaded: Boolean(state.entries), entries: state.entries?.length ?? null, loadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null, error: state.error };
}

export function _resetCnmvStateForTests() {
  state.entries = null; state.loadedAt = null; state.loading = null; state.error = null;
}
