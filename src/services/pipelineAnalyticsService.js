// ============================================
// ANÁLISIS Y PREDICCIÓN DE PIPELINE
// Scoring, predicción y recomendaciones
// ============================================

export function analyzePipelineOpportunity(opportunity, requirements = [], documents = []) {
  let score = 0;
  const factors = [];

  // === FACTOR 1: PERFIL DEL SOLICITANTE (25 pts) ===
  const profileScore = calculateProfileScore(opportunity);
  score += profileScore * 0.25;
  factors.push({
    name: 'Perfil del Solicitante',
    score: profileScore,
    weight: 0.25,
    indicators: [
      opportunity.complianceScore >= 70 ? '✓ Cumplimiento alto' : '⚠ Cumplimiento bajo',
      opportunity.risk === 'Bajo' ? '✓ Riesgo bajo' : opportunity.risk === 'Medio' ? '~ Riesgo medio' : '✗ Riesgo alto',
      opportunity.readinessLevel === 'Listo para comite' ? '✓ Preparado' : '~ En preparación'
    ]
  });

  // === FACTOR 2: DOCUMENTACIÓN (25 pts) ===
  const docScore = Math.min(documents.length * 5, 25);
  score += docScore;
  factors.push({
    name: 'Documentación',
    score: docScore,
    weight: 0.25,
    indicators: [
      `${documents.length} documento(s) cargado(s)`,
      documents.length >= 5 ? '✓ Completa' : documents.length >= 3 ? '~ Parcial' : '✗ Insuficiente'
    ]
  });

  // === FACTOR 3: RESPONSIVIDAD (20 pts) ===
  const closedReqs = requirements.filter(r => r.status === 'approved').length;
  const totalReqs = requirements.length || 1;
  const responsiveness = (closedReqs / totalReqs) * 20;
  score += responsiveness;
  factors.push({
    name: 'Responsividad',
    score: responsiveness,
    weight: 0.20,
    indicators: [
      `${closedReqs}/${totalReqs} requerimientos cerrados`,
      closedReqs === totalReqs && totalReqs > 0 ? '✓ Totalmente responsivo' : closedReqs > 0 ? '~ Parcialmente responsivo' : '✗ Sin respuestas'
    ]
  });

  // === FACTOR 4: VIABILIDAD FINANCIERA (15 pts) ===
  const finScore = calculateFinancialViability(opportunity);
  score += finScore * 0.15;
  factors.push({
    name: 'Viabilidad Financiera',
    score: finScore,
    weight: 0.15,
    indicators: [
      opportunity.amount > 0 ? `Monto: ${formatCurrency(opportunity.amount)}` : 'Monto no especificado',
      opportunity.financialScore >= 70 ? '✓ Score alto' : '~ Score moderado'
    ]
  });

  // === FACTOR 5: CONTEXTO DE MERCADO (15 pts) ===
  const marketScore = calculateMarketContext(opportunity);
  score += marketScore * 0.15;
  factors.push({
    name: 'Contexto de Mercado',
    score: marketScore,
    weight: 0.15,
    indicators: [
      `Sector: ${opportunity.sector || 'N/A'}`,
      `Región: ${opportunity.country || 'N/A'}`,
      opportunity.readinessLevel ? `Preparación: ${opportunity.readinessLevel}` : 'Preparación indefinida'
    ]
  });

  const totalScore = Math.round(score);

  // Determinar recomendación
  let recommendation = '';
  let action = '';
  let probabilityOfSuccess = 0;

  if (totalScore >= 85) {
    recommendation = 'EXCELENTE - Oportunidad de alto potencial';
    action = 'Avanzar a revisión institucional inmediata';
    probabilityOfSuccess = 0.85;
  } else if (totalScore >= 70) {
    recommendation = 'BUENA - Oportunidad viable con condiciones';
    action = 'Solicitar documentación faltante, luego avanzar';
    probabilityOfSuccess = 0.65;
  } else if (totalScore >= 55) {
    recommendation = 'MODERADA - Requiere trabajo previo';
    action = 'Crear requerimientos específicos para mejora';
    probabilityOfSuccess = 0.40;
  } else if (totalScore >= 40) {
    recommendation = 'DÉBIL - Requiere fortalecimiento significativo';
    action = 'Evaluar capacidad del solicitante para mejorar';
    probabilityOfSuccess = 0.20;
  } else {
    recommendation = 'NO VIABLE - Deficiencias críticas';
    action = 'Declinar o pausar indefinidamente';
    probabilityOfSuccess = 0.05;
  }

  return {
    totalScore,
    probabilityOfSuccess,
    recommendation,
    action,
    factors,
    nextSteps: generateNextSteps(opportunity, requirements, documents, totalScore)
  };
}

