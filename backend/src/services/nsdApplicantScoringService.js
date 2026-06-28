// Algoritmo propietario NSD de scoring de solicitante.
// Portado desde el prototipo Python (USB: NSDFINAL/app/agents/tools.py, may-2026).
// Calcula score 0-100 ponderado, riesgo global y flags de alerta.

const WEIGHTS = { rfc: 0.25, credit: 0.30, ofac: 0.20, clarity: 0.15, delinquency: 0.10 };

export function calculateNsdScore({ rfcData = {}, bureauData = {}, ofacData = {}, clarityData = {} }) {
  const rfcScore = rfcData.valid ? 100 : 0;

  const raw = bureauData.score ?? 0;
  const creditScore = raw ? Math.max(0, Math.min(100, (raw - 300) / 550 * 100)) : 0;

  const ofacScore = ofacData.verdict === 'hit' ? 0 : 100;

  const clarityScore = clarityData?.score ?? 75;

  const delinq = bureauData.delinquency ?? 0;
  const delinqScore = delinq === 0 ? 100 : delinq <= 3 ? 75 : delinq <= 6 ? 50 : 0;

  const final = Math.round((
    rfcScore * WEIGHTS.rfc +
    creditScore * WEIGHTS.credit +
    ofacScore * WEIGHTS.ofac +
    clarityScore * WEIGHTS.clarity +
    delinqScore * WEIGHTS.delinquency
  ) * 100) / 100;

  let grade, recommendation;
  if (final >= 85) { grade = 'AAA'; recommendation = 'APROBADO'; }
  else if (final >= 75) { grade = 'AA'; recommendation = 'APROBADO'; }
  else if (final >= 65) { grade = 'A';  recommendation = 'APROBADO'; }
  else if (final >= 55) { grade = 'BBB'; recommendation = 'REVISAR_MANUALMENTE'; }
  else if (final >= 45) { grade = 'BB'; recommendation = 'REVISAR_MANUALMENTE'; }
  else { grade = 'B'; recommendation = 'RECHAZAR'; }

  return {
    final_score: final,
    grade,
    recommendation,
    breakdown: {
      rfc_score: rfcScore,
      credit_score: Math.round(creditScore * 100) / 100,
      ofac_score: ofacScore,
      clarity_score: clarityScore,
      delinquency_score: delinqScore
    },
    weights: WEIGHTS
  };
}

export function calculateGlobalRisk({ rfcData = {}, bureauData = {}, ofacData = {}, pepData = {}, equifaxData = {}, experianData = {} }) {
  const factors = [];

  if (!rfcData.valid) factors.push({ factor: 'RFC invalido', severity: 4 });
  if (ofacData.verdict === 'hit') factors.push({ factor: 'Sanciones internacionales (OFAC/ONU/UK/EU)', severity: 4 });
  if (pepData.status === 'hit') factors.push({ factor: `PEP: ${pepData.matchedCategory || 'cargo publico'}`, severity: 4 });

  const buroScore = bureauData.score ?? 0;
  if (buroScore && buroScore < 500) factors.push({ factor: 'Score Buro muy bajo', severity: 3 });
  else if (buroScore && buroScore < 650) factors.push({ factor: 'Score Buro moderado', severity: 2 });

  const eqScore = equifaxData.global_score ?? 0;
  if (eqScore && eqScore < 500) factors.push({ factor: 'Equifax Global bajo', severity: 3 });
  else if (eqScore && eqScore < 650) factors.push({ factor: 'Equifax Global moderado', severity: 2 });

  const exScore = experianData.score ?? 0;
  if (exScore && exScore < 500) factors.push({ factor: 'Experian USA bajo', severity: 3 });
  else if (exScore && exScore < 650) factors.push({ factor: 'Experian USA moderado', severity: 2 });

  const delinq = bureauData.delinquency ?? 0;
  if (delinq > 6) factors.push({ factor: 'Morosidad alta', severity: 3 });
  else if (delinq > 0) factors.push({ factor: 'Morosidad', severity: 2 });

  const util = bureauData.utilization ?? 0;
  if (util > 80) factors.push({ factor: 'Utilizacion de credito muy alta', severity: 2 });

  const maxSeverity = factors.length ? Math.max(...factors.map((f) => f.severity)) : 0;
  const globalRisk = maxSeverity >= 4 ? 'CRITICO' : maxSeverity >= 3 ? 'ALTO' : maxSeverity >= 2 ? 'MEDIO' : 'BAJO';

  return { global_risk: globalRisk, risk_factors: factors, risk_count: factors.length };
}

export function detectFlags({ rfcData = {}, bureauData = {}, ofacData = {}, pepData = {} }) {
  const flags = [];

  if (!rfcData.valid) {
    flags.push({ code: 'RFC_INVALID', severity: 'CRITICO', message: `RFC invalido: ${rfcData.status || 'Desconocido'}` });
  }

  const score = bureauData.score ?? 0;
  if (score && score < 500) {
    flags.push({ code: 'LOW_SCORE', severity: 'CRITICO', message: `Score Buro muy bajo: ${score}/850` });
  } else if (score && score < 650) {
    flags.push({ code: 'MEDIUM_SCORE', severity: 'ALTO', message: `Score Buro moderado: ${score}/850` });
  }

  const delinq = bureauData.delinquency ?? 0;
  if (delinq > 6) {
    flags.push({ code: 'DELINQUENCY', severity: 'CRITICO', message: `Morosidad: ${delinq} meses` });
  } else if (delinq > 0) {
    flags.push({ code: 'SOME_DELINQUENCY', severity: 'MEDIO', message: `Morosidad: ${delinq} meses` });
  }

  if (ofacData.verdict === 'hit') {
    flags.push({ code: 'SANCTIONS_HIT', severity: 'CRITICO', message: `Coincidencia en listas de sanciones: ${ofacData.matchedIn?.join(', ') || 'lista internacional'}` });
  }

  if (pepData.status === 'hit') {
    flags.push({ code: 'PEP_MATCH', severity: 'CRITICO', message: `PEP: ${pepData.matchedCategory || 'cargo publico detectado'}` });
  }

  const util = bureauData.utilization ?? 0;
  if (util > 80) {
    flags.push({ code: 'HIGH_UTILIZATION', severity: 'MEDIO', message: `Utilizacion de credito alta: ${util}%` });
  }

  const severityLevel = flags.some((f) => f.severity === 'CRITICO') ? 'CRITICO'
    : flags.some((f) => f.severity === 'ALTO') ? 'ALTO'
    : flags.some((f) => f.severity === 'MEDIO') ? 'MEDIO'
    : 'BAJO';

  return { flags, flag_count: flags.length, severity_level: severityLevel };
}
