import { pickLang } from "../../data/requisitosMinimos";

const evidenceLinksSource = [
  {
    id: "finance-readiness",
    engine: "Finance",
    label: { es: "Readiness y expediente financiero", en: "Readiness & financial file" },
    path: "/dashboard/nuxera/finance",
    signal: { es: "Preparacion documental y costo de capital", en: "Document preparation and cost of capital" },
  },
  {
    id: "intelligence-docs",
    engine: "Intelligence",
    label: { es: "Validacion documental y hallazgos", en: "Document validation & findings" },
    path: "/dashboard/nuxera/intelligence",
    signal: { es: "Riesgos, cruces y evidencia de soporte", en: "Risks, cross-checks and supporting evidence" },
  },
  {
    id: "markets-watchlist",
    engine: "Markets",
    label: { es: "Variables de mercado vigiladas", en: "Monitored market variables" },
    path: "/dashboard/nuxera/markets",
    signal: { es: "Tasas, FX, insumos y eventos externos", en: "Rates, FX, inputs and external events" },
  },
];

const guidedQuestionsSource = [
  { es: "Que decision se quiere tomar y que fecha limite tiene?", en: "What decision needs to be made, and what is the deadline?" },
  { es: "Que evidencia financiera, documental y de mercado sostiene la decision?", en: "What financial, documentary and market evidence supports the decision?" },
  { es: "Que supuestos pueden cambiar el resultado en los proximos 30 a 90 dias?", en: "What assumptions could change the outcome over the next 30 to 90 days?" },
  { es: "Que accion es reversible y cual compromete capital, reputacion o cumplimiento?", en: "Which action is reversible, and which commits capital, reputation or compliance?" },
];

const assumptionsSource = [
  {
    id: "capital-cost",
    label: { es: "Costo financiero estable", en: "Stable financial cost" },
    confidence: { es: "Media", en: "Medium" },
    uncertainty: { es: "Puede cambiar por tasas, tipo de cambio o apetito institucional.", en: "Can change due to rates, exchange rate or institutional appetite." },
  },
  {
    id: "document-readiness",
    label: { es: "Expediente subsanable", en: "Fixable file" },
    confidence: { es: "Alta", en: "High" },
    uncertainty: { es: "Depende de evidencia pendiente y tiempos de respuesta.", en: "Depends on pending evidence and response times." },
  },
  {
    id: "market-volatility",
    label: { es: "Volatilidad de mercado acotada", en: "Bounded market volatility" },
    confidence: { es: "Media", en: "Medium" },
    uncertainty: { es: "Eventos macro o commodities pueden alterar margenes.", en: "Macro or commodity events can alter margins." },
  },
];

const scenariosSource = [
  {
    id: "base",
    name: { es: "Base controlado", en: "Controlled base" },
    probability: { es: "Media", en: "Medium" },
    benefit: { es: "Avanza con requerimientos claros y decision reversible.", en: "Moves forward with clear requirements and a reversible decision." },
    risk: { es: "Puede retrasarse si faltan documentos o autorizaciones.", en: "May be delayed if documents or authorizations are missing." },
    action: { es: "Abrir checklist Finance y cerrar evidencia critica antes de comite.", en: "Open the Finance checklist and close critical evidence before committee." },
  },
  {
    id: "upside",
    name: { es: "Aceleracion", en: "Acceleration" },
    probability: { es: "Baja-media", en: "Low-medium" },
    benefit: { es: "Reduce tiempo de revision y mejora narrativa institucional.", en: "Reduces review time and improves the institutional narrative." },
    risk: { es: "Riesgo de sobrerreaccion si se omiten validaciones.", en: "Risk of overreaction if validations are skipped." },
    action: { es: "Usar Intelligence para priorizar hallazgos y preparar paquete ejecutivo.", en: "Use Intelligence to prioritize findings and prepare the executive package." },
  },
  {
    id: "downside",
    name: { es: "Presion externa", en: "External pressure" },
    probability: { es: "Media", en: "Medium" },
    benefit: { es: "Permite activar mitigantes antes de comprometer decision.", en: "Allows activating mitigants before committing to a decision." },
    risk: { es: "FX, tasas o insumos afectan DSCR, margen o covenants.", en: "FX, rates or inputs affect DSCR, margin or covenants." },
    action: { es: "Monitorear Markets y documentar umbrales de pausa o renegociacion.", en: "Monitor Markets and document pause or renegotiation thresholds." },
  },
];

