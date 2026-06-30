// Screening contra registros de la CMF (Comision para el Mercado Financiero) de Chile.
// La CMF es el regulador de valores, seguros e intermediarios financieros de Chile.
// Fuentes publicas:
//   - Registro intermediarios: https://www.cmfchile.cl/institucional/intermediarios/busqueda_intermediarios.php
//   - Sanciones: https://www.cmfchile.cl/institucional/sanciones/busqueda_sanciones.php
//   - API publica: https://api.cmfchile.cl/api-sbifv3/recursos_api/
// Intenta la API estructurada primero; fallback a HTML si no responde.
const CMF_API_SANCIONES = 'https://api.cmfchile.cl/api-sbifv3/recursos_api/sancion?apikey=anonimo&formato=json';
const CMF_API_ENTIDADES = 'https://api.cmfchile.cl/api-sbifv3/recursos_api/entidadsistema?apikey=anonimo&formato=json';
const CMF_WEB_SANCIONES = 'https://www.cmfchile.cl/institucional/sanciones/busqueda_sanciones.php';
const CMF_WEB_INTERMEDIARIOS = 'https://www.cmfchile.cl/institucional/intermediarios/busqueda_intermediarios.php';
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 15_000;
const MATCH_THRESHOLD = 78;

import { normalizeName, matchName } from './matchingEngine.js';
import { createEntityRecord } from './entityModel.js';

const state = { entries: null, loadedAt: null, loading: null, error: null };

// Intenta obtener datos de la API CMF (JSON estructurado).
// Retorna array de { name, normalizedName, sourceLabel } o lanza si falla.
async function tryApiSource(url, nameField, label) {
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'NSD-Compliance-Gateway/1.0 contact@nsd.mx' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });
  if (!res.ok) throw new Error(`CMF API ${label} respondio ${res.status}`);
  const data = await res.json();
  // La API CMF anida los datos bajo distintas claves segun endpoint
  const records = data?.Sanciones?.Sancion || data?.Entidades?.Entidad || data?.items || (Array.isArray(data) ? data : []);
  return records
    .map((r) => {
      const raw = (typeof nameField === 'function' ? nameField(r) : r[nameField] || '').trim();
      return raw ? { name: raw, normalizedName: normalizeName(raw), sourceLabel: label } : null;
    })
    .filter(Boolean);
}

// Fallback HTML si la API no esta disponible.
function extractNamesFromHtml(html, sourceLabel) {
  const entries = [];
  if (!html) return entries;
  const tdPattern = /<td[^>]*>\s*([A-ZÁÉÍÓÚÑ][^<\n]{3,100})\s*<\/td>/g;
  let m;
  while ((m = tdPattern.exec(html)) !== null) {
    const raw = m[1].replace(/&[^;]+;/gi, ' ').replace(/<[^>]+>/g, '').trim();
    if (raw.length < 4 || raw.length > 120) continue;
    entries.push({ name: raw, normalizedName: normalizeName(raw), sourceLabel });
  }
  const seen = new Set();
  return entries.filter((e) => { if (seen.has(e.normalizedName)) return false; seen.add(e.normalizedName); return true; });
}

async function fetchPage(url, label) {
  const res = await fetch(url, {
    headers: { 'Accept': 'text/html', 'User-Agent': 'NSD-Compliance-Gateway/1.0 contact@nsd.mx' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });
  if (!res.ok) throw new Error(`CMF HTML ${label} respondio ${res.status}`);
  return res.text();
}

async function fetchCmfLists() {
  const entries = [];
  const errors = [];

  // Intento 1: API CMF para sanciones
  try {
    const sanciones = await tryApiSource(
      CMF_API_SANCIONES,
      (r) => r.NombreSancionado || r.RazonSocial || r.Nombre || '',
      'CMF_SANCION'
    );
    entries.push(...sanciones);
  } catch (err) {
    errors.push(`CMF API sanciones: ${err.message}`);
    // Fallback HTML para sanciones
    try {
      const html = await fetchPage(CMF_WEB_SANCIONES, 'CMF_SANCION');
      entries.push(...extractNamesFromHtml(html, 'CMF_SANCION'));
    } catch (e2) {
      errors.push(`CMF HTML sanciones: ${e2.message}`);
    }
  }

  // Intento 2: API CMF para entidades del sistema
  try {
    const entidades = await tryApiSource(
      CMF_API_ENTIDADES,
      (r) => r.NombreEntidad || r.RazonSocial || r.Nombre || '',
      'CMF_ENTIDAD'
    );
    entries.push(...entidades);
  } catch (err) {
    errors.push(`CMF API entidades: ${err.message}`);
    // Fallback HTML para intermediarios
    try {
      const html = await fetchPage(CMF_WEB_INTERMEDIARIOS, 'CMF_ENTIDAD');
      entries.push(...extractNamesFromHtml(html, 'CMF_ENTIDAD'));
    } catch (e2) {
      errors.push(`CMF HTML intermediarios: ${e2.message}`);
    }
  }

  if (!entries.length) {
    throw new Error(`CMF Chile no disponible: ${errors.join('; ')}`);
  }

  const seen = new Set();
  return entries.filter((e) => { if (seen.has(e.normalizedName)) return false; seen.add(e.normalizedName); return true; });
}

function isStale() {
  return !state.loadedAt || (Date.now() - state.loadedAt) > REFRESH_INTERVAL_MS;
}

export function primeCmfChileList() {
  if (state.loading || (!isStale() && state.entries)) return state.loading;
  state.loading = fetchCmfLists()
    .then((entries) => { state.entries = entries; state.loadedAt = Date.now(); state.error = null; })
    .catch((err) => { state.error = err.message; })
    .finally(() => { state.loading = null; });
  return state.loading;
}

export function screenNameAgainstCmfChile(name) {
  primeCmfChileList();
  const trimmed = String(name || '').trim();
  if (!trimmed) return { status: 'skipped', detail: 'Sin nombre para verificar contra CMF Chile', matches: [], listEntries: null, listLoadedAt: null };
  if (!state.entries) {
    return {
      status: 'skipped',
      detail: state.error
        ? `CMF Chile no disponible: ${state.error}`
        : 'Registros CMF Chile aun se estan descargando',
      matches: [], listEntries: null, listLoadedAt: null
    };
  }

  const hits = matchName(trimmed, state.entries).filter((m) => m.score >= MATCH_THRESHOLD);

  const matches = hits.slice(0, 5).map((h) =>
    createEntityRecord({
      name: h.name,
      type: 'entity',
      program: h.sourceLabel || 'CMF_REGULATORY',
      authority: 'CMF (Comision para el Mercado Financiero, Chile)',
      reason: h.sourceLabel === 'CMF_SANCION'
        ? 'Sancion CMF Chile'
        : 'Entidad en sistema financiero Chile (CMF)',
      jurisdiction: 'Chile',
      source: 'cmfChileScreening',
      sourceUrl: h.sourceLabel === 'CMF_SANCION' ? CMF_WEB_SANCIONES : CMF_WEB_INTERMEDIARIOS,
      score: h.score,
      confidence: h.confidence
    })
  );

  return {
    status: hits.length ? 'hit' : 'clear',
    detail: hits.length
      ? `${hits.length} coincidencia(s) en registros CMF Chile: ${hits.map((m) => `${m.name} (${m.score}%)`).join('; ')}. Requiere revision manual.`
      : `Sin coincidencias en registros CMF Chile (${state.entries.length} registros, ${new Date(state.loadedAt).toISOString().slice(0, 10)})`,
    matches,
    listEntries: state.entries.length,
    listLoadedAt: new Date(state.loadedAt).toISOString()
  };
}

export function getCmfChileListStatus() {
  return { loaded: Boolean(state.entries), entries: state.entries?.length ?? null, loadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null, error: state.error };
}

export function _resetCmfChileStateForTests() {
  state.entries = null; state.loadedAt = null; state.loading = null; state.error = null;
}
