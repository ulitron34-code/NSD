// Screening contra la lista de sanciones del Grupo Banco Mundial (WBG).
// El Banco Mundial publica una lista de personas y empresas sancionadas (debarred)
// por fraude o corrupción en proyectos financiados por el BM.
// API JSON: https://apigw.worldbank.org/api/sanctions/v1/sanctionsList?format=JSON
// Fallback HTML: https://www.worldbank.org/en/programs/sanctions-system/list
// No requiere API key. Cache 24h.
const WB_API_URL  = 'https://apigw.worldbank.org/api/sanctions/v1/sanctionsList?format=JSON';
const WB_PAGE_URL = 'https://www.worldbank.org/en/programs/sanctions-system/list';
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 20_000;
const MATCH_THRESHOLD = 78;

import { normalizeName, matchName } from './matchingEngine.js';
import { createEntityRecord } from './entityModel.js';

const state = { entries: null, loadedAt: null, loading: null, error: null };

// Parsea respuesta JSON del API WBG — los campos varían entre versiones.
function parseJsonResponse(data) {
  const items = data?.sanctionList?.sanction
    || data?.sanctions
    || data?.debarredList
    || (Array.isArray(data) ? data : []);
  return items
    .map((r) => {
      const raw = (
        r.name || r.firmName || r.entityName ||
        (r.firstName && r.lastName ? `${r.firstName} ${r.lastName}` : '') ||
        ''
      ).trim();
      if (!raw || raw.length < 2) return null;
      return {
        name: raw,
        normalizedName: normalizeName(raw),
        country: r.country || r.fromCountry || '',
        grounds: r.grounds || r.sanctionType || '',
        fromDate: r.fromDate || r.startDate || '',
        status: r.status || 'active',
        sourceLabel: 'WB_SANCTION'
      };
    })
    .filter(Boolean);
}

// Extrae nombres de la página HTML del BM como último recurso.
function parseHtmlFallback(html) {
  const entries = [];
  const tdPat = /<td[^>]*>\s*([A-Z][^<\n]{3,120})\s*<\/td>/gi;
  let m;
  while ((m = tdPat.exec(html)) !== null) {
    const raw = m[1].replace(/&[^;]+;/gi, ' ').replace(/<[^>]+>/g, '').trim();
    if (raw.length < 4 || raw.length > 130) continue;
    entries.push({ name: raw, normalizedName: normalizeName(raw), country: '', grounds: '', fromDate: '', status: 'active', sourceLabel: 'WB_SANCTION' });
  }
  const seen = new Set();
  return entries.filter((e) => { if (seen.has(e.normalizedName)) return false; seen.add(e.normalizedName); return true; });
}

async function fetchWorldBankList() {
  // Intentar API JSON primero
  try {
    const res = await fetch(WB_API_URL, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'NSD-Compliance-Gateway/1.0 contact@nsd.mx' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    });
    if (res.ok) {
      const data = await res.json();
      const entries = parseJsonResponse(data);
      if (entries.length) return entries;
    }
  } catch { /* fallthrough a HTML */ }

  // Fallback HTML
  const res = await fetch(WB_PAGE_URL, {
    headers: { 'Accept': 'text/html', 'User-Agent': 'NSD-Compliance-Gateway/1.0 contact@nsd.mx' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });
  if (!res.ok) throw new Error(`WB Sanctions page respondio ${res.status}`);
  const html = await res.text();
  const entries = parseHtmlFallback(html);
  if (!entries.length) throw new Error('WB Sanctions: sin registros parseables del HTML');
  return entries;
}

function isStale() {
  return !state.loadedAt || (Date.now() - state.loadedAt) > REFRESH_INTERVAL_MS;
}

export function primeWorldBankList() {
  if (state.loading || (!isStale() && state.entries)) return state.loading;
  state.loading = fetchWorldBankList()
    .then((entries) => { state.entries = entries; state.loadedAt = Date.now(); state.error = null; })
    .catch((err) => { state.error = err.message; })
    .finally(() => { state.loading = null; });
  return state.loading;
}

export function screenNameAgainstWorldBank(name) {
  primeWorldBankList();
  const trimmed = String(name || '').trim();
  if (!trimmed) return { status: 'skipped', detail: 'Sin nombre para verificar contra WB Sanctions', matches: [], listEntries: null, listLoadedAt: null };
  if (!state.entries) {
    return {
      status: 'skipped',
      detail: state.error
        ? `WB Sanctions no disponible: ${state.error}`
        : 'Lista WB Sanctions aun se esta descargando',
      matches: [], listEntries: null, listLoadedAt: null
    };
  }

  const hits = matchName(trimmed, state.entries).filter((m) => m.score >= MATCH_THRESHOLD);

  const matches = hits.slice(0, 5).map((h) =>
    createEntityRecord({
      name: h.name,
      type: h.grounds?.toLowerCase().includes('individu') ? 'individual' : 'entity',
      program: 'WORLD_BANK_DEBARRED',
      authority: 'World Bank Group Integrity Vice Presidency (INT)',
      reason: h.grounds
        ? `Sancionado por WBG: ${h.grounds}${h.fromDate ? `. Desde: ${h.fromDate.slice(0, 10)}` : ''}`
        : 'Incluido en lista de debarred del Banco Mundial',
      nationality: h.country || undefined,
      jurisdiction: h.country || undefined,
      status: 'blacklisted',
      source: 'worldBankScreening',
      sourceUrl: WB_PAGE_URL,
      score: h.score,
      confidence: h.confidence
    })
  );

  return {
    status: hits.length ? 'hit' : 'clear',
    detail: hits.length
      ? `${hits.length} coincidencia(s) en lista de sanciones del Banco Mundial: ${hits.map((m) => `${m.name} (${m.score}%)`).join('; ')}. Entidad inhabilitada para proyectos WBG.`
      : `Sin coincidencias en lista de sanciones WBG (${state.entries.length} entidades verificadas)`,
    matches,
    listEntries: state.entries.length,
    listLoadedAt: new Date(state.loadedAt).toISOString()
  };
}

export function getWorldBankListStatus() {
  return { loaded: Boolean(state.entries), entries: state.entries?.length ?? null, loadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null, error: state.error };
}

export function _resetWorldBankStateForTests() {
  state.entries = null; state.loadedAt = null; state.loading = null; state.error = null;
}
