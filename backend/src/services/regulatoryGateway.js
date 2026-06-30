// Gateway regulatorio NSD — capa nueva sobre el sanctionsGateway existente.
// Orquesta fuentes de inteligencia regulatoria y personas buscadas.
// El endpoint /api/screening/check-full corre AMBOS gateways en paralelo
// y devuelve un resultado consolidado con modelo normalizado.
//
// Importante: sanctionsGateway.js y sus 6 screeners NO se modifican.
// Este modulo los consume y agrega resultados adicionales.

import { screenEntity, getGatewayStatus } from './sanctionsGateway.js';
import { screenNameAgainstInterpol, getInterpolListStatus, primeInterpolList } from './interpolScreening.js';
import { checkCountryFatfRisk, getFatfListStatus, primeFatfList } from './fatfScreening.js';

// 2A — EE.UU. / EAU
import { screenNameAgainstSec, getSecListStatus } from './secScreening.js';
import { screenNameAgainstDfsa, getDfsaListStatus, primeDfsaList } from './dfsaScreening.js';
import { screenNameAgainstVara, getVaraListStatus, primeVaraList } from './varaScreening.js';

// 2B — LATAM
import { screenNameAgainstCnbv, getCnbvListStatus, primeCnbvList } from './cnbvScreening.js';
import { screenNameAgainstBcb, getBcbListStatus } from './bcbScreening.js';
import { screenNameAgainstSfColombia, getSfColombiaListStatus, primeSfColombiaList } from './sfColombiaScreening.js';
import { screenNameAgainstCmfChile, getCmfChileListStatus, primeCmfChileList } from './cmfChileScreening.js';

import { fromLegacyMatch } from './entityModel.js';

// Envuelve cualquier screener (sync o async) en un Promise que nunca rechaza.
// Si el screener falla, retorna { status: 'skipped', detail: msg, matches: [] }.
async function safeRun(label, fn) {
  try {
    return await Promise.resolve(fn());
  } catch (err) {
    return { status: 'skipped', detail: `${label} error interno: ${err.message}`, matches: [], listEntries: null, listLoadedAt: null };
  }
}

// Precarga todas las listas regulatorias en background al arranque del server.
export function primeRegulatoryLists() {
  primeInterpolList();
  primeFatfList();
  // 2A
  primeDfsaList();
  primeVaraList();
  // 2B
  primeCnbvList();
  primeSfColombiaList();
  primeCmfChileList();
  // SEC y BCB son live-search — no precargan
}

// Screening completo: sanciones (6 fuentes) + todos los regulatorios en paralelo.
// name: nombre/razon social requerido.
// country: pais de la contraparte, opcional — si se provee se verifica FATF.
export async function screenEntityFull(name, country = null) {
  const trimmed = String(name || '').trim();
  if (!trimmed) {
    return {
      verdict: 'skipped',
      reason: 'Sin nombre o razon social para verificar',
      entities: [],
      sanctions: {},
      regulatory: {},
      jurisdiction: null,
      screened_at: new Date().toISOString()
    };
  }

  // Ejecutar todo en paralelo: sanciones + INTERPOL + todos los regulatorios nuevos
  const [
    sanctionsResult,
    interpolResult,
    secResult,
    dfsaResult,
    varaResult,
    cnbvResult,
    bcbResult,
    sfResult,
    cmfResult
  ] = await Promise.all([
    safeRun('sanctionsGateway', () => screenEntity(trimmed)),
    safeRun('interpol',         () => screenNameAgainstInterpol(trimmed)),
    safeRun('sec',              () => screenNameAgainstSec(trimmed)),
    safeRun('dfsa',             () => screenNameAgainstDfsa(trimmed)),
    safeRun('vara',             () => screenNameAgainstVara(trimmed)),
    safeRun('cnbv',             () => screenNameAgainstCnbv(trimmed)),
    safeRun('bcb',              () => screenNameAgainstBcb(trimmed)),
    safeRun('sf_colombia',      () => screenNameAgainstSfColombia(trimmed)),
    safeRun('cmf_chile',        () => screenNameAgainstCmfChile(trimmed))
  ]);

  const fatfResult = country ? checkCountryFatfRisk(country) : null;

  // Consolidar entidades detectadas con modelo normalizado
  const entities = [];

  // Hits de sanciones (formato legacy → EntityRecord)
  for (const hit of (sanctionsResult.hits || [])) {
    for (const m of (hit.matches || [])) {
      entities.push(fromLegacyMatch({ ...m, program: hit.source.toUpperCase() }));
    }
  }

  // Hits de screeners regulatorios (ya vienen como EntityRecord)
  const regulatoryResults = [
    interpolResult, secResult, dfsaResult, varaResult,
    cnbvResult, bcbResult, sfResult, cmfResult
  ];
  for (const r of regulatoryResults) {
    if (r.status === 'hit' && Array.isArray(r.matches)) {
      entities.push(...r.matches);
    }
  }

  // Calcular veredicto global
  const hasCritical = entities.some((e) =>
    e.program?.includes('INTERPOL') ||
    e.program?.includes('BLACK') ||
    e.confidence === 'high'
  );
  const hasHit = entities.length > 0 || sanctionsResult.verdict === 'hit';
  const jurisdictionCritical = fatfResult?.riskLevel === 'CRITICAL';
  const jurisdictionHigh = fatfResult?.riskLevel === 'HIGH';

  let verdict;
  if (hasHit || jurisdictionCritical) {
    verdict = hasCritical || jurisdictionCritical ? 'block' : 'review';
  } else if (jurisdictionHigh) {
    verdict = 'review';
  } else {
    verdict = 'clear';
  }

  const buildSource = (r, label, url = null) => ({
    label,
    status: r.status,
    detail: r.detail,
    matches: r.matches || [],
    listEntries: r.listEntries ?? null,
    listLoadedAt: r.listLoadedAt ?? null
  });

  return {
    verdict,
    name: trimmed,
    country: country || null,
    entities: entities.slice(0, 15),
    sanctions: sanctionsResult.results || {},
    regulatory: {
      interpol:    buildSource(interpolResult, 'INTERPOL Red Notices (Publicas)'),
      sec:         buildSource(secResult,      'SEC EDGAR (Enforcement — EE.UU.)'),
      dfsa:        buildSource(dfsaResult,     'DFSA (Dubai Financial Services Authority)'),
      vara:        buildSource(varaResult,     'VARA (Virtual Assets Regulatory, Dubai)'),
      cnbv:        buildSource(cnbvResult,     'CNBV (Comision Nacional Bancaria y de Valores, Mexico)'),
      bcb:         buildSource(bcbResult,      'BCB (Banco Central de Brasil)'),
      sf_colombia: buildSource(sfResult,       'SFC (Superintendencia Financiera de Colombia)'),
      cmf_chile:   buildSource(cmfResult,      'CMF (Comision para el Mercado Financiero, Chile)')
    },
    jurisdiction: fatfResult
      ? {
          country,
          fatf: {
            status: fatfResult.status,
            riskLevel: fatfResult.riskLevel,
            detail: fatfResult.detail
          }
        }
      : null,
    screened_at: new Date().toISOString(),
    note: 'Resultado basado en fuentes publicas oficiales. La ausencia de coincidencia no equivale a certificacion de cumplimiento. Toda coincidencia requiere corroboracion de identidad y revision humana.'
  };
}

export function getRegulatoryGatewayStatus() {
  return {
    sanctions: getGatewayStatus(),
    regulatory: {
      interpol:    getInterpolListStatus(),
      fatf:        getFatfListStatus(),
      sec:         getSecListStatus(),
      dfsa:        getDfsaListStatus(),
      vara:        getVaraListStatus(),
      cnbv:        getCnbvListStatus(),
      bcb:         getBcbListStatus(),
      sf_colombia: getSfColombiaListStatus(),
      cmf_chile:   getCmfChileListStatus()
    }
  };
}
