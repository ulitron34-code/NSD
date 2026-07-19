import { pickLang } from "../../data/requisitosMinimos";

const financeJourneyByRoleSource = {
  applicant: {
    headline: { es: "Continua tu solicitud de financiamiento", en: "Continue your funding request" },
    nextAction: { es: "Completa los faltantes criticos del expediente antes de solicitar revision.", en: "Complete the file's critical gaps before requesting review." },
    progressLabel: { es: "Preparacion estimada", en: "Estimated preparation" },
    progress: 62,
    effort: { es: "2 a 3 sesiones cortas", en: "2 to 3 short sessions" },
    alerts: [
      { es: "Estados financieros y evidencia fiscal deben quedar trazables.", en: "Financial statements and tax evidence must remain traceable." },
      { es: "La revision institucional mejora si el proyecto tiene supuestos claros.", en: "Institutional review improves when the project has clear assumptions." },
    ],
    goals: [
      { es: "Conseguir financiamiento", en: "Get funding" },
      { es: "Mejorar mi proyecto", en: "Improve my project" },
      { es: "Investigar mi empresa", en: "Research my company" },
      { es: "Dar seguimiento", en: "Follow up" },
    ],
  },
  grantor: {
    headline: { es: "Prioriza casos con evidencia suficiente", en: "Prioritize cases with sufficient evidence" },
    nextAction: { es: "Revisa oportunidades listas para comite y separa las que requieren informacion.", en: "Review opportunities ready for committee and separate those needing information." },
    progressLabel: { es: "Casos revisables", en: "Reviewable cases" },
    progress: 48,
    effort: { es: "Revision por cola y prioridad", en: "Review by queue and priority" },
    alerts: [
      { es: "Casos con score alto aun pueden requerir documentos o autorizaciones.", en: "Cases with a high score may still require documents or authorizations." },
      { es: "La decision final debe conservar revision humana y politicas internas.", en: "The final decision must preserve human review and internal policies." },
    ],
    goals: [
      { es: "Ver cola prioritaria", en: "View priority queue" },
      { es: "Pedir informacion", en: "Request information" },
      { es: "Preparar comite", en: "Prepare committee" },
      { es: "Registrar interes", en: "Register interest" },
    ],
  },
  admin: {
    headline: { es: "Supervisa la operacion financiera", en: "Oversee financial operations" },
    nextAction: { es: "Confirma que expedientes, permisos y estados operativos esten sincronizados.", en: "Confirm files, permissions and operational states are in sync." },
    progressLabel: { es: "Cobertura operativa", en: "Operational coverage" },
    progress: 74,
    effort: { es: "Revision operativa semanal", en: "Weekly operational review" },
    alerts: [
      { es: "Los adapters reutilizan modulos existentes; la unificacion final queda pendiente.", en: "Adapters reuse existing modules; final unification is still pending." },
      { es: "Las rutas nuevas deben permanecer detras de la experiencia NUXERA.", en: "New routes must remain behind the NUXERA experience." },
    ],
    goals: [
      { es: "Auditar expedientes", en: "Audit files" },
      { es: "Revisar permisos", en: "Review permissions" },
      { es: "Medir operacion", en: "Measure operations" },
      { es: "Preparar migracion", en: "Prepare migration" },
    ],
  },
};

function localizeJourney(journey, language) {
  return {
    ...journey,
    headline: pickLang(journey.headline, language),
    nextAction: pickLang(journey.nextAction, language),
    progressLabel: pickLang(journey.progressLabel, language),
    effort: pickLang(journey.effort, language),
    alerts: journey.alerts.map((alert) => pickLang(alert, language)),
    goals: journey.goals.map((goal) => pickLang(goal, language)),
  };
}

export function getFinanceJourney(role = "applicant", language = "es") {
  const journey = financeJourneyByRoleSource[role] || financeJourneyByRoleSource.applicant;
  return localizeJourney(journey, language);
}

function clampProgress(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.min(100, Math.max(0, Math.round(numeric))) : null;
}

function readinessFromGrade(grade) {
  const normalized = String(grade || "").toUpperCase();
  if (["A", "A+", "LISTO", "LISTO PARA COMITE"].includes(normalized)) return 90;
  if (["B", "B+", "SUBSANABLE"].includes(normalized)) return 75;
  if (["C", "C+"].includes(normalized)) return 60;
  if (["D", "E"].includes(normalized)) return 35;
  return null;
}

