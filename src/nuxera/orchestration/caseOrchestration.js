const AGENT_DEFINITIONS = [
  ["document", "Document Agent", "Clasificar y validar evidencia documental", "Intelligence"],
  ["compliance", "Compliance Agent", "Revisar identidad, permisos y cumplimiento", "Intelligence"],
  ["risk", "Risk Agent", "Consolidar riesgos financieros y operativos", "Strategy"],
  ["financial", "Financial Analysis Agent", "Analizar readiness, score y capacidad financiera", "Finance"],
  ["company", "Company Intelligence Agent", "Contextualizar empresa, grupo y contraparte", "Intelligence"],
  ["market", "Market Intelligence Agent", "Vigilar tasas, FX, insumos y sector", "Markets"],
  ["strategy", "Strategy Agent", "Comparar escenarios y mitigantes", "Strategy"],
  ["report", "Report Agent", "Preparar un borrador trazable no vinculante", "Strategy"],
  ["quality", "Quality Agent", "Comprobar cobertura, consistencia y fuentes", "Quality"],
  ["security", "Security Agent", "Verificar alcance, rol y segregacion", "Security"],
  ["orchestrator", "Orchestrator Agent", "Ordenar tareas y detener flujos inseguros", "Orchestration"],
];

function getOrderIdentity(context) {
  const order = context?.order;
  if (!order) return null;
  return {
    id: order.id,
    label: order.project_name || order.projectName || order.case_number || order.id,
    risk: order.risk_level || order.riskLevel || context.expedient?.risk || "por validar",
    score: context.expedient?.scoring?.finalScore ?? context.expedient?.averageScore ?? order.metadata?.financialScore ?? null,
    documentCount: Number(context.expedient?.documentsCount ?? order.metadata?.documentsCount ?? order.metadata?.documents_count ?? 0),
  };
}

export function buildContextAccessEnvelope(context = {}) {
  const identity = getOrderIdentity(context);
  const expectedSource = context.role === "applicant"
    ? "applicant-order"
    : context.role === "grantor"
      ? "authorized-grantor-entry"
      : "no-expedient";
  const sourceAligned = context.source === expectedSource;
  const selectable = identity && context.selectedId === identity.id;
  const allowed = Boolean(identity && sourceAligned && selectable && !context.isDemo);

  return {
    allowed,
    mode: allowed ? "role-scoped-read-only" : "blocked-no-authorized-context",
    role: context.role,
    source: context.source,
    expedientId: identity?.id || null,
    checks: [
      { id: "role-source", passed: sourceAligned, detail: `Fuente esperada: ${expectedSource}.` },
      { id: "selected-expedient", passed: Boolean(selectable), detail: "El expediente debe coincidir con la seleccion compartida." },
      { id: "demo-isolation", passed: !context.isDemo, detail: "Demo nunca habilita lectura real." },
    ],
    guardrails: [
      "El envelope no concede permisos; solo refleja el contexto ya autorizado por backend.",
      "Ningun agente puede ampliar data-room shares, roles o acceso documental.",
      "Toda decision material requiere revision humana y registro auditable.",
    ],
  };
}

export function buildCaseOrchestration(context = {}) {
  const identity = getOrderIdentity(context);
  const access = buildContextAccessEnvelope(context);
  if (!identity || !access.allowed) {
    return {
      status: "blocked-no-authorized-context",
      identity,
      access,
      agents: [],
      evidencePackage: { status: "not-available", items: [] },
      summary: { agents: 0, ready: 0, waitingEvidence: 0, humanReview: 0 },
    };
  }

  const evidencePackage = {
    status: identity.documentCount > 0 ? "partial-evidence-visible" : "evidence-required",
    items: [
      { id: "order", label: "Identidad del expediente", status: "available", source: context.source },
      { id: "documents", label: "Documentos autorizados", status: identity.documentCount > 0 ? "available" : "missing", source: "data-room-summary" },
      { id: "score", label: "Scoring financiero", status: identity.score !== null ? "available" : "missing", source: "Finance" },
      { id: "risk", label: "Riesgo declarado", status: identity.risk !== "por validar" ? "available" : "missing", source: "selected-order" },
      { id: "market", label: "Contexto de mercado", status: "delayed-only", source: "Markets local provider" },
    ],
  };
  const availableEvidence = evidencePackage.items.filter((item) => item.status === "available").length;
  const confidence = availableEvidence >= 4 ? "media-alta" : availableEvidence >= 2 ? "media" : "baja";
  const agents = AGENT_DEFINITIONS.map(([id, label, objective, engine], index) => {
    const requiresDocuments = ["document", "compliance", "company", "quality", "report"].includes(id);
    const requiresScore = ["risk", "financial", "strategy", "report"].includes(id);
    const waiting = (requiresDocuments && identity.documentCount === 0) || (requiresScore && identity.score === null);
    return {
      id,
      label,
      objective,
      engine,
      status: waiting ? "waiting-evidence" : id === "orchestrator" ? "plan-ready" : "ready-for-human-trigger",
      input: `Expediente ${identity.id}; solo resumen autorizado y evidencia visible por rol.`,
      output: `Borrador ${engine} trazable; no vinculante y no persistido.`,
      sources: evidencePackage.items.filter((item) => item.status !== "missing").map((item) => item.id),
      model: "not-selected",
      version: "orchestration-v1",
      estimatedCostUsd: 0,
      estimatedSeconds: 0,
      confidence: waiting ? "insuficiente" : confidence,
      error: waiting ? "required-evidence-missing" : null,
      humanReviewRequired: true,
      traceId: `${identity.id}:${id}:${index + 1}`,
    };
  });

  return {
    status: agents.some((agent) => agent.status === "waiting-evidence") ? "evidence-gated" : "ready-for-controlled-human-trigger",
    identity,
    access,
    agents,
    evidencePackage,
    summary: {
      agents: agents.length,
      ready: agents.filter((agent) => agent.status !== "waiting-evidence").length,
      waitingEvidence: agents.filter((agent) => agent.status === "waiting-evidence").length,
      humanReview: agents.filter((agent) => agent.humanReviewRequired).length,
    },
  };
}
