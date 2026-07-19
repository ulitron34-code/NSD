const financeJourneyByRole = {
  applicant: {
    headline: "Continua tu solicitud de financiamiento",
    nextAction: "Completa los faltantes criticos del expediente antes de solicitar revision.",
    progressLabel: "Preparacion estimada",
    progress: 62,
    effort: "2 a 3 sesiones cortas",
    alerts: [
      "Estados financieros y evidencia fiscal deben quedar trazables.",
      "La revision institucional mejora si el proyecto tiene supuestos claros.",
    ],
    goals: [
      "Conseguir financiamiento",
      "Mejorar mi proyecto",
      "Investigar mi empresa",
      "Dar seguimiento",
    ],
  },
  grantor: {
    headline: "Prioriza casos con evidencia suficiente",
    nextAction: "Revisa oportunidades listas para comite y separa las que requieren informacion.",
    progressLabel: "Casos revisables",
    progress: 48,
    effort: "Revision por cola y prioridad",
    alerts: [
      "Casos con score alto aun pueden requerir documentos o autorizaciones.",
      "La decision final debe conservar revision humana y politicas internas.",
    ],
    goals: [
      "Ver cola prioritaria",
      "Pedir informacion",
      "Preparar comite",
      "Registrar interes",
    ],
  },
  admin: {
    headline: "Supervisa la operacion financiera",
    nextAction: "Confirma que expedientes, permisos y estados operativos esten sincronizados.",
    progressLabel: "Cobertura operativa",
    progress: 74,
    effort: "Revision operativa semanal",
    alerts: [
      "Los adapters reutilizan modulos existentes; la unificacion final queda pendiente.",
      "Las rutas nuevas deben permanecer detras de la experiencia NUXERA.",
    ],
    goals: [
      "Auditar expedientes",
      "Revisar permisos",
      "Medir operacion",
      "Preparar migracion",
    ],
  },
};

export function getFinanceJourney(role = "applicant") {
  return financeJourneyByRole[role] || financeJourneyByRole.applicant;
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

export function buildFinanceJourneyFromExpedient(expedient, role = "applicant") {
  if (!expedient) return { ...getFinanceJourney(role), source: "local-fallback", expedientId: null };

  const order = expedient.order || expedient;
  const scoring = expedient.scoring || order.scoring || {};
  const metadata = order.metadata || {};
  const score = clampProgress(scoring.finalScore ?? expedient.averageScore ?? metadata.financialScore);
  const progress = score ?? readinessFromGrade(order.readiness_grade ?? order.readinessGrade ?? expedient.readinessLevel) ?? 0;
  const projectName = order.project_name || order.projectName || expedient.name || order.case_number || "Expediente financiero";
  const risk = order.risk_level || order.riskLevel || expedient.risk || (progress >= 80 ? "Bajo" : progress >= 60 ? "Medio" : "Alto");
  const documentCount = Number(expedient.documentsCount ?? metadata.documentsCount ?? metadata.documents_count ?? 0);

  return {
    ...getFinanceJourney(role),
    source: "real-expedient",
    expedientId: order.id || expedient.id,
    projectName,
    progress,
    progressLabel: role === "grantor" ? "Score del caso" : "Readiness del expediente",
    headline: role === "grantor" ? `Evalua ${projectName} con evidencia autorizada` : `Continua la preparacion de ${projectName}`,
    nextAction: progress >= 80
      ? "Revisa consistencia, riesgos y condiciones antes de preparar la siguiente decision humana."
      : documentCount > 0
        ? "Atiende faltantes y observaciones documentales antes de solicitar la siguiente revision."
        : "Carga y clasifica la evidencia financiera prioritaria del expediente.",
    effort: `${documentCount} documentos visibles / riesgo ${risk}`,
    alerts: [
      `Riesgo actual: ${risk}.`,
      score === null ? "El score financiero detallado aun no esta disponible." : `Score financiero disponible: ${score}/100.`,
    ],
  };
}

export function getFinanceJourneyEvidenceLinks() {
  return [
    {
      id: "readiness",
      label: "Readiness financiero",
      path: "/dashboard/nuxera/finance",
      detail: "Checklist, faltantes, evidencia y reporte.",
    },
    {
      id: "documents",
      label: "Inteligencia documental",
      path: "/dashboard/nuxera/intelligence",
      detail: "Cruces, red flags y validacion de documentos.",
    },
    {
      id: "strategy",
      label: "Soporte de decision",
      path: "/dashboard/nuxera/strategy",
      detail: "Supuestos, escenarios y acciones.",
    },
  ];
}