// Calcular score de perfil
function calculateProfileScore(opportunity) {
  let score = 0;
  if (opportunity.complianceScore >= 80) score += 10;
  else if (opportunity.complianceScore >= 60) score += 5;

  if (opportunity.risk === 'Bajo') score += 10;
  else if (opportunity.risk === 'Medio') score += 5;

  if (opportunity.readinessLevel === 'Listo para comite') score += 5;

  return Math.min(score, 25);
}

// Calcular viabilidad financiera
function calculateFinancialViability(opportunity) {
  let score = 0;
  if (opportunity.amount > 0) score += 5;
  if (opportunity.financialScore >= 70) score += 8;
  if (opportunity.financialScore >= 80) score += 2;

  return Math.min(score, 15);
}

// Calcular contexto de mercado
function calculateMarketContext(opportunity) {
  let score = 0;
  if (opportunity.sector) score += 5;
  if (opportunity.country) score += 5;
  if (opportunity.readinessLevel) score += 5;

  return Math.min(score, 15);
}

// Generar próximos pasos
function generateNextSteps(opportunity, requirements, documents, score) {
  const steps = [];

  if (documents.length < 5) {
    steps.push(`📄 Solicitar ${5 - documents.length} documento(s) faltante(s)`);
  }

  const openReqs = requirements.filter(r => r.status === 'pending').length;
  if (openReqs > 0) {
    steps.push(`📋 Seguimiento a ${openReqs} requerimiento(s) abierto(s)`);
  }

  if (opportunity.risk === 'Alto') {
    steps.push('⚠️ Revisar y mitigar riesgos identificados');
  }

  if (score >= 70 && opportunity.interest?.status !== 'under_review') {
    steps.push('✅ Registrar interés institucional');
  }

  if (score >= 85 && !opportunity.contactRequest) {
    steps.push('📞 Solicitar contacto autorizado con solicitante');
  }

  return steps;
}

// Análisis comparativo del pipeline
export function analyzeEntirePipeline(opportunities) {
  const analyzed = opportunities.map(opp => ({
    ...opp,
    analysis: analyzePipelineOpportunity(opp, opp.infoRequests || [], opp.documents || [])
  }));

  const byScore = {
    excellent: analyzed.filter(o => o.analysis.totalScore >= 85),
    good: analyzed.filter(o => o.analysis.totalScore >= 70 && o.analysis.totalScore < 85),
    moderate: analyzed.filter(o => o.analysis.totalScore >= 55 && o.analysis.totalScore < 70),
    weak: analyzed.filter(o => o.analysis.totalScore >= 40 && o.analysis.totalScore < 55),
    nonViable: analyzed.filter(o => o.analysis.totalScore < 40)
  };

  const totalValue = opportunities.reduce((sum, o) => sum + (o.amount || 0), 0);
  const valueByScore = {
    excellent: byScore.excellent.reduce((sum, o) => sum + (o.amount || 0), 0),
    good: byScore.good.reduce((sum, o) => sum + (o.amount || 0), 0),
    moderate: byScore.moderate.reduce((sum, o) => sum + (o.amount || 0), 0)
  };

  return {
    total: analyzed.length,
    byScore,
    totalValue,
    valueByScore,
    averageScore: Math.round(analyzed.reduce((sum, o) => sum + o.analysis.totalScore, 0) / analyzed.length),
    readyForCommittee: analyzed.filter(o => o.analysis.totalScore >= 70).length,
    successProbability: analyzed.reduce((sum, o) => sum + o.analysis.probabilityOfSuccess, 0) / analyzed.length
  };
}

// Helper para formatear moneda
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0
  }).format(amount);
}

// Ranking de oportunidades
export function rankOpportunities(opportunities) {
  return opportunities
    .map(opp => ({
      ...opp,
      analysis: analyzePipelineOpportunity(opp, opp.infoRequests || [], opp.documents || [])
    }))
    .sort((a, b) => b.analysis.totalScore - a.analysis.totalScore)
    .map((opp, index) => ({
      ...opp,
      rank: index + 1
    }));
}

// Detectar oportunidades de alto riesgo
export function detectHighRiskOpportunities(opportunities) {
  return opportunities
    .map(opp => ({
      ...opp,
      analysis: analyzePipelineOpportunity(opp, opp.infoRequests || [], opp.documents || [])
    }))
    .filter(opp =>
      opp.analysis.totalScore < 55 ||
      opp.risk === 'Alto' ||
      opp.analysis.factors[2].score < 5 // Responsividad muy baja
    );
}

// Oportunidades listas para comité
export function getCommitteeReadyOpportunities(opportunities) {
  return opportunities
    .map(opp => ({
      ...opp,
      analysis: analyzePipelineOpportunity(opp, opp.infoRequests || [], opp.documents || [])
    }))
    .filter(opp =>
      opp.analysis.totalScore >= 70 &&
      opp.documents && opp.documents.length >= 5
    );
}