export function buildFinanceJourneyFromExpedient(expedient, role = "applicant", language = "es") {
  if (!expedient) return { ...getFinanceJourney(role, language), source: "local-fallback", expedientId: null };

  const order = expedient.order || expedient;
  const scoring = expedient.scoring || order.scoring || {};
  const metadata = order.metadata || {};
  const score = clampProgress(scoring.finalScore ?? expedient.averageScore ?? metadata.financialScore);
  const progress = score ?? readinessFromGrade(order.readiness_grade ?? order.readinessGrade ?? expedient.readinessLevel) ?? 0;
  const projectName = order.project_name || order.projectName || expedient.name || order.case_number || pickLang({ es: "Expediente financiero", en: "Financial file" }, language);
  const riskLevel = order.riskLevel || expedient.riskLevel || (progress >= 80 ? "low" : progress >= 60 ? "medium" : "high");
  const risk = order.risk_level || pickLang({ low: { es: "Bajo", en: "Low" }, medium: { es: "Medio", en: "Medium" }, high: { es: "Alto", en: "High" } }[riskLevel], language);
  const documentCount = Number(expedient.documentsCount ?? metadata.documentsCount ?? metadata.documents_count ?? 0);

  return {
    ...getFinanceJourney(role, language),
    source: "real-expedient",
    expedientId: order.id || expedient.id,
    projectName,
    progress,
    progressLabel: role === "grantor"
      ? pickLang({ es: "Score del caso", en: "Case score" }, language)
      : pickLang({ es: "Readiness del expediente", en: "File readiness" }, language),
    headline: role === "grantor"
      ? pickLang({ es: `Evalua ${projectName} con evidencia autorizada`, en: `Evaluate ${projectName} with authorized evidence` }, language)
      : pickLang({ es: `Continua la preparacion de ${projectName}`, en: `Continue preparing ${projectName}` }, language),
    nextAction: progress >= 80
      ? pickLang({ es: "Revisa consistencia, riesgos y condiciones antes de preparar la siguiente decision humana.", en: "Review consistency, risks and conditions before preparing the next human decision." }, language)
      : documentCount > 0
        ? pickLang({ es: "Atiende faltantes y observaciones documentales antes de solicitar la siguiente revision.", en: "Address document gaps and observations before requesting the next review." }, language)
        : pickLang({ es: "Carga y clasifica la evidencia financiera prioritaria del expediente.", en: "Upload and classify the file's priority financial evidence." }, language),
    effort: pickLang(
      { es: `${documentCount} documentos visibles / riesgo ${risk}`, en: `${documentCount} visible documents / ${risk} risk` },
      language
    ),
    alerts: [
      pickLang({ es: `Riesgo actual: ${risk}.`, en: `Current risk: ${risk}.` }, language),
      score === null
        ? pickLang({ es: "El score financiero detallado aun no esta disponible.", en: "The detailed financial score is not yet available." }, language)
        : pickLang({ es: `Score financiero disponible: ${score}/100.`, en: `Financial score available: ${score}/100.` }, language),
    ],
  };
}

export function getFinanceJourneyEvidenceLinks(language = "es") {
  return [
    {
      id: "readiness",
      label: pickLang({ es: "Readiness financiero", en: "Financial readiness" }, language),
      path: "/dashboard/nuxera/finance",
      detail: pickLang({ es: "Checklist, faltantes, evidencia y reporte.", en: "Checklist, gaps, evidence and report." }, language),
    },
    {
      id: "documents",
      label: pickLang({ es: "Inteligencia documental", en: "Document intelligence" }, language),
      path: "/dashboard/nuxera/intelligence",
      detail: pickLang({ es: "Cruces, red flags y validacion de documentos.", en: "Cross-checks, red flags and document validation." }, language),
    },
    {
      id: "strategy",
      label: pickLang({ es: "Soporte de decision", en: "Decision support" }, language),
      path: "/dashboard/nuxera/strategy",
      detail: pickLang({ es: "Supuestos, escenarios y acciones.", en: "Assumptions, scenarios and actions." }, language),
    },
  ];
}
