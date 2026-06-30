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
import { fromLegacyMatch } from './entityModel.js';

// Precarga todas las listas regulatorias nuevas en background.
export function primeRegulatoryLists() {
  primeInterpolList();
  primeFatfList();
}

// Screening completo: sanciones (6 fuentes) + INTERPOL + FATF + futuras fuentes.
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

  // Ejecutar sanctionsGateway y los nuevos screeners en paralelo
  const [sanctionsResult, interpolResult] = await Promise.all([
    screenEntity(trimmed),
    Promise.resolve(screenNameAgainstInterpol(trimmed))
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

  // Hits de INTERPOL (ya vienen como EntityRecord)
  if (interpolResult.status === 'hit') {
    entities.push(...(interpolResult.matches || []));
  }

  // Calcular veredicto global
  const hasCritical = entities.some((e) => e.program?.includes('INTERPOL') || e.confidence === 'high');
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

  return {
    verdict,
    name: trimmed,
    country: country || null,
    entities: entities.slice(0, 10),
    sanctions: sanctionsResult.results || {},
    regulatory: {
      interpol: {
        label: 'INTERPOL Red Notices (Publicas)',
        status: interpolResult.status,
        detail: interpolResult.detail,
        matches: interpolResult.matches || [],
        listEntries: interpolResult.listEntries,
        listLoadedAt: interpolResult.listLoadedAt
      }
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
      interpol: getInterpolListStatus(),
      fatf: getFatfListStatus()
    }
  };
}
