const evidenceLinks = [
  {
    id: "finance-readiness",
    engine: "Finance",
    label: "Readiness y expediente financiero",
    path: "/dashboard/nuxera/finance",
    signal: "Preparacion documental y costo de capital",
  },
  {
    id: "intelligence-docs",
    engine: "Intelligence",
    label: "Validacion documental y hallazgos",
    path: "/dashboard/nuxera/intelligence",
    signal: "Riesgos, cruces y evidencia de soporte",
  },
  {
    id: "markets-watchlist",
    engine: "Markets",
    label: "Variables de mercado vigiladas",
    path: "/dashboard/nuxera/markets",
    signal: "Tasas, FX, insumos y eventos externos",
  },
];

const guidedQuestions = [
  "Que decision se quiere tomar y que fecha limite tiene?",
  "Que evidencia financiera, documental y de mercado sostiene la decision?",
  "Que supuestos pueden cambiar el resultado en los proximos 30 a 90 dias?",
  "Que accion es reversible y cual compromete capital, reputacion o cumplimiento?",
];

const assumptions = [
  {
    id: "capital-cost",
    label: "Costo financiero estable",
    confidence: "Media",
    uncertainty: "Puede cambiar por tasas, tipo de cambio o apetito institucional.",
  },
  {
    id: "document-readiness",
    label: "Expediente subsanable",
    confidence: "Alta",
    uncertainty: "Depende de evidencia pendiente y tiempos de respuesta.",
  },
  {
    id: "market-volatility",
    label: "Volatilidad de mercado acotada",
    confidence: "Media",
    uncertainty: "Eventos macro o commodities pueden alterar margenes.",
  },
];

const scenarios = [
  {
    id: "base",
    name: "Base controlado",
    probability: "Media",
    benefit: "Avanza con requerimientos claros y decision reversible.",
    risk: "Puede retrasarse si faltan documentos o autorizaciones.",
    action: "Abrir checklist Finance y cerrar evidencia critica antes de comite.",
  },
  {
    id: "upside",
    name: "Aceleracion",
    probability: "Baja-media",
    benefit: "Reduce tiempo de revision y mejora narrativa institucional.",
    risk: "Riesgo de sobrerreaccion si se omiten validaciones.",
    action: "Usar Intelligence para priorizar hallazgos y preparar paquete ejecutivo.",
  },
  {
    id: "downside",
    name: "Presion externa",
    probability: "Media",
    benefit: "Permite activar mitigantes antes de comprometer decision.",
    risk: "FX, tasas o insumos afectan DSCR, margen o covenants.",
    action: "Monitorear Markets y documentar umbrales de pausa o renegociacion.",
  },
];

const decisionFlowStages = [
  {
    id: "frame-decision",
    label: "Enmarcar decision",
    owner: "Sponsor del caso",
    status: "ready",
    gate: "Objetivo, fecha limite y responsable confirmados.",
    evidenceIds: ["finance-readiness", "intelligence-docs"],
    rollback: "Volver a discovery si cambia el objetivo o falta responsable.",
  },
  {
    id: "stress-evidence",
    label: "Tensionar evidencia",
    owner: "Analista NUXERA",
    status: "in-review",
    gate: "Supuestos criticos contrastados contra Finance, Intelligence y Markets.",
    evidenceIds: ["finance-readiness", "intelligence-docs", "markets-watchlist"],
    rollback: "Pausar decision si un hallazgo critico no tiene fuente verificable.",
  },
  {
    id: "approve-path",
    label: "Elegir ruta controlada",
    owner: "Comite humano",
    status: "blocked-until-review",
    gate: "Decision documentada con condiciones, mitigantes y umbrales de pausa.",
    evidenceIds: ["markets-watchlist"],
    rollback: "No ejecutar acciones irreversibles sin aprobacion y bitacora.",
  },
];

const decisionReadinessCriteria = [
  {
    id: "evidence-coverage",
    label: "Cobertura de evidencia",
    state: "partial",
    requirement: "Cada supuesto material debe ligar a Finance, Intelligence o Markets.",
  },
  {
    id: "human-review",
    label: "Revision humana",
    state: "required",
    requirement: "Una persona autorizada debe aceptar incertidumbre, mitigantes y rollback.",
  },
  {
    id: "reversibility",
    label: "Reversibilidad",
    state: "controlled",
    requirement: "Separar acciones reversibles de compromisos de capital, reputacion o cumplimiento.",
  },
];

export function getStrategyWorkspace(role = "applicant") {
  const roleFocus = {
    applicant: "Preparar una decision de avance con evidencia, supuestos y siguientes acciones.",
    grantor: "Comparar escenarios de riesgo antes de interes, comite o solicitud de informacion.",
    admin: "Alinear operacion, evidencia y politicas antes de activar una decision transversal.",
  };

  return {
    focus: roleFocus[role] || roleFocus.applicant,
    guidedQuestions,
    assumptions,
    scenarios,
    evidenceLinks,
    decisionFlowStages,
    decisionReadinessCriteria,
    recommendation: {
      summary: "Avanzar en modo controlado, cerrando evidencia critica antes de comprometer capital o decision final.",
      uncertainty: "Recomendacion sujeta a calidad documental, condiciones de mercado y revision humana autorizada.",
      auditState: "Borrador local auditable; persistencia formal pendiente de tarea posterior.",
    },
  };
}

export function buildStrategyWorkspaceForExpedient(context) {
  const base = getStrategyWorkspace(context?.role);
  const order = context?.order;
  if (!order || context?.isDemo) return base;

  const metadata = order.metadata || {};
  const expedient = context.expedient || order;
  const scoring = expedient.scoring || {};
  const projectName = order.project_name || order.projectName || order.case_number || order.id;
  const score = scoring.finalScore ?? expedient.averageScore ?? metadata.financialScore ?? null;
  const risk = order.risk_level || order.riskLevel || expedient.risk || "por validar";
  const highRisk = String(risk).toLowerCase() === "alto" || (score !== null && Number(score) < 60);

  return {
    ...base,
    expedientId: order.id,
    focus: `Soporte de decision para ${projectName}; score ${score ?? "no disponible"}, riesgo ${risk}.`,
    scenarios: base.scenarios.map((scenario) => ({
      ...scenario,
      action: `${scenario.action} Aplicar al expediente ${projectName}.`,
    })),
    recommendation: {
      ...base.recommendation,
      summary: highRisk
        ? `Pausar avance de ${projectName} y cerrar mitigantes antes de comite.`
        : `Avanzar ${projectName} en modo controlado, sujeto a evidencia y revision humana.`,
      auditState: `Borrador contextual para ${order.id}; no persistido y no vinculante.`,
    },
  };
}

export function buildStrategyDecisionPackageForWorkspace(workspace) {
  const blockedCriteria = workspace.decisionReadinessCriteria.filter((criterion) => criterion.state === "required");
  return {
    status: blockedCriteria.length > 0 ? "human-review-required" : "ready-for-record",
    decisionType: "controlled-advance",
    summary: workspace.recommendation.summary,
    requiredEvidenceIds: [...new Set(workspace.decisionFlowStages.flatMap((stage) => stage.evidenceIds))],
    rollbackConditions: workspace.decisionFlowStages.map((stage) => stage.rollback),
    auditTrail: [
      `Decision package generado para ${workspace.expedientId || "contexto local"}.`,
      "No ejecuta aprobaciones automaticas ni cambios de contrato.",
      "Persistencia formal pendiente de tarea aprobada.",
    ],
  };
}

export function getStrategyDecisionPackage(role = "applicant") {
  const workspace = getStrategyWorkspace(role);
  return buildStrategyDecisionPackageForWorkspace(workspace);
}

export function getStrategyActionPlan() {
  return [
    "Confirmar objetivo, fecha limite y responsable de la decision.",
    "Abrir Finance para validar readiness, score y faltantes.",
    "Abrir Intelligence para revisar evidencia, red flags y cruces.",
    "Abrir Markets para identificar variables externas y umbrales de alerta.",
    "Registrar decision humana, supuestos aceptados y condiciones de rollback.",
  ];
}
