import { REQUIREMENTS_MATRIX } from '../config/requirementsMatrix.js';
import { validateRegulatoryProfile } from './regulatoryValidation.js';

const DEFAULT_MATRIX_KEY = 'MX_BANCA_MFG';

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function inferRequirementMatch(requirement, documents = []) {
  const haystack = normalizeText([
    requirement.code,
    requirement.name,
    requirement.category
  ].join(' '));

  return documents.find((document) => {
    const filename = normalizeText(document.filename || '');
    return haystack
      .split(/\s+/)
      .filter((token) => token.length > 3)
      .some((token) => filename.includes(token));
  });
}

function mapDecision(score, missingMandatoryCount, reviewRiskCount) {
  if (missingMandatoryCount > 0 || score < 60) {
    return {
      status: 'reject',
      label: 'No recomendable',
      reason: 'El expediente tiene requisitos obligatorios faltantes o score insuficiente.'
    };
  }

  if (score < 80 || reviewRiskCount > 0) {
    return {
      status: 'conditional',
      label: 'Viable con condiciones',
      reason: 'El expediente puede avanzar sujeto a subsanar faltantes y validar riesgos.'
    };
  }

  return {
    status: 'approve',
    label: 'Recomendable',
    reason: 'El expediente cumple con la matriz base y presenta riesgo documental controlado.'
  };
}

function mapReadinessGrade(score, missingMandatoryCount, reviewRiskCount, regulatoryFlags = []) {
  const hasBlockingRisk = missingMandatoryCount > 0 || reviewRiskCount > 1 || regulatoryFlags.some((flag) => flag.severity === 'high');

  if (hasBlockingRisk || score < 50) {
    return {
      grade: 'E',
      label: 'No presentable en estado actual',
      color: 'red',
      explanation: 'El expediente tiene faltantes obligatorios, riesgos relevantes o evidencia insuficiente para presentacion institucional.'
    };
  }

  if (score < 65 || reviewRiskCount > 0) {
    return {
      grade: 'D',
      label: 'Riesgo alto o faltantes criticos',
      color: 'red',
      explanation: 'Puede corregirse, pero requiere subsanar observaciones antes de exponerlo a otorgantes.'
    };
  }

  if (score < 80) {
    return {
      grade: 'C',
      label: 'Incompleto pero corregible',
      color: 'amber',
      explanation: 'Tiene base documental, aunque faltan evidencias o validaciones para una revision eficiente.'
    };
  }

  if (score < 92) {
    return {
      grade: 'B',
      label: 'Viable con observaciones menores',
      color: 'blue',
      explanation: 'El expediente esta preparado para revision, sujeto a ajustes o verificaciones puntuales.'
    };
  }

  return {
    grade: 'A',
    label: 'Expediente robusto',
    color: 'green',
    explanation: 'El expediente presenta cobertura documental solida y trazabilidad suficiente para revision institucional.'
  };
}

function summarizeReview(review) {
  if (!review) return null;

  return {
    status: review.status,
    score: Number(review.score || 0),
    summary: review.summary,
    findings: review.findings || [],
    missing_items: review.missing_items || []
  };
}

function getDocumentIssues(document) {
  if (!document) return [];

  const issues = [];
  const reviewStatus = document.review_status;

  if (reviewStatus === 'expired') {
    issues.push({ code: 'expired_status', severity: 'high', label: 'Documento marcado como vencido.' });
  }

  if (reviewStatus === 'rejected') {
    issues.push({ code: 'rejected_status', severity: 'high', label: 'Documento rechazado.' });
  }

  if (document.is_blocking) {
    issues.push({ code: 'blocking_document', severity: 'high', label: 'Documento marcado como bloqueante.' });
  }

  if (document.expires_at) {
    const expiry = new Date(document.expires_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!Number.isNaN(expiry.getTime())) {
      const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        issues.push({ code: 'expired_date', severity: 'high', label: 'Documento con vigencia vencida.' });
      } else if (diffDays <= 30) {
        issues.push({ code: 'near_expiry', severity: 'medium', label: 'Documento por vencer en 30 dias o menos.' });
      }
    }
  }

  return issues;
}

export function resolveMatrixKey({ matrixKey, entityType, sector } = {}) {
  if (matrixKey && REQUIREMENTS_MATRIX[matrixKey]) {
    return matrixKey;
  }

  const normalizedEntity = normalizeText(entityType || '');
  const normalizedSector = normalizeText(sector || '');

  if (normalizedEntity.includes('family') || normalizedSector.includes('startup') || normalizedSector.includes('tecnologia')) {
    return 'MX_FO_STARTUP';
  }

  if (normalizedEntity.includes('sofom') || normalizedSector.includes('sofom')) {
    return 'MX_SOFOM';
  }

  if (normalizedEntity.includes('fintech') || normalizedSector.includes('fintech') || normalizedSector.includes('itf')) {
    return 'MX_FINTECH';
  }

  if (normalizedEntity.includes('inmobiliario') || normalizedSector.includes('inmobiliario') || normalizedSector.includes('real estate') || normalizedEntity.includes('desarrollador')) {
    return 'MX_RE_DEV';
  }

  if (normalizedSector.includes('deuda privada') || normalizedSector.includes('fondo') || normalizedEntity.includes('fondo')) {
    return 'MX_PVT_DEBT';
  }

  return DEFAULT_MATRIX_KEY;
}

export function scoreExpedient({ order, documents = [], reviews = [], matrixKey } = {}) {
  const selectedMatrixKey = resolveMatrixKey({
    matrixKey,
    entityType: order?.metadata?.entityType || order?.metadata?.targetEntity,
    sector: order?.metadata?.sector
  });
  const matrix = REQUIREMENTS_MATRIX[selectedMatrixKey] || REQUIREMENTS_MATRIX[DEFAULT_MATRIX_KEY];
  const reviewByDocumentId = new Map(reviews.map((review) => [review.document_id, review]));

  let earnedWeight = 0;
  let totalWeight = 0;
  let missingMandatoryCount = 0;
  let reviewRiskCount = 0;
  let expiredDocumentsCount = 0;
  let blockingDocumentsCount = 0;

  const requirementResults = matrix.requirements.map((requirement) => {
    const matchedDocument = inferRequirementMatch(requirement, documents);
    const review = matchedDocument ? reviewByDocumentId.get(matchedDocument.id) : null;
    const documentIssues = getDocumentIssues(matchedDocument);
    const reviewScore = Number(review?.score ?? 0);
    const hasHighDocumentIssue = documentIssues.some((issue) => issue.severity === 'high');
    const hasMediumDocumentIssue = documentIssues.some((issue) => issue.severity === 'medium');
    const reviewMultiplier = hasHighDocumentIssue
      ? 0
      : hasMediumDocumentIssue
        ? 0.75
        : review
          ? Math.max(0, Math.min(1, reviewScore / 100))
          : 1;
    const weight = Number(requirement.weight || 0);
    const matchedWeight = matchedDocument ? Math.round(weight * reviewMultiplier) : 0;

    totalWeight += weight;
    earnedWeight += matchedWeight;

    if (!matchedDocument && requirement.is_mandatory) {
      missingMandatoryCount += 1;
    }

    const hasReviewRisk = Boolean(review && (review.status === 'red' || reviewScore < 70)) || documentIssues.length > 0;

    if (hasReviewRisk) {
      reviewRiskCount += 1;
    }

    if (documentIssues.some((issue) => issue.code === 'expired_status' || issue.code === 'expired_date')) {
      expiredDocumentsCount += 1;
    }

    if (documentIssues.some((issue) => issue.code === 'blocking_document' || issue.code === 'rejected_status')) {
      blockingDocumentsCount += 1;
    }

    return {
      code: requirement.code,
      category: requirement.category,
      name: requirement.name,
      mandatory: requirement.is_mandatory,
      weight,
      status: matchedDocument ? (hasReviewRisk ? 'review' : 'present') : 'missing',
      matchedDocument: matchedDocument ? {
        id: matchedDocument.id,
        filename: matchedDocument.filename,
        uploaded_at: matchedDocument.uploaded_at,
        review_status: matchedDocument.review_status || 'uploaded',
        expires_at: matchedDocument.expires_at || null,
        is_blocking: Boolean(matchedDocument.is_blocking),
        version_number: matchedDocument.version_number || 1
      } : null,
      review: summarizeReview(review),
      documentIssues,
      scoreContribution: matchedWeight
    };
  });

  const finalScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  const regulatoryValidation = validateRegulatoryProfile({
    country: order?.metadata?.country || 'MX',
    applicant: order?.metadata || {},
    order
  });
  const recommendation = mapDecision(finalScore, missingMandatoryCount, reviewRiskCount);
  const readinessGrade = mapReadinessGrade(
    finalScore,
    missingMandatoryCount,
    reviewRiskCount,
    regulatoryValidation?.checks || []
  );

  return {
    orderId: order?.id,
    matrixKey: selectedMatrixKey,
    matrix: {
      entity: matrix.entity,
      sector: matrix.sector,
      minDscr: matrix.min_dscr,
      approvalThreshold: matrix.approval_threshold
    },
    finalScore,
    readinessGrade,
    recommendation,
    summary: {
      totalRequirements: matrix.requirements.length,
      uploadedDocuments: documents.length,
      missingMandatory: missingMandatoryCount,
      reviewRisks: reviewRiskCount,
      expiredDocuments: expiredDocumentsCount,
      blockingDocuments: blockingDocumentsCount
    },
    requirementResults,
    regulatoryValidation,
    generatedAt: new Date().toISOString()
  };
}

