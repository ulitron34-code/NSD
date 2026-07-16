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
    recommendation: {
      summary: "Avanzar en modo controlado, cerrando evidencia critica antes de comprometer capital o decision final.",
      uncertainty: "Recomendacion sujeta a calidad documental, condiciones de mercado y revision humana autorizada.",
      auditState: "Borrador local auditable; persistencia formal pendiente de tarea posterior.",
    },
  };
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