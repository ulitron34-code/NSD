// Screening contra registros de enforcement de la SEC (Securities and Exchange Commission).
// Usa la API publica EFTS (Full-Text Search) de SEC EDGAR para buscar:
//   - Administrative Proceedings (AP): procedimientos administrativos
//   - Litigation Releases (LR): comunicados de litigio
// Referencia: https://efts.sec.gov/LATEST/search-index
// No requiere API key; sujeto a fair use policy de la SEC.
// Modo: busqueda en vivo por nombre (no cache — el volumen de documentos es demasiado grande).
const SEC_EFTS_URL = 'https://efts.sec.gov/LATEST/search-index';
const SEC_TIMEOUT_MS = 12_000;

import { createEntityRecord } from './entityModel.js';

// Convierte el _score de Elasticsearch de EFTS a un porcentaje 0-100 aproximado.
function esScoreToPercent(score) {
  if (!score || score <= 0) return 50;
  // Scores tipicos de EFTS para coincidencias exactas de frase: 10-30
  return Math.min(100, Math.round((score / 20) * 100));
}

export async function screenNameAgainstSec(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) {
    return { status: 'skipped', detail: 'Sin nombre para verificar contra SEC EDGAR', matches: [], listEntries: null, listLoadedAt: null };
  }

  // Busqueda de frase exacta entre comillas para mayor precision
  const query = `"${trimmed}"`;
  const url = `${SEC_EFTS_URL}?q=${encodeURIComponent(query)}&forms=AP,LR&dateRange=custom&startdt=2000-01-01`;

  let data;
  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NSD-Compliance-Gateway/1.0 contact@nsd.mx'
      },
      signal: AbortSignal.timeout(SEC_TIMEOUT_MS)
    });
    if (!res.ok) throw new Error(`SEC EDGAR EFTS respondio ${res.status}`);
    data = await res.json();
  } catch (err) {
    return {
      status: 'skipped',
      detail: `SEC EDGAR no disponible temporalmente: ${err.message}`,
      matches: [],
      listEntries: null,
      listLoadedAt: null
    };
  }

  const rawHits = data?.hits?.hits || [];
  const total = data?.hits?.total?.value || 0;

  if (!rawHits.length) {
    return {
      status: 'clear',
      detail: `Sin registros de enforcement SEC EDGAR (AP/LR) para "${trimmed}"`,
      matches: [],
      listEntries: null,
      listLoadedAt: new Date().toISOString()
    };
  }

  const matches = rawHits.slice(0, 5).map((h) => {
    const src = h._source || {};
    const displayName = Array.isArray(src.display_names) && src.display_names.length
      ? src.display_names[0]
      : (src.entity_name || trimmed);
    const formType = src.form_type || 'ENFORCEMENT';
    const fileDate = src.file_date || null;
    const score = esScoreToPercent(h._score);

    return createEntityRecord({
      name: displayName,
      type: 'individual_or_entity',
      program: `SEC_${formType}`,
      authority: 'SEC (Securities and Exchange Commission)',
      reason: formType === 'AP'
        ? `Administrative Proceeding — ${fileDate || 'fecha no disponible'}`
        : `Litigation Release — ${fileDate || 'fecha no disponible'}`,
      status: 'active',
      source: 'secScreening',
      sourceUrl: src.file_num
        ? `https://www.sec.gov/litigation/${formType === 'AP' ? 'admin' : 'litreleases'}.shtml`
        : null,
      score,
      confidence: score >= 85 ? 'high' : score >= 65 ? 'medium' : 'low'
    });
  });

  return {
    status: 'hit',
    detail: `${total} registro(s) de enforcement SEC EDGAR para "${trimmed}" (AP: Administrative Proceedings / LR: Litigation Releases). Requiere corroboracion de identidad y revision manual antes de actuar.`,
    matches,
    listEntries: null,
    listLoadedAt: new Date().toISOString()
  };
}

// No hay lista para precargar — la busqueda es en vivo.
export function getSecListStatus() {
  return { loaded: true, entries: null, loadedAt: null, error: null, mode: 'live_search' };
}
export function primeSecList() {} // sin estado — no-op
export function _resetSecStateForTests() {} // sin estado — no-op
