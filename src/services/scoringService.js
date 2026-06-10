// ============================================
// MOTOR DE SCORING REAL PARA EXPEDIENTES
// ============================================

export function calculateScore(documents, expedienteData = {}) {
  let score = 0;
  const breakdown = [];

  // === SECCIÓN 1: DOCUMENTOS (60 puntos) ===
  const docsApproved = documents.filter(d => d.status === 'approved').length;
  const docsTotal = documents.length;
  const docsScore = docsTotal > 0 ? (docsApproved / docsTotal) * 60 : 0;
  score += docsScore;

  breakdown.push({
    category: 'Documentos',
    weight: 60,
    earned: Math.round(docsScore),
    detail: `${docsApproved}/${docsTotal} aprobados`,
    status: docsApproved === docsTotal ? 'complete' : docsApproved > 0 ? 'partial' : 'missing'
  });

  // === SECCIÓN 2: RIESGOS (25 puntos) ===
  const criticalRisks = documents.filter(d => d.risk === 'Critico' || d.risk === 'Alto').length;
  const riskScore = criticalRisks === 0 ? 25 : criticalRisks > 2 ? 0 : 25 - (criticalRisks * 12);
  score += Math.max(0, riskScore);

  breakdown.push({
    category: 'Riesgos Documentales',
    weight: 25,
    earned: Math.max(0, Math.round(riskScore)),
    detail: criticalRisks === 0 ? 'Sin riesgos críticos' : `${criticalRisks} documento(s) con riesgo alto`,
    status: criticalRisks === 0 ? 'complete' : 'partial'
  });

  // === SECCIÓN 3: CONSISTENCIA (15 puntos) ===
  // Verifica que no haya inconsistencias entre documentos
  const hasInconsistencies = expedienteData.hasInconsistencies || false;
  const consistencyScore = hasInconsistencies ? 0 : 15;
  score += consistencyScore;

  breakdown.push({
    category: 'Consistencia',
    weight: 15,
    earned: Math.round(consistencyScore),
    detail: hasInconsistencies ? 'Detectadas inconsistencias entre documentos' : 'Documentos consistentes',
    status: hasInconsistencies ? 'partial' : 'complete'
  });

  const totalScore = Math.round(score);

  // Determinar estado
  let status = 'ROJO';
  let statusColor = '#C62828';
  let canPublish = false;
  let nextActions = [];

  if (totalScore >= 70) {
    status = 'VERDE';
    statusColor = '#2E7D32';
    canPublish = true;
    nextActions = ['Listo para presentar a instituciones financieras'];
  } else if (totalScore >= 50) {
    status = 'AMARILLO';
    statusColor = '#F59E0B';
    canPublish = false;
    nextActions = [];
  } else {
    status = 'ROJO';
    statusColor = '#C62828';
    canPublish = false;
  }

  // Generar próximos pasos si no está completo
  if (docsApproved < docsTotal) {
    const missingDocs = documents.filter(d => d.status !== 'approved');
    nextActions.unshift(`Completar: ${missingDocs.map(d => d.filename || d.name).join(', ')}`);
  }

  if (criticalRisks > 0) {
    const riskyDocs = documents.filter(d => d.risk === 'Critico' || d.risk === 'Alto');
    nextActions.unshift(`Revisar riesgos: ${riskyDocs.map(d => d.filename || d.name).join(', ')}`);
  }

  if (nextActions.length === 0 && totalScore >= 50) {
    nextActions = [
      'Revisar observaciones documentales',
      'Validar consistencia entre documentos'
    ];
  }

  return {
    totalScore,
    status,
    statusColor,
    canPublish,
    breakdown,
    nextActions,
    summary: {
      docsApproved,
      docsTotal,
      criticalRisks,
      hasInconsistencies
    }
  };
}

// Función helper para obtener color del estado
export function getScoreColor(score) {
  if (score >= 70) return '#2E7D32'; // Verde
  if (score >= 50) return '#F59E0B'; // Amarillo
  return '#C62828'; // Rojo
}

// Función helper para obtener label del estado
export function getScoreStatus(score) {
  if (score >= 70) return 'VERDE';
  if (score >= 50) return 'AMARILLO';
  return 'ROJO';
}
