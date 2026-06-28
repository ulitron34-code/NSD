// NSD Transaction Oversight — motor de reglas para monitoreo de operaciones.
// Evalua una transaccion contra un conjunto de reglas configurables y genera
// alertas con severidad, razon y recomendacion. No bloquea automaticamente:
// toda decision de bloqueo corresponde al responsable de la organizacion.
import { screenEntity } from './sanctionsGateway.js';

// ── Reglas base por tipo de alerta ──────────────────────────────────────────

const AMOUNT_THRESHOLDS = {
  USD: { CRITICAL: 500000, HIGH: 100000, MEDIUM: 50000 },
  MXN: { CRITICAL: 10000000, HIGH: 2000000, MEDIUM: 1000000 },
  COP: { CRITICAL: 2000000000, HIGH: 400000000, MEDIUM: 200000000 },
  ARS: { CRITICAL: 500000000, HIGH: 100000000, MEDIUM: 50000000 },
  CLP: { CRITICAL: 500000000, HIGH: 100000000, MEDIUM: 50000000 },
  PEN: { CRITICAL: 2000000, HIGH: 400000, MEDIUM: 200000 },
  DEFAULT: { CRITICAL: 500000, HIGH: 100000, MEDIUM: 50000 },
};

// Paises de alto riesgo FATF / GAFI (lista gris y negra consolidada, referencia publica).
const HIGH_RISK_COUNTRIES = new Set([
  'AF', 'MM', 'KP', 'IR', 'YE', 'SY', 'LY', 'SO',       // lista negra
  'BB', 'BF', 'CM', 'CD', 'GI', 'HT', 'JM', 'JO',        // lista gris
  'ML', 'MZ', 'NG', 'PA', 'PH', 'SN', 'SS', 'TZ', 'TN',
  'TR', 'UG', 'AE', 'VN', 'VU', 'ZA',
]);

// Paises sancionados por OFAC, UE y/o ONU con restriccion total.
const SANCTIONED_COUNTRIES = new Set(['CU', 'IR', 'KP', 'RU', 'SY', 'VE', 'BY', 'MM']);

// Tipos de transaccion de alto riesgo.
const HIGH_RISK_TX_TYPES = new Set([
  'cash', 'efectivo', 'crypto', 'criptomoneda', 'wire_third_party',
  'correspondent_banking', 'hawala', 'informal', 'anonymous'
]);

// ── Motor de reglas ──────────────────────────────────────────────────────────

function checkAmountThreshold(amount, currency = 'USD') {
  const thresholds = AMOUNT_THRESHOLDS[currency.toUpperCase()] || AMOUNT_THRESHOLDS.DEFAULT;
  if (amount >= thresholds.CRITICAL) {
    return { triggered: true, severity: 'CRITICAL', rule: 'AMOUNT_THRESHOLD',
      detail: `Monto ${amount.toLocaleString()} ${currency} supera umbral critico (${thresholds.CRITICAL.toLocaleString()})` };
  }
  if (amount >= thresholds.HIGH) {
    return { triggered: true, severity: 'HIGH', rule: 'AMOUNT_THRESHOLD',
      detail: `Monto ${amount.toLocaleString()} ${currency} supera umbral alto (${thresholds.HIGH.toLocaleString()})` };
  }
  if (amount >= thresholds.MEDIUM) {
    return { triggered: true, severity: 'MEDIUM', rule: 'AMOUNT_THRESHOLD',
      detail: `Monto ${amount.toLocaleString()} ${currency} supera umbral medio (${thresholds.MEDIUM.toLocaleString()})` };
  }
  return { triggered: false };
}

function checkCountryRisk(countryCode) {
  const code = (countryCode || '').toUpperCase();
  if (SANCTIONED_COUNTRIES.has(code)) {
    return { triggered: true, severity: 'CRITICAL', rule: 'SANCTIONED_COUNTRY',
      detail: `Pais "${code}" esta en lista de paises sancionados (OFAC/UE/ONU)` };
  }
  if (HIGH_RISK_COUNTRIES.has(code)) {
    return { triggered: true, severity: 'HIGH', rule: 'HIGH_RISK_COUNTRY',
      detail: `Pais "${code}" esta en lista FATF de jurisdicciones de alto riesgo` };
  }
  return { triggered: false };
}

function checkTransactionType(txType) {
  const type = (txType || '').toLowerCase();
  if (HIGH_RISK_TX_TYPES.has(type)) {
    return { triggered: true, severity: 'HIGH', rule: 'HIGH_RISK_TX_TYPE',
      detail: `Tipo de operacion "${txType}" requiere controles reforzados` };
  }
  return { triggered: false };
}

function checkRoundAmount(amount) {
  if (amount > 0 && amount % 10000 === 0) {
    return { triggered: true, severity: 'MEDIUM', rule: 'ROUND_AMOUNT',
      detail: `Monto exactamente redondo (${amount.toLocaleString()}) — posible estructuracion` };
  }
  return { triggered: false };
}

function checkStructuring(amount, currency = 'USD') {
  const thresholds = AMOUNT_THRESHOLDS[currency.toUpperCase()] || AMOUNT_THRESHOLDS.DEFAULT;
  const gap = thresholds.CRITICAL - amount;
  if (gap >= 0 && gap / thresholds.CRITICAL < 0.05) {
    return { triggered: true, severity: 'HIGH', rule: 'STRUCTURING_RISK',
      detail: `Monto (${amount.toLocaleString()}) queda a menos del 5% del umbral critico — posible estructuracion` };
  }
  return { triggered: false };
}

// ── API publica ──────────────────────────────────────────────────────────────

// Evalua una transaccion contra las reglas y el gateway de sanciones.
// Parametros: { name, amount, currency, countryCode, txType, notes }
// Retorna: { riskLevel, alerts, sanctionsResult, recommendation, evaluated_at }
export async function evaluateTransaction({ name, amount = 0, currency = 'USD', countryCode = '', txType = '', notes = '' }) {
  const alerts = [];

  // Reglas sincronas
  const checks = [
    checkAmountThreshold(Number(amount), currency),
    checkCountryRisk(countryCode),
    checkTransactionType(txType),
    checkRoundAmount(Number(amount)),
    checkStructuring(Number(amount), currency),
  ];

  for (const check of checks) {
    if (check.triggered) alerts.push({ rule: check.rule, severity: check.severity, detail: check.detail });
  }

  // Screening de sanciones (asincrono — gateway)
  let sanctionsResult = null;
  if (name && name.trim()) {
    try {
      sanctionsResult = await screenEntity(name.trim());
      if (sanctionsResult.verdict === 'hit') {
        alerts.push({
          rule: 'SANCTIONS_HIT',
          severity: 'CRITICAL',
          detail: `Nombre "${name}" tiene coincidencias en ${sanctionsResult.hits.map((h) => h.label).join(', ')}`
        });
      }
    } catch {
      alerts.push({ rule: 'SANCTIONS_ERROR', severity: 'LOW', detail: 'No se pudo completar el screening de sanciones' });
    }
  }

  // Nivel de riesgo global
  const hasCritical = alerts.some((a) => a.severity === 'CRITICAL');
  const hasHigh = alerts.some((a) => a.severity === 'HIGH');
  const hasMedium = alerts.some((a) => a.severity === 'MEDIUM');
  const riskLevel = hasCritical ? 'CRITICAL' : hasHigh ? 'HIGH' : hasMedium ? 'MEDIUM' : 'LOW';

  const recommendation =
    riskLevel === 'CRITICAL' ? 'Escalar a oficial de cumplimiento antes de procesar. No aprobar sin revision.' :
    riskLevel === 'HIGH'     ? 'Requiere revision por analista de cumplimiento y documentacion adicional.' :
    riskLevel === 'MEDIUM'   ? 'Agregar nota en expediente y documentar la decision del responsable.' :
                               'Sin alertas identificadas. Proceder segun politicas internas.';

  return {
    riskLevel,
    alerts,
    sanctionsResult: sanctionsResult ? { verdict: sanctionsResult.verdict, hits: sanctionsResult.hits } : null,
    recommendation,
    input: { name, amount: Number(amount), currency, countryCode, txType },
    evaluated_at: new Date().toISOString()
  };
}

// Devuelve la configuracion de reglas activa (para mostrar en el panel).
export function getTransactionRules() {
  return {
    amountThresholds: AMOUNT_THRESHOLDS,
    highRiskCountries: [...HIGH_RISK_COUNTRIES],
    sanctionedCountries: [...SANCTIONED_COUNTRIES],
    highRiskTxTypes: [...HIGH_RISK_TX_TYPES],
    rules: [
      { id: 'AMOUNT_THRESHOLD',   description: 'Monto supera umbral por moneda', severity_range: 'MEDIUM–CRITICAL' },
      { id: 'SANCTIONED_COUNTRY', description: 'Pais en lista de sanciones OFAC/UE/ONU', severity_range: 'CRITICAL' },
      { id: 'HIGH_RISK_COUNTRY',  description: 'Pais en lista gris/negra FATF', severity_range: 'HIGH' },
      { id: 'HIGH_RISK_TX_TYPE',  description: 'Tipo de operacion requiere controles reforzados', severity_range: 'HIGH' },
      { id: 'ROUND_AMOUNT',       description: 'Monto exactamente redondo — posible estructuracion', severity_range: 'MEDIUM' },
      { id: 'STRUCTURING_RISK',   description: 'Monto a menos del 5% del umbral critico', severity_range: 'HIGH' },
      { id: 'SANCTIONS_HIT',      description: 'Nombre con coincidencia en listas de sanciones', severity_range: 'CRITICAL' },
    ]
  };
}
