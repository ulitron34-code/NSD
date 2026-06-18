import { getExpedienteRedFlags, getCrossReferences, logAgentAction } from '../services/documentIntelligenceService.js';
import { validateRegulatoryProfile } from '../services/regulatoryValidation.js';

// Reglas que ya escribe AgentFinancial en document_verifications. Todo lo demas
// que llegue desde document_verifications (AgentValidator) se cuenta como
// Riesgo de Cumplimiento.
const FINANCIAL_RULE_CODES = new Set([
  'BALANCE_CUADRA',
  'UTILIDAD_COHERENTE',
  'BENCHMARK_MARGEN_NETO',
  'BENCHMARK_APALANCAMIENTO',
  'BENCHMARK_DSCR',
  'FORENSE_ROE_ANOMALO',
  'FORENSE_ROA_ANOMALO',
  'FORENSE_BENFORD_LAW'
]);

// document_verifications usa severidades 'critical'/'error'/'warning'/'info';
// regulatoryValidation usa 'high'/'medium'/'low'/'info'. Se unifican en una
// sola tabla de puntos para no duplicar logica de mapeo.
const SEVERITY_POINTS = {
  critical: 12,
  high: 8,
  error: 8,
  medium: 4,
  warning: 4,
  low: 1,
  info: 0
};

const BLOCKING_SEVERITIES = new Set(['critical', 'high']);
const PILLAR_MAX = 25;

function pointsForSeverity(severity) {
  return SEVERITY_POINTS[severity] ?? 4;
}

function clampPillar(points) {
  return Math.max(0, Math.min(PILLAR_MAX, Math.round(points)));
}

function semaforoFor(score) {
  if (score <= 20) return 'Verde';
  if (score <= 40) return 'Amarillo';
  if (score <= 60) return 'Naranja';
  if (score <= 80) return 'Rojo';
  return 'Crítico';
}

function recommendationFor(scoreFinal, hasBlockingFlag) {
  if (hasBlockingFlag || scoreFinal > 80) return 'RECHAZADO';
  if (scoreFinal > 60) return 'APROBADO_CON_GARANTIAS_REFORZADAS';
  if (scoreFinal > 40) return 'APROBADO_CON_CONDICIONES';
  return 'APROBADO';
}

// Agrega en un score de riesgo 0-100 a 4 pilares (Regulatorio, Financiero,
// Operacional, Cumplimiento) los hallazgos REALES que ya producen
// AgentValidator, AgentFinancial, AgentCrossRef y el screening regulatorio
// (OFAC/SAT/UIF). No evalua los sub-criterios cualitativos de la rubrica
// original (gobernanza, track record, antecedentes personales) porque esos
// requieren juicio humano/documentacion que la plataforma no captura todavia;
// se reportan como "informacion_pendiente" en vez de inventarse un valor.
export async function computeExpedienteRiskScore(expedienteId, { order = null, sector = 'General' } = {}) {
  const startTime = Date.now();

  const [redFlags, crossReferences] = await Promise.all([
    getExpedienteRedFlags(expedienteId),
    getCrossReferences(expedienteId)
  ]);

  const regulatoryValidation = validateRegulatoryProfile({
    country: order?.metadata?.country || 'MX',
    applicant: order?.metadata || {},
    order
  });

  let cumplimientoPoints = 0;
  let financieroPoints = 0;
  let operacionalPoints = 0;
  let regulatorioPoints = 0;
  let hasBlockingFlag = false;
  const redFlagsDetalle = [];

  for (const flag of redFlags || []) {
    const points = pointsForSeverity(flag.severity);
    const pilar = FINANCIAL_RULE_CODES.has(flag.rule_code) ? 'financiero' : 'cumplimiento';
    if (pilar === 'financiero') financieroPoints += points;
    else cumplimientoPoints += points;
    if (BLOCKING_SEVERITIES.has(flag.severity)) hasBlockingFlag = true;
    if (points > 0) {
      redFlagsDetalle.push({
        pilar,
        rule_code: flag.rule_code,
        severidad: flag.severity,
        hallazgo: flag.findings,
        documento: flag.filename
      });
    }
  }

  for (const ref of crossReferences || []) {
    if (ref.status === 'fail') {
      operacionalPoints += 10;
      hasBlockingFlag = true;
      redFlagsDetalle.push({ pilar: 'operacional', rule_code: ref.cross_reference_type, severidad: 'high', hallazgo: ref.details });
    } else if (ref.status === 'warning') {
      operacionalPoints += 5;
      redFlagsDetalle.push({ pilar: 'operacional', rule_code: ref.cross_reference_type, severidad: 'medium', hallazgo: ref.details });
    }
  }

  for (const check of regulatoryValidation.checks) {
    if (check.status === 'fail') {
      const points = pointsForSeverity(check.severity);
      regulatorioPoints += points;
      if (BLOCKING_SEVERITIES.has(check.severity)) hasBlockingFlag = true;
      redFlagsDetalle.push({ pilar: 'regulatorio', rule_code: check.provider, severidad: check.severity, hallazgo: check.detail });
    }
  }

  const pilares = {
    riesgo_regulatorio: clampPillar(regulatorioPoints),
    riesgo_financiero: clampPillar(financieroPoints),
    riesgo_operacional: clampPillar(operacionalPoints),
    riesgo_cumplimiento: clampPillar(cumplimientoPoints)
  };

  const scoreFinal = Math.round(
    (pilares.riesgo_regulatorio + pilares.riesgo_financiero + pilares.riesgo_operacional + pilares.riesgo_cumplimiento) / 4
  );

  const informacionPendiente = [];
  if (!crossReferences || !crossReferences.length) {
    informacionPendiente.push('Sin cruces documentales calculados (se requieren al menos 2 documentos procesados por AgentCrossRef)');
  }
  const skippedProviders = regulatoryValidation.checks.filter((c) => c.status === 'skipped');
  if (skippedProviders.length) {
    informacionPendiente.push(
      `${skippedProviders.length} verificación(es) regulatoria(s) sin proveedor configurado: ${skippedProviders.map((c) => c.label).join(', ')}`
    );
  }

  const duration = (Date.now() - startTime) / 1000;
  await logAgentAction(
    'AgentRiskScorer',
    'compute_risk_score',
    { expedienteId, sector, scoreFinal, semaforo: semaforoFor(scoreFinal), durationSeconds: duration },
    0.0
  );

  return {
    expedienteId,
    fecha_evaluacion: new Date().toISOString(),
    sector,
    pilares,
    score_final: scoreFinal,
    semaforo: semaforoFor(scoreFinal),
    recomendacion: recommendationFor(scoreFinal, hasBlockingFlag),
    red_flags: redFlagsDetalle,
    informacion_pendiente: informacionPendiente,
    metodologia: 'Heurística determinista sobre hallazgos reales de AgentValidator, AgentFinancial, AgentCrossRef y screening regulatorio (OFAC/SAT/UIF). No reproduce los sub-criterios cualitativos de la rúbrica original (gobernanza, track record, antecedentes personales); esos se marcan como información pendiente en vez de inventarse.'
  };
}
