import { buildOtorganteAnalytics, buildOtorgantePipeline } from "../../data/otorgantePipeline";

const grantorDemoOrders = [
  {
    id: "nuxera-gra-001",
    projectName: "Expansion agroindustrial Bajio",
    service_type: "combo-complete",
    status: "paid",
    amount: 18000000,
    created_at: "2026-07-10T15:30:00.000Z",
    metadata: {
      companyName: "AgroNova MX",
      sector: "Agroindustria",
      country: "MX",
      description: "Capital para linea de empaque, certificaciones y contratos de exportacion.",
      targetEntity: "Banco de desarrollo",
      structure: "Credito senior con garantia mobiliaria",
      complianceScore: 84,
      financialScore: 78,
      readinessLevel: "Subsanable",
      documentsCount: 11,
      documents: ["Business plan", "Estados financieros", "KYC/KYB", "Contratos", "Permisos"],
      infoRequests: [{ id: "req-risk", status: "open", title: "Matriz de riesgos actualizada" }],
    },
  },
  {
    id: "nuxera-gra-002",
    projectName: "Plataforma SaaS compliance",
    service_type: "financial-analysis",
    status: "in_progress",
    amount: 9500000,
    created_at: "2026-07-08T11:00:00.000Z",
    metadata: {
      companyName: "RegTech Andes",
      sector: "SaaS B2B",
      country: "CO",
      description: "Financiamiento para ventas enterprise, seguridad y localizacion regional.",
      targetEntity: "Fondo growth",
      structure: "Deuda venture con covenants operativos",
      complianceScore: 88,
      financialScore: 82,
      readinessLevel: "Listo para comite",
      documentsCount: 14,
      documents: ["Modelo financiero", "MRR dashboard", "KYC/KYB", "SOC roadmap"],
      interest: { status: "under_review" },
    },
  },
  {
    id: "nuxera-gra-003",
    projectName: "Infraestructura energia distribuida",
    service_type: "business-plan",
    status: "pending",
    amount: 26000000,
    created_at: "2026-07-04T09:20:00.000Z",
    metadata: {
      companyName: "Luz Norte",
      sector: "Energia",
      country: "MX",
      description: "CAPEX para activos solares C&I y contratos PPA.",
      targetEntity: "Vehiculo privado de deuda",
      structure: "Project finance preliminar",
      complianceScore: 64,
      financialScore: 58,
      readinessLevel: "Preparacion inicial",
      documentsCount: 7,
      documents: ["Resumen ejecutivo", "PPA draft", "KYC/KYB"],
      infoRequests: [{ id: "req-permits", status: "open", title: "Permisos y conexion" }],
    },
  },
];

const riskWeight = {
  Alto: 3,
  Medio: 2,
  Bajo: 1,
};

function getPriority(opportunity) {
  if (opportunity.readinessLevel === "Listo para comite" && opportunity.risk !== "Alto") return "committee-ready";
  if (opportunity.infoRequests?.some((request) => request.status === "open") || opportunity.risk === "Alto") return "needs-information";
  return "watch";
}

function buildDecisionSignals(opportunity) {
  return [
    `Readiness: ${opportunity.readinessLevel}`,
    `Riesgo: ${opportunity.risk}`,
    `Documentos visibles: ${opportunity.documentsCount}`,
    `Ticket: ${opportunity.amountLabel}`,
  ];
}

export function getGrantorCaseQueue() {
  const opportunities = buildOtorgantePipeline(grantorDemoOrders)
    .map((opportunity) => ({
      ...opportunity,
      priority: getPriority(opportunity),
      decisionSignals: buildDecisionSignals(opportunity),
      nextAction: getPriority(opportunity) === "committee-ready"
        ? "Preparar memo de comite y confirmar condiciones no vinculantes."
        : getPriority(opportunity) === "needs-information"
          ? "Solicitar evidencia faltante antes de continuar revision."
          : "Mantener en observacion y revisar cambios de evidencia.",
      evidenceLinks: [
        { engine: "Finance", path: "/dashboard/nuxera/finance", label: "Score y estructura" },
        { engine: "Intelligence", path: "/dashboard/nuxera/intelligence", label: "Documentos y hallazgos" },
        { engine: "Strategy", path: "/dashboard/nuxera/strategy", label: "Escenarios y rollback" },
      ],
    }))
    .sort((a, b) => (riskWeight[b.risk] - riskWeight[a.risk]) || (b.averageScore - a.averageScore));

  return {
    cases: opportunities,
    analytics: buildOtorganteAnalytics(opportunities),
    policies: [
      "La cola no aprueba credito ni emite term sheets automaticamente.",
      "Cada caso requiere revision humana antes de contacto, comite o decision vinculante.",
      "La visibilidad documental debe respetar permisos de data room existentes.",
      "Las senales de riesgo son priorizacion operativa, no decision final.",
    ],
  };
}