export function evaluateInstitutionalPublishability(scoringResult, order = {}) {
  const grade = String(scoringResult?.readinessGrade?.grade || order.readiness_grade || 'pendiente').toUpperCase();
  const missingMandatory = Number(scoringResult?.summary?.missingMandatory || 0);
  const reviewRisks = Number(scoringResult?.summary?.reviewRisks || 0);
  const expiredDocuments = Number(scoringResult?.summary?.expiredDocuments || 0);
  const blockingDocuments = Number(scoringResult?.summary?.blockingDocuments || 0);
  const finalScore = Number(scoringResult?.finalScore || 0);
  const complianceStatus = order.compliance_status || order.metadata?.complianceStatus || 'pendiente';
  const manualApproval = Boolean(order.can_share_with_funders || order.metadata?.canShareWithFunders);
  const regulatoryStatus = scoringResult?.regulatoryValidation?.status;
  const allowedByGrade = ['A', 'B', 'C'].includes(grade);
  const allowedByCompliance = ['aprobado_para_presentacion', 'en_revision', 'pendiente'].includes(complianceStatus);
  const hasRegulatoryBlock = regulatoryStatus === 'fail' || regulatoryStatus === 'blocked';

  const blockers = [];
  const warnings = [];

  if (missingMandatory > 0) {
    blockers.push(`${missingMandatory} requisito(s) obligatorio(s) faltante(s).`);
  }

  if (!allowedByGrade) {
    blockers.push(`Grado ${grade}: expediente no presentable sin subsanacion.`);
  }

  if (!allowedByCompliance) {
    blockers.push(`Estado de cumplimiento: ${complianceStatus}.`);
  }

  if (hasRegulatoryBlock) {
    blockers.push('Validacion regulatoria con bloqueo.');
  }

  if (expiredDocuments > 0) {
    blockers.push(`${expiredDocuments} documento(s) vencido(s) o sin vigencia aceptable.`);
  }

  if (blockingDocuments > 0) {
    blockers.push(`${blockingDocuments} documento(s) marcado(s) como bloqueante(s).`);
  }

  if (reviewRisks > 0) {
    warnings.push(`${reviewRisks} documento(s) requieren revision adicional.`);
  }

  if (finalScore < 80) {
    warnings.push(`Score interno ${finalScore}/100: compartir solo con contexto de pendientes.`);
  }

  const canPublish = manualApproval || (blockers.length === 0 && allowedByGrade);

  return {
    canPublish,
    manualApproval,
    grade,
    finalScore,
    complianceStatus,
    regulatoryStatus: regulatoryStatus || 'N/D',
    blockers,
    warnings,
    nextAction: canPublish
      ? 'El expediente puede compartirse con otorgantes bajo trazabilidad NSD.'
      : 'Subsanar bloqueos o autorizar manualmente antes de compartir con otorgantes.'
  };
}

export function buildExecutiveReport(scoringResult) {
  const missing = scoringResult.requirementResults
    .filter((item) => item.status === 'missing')
    .map((item) => item.name);
  const risks = scoringResult.requirementResults
    .filter((item) => item.review?.status === 'red' || Number(item.review?.score || 100) < 70)
    .map((item) => item.name);

  return {
    globalScore: scoringResult.finalScore,
    readinessGrade: scoringResult.readinessGrade,
    decisionRecommendation: scoringResult.recommendation.status,
    executiveConclusion: `${scoringResult.readinessGrade.grade} - ${scoringResult.readinessGrade.label}. ${scoringResult.readinessGrade.explanation}`,
    matrix: scoringResult.matrix,
    agentResults: [
      {
        reviewArea: 'documental',
        score: scoringResult.finalScore,
        decisionImpact: scoringResult.recommendation.status,
        keyFindings: [
          `${scoringResult.summary.uploadedDocuments} documentos vinculados al expediente.`,
          `${scoringResult.summary.totalRequirements} requisitos evaluados contra matriz ${scoringResult.matrixKey}.`
        ],
        redFlags: [...missing, ...risks]
      }
    ],
    regulatoryValidation: scoringResult.regulatoryValidation,
    criticalRisks: risks.length ? risks : missing,
    mitigants: scoringResult.finalScore >= 80
      ? ['Matriz documental cubierta con nivel suficiente para revisión de comité.']
      : [],
    missingInformation: missing,
    recommendedConditions: missing.map((item) => `Subsanar o justificar: ${item}`),
    generatedAt: scoringResult.generatedAt
  };
}

export function buildInstitutionalMemo(scoringResult, order = {}) {
  const report = buildExecutiveReport(scoringResult);
  const metadata = order.metadata || {};
  const caseNumber = order.case_number || `NSD-${String(order.id || '').slice(0, 8).toUpperCase()}`;
  const projectName = order.project_name || metadata.projectName || metadata.companyName || 'Proyecto sin nombre';
  const applicant = metadata.companyName || metadata.contactEmail || metadata.email || 'Solicitante NSD';
  const requestedAmount = Number(order.requested_amount || metadata.requestedAmount || metadata.investmentRequired || order.amount || 0);
  const missingMandatory = scoringResult.requirementResults.filter((item) => item.status === 'missing' && item.mandatory);
  const observed = scoringResult.requirementResults.filter((item) => item.status === 'review');
  const present = scoringResult.requirementResults.filter((item) => item.status === 'present');

  const lines = [
    '# Memo institucional NSD',
    '',
    '## 1. Resumen ejecutivo',
    `- Expediente: ${caseNumber}`,
    `- Proyecto: ${projectName}`,
    `- Solicitante: ${applicant}`,
    `- Monto solicitado: ${requestedAmount ? requestedAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) : 'No especificado'}`,
    `- Matriz aplicada: ${scoringResult.matrix.entity} / ${scoringResult.matrix.sector}`,
    `- Score interno: ${scoringResult.finalScore}/100`,
    `- Grado de preparación: ${scoringResult.readinessGrade.grade} - ${scoringResult.readinessGrade.label}`,
    `- Recomendación preliminar: ${report.decisionRecommendation}`,
    '',
    '## 2. Conclusión',
    report.executiveConclusion,
    '',
    '## 3. Cobertura documental',
    `- Requisitos evaluados: ${scoringResult.summary.totalRequirements}`,
    `- Documentos cargados: ${scoringResult.summary.uploadedDocuments}`,
    `- Requisitos presentes: ${present.length}`,
    `- Obligatorios faltantes: ${missingMandatory.length}`,
    `- Documentos observados: ${observed.length}`,
    '',
    '## 4. Faltantes obligatorios',
    ...(missingMandatory.length ? missingMandatory.map((item) => `- ${item.name}`) : ['- Sin faltantes obligatorios detectados.']),
    '',
    '## 5. Observaciones y riesgos',
    ...(report.criticalRisks.length ? report.criticalRisks.map((item) => `- ${item}`) : ['- Sin riesgos críticos detectados en la matriz actual.']),
    '',
    '## 6. Condiciones sugeridas',
    ...(report.recommendedConditions.length ? report.recommendedConditions.map((item) => `- ${item}`) : ['- Mantener expediente actualizado y evidencia vigente.']),
    '',
    '## 7. Validación regulatoria preliminar',
    `- País: ${report.regulatoryValidation?.country || 'N/D'}`,
    `- Estado: ${report.regulatoryValidation?.status || 'N/D'}`,
    `- Controles aprobados: ${report.regulatoryValidation?.summary?.passed || 0}`,
    `- Controles pendientes/sin proveedor: ${report.regulatoryValidation?.summary?.skipped || 0}`,
    '',
    '## 8. Nota de alcance',
    'Este memo es una evaluación preliminar de preparación documental y cumplimiento operativo. No constituye aprobación crediticia, opinión legal, fiscal, financiera ni decisión vinculante de una entidad otorgante.',
    '',
    `Generado: ${new Date(scoringResult.generatedAt).toLocaleString('es-MX')}`
  ];

  return {
    ...report,
    memo: {
      title: `Memo institucional ${caseNumber}`,
      format: 'markdown',
      content: lines.join('\n')
    }
  };
}