const decisionFlowStagesSource = [
  {
    id: "frame-decision",
    label: { es: "Enmarcar decision", en: "Frame the decision" },
    owner: { es: "Sponsor del caso", en: "Case sponsor" },
    status: "ready",
    gate: { es: "Objetivo, fecha limite y responsable confirmados.", en: "Objective, deadline and owner confirmed." },
    evidenceIds: ["finance-readiness", "intelligence-docs"],
    rollback: { es: "Volver a discovery si cambia el objetivo o falta responsable.", en: "Return to discovery if the objective changes or an owner is missing." },
  },
  {
    id: "stress-evidence",
    label: { es: "Tensionar evidencia", en: "Stress-test evidence" },
    owner: { es: "Analista NUXERA", en: "NUXERA analyst" },
    status: "in-review",
    gate: { es: "Supuestos criticos contrastados contra Finance, Intelligence y Markets.", en: "Critical assumptions checked against Finance, Intelligence and Markets." },
    evidenceIds: ["finance-readiness", "intelligence-docs", "markets-watchlist"],
    rollback: { es: "Pausar decision si un hallazgo critico no tiene fuente verificable.", en: "Pause the decision if a critical finding has no verifiable source." },
  },
  {
    id: "approve-path",
    label: { es: "Elegir ruta controlada", en: "Choose a controlled path" },
    owner: { es: "Comite humano", en: "Human committee" },
    status: "blocked-until-review",
    gate: { es: "Decision documentada con condiciones, mitigantes y umbrales de pausa.", en: "Decision documented with conditions, mitigants and pause thresholds." },
    evidenceIds: ["markets-watchlist"],
    rollback: { es: "No ejecutar acciones irreversibles sin aprobacion y bitacora.", en: "Do not execute irreversible actions without approval and a log." },
  },
];

const decisionReadinessCriteriaSource = [
  {
    id: "evidence-coverage",
    label: { es: "Cobertura de evidencia", en: "Evidence coverage" },
    state: "partial",
    requirement: { es: "Cada supuesto material debe ligar a Finance, Intelligence o Markets.", en: "Every material assumption must link to Finance, Intelligence or Markets." },
  },
  {
    id: "human-review",
    label: { es: "Revision humana", en: "Human review" },
    state: "required",
    requirement: { es: "Una persona autorizada debe aceptar incertidumbre, mitigantes y rollback.", en: "An authorized person must accept uncertainty, mitigants and rollback." },
  },
  {
    id: "reversibility",
    label: { es: "Reversibilidad", en: "Reversibility" },
    state: "controlled",
    requirement: { es: "Separar acciones reversibles de compromisos de capital, reputacion o cumplimiento.", en: "Separate reversible actions from capital, reputation or compliance commitments." },
  },
];

function localizeList(items, fields, language) {
  return items.map((item) => {
    const localized = { ...item };
    fields.forEach((field) => {
      if (item[field]) localized[field] = pickLang(item[field], language);
    });
    return localized;
  });
}

export function getStrategyWorkspace(role = "applicant", language = "es") {
  const roleFocus = {
    applicant: { es: "Preparar una decision de avance con evidencia, supuestos y siguientes acciones.", en: "Prepare an advance decision with evidence, assumptions and next actions." },
    grantor: { es: "Comparar escenarios de riesgo antes de interes, comite o solicitud de informacion.", en: "Compare risk scenarios before interest, committee or an information request." },
    admin: { es: "Alinear operacion, evidencia y politicas antes de activar una decision transversal.", en: "Align operations, evidence and policies before activating a cross-cutting decision." },
  };

  return {
    focus: pickLang(roleFocus[role] || roleFocus.applicant, language),
    guidedQuestions: guidedQuestionsSource.map((question) => pickLang(question, language)),
    assumptions: localizeList(assumptionsSource, ["label", "confidence", "uncertainty"], language),
    scenarios: localizeList(scenariosSource, ["name", "probability", "benefit", "risk", "action"], language),
    evidenceLinks: localizeList(evidenceLinksSource, ["label", "signal"], language),
    decisionFlowStages: localizeList(decisionFlowStagesSource, ["label", "owner", "gate", "rollback"], language),
    decisionReadinessCriteria: localizeList(decisionReadinessCriteriaSource, ["label", "requirement"], language),
    recommendation: {
      summary: pickLang({ es: "Avanzar en modo controlado, cerrando evidencia critica antes de comprometer capital o decision final.", en: "Move forward in controlled mode, closing critical evidence before committing capital or a final decision." }, language),
      uncertainty: pickLang({ es: "Recomendacion sujeta a calidad documental, condiciones de mercado y revision humana autorizada.", en: "Recommendation subject to document quality, market conditions and authorized human review." }, language),
      auditState: pickLang({ es: "Borrador local auditable; persistencia formal pendiente de tarea posterior.", en: "Auditable local draft; formal persistence pending a later task." }, language),
    },
  };
}

