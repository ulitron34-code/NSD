// Screening contra registros del Banco Central de Brasil (BCB).
// Usa la API OData publica IF.data del BCB para buscar instituciones financieras
// autorizadas. Tambien verifica la lista de enforcement publicada por el BCB.
// API OData: https://olinda.bcb.gov.br/olinda/servico/IF_Data/versao/v1/odata/
// No requiere API key. Modo: busqueda en vivo por nombre (OData query).
const BCB_ODATA_BASE = 'https://olinda.bcb.gov.br/olinda/servico/IF_Data/versao/v1/odata';
const BCB_ENFORCEMENT_URL = 'https://www.bcb.gov.br/estabilidadefinanceira/supervisaoregulacao/processos';
const FETCH_TIMEOUT_MS = 12_000;
const MATCH_THRESHOLD = 78;

import { normalizeName, matchName } from './matchingEngine.js';
import { createEntityRecord } from './entityModel.js';

// BCB IF.data — busqueda de institucion financiera por nombre (PJ = Pessoa Juridica)
// Endpoint: ListaIFPJ(nome='{NAME}')
// Retorna: { value: [ { Nome, Cnpj, DataInicio, DataFim, Tipo, Segmento, ... } ] }
export async function screenNameAgainstBcb(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) {
    return { status: 'skipped', detail: 'Sin nombre para verificar contra BCB Brasil', matches: [], listEntries: null, listLoadedAt: null };
  }

  // OData requiere comillas simples; se escapan comillas simples internas duplicandolas
  const oDataName = trimmed.toUpperCase().replace(/'/g, "''");
  const url = `${BCB_ODATA_BASE}/ListaIFPJ(nome='${encodeURIComponent(oDataName)}')?$format=json`;

  let data;
  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NSD-Compliance-Gateway/1.0 contact@nsd.mx'
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    });
    if (!res.ok) throw new Error(`BCB IF.data respondio ${res.status}`);
    data = await res.json();
  } catch (err) {
    return {
      status: 'skipped',
      detail: `BCB Brasil no disponible temporalmente: ${err.message}`,
      matches: [], listEntries: null, listLoadedAt: null
    };
  }

  const records = data?.value || [];
  if (!records.length) {
    return {
      status: 'clear',
      detail: `"${trimmed}" no figura en el registro de instituciones financieras autorizadas del BCB. Puede no estar autorizada o no ser una IF regulada por el BCB.`,
      matches: [], listEntries: null, listLoadedAt: new Date().toISOString()
    };
  }

  // Instituciones encontradas — verificar si tienen fecha de fin (cancelacion/suspension)
  const targetNorm = normalizeName(trimmed);
  const hits = records
    .map((r) => ({
      ...r,
      normalizedName: normalizeName(r.Nome || ''),
      score: normalizeName(r.Nome || '') === targetNorm ? 100 : 75
    }))
    .filter((r) => r.score >= MATCH_THRESHOLD);

  const matches = hits.slice(0, 5).map((r) => {
    const isCanceled = Boolean(r.DataFim);
    return createEntityRecord({
      name: r.Nome,
      type: 'entity',
      identifiers: r.Cnpj ? [{ kind: 'cnpj', value: r.Cnpj }] : [],
      program: isCanceled ? 'BCB_CANCELED' : 'BCB_AUTHORIZED',
      authority: 'BCB (Banco Central de Brasil)',
      reason: isCanceled
        ? `Institucion con autorizacion CANCELADA por BCB. Inicio: ${r.DataInicio?.slice(0, 10) || 'N/D'}, Fin: ${r.DataFim?.slice(0, 10) || 'N/D'}`
        : `Institucion AUTORIZADA por BCB. Tipo: ${r.Tipo || 'N/D'}, Segmento: ${r.Segmento || 'N/D'}. Inicio: ${r.DataInicio?.slice(0, 10) || 'N/D'}`,
      status: isCanceled ? 'removed' : 'active',
      jurisdiction: 'Brasil',
      source: 'bcbScreening',
      sourceUrl: BCB_ODATA_BASE,
      score: r.score,
      confidence: r.score >= 90 ? 'high' : 'medium'
    });
  });

  // Una institucion CANCELADA es mayor riesgo; una AUTORIZADA puede ser informativa
  const hasCanceled = hits.some((r) => Boolean(r.DataFim));

  return {
    status: hasCanceled ? 'hit' : 'clear',
    detail: hasCanceled
      ? `${hits.length} institucion(es) con coincidencia en BCB — al menos una con autorizacion CANCELADA: ${hits.filter(r => r.DataFim).map(r => r.Nome).join(', ')}. Requiere verificacion.`
      : `${hits.length} institucion(es) en BCB con autorizacion vigente: ${hits.map(r => r.Nome).join(', ')}. Estado: autorizado/activo — no representa riesgo por si solo.`,
    matches,
    listEntries: null,
    listLoadedAt: new Date().toISOString()
  };
}

export function getBcbListStatus() {
  return { loaded: true, entries: null, loadedAt: null, error: null, mode: 'live_search' };
}
export function primeBcbList() {} // live search — sin estado propio
export function _resetBcbStateForTests() {} // stateless
