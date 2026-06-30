// Screening contra la CVM (Comissão de Valores Mobiliários) de Brasil.
// La CVM regula el mercado de valores brasileño (complementa al BCB para entidades
// de valores, fondos y gestoras). Publica un registro de sanciones administrativas
// y una lista de entidades no autorizadas.
// API datos abiertos: https://dados.cvm.gov.br/api/3/action/datastore_search
// Sanciones web: https://www.gov.br/cvm/pt-br/assuntos/noticias/sancionadores
// Alertas no autorizados: https://www.gov.br/cvm/pt-br/assuntos/noticias/alertas
// No requiere API key. Intenta API JSON, fallback HTML. Cache 24h.
const CVM_API_SANCIONES   = 'https://dados.cvm.gov.br/api/3/action/datastore_search?resource_id=38e54012-7591-47b2-9f11-a8ccc35f7ca4&limit=2000';
const CVM_WEB_SANCIONES   = 'https://www.gov.br/cvm/pt-br/assuntos/noticias/sancionadores';
const CVM_WEB_ALERTAS     = 'https://www.gov.br/cvm/pt-br/assuntos/noticias/alertas';
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS    = 20_000;
const MATCH_THRESHOLD     = 78;

import { normalizeName, matchName } from './matchingEngine.js';
import { createEntityRecord } from './entityModel.js';

const state = { entries: null, loadedAt: null, loading: null, error: null };

// El API CKAN de dados.cvm.gov.br devuelve { result: { records: [...] } }
function parseApiJson(data) {
  const records = data?.result?.records || data?.records || (Array.isArray(data) ? data : []);
  return records
    .map((r) => {
      const raw = (
        r.NOME_ADMINISTRADOR || r.DENOM_SOCIAL || r.NOME_FUNDO ||
        r.nome || r.name || r.RAZAO_SOCIAL || ''
      ).trim();
      if (!raw || raw.length < 2) return null;
      return { name: raw, normalizedName: normalizeName(raw), sourceLabel: 'CVM_SANCION' };
    })
    .filter(Boolean);
}

const CVM_STOP_WORDS = new Set([
  'cvm', 'comissao de valores', 'brasil', 'brazil', 'governo federal',
  'proximo', 'anterior', 'pesquisa', 'inicio', 'home', 'buscar',
  'resultado', 'pagina', 'filtro', 'alerta', 'sancao'
]);

function extractFromHtml(html, sourceLabel) {
  const entries = [];
  if (!html) return entries;

  const patterns = [
    // Tablas CVM con nombres de entidades/personas sancionadas
    /<td[^>]*>\s*([A-ZÁÉÍÓÚÃÕÇÜ][^<\n]{3,120})\s*<\/td>/g,
    // Titulos de procesos sancionadores
    /<h[234][^>]*>\s*([^<]{4,160})\s*<\/h[234]>/gi,
    // Items con nombres de entidades no autorizadas
    /<li[^>]*>\s*([A-ZÁÉÍÓÚÃÕÇ][^<\n]{3,120})\s*<\/li>/gi
  ];

  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(html)) !== null) {
      const raw = m[1].replace(/&[^;]+;/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (raw.length < 4 || raw.length > 160) continue;
      if (CVM_STOP_WORDS.has(raw.toLowerCase())) continue;
      if (/^\d/.test(raw)) continue;
      entries.push({ name: raw, normalizedName: normalizeName(raw), sourceLabel });
    }
  }

  const seen = new Set();
  return entries.filter((e) => { if (seen.has(e.normalizedName)) return false; seen.add(e.normalizedName); return true; });
}

async function fetchCvmLists() {
  const entries = [];
  const errors = [];

  // 1. Intentar API datos abiertos CVM
  try {
    const res = await fetch(CVM_API_SANCIONES, {
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
    errors.push(`CVM API: ${err.message}`);
  }

  // 2. HTML scraping como complemento o fallback
  for (const { url, label } of [
    { url: CVM_WEB_SANCIONES, label: 'CVM_SANCION' },
    { url: CVM_WEB_ALERTAS,   label: 'CVM_ALERTA' }
  ]) {
    try {
      const res = await fetch(url, {
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'NSD-Compliance-Gateway/1.0 contact@nsd.mx',
          'Accept-Language': 'pt-BR,pt;q=0.9'
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
      });
      if (!res.ok) throw new Error(`CVM ${label} respondio ${res.status}`);
      entries.push(...extractFromHtml(await res.text(), label));
    } catch (err) {
      errors.push(`${label}: ${err.message}`);
    }
  }

  if (!entries.length) throw new Error(errors.length ? `CVM Brasil no disponible: ${errors.join('; ')}` : 'CVM Brasil: sin registros parseables');

  const seen = new Set();
  return entries.filter((e) => { if (seen.has(e.normalizedName)) return false; seen.add(e.normalizedName); return true; });
}

function isStale() {
  return !state.loadedAt || (Date.now() - state.loadedAt) > REFRESH_INTERVAL_MS;
}

export function primeCvmBrazilList() {
  if (state.loading || (!isStale() && state.entries)) return state.loading;
  state.loading = fetchCvmLists()
    .then((entries) => { state.entries = entries; state.loadedAt = Date.now(); state.error = null; })
    .catch((err) => { state.error = err.message; })
    .finally(() => { state.loading = null; });
  return state.loading;
}

export function screenNameAgainstCvmBrazil(name) {
  primeCvmBrazilList();
  const trimmed = String(name || '').trim();
  if (!trimmed) return { status: 'skipped', detail: 'Sin nombre para verificar contra CVM Brasil', matches: [], listEntries: null, listLoadedAt: null };
  if (!state.entries) {
    return {
      status: 'skipped',
      detail: state.error ? `CVM Brasil no disponible: ${state.error}` : 'Registros CVM Brasil aun se estan descargando',
      matches: [], listEntries: null, listLoadedAt: null
    };
  }

  const hits = matchName(trimmed, state.entries).filter((m) => m.score >= MATCH_THRESHOLD);

  const matches = hits.slice(0, 5).map((h) =>
    createEntityRecord({
      name: h.name,
      type: 'entity',
      program: h.sourceLabel || 'CVM_REGULATORY',
      authority: 'CVM (Comissao de Valores Mobiliarios, Brazil)',
      reason: h.sourceLabel === 'CVM_ALERTA'
        ? 'Empresa en lista de alertas de la CVM Brasil — opera sin autorizacion en el mercado de valores'
        : 'Empresa con proceso sancionador de la CVM Brasil',
      jurisdiction: 'Brazil',
      source: 'cvmBrazilScreening',
      sourceUrl: h.sourceLabel === 'CVM_ALERTA' ? CVM_WEB_ALERTAS : CVM_WEB_SANCIONES,
      score: h.score,
      confidence: h.confidence
    })
  );

  return {
    status: hits.length ? 'hit' : 'clear',
    detail: hits.length
      ? `${hits.length} coincidencia(s) en registros CVM Brasil: ${hits.map((m) => `${m.name} (${m.score}%)`).join('; ')}. Requiere revision.`
      : `Sin coincidencias en registros CVM Brasil (${state.entries.length} registros, ${new Date(state.loadedAt).toISOString().slice(0, 10)})`,
    matches,
    listEntries: state.entries.length,
    listLoadedAt: new Date(state.loadedAt).toISOString()
  };
}

export function getCvmBrazilListStatus() {
  return { loaded: Boolean(state.entries), entries: state.entries?.length ?? null, loadedAt: state.loadedAt ? new Date(state.loadedAt).toISOString() : null, error: state.error };
}

export function _resetCvmBrazilStateForTests() {
  state.entries = null; state.loadedAt = null; state.loading = null; state.error = null;
}
