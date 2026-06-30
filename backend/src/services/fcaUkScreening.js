// Screening contra la FCA (Financial Conduct Authority) del Reino Unido.
// La FCA publica una Warning List de empresas no autorizadas que operan en el UK,
// diferente de las sanciones OFSI/UK que ya cubre sanctionsGateway.
// Warning list API: https://register.fca.org.uk/services/V0.1/Warnings
// Warning list web: https://www.fca.org.uk/scamsmart/warning-list-of-firms-to-avoid
// Enforcement actions: https://www.fca.org.uk/news/news-stories/enforcement-news
// No requiere API key. Cache 24h.
const FCA_WARNINGS_API  = 'https://register.fca.org.uk/services/V0.1/Warnings?ItemsPerPage=5000&PageNumber=1';
const FCA_WARNINGS_WEB  = 'https://www.fca.org.uk/scamsmart/warning-list-of-firms-to-avoid';
const FCA_ENFORCE_URL   = 'https://www.fca.org.uk/news/news-stories/enforcement-news';
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 18_000;
const MATCH_THRESHOLD = 78;

import { normalizeName, matchName } from './matchingEngine.js';
import { createEntityRecord } from './entityModel.js';

const state = { entries: null, loadedAt: null, loading: null, error: null };

// El API de FCA puede devolver JSON con el siguiente formato aproximado:
// { Data: [ { TradingName, LegalName, Status, ... } ] }
function parseApiJson(data) {
  const items = data?.Data || data?.data || data?.warnings || (Array.isArray(data) ? data : []);
  return items
    .map((r) => {
      const raw = (r.TradingName || r.LegalName || r.Name || r.name || r.firmName || '').trim();
      if (!raw || raw.length < 2) return null;
      return { name: raw, normalizedName: normalizeName(raw), status: r.Status || r.status || '', sourceLabel: 'FCA_WARNING' };
    })
    .filter(Boolean);
}

const FCA_STOP_WORDS = new Set([
  'fca', 'financial conduct', 'authority', 'warning', 'list', 'united kingdom',
  'united states', 'home', 'search', 'filter', 'next', 'previous', 'page',
  'scamsmart', 'firm', 'company', 'person', 'result'
]);

function extractFromHtml(html, sourceLabel) {
  const entries = [];
  if (!html) return entries;
  const patterns = [
    // Filas de tabla con nombres de firmas
    /<td[^>]*>\s*([A-Z][^<\n]{3,100})\s*<\/td>/g,
    // Titulos de enforcement actions
    /<h[234][^>]*>\s*([^<]{4,100})\s*<\/h[234]>/gi,
    // Items de lista con nombres de firmas no autorizadas
    /<li[^>]*>\s*([A-Z][^<\n]{3,100})\s*<\/li>/gi
  ];
  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(html)) !== null) {
      const raw = m[1].replace(/&[^;]+;/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (raw.length < 4 || raw.length > 130) continue;
      if (FCA_STOP_WORDS.has(raw.toLowerCase())) continue;
      if (/^\d/.test(raw) || /^(the|a|an|to|of|for|and|is|are|you)\s/i.test(raw)) continue;
      entries.push({ name: raw, normalizedName: normalizeName(raw), status: '', sourceLabel });
    }
  }
  const seen = new Set();
  return entries.filter((e) => { if (seen.has(e.normalizedName)) return false; seen.add(e.normalizedName); return true; });
}