export function getGrantorQueueSummary() {
  const queue = getGrantorCaseQueue();
  const committeeReady = queue.cases.filter((item) => item.priority === "committee-ready").length;
  const needsInformation = queue.cases.filter((item) => item.priority === "needs-information").length;

  return {
    total: queue.cases.length,
    committeeReady,
    needsInformation,
    observed: queue.analytics.observed,
    status: needsInformation > 0 ? "information-needed" : "ready-for-review",
    requiresHumanReview: true,
  };
}
function getWorkbenchQuestions(caseItem) {
  return [
    {
      id: "risk-gap",
      label: "Riesgo y faltantes",
      prompt: `Que evidencia falta para bajar riesgo ${caseItem.risk} antes de comite?`,
      owner: "Analista de riesgo",
    },
    {
      id: "structure-fit",
      label: "Estructura",
      prompt: `La estructura ${caseItem.structure} calza con ticket, plazo y garantias?`,
      owner: "Otorgante",
    },
    {
      id: "permission-check",
      label: "Permisos",
      prompt: "El data room permite revisar todos los documentos citados sin ampliar acceso indebidamente?",
      owner: "Operacion NUXERA",
    },
  ];
}

function getWorkbenchConditions(caseItem) {
  return [
    `Confirmar ${caseItem.documentsCount} documentos visibles y vigentes antes de contacto formal.`,
    "Cerrar informacion abierta antes de emitir condiciones no vinculantes.",
    "Registrar decision humana, supuestos y rollback si cambian score, mercado o permisos.",
  ];
}

export function getGrantorCaseWorkbench(caseId) {
  const queue = getGrantorCaseQueue();
  const selectedCase = queue.cases.find((item) => item.id === caseId) || queue.cases[0];

  return {
    case: selectedCase,
    status: selectedCase.priority === "committee-ready" ? "ready-for-memo" : "evidence-required",
    questions: getWorkbenchQuestions(selectedCase),
    requiredEvidence: selectedCase.documents.map((documentName, index) => ({
      id: `${selectedCase.id}-doc-${index + 1}`,
      label: documentName,
      status: index < Math.max(selectedCase.documents.length - 1, 1) ? "visible" : "verify",
    })),
    conditions: getWorkbenchConditions(selectedCase),
    auditTrail: [
      "Workbench local para revision del otorgante.",
      "No emite term sheet ni aprobacion vinculante.",
      "Respeta permisos existentes del data room; no concede accesos nuevos.",
    ],
  };
}
function getMemoRecommendation(caseItem) {
  if (caseItem.priority === "committee-ready") {
    return "Preparar comite interno con condiciones no vinculantes y confirmacion documental.";
  }

  if (caseItem.priority === "needs-information") {
    return "No avanzar a comite hasta cerrar evidencia faltante y actualizar riesgo.";
  }

  return "Mantener en observacion hasta recibir nueva evidencia o cambio de apetito.";
}

export function getGrantorDecisionMemo(caseId) {
  const workbench = getGrantorCaseWorkbench(caseId);
  const caseItem = workbench.case;
  const visibleEvidence = workbench.requiredEvidence.filter((item) => item.status === "visible");
  const pendingEvidence = workbench.requiredEvidence.filter((item) => item.status !== "visible");

  return {
    id: `${caseItem.id}-memo-local`,
    case: caseItem,
    title: `Memo local no vinculante: ${caseItem.name}`,
    status: caseItem.priority === "committee-ready" ? "draft-ready" : "evidence-blocked",
    recommendation: getMemoRecommendation(caseItem),
    thesis: [
      `${caseItem.applicant} solicita ${caseItem.amountLabel} para ${caseItem.sector}.`,
      `Estructura preliminar: ${caseItem.structure}.`,
      `Readiness reportado: ${caseItem.readinessLevel}; riesgo operativo: ${caseItem.risk}.`,
    ],
    evidenceSnapshot: {
      visible: visibleEvidence.length,
      pending: pendingEvidence.length,
      documents: workbench.requiredEvidence,
    },
    riskNotes: [
      `Score promedio observado: ${caseItem.averageScore}/100.`,
      `Faltantes abiertos: ${pendingEvidence.length}.`,
      "La decision final requiere revision humana y evidencia vigente.",
    ],
    proposedConditions: workbench.conditions,
    nextActions: workbench.questions.map((question) => ({
      id: question.id,
      owner: question.owner,
      action: question.prompt,
    })),
    guardrails: [
      "Memo local para preparacion; no es term sheet ni aprobacion de credito.",
      "No cambia permisos del data room ni comparte documentos fuera del flujo existente.",
      "No persiste estado ni crea compromisos vinculantes sin contrato backend aprobado.",
    ],
  };
}
