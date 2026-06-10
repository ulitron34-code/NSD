// ============================================
// SCORING DE OPORTUNIDADES PARA OTORGANTE
// Evaluación integral de un proyecto/solicitante
// ============================================

export function scoreOpportunity(opportunity, requirements = [], documents = []) {
  let score = 0;
  const breakdown = [];

  // === SECCIÓN 1: DOCUMENTACIÓN (30 puntos) ===
  const docCount = documents.length || opportunity.documentsCount || 0;
  const docsScore = Math.min(docCount * 6, 30); // 5 docs = 30 pts
  score += docsScore;

  breakdown.push({
    category: 'Documentación',
    weight: 30,
    earned: Math.round(docsScore),
    detail: `${docCount} documento(s) cargado(s)`,
    status: docCount >= 5 ? 'complete' : docCount >= 3 ? 'partial' : 'missing'
  });

  // === SECCIÓN 2: CUMPLIMIENTO FINANCIERO (25 puntos) ===
  const hasFinancialDocs = docCount >= 3; // RFC, estados financieros, etc.
  const complianceScore = hasFinancialDocs ? 25 : docCount >= 1 ? 12 : 0;
  score += complianceScore;

  breakdown.push({
    category: 'Cumplimiento Financiero',
    weight: 25,
    earned: Math.round(complianceScore),
    detail: hasFinancialDocs ? 'Documentación fiscal/financiera presente' : 'Documentos de cumplimiento insuficientes',
    status: hasFinancialDocs ? 'complete' : 'partial'
  });

  // === SECCIÓN 3: RESPONSIVIDAD (20 puntos) ===
  const openRequirements = requirements.filter(r => r.status === 'pending').length;
  const closedRequirements = requirements.filter(r => r.status === 'approved').length;
  const totalReqs = openRequirements + closedRequirements || 1;
  const responsiveness = (closedRequirements / totalReqs) * 20;
  score += responsiveness;

  breakdown.push({
    category: 'Responsividad',
    weight: 20,
    earned: Math.round(responsiveness),
    detail: `${closedRequirements}/${totalReqs} requerimientos cerrados`,
    status: closedRequirements === totalReqs && totalReqs > 0 ? 'complete' : closedRequirements > 0 ? 'partial' : 'missing'
  });

  // === SECCIÓN 4: SEÑALES DE CALIDAD (15 puntos) ===
  const riskLevel = opportunity.risk || 'Medio';
  const qualityScore = riskLevel === 'Bajo' ? 15 : riskLevel === 'Medio' ? 10 : 0;
  score += qualityScore;

  breakdown.push({
    category: 'Calidad del Perfil',
    weight: 15,
    earned: qualityScore,
    detail: `Riesgo clasificado como: ${riskLevel}`,
    status: riskLevel === 'Bajo' ? 'complete' : riskLevel === 'Medio' ? 'partial' : 'missing'
  });

  // === SECCIÓN 5: TICKET VIABLE (10 puntos) ===
  const amount = opportunity.amount || 0;
  const ticketScore = amount > 0 ? 10 : 0;
  score += ticketScore;

  breakdown.push({
    category: 'Ticket Definido',
    weight: 10,
    earned: ticketScore,
    detail: amount > 0 ? `Monto: ${formatCurrency(amount)}` : 'Monto no especificado',
    status: amount > 0 ? 'complete' : 'missing'
  });

  const totalScore = Math.round(score);

  // Determinar estado
  let status = 'ROJO';
  let statusColor = '#C62828';
  let recommendation = '';
  let nextSteps = [];

  if (totalScore >= 80) {
    status = 'VERDE';
    statusColor = '#2E7D32';
    recommendation = 'Apto para seguimiento activo y contacto directo.';
    nextSteps = [
      'Registrar interés institucional',
      'Solicitar información complementaria específica',
      'Agendar contacto con solicitante'
    ];
  } else if (totalScore >= 60) {
    status = 'AMARILLO';
    statusColor = '#F59E0B';
    recommendation = 'Requiere subsanación documental antes de avanzar.';
    nextSteps = [
      'Crear requerimientos específicos',
      'Esperar respuesta del solicitante',
      'Reevaluar con documentación completa'
    ];
  } else {
    status = 'ROJO';
    statusColor = '#C62828';
    recommendation = 'Requiere fortalecimiento integral antes de considerar.';
    nextSteps = [
      'Comunicar observaciones al solicitante',
      'Solicitar documentación crítica faltante',
      'Evaluación diferida hasta mejora material'
    ];
  }

  return {
    totalScore,
    status,
    statusColor,
    recommendation,
    breakdown,
    nextSteps,
    summary: {
      docCount,
      openRequirements,
      closedRequirements,
      riskLevel,
      amount
    }
  };
}

// Función helper para obtener color
export function getOpportunityScoreColor(score) {
  if (score >= 80) return '#2E7D32'; // Verde
  if (score >= 60) return '#F59E0B'; // Amarillo
  return '#C62828'; // Rojo
}

// Función helper para obtener estado
export function getOpportunityScoreStatus(score) {
  if (score >= 80) return 'VERDE';
  if (score >= 60) return 'AMARILLO';
  return 'ROJO';
}

// Helper para formatear moneda
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0
  }).format(amount);
}

// Análisis de fortalezas y debilidades
export function analyzeOpportunityStrengths(opportunity, requirements = []) {
  const strengths = [];
  const weaknesses = [];

  // Fortalezas
  if (opportunity.risk === 'Bajo') {
    strengths.push('Perfil de riesgo bajo');
  }
  if (opportunity.documentsCount >= 5) {
    strengths.push('Documentación completa');
  }
  if (opportunity.complianceScore >= 70) {
    strengths.push('Score de cumplimiento alto');
  }
  const closedReqs = requirements.filter(r => r.status === 'approved').length;
  if (closedReqs > 0) {
    strengths.push(`${closedReqs} requerimiento(s) cerrado(s) exitosamente`);
  }
  if (opportunity.readinessLevel === 'Listo para comite') {
    strengths.push('Expediente listo para comité');
  }

  // Debilidades
  if (!opportunity.amount || opportunity.amount === 0) {
    weaknesses.push('Monto no especificado');
  }
  if (opportunity.documentsCount < 3) {
    weaknesses.push('Documentación insuficiente');
  }
  if (opportunity.risk === 'Alto') {
    weaknesses.push('Riesgo clasificado como alto');
  }
  const openReqs = requirements.filter(r => r.status === 'pending').length;
  if (openReqs > 0) {
    weaknesses.push(`${openReqs} requerimiento(s) pendiente(s)`);
  }
  if (opportunity.complianceScore < 60) {
    weaknesses.push('Deficiencias en cumplimiento regulatorio');
  }

  return {
    strengths: strengths.length > 0 ? strengths : ['Sin fortalezas identificadas aún'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['Sin debilidades detectadas']
  };
}