async function fetchFcaLists() {
  const entries = [];
  const errors = [];

  // 1. Intentar API JSON de FCA warnings
  try {
    const res = await fetch(FCA_WARNINGS_API, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NSD-Compliance-Gateway/1.0 contact@nsd.mx'
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    });
    if (res.ok) {
      const data = await res.json();
      const parsed = parseApiJson(data);
      if (parsed.length) {
        entries.push(...parsed);
      }
    }
  } catch (err) {
    errors.push(`FCA API: ${err.message}`);
  }

  // 2. HTML scraping de la warning list web si no hubo exito via API
  if (!entries.length) {
    try {
      const res = await fetch(FCA_WARNINGS_WEB, {
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'NSD-Compliance-Gateway/1.0 contact@nsd.mx',
          'Accept-Language': 'en-GB,en;q=0.9'
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
      });
      if (!res.ok) throw new Error(`FCA warnings web respondio ${res.status}`);
      const html = await res.text();
      entries.push(...extractFromHtml(html, 'FCA_WARNING'));
    } catch (err) {
      errors.push(`FCA web: ${err.message}`);
    }
  }

  // 3. Enforcement actions para completar
  try {
    const res = await fetch(FCA_ENFORCE_URL, {
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'NSD-Compliance-Gateway/1.0 contact@nsd.mx',
        'Accept-Language': 'en-GB,en;q=0.9'
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    });
    if (res.ok) {
      const html = await res.text();
      entries.push(...extractFromHtml(html, 'FCA_ENFORCEMENT'));
    }
  } catch (err) {
    errors.push(`FCA enforcement: ${err.message}`);
  }

  if (!entries.length) {
    throw new Error(errors.length ? `FCA UK no disponible: ${errors.join('; ')}` : 'FCA UK: sin registros parseables');
  }

  const seen = new Set();
  return entries.filter((e) => { if (seen.has(e.normalizedName)) return false; seen.add(e.normalizedName); return true; });
}

function isStale() {
  return !state.loadedAt || (Date.now() - state.loadedAt) > REFRESH_INTERVAL_MS;
}

export function primeFcaUkList() {
  if (state.loading || (!isStale() && state.entries)) return state.loading;
  state.loading = fetchFcaLists()
    .then((entries) => { state.entries = entries; state.loadedAt = Date.now(); state.error = null; })
    .catch((err) => { state.error = err.message; })
    .finally(() => { state.loading = null; });
  return state.loading;
}

export function screenNameAgainstFcaUk(name) {
  primeFcaUkList();
  const trimmed = String(name || '').trim();
  if (!trimmed) return { status: 'skipped', detail: 'Sin nombre para verificar contra FCA UK', matches: [], listEntries: null, listLoadedAt: null };
  if (!state.entries) {
    return {
      status: 'skipped',
      detail: state.error
        ? `FCA UK no disponible: ${state.error}`
        : 'Registros FCA UK aun se estan descargando',
      matches: [], listEntries: null, listLoadedAt: null
    };
  }

  const hits = matchName(trimmed, state.entries).filter((m) => m.score >= MATCH_THRESHOLD);

  const matches = hits.slice(0, 5).map((h) =>
    createEntityRecord({
      name: h.name,
      type: 'entity',
      program: h.sourceLabel || 'FCA_REGULATORY',
      authority: 'FCA (Financial Conduct Authority, United Kingdom)',
      reason: h.sourceLabel === 'FCA_WARNING'
        ? 'Empresa en Warning List de la FCA UK — no autorizada o bajo investigacion por operar sin licencia'
        : 'Empresa sujeta a accion de enforcement de la FCA UK',
      jurisdiction: 'United Kingdom',
      source: 'fcaUkScreening',
      sourceUrl: h.sourceLabel === 'FCA_WARNING' ? FCA_WARNINGS_WEB : FCA_ENFORCE_URL,
      score: h.score,
      confidence: h.confidence
    })
  );

  return {
    status: hits.length ? 'hit' : 'clear',
    detail: hits.length
      ? `${hits.length} coincidencia(s) en registros FCA UK: ${hits.map((m) => `${m.name} (${m.score}%)`).join('; ')}. Requiere revision.`
      : `Sin coincidencias en registros FCA UK (${state.entries.length} registros, ${new Date(state.loadedAt).toISOString().slice(0, 10)})`,
    matches,
    listEntries: state.entries.length,
    listLoadedAt: new Date(state.loadedAt).toISOString()
  };
}

export function getFcaUkListStatus() {
  return { loaded: Boolean(state.entries), entries: state.entries?.length ?? null, loadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null, error: state.error };
}

export function _resetFcaUkStateForTests() {
  state.entries = null; state.loadedAt = null; state.loading = null; state.error = null;
}