export function buildStrategyWorkspaceForExpedient(context, language = "es") {
  const base = getStrategyWorkspace(context?.role, language);
  const order = context?.order;
  if (!order || context?.isDemo) return base;

  const metadata = order.metadata || {};
  const expedient = context.expedient || order;
  const scoring = expedient.scoring || {};
  const projectName = order.project_name || order.projectName || order.case_number || order.id;
  const score = scoring.finalScore ?? expedient.averageScore ?? metadata.financialScore ?? null;
  const risk = order.risk_level || order.riskLevel || expedient.risk || pickLang({ es: "por validar", en: "to validate" }, language);
  const highRisk = ["alto", "high"].includes(String(risk).toLowerCase()) || (score !== null && Number(score) < 60);
  const noScoreLabel = pickLang({ es: "no disponible", en: "not available" }, language);

  return {
    ...base,
    expedientId: order.id,
    focus: pickLang(
      { es: `Soporte de decision para ${projectName}; score ${score ?? noScoreLabel}, riesgo ${risk}.`, en: `Decision support for ${projectName}; score ${score ?? noScoreLabel}, ${risk} risk.` },
      language
    ),
    scenarios: base.scenarios.map((scenario) => ({
      ...scenario,
      action: pickLang(
        { es: `${scenario.action} Aplicar al expediente ${projectName}.`, en: `${scenario.action} Apply to the ${projectName} file.` },
        language
      ),
    })),
    recommendation: {
      ...base.recommendation,
      summary: highRisk
        ? pickLang({ es: `Pausar avance de ${projectName} y cerrar mitigantes antes de comite.`, en: `Pause progress on ${projectName} and close mitigants before committee.` }, language)
        : pickLang({ es: `Avanzar ${projectName} en modo controlado, sujeto a evidencia y revision humana.`, en: `Advance ${projectName} in controlled mode, subject to evidence and human review.` }, language),
      auditState: pickLang(
        { es: `Borrador contextual para ${order.id}; no persistido y no vinculante.`, en: `Contextual draft for ${order.id}; not persisted and not binding.` },
        language
      ),
    },
  };
}

export function buildStrategyDecisionPackageForWorkspace(workspace, language = "es") {
  const blockedCriteria = workspace.decisionReadinessCriteria.filter((criterion) => criterion.state === "required");
  return {
    status: blockedCriteria.length > 0 ? "human-review-required" : "ready-for-record",
    decisionType: "controlled-advance",
    summary: workspace.recommendation.summary,
    requiredEvidenceIds: [...new Set(workspace.decisionFlowStages.flatMap((stage) => stage.evidenceIds))],
    rollbackConditions: workspace.decisionFlowStages.map((stage) => stage.rollback),
    auditTrail: [
      pickLang(
        { es: `Decision package generado para ${workspace.expedientId || "contexto local"}.`, en: `Decision package generated for ${workspace.expedientId || "local context"}.` },
        language
      ),
      pickLang({ es: "No ejecuta aprobaciones automaticas ni cambios de contrato.", en: "It does not execute automated approvals or contract changes." }, language),
      pickLang({ es: "Persistencia formal pendiente de tarea aprobada.", en: "Formal persistence pending an approved task." }, language),
    ],
  };
}

export function getStrategyDecisionPackage(role = "applicant", language = "es") {
  const workspace = getStrategyWorkspace(role, language);
  return buildStrategyDecisionPackageForWorkspace(workspace, language);
}

export function getStrategyActionPlan(language = "es") {
  return [
    { es: "Confirmar objetivo, fecha limite y responsable de la decision.", en: "Confirm the decision's objective, deadline and owner." },
    { es: "Abrir Finance para validar readiness, score y faltantes.", en: "Open Finance to validate readiness, score and gaps." },
    { es: "Abrir Intelligence para revisar evidencia, red flags y cruces.", en: "Open Intelligence to review evidence, red flags and cross-checks." },
    { es: "Abrir Markets para identificar variables externas y umbrales de alerta.", en: "Open Markets to identify external variables and alert thresholds." },
    { es: "Registrar decision humana, supuestos aceptados y condiciones de rollback.", en: "Record the human decision, accepted assumptions and rollback conditions." },
  ].map((step) => pickLang(step, language));
}
