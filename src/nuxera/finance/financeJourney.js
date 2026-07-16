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