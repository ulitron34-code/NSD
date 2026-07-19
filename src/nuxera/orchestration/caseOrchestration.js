import { pickLang } from "../../data/requisitosMinimos";

const AGENT_DEFINITIONS = [
  ["document", "Document Agent", { es: "Clasificar y validar evidencia documental", en: "Classify and validate documentary evidence" }, "Intelligence"],
  ["compliance", "Compliance Agent", { es: "Revisar identidad, permisos y cumplimiento", en: "Review identity, permissions and compliance" }, "Intelligence"],
  ["risk", "Risk Agent", { es: "Consolidar riesgos financieros y operativos", en: "Consolidate financial and operational risks" }, "Strategy"],
  ["financial", "Financial Analysis Agent", { es: "Analizar readiness, score y capacidad financiera", en: "Analyze readiness, score and financial capacity" }, "Finance"],
  ["company", "Company Intelligence Agent", { es: "Contextualizar empresa, grupo y contraparte", en: "Contextualize the company, group and counterparty" }, "Intelligence"],
  ["market", "Market Intelligence Agent", { es: "Vigilar tasas, FX, insumos y sector", en: "Monitor rates, FX, inputs and sector" }, "Markets"],
  ["strategy", "Strategy Agent", { es: "Comparar escenarios y mitigantes", en: "Compare scenarios and mitigants" }, "Strategy"],
  ["report", "Report Agent", { es: "Preparar un borrador trazable no vinculante", en: "Prepare a traceable, non-binding draft" }, "Strategy"],
  ["quality", "Quality Agent", { es: "Comprobar cobertura, consistencia y fuentes", en: "Check coverage, consistency and sources" }, "Quality"],
  ["security", "Security Agent", { es: "Verificar alcance, rol y segregacion", en: "Verify scope, role and segregation" }, "Security"],
  ["orchestrator", "Orchestrator Agent", { es: "Ordenar tareas y detener flujos inseguros", en: "Order tasks and stop unsafe flows" }, "Orchestration"],
];

function getOrderIdentity(context, language) {
  const order = context?.order;
  if (!order) return null;
  return {
    id: order.id,
    label: order.project_name || order.projectName || order.case_number || order.id,
    risk: order.risk_level || order.riskLevel || context.expedient?.risk || pickLang({ es: "por validar", en: "to validate" }, language),
    score: context.expedient?.scoring?.finalScore ?? context.expedient?.averageScore ?? order.metadata?.financialScore ?? null,
    documentCount: Number(context.expedient?.documentsCount ?? order.metadata?.documentsCount ?? order.metadata?.documents_count ?? 0),
  };
}

export function buildContextAccessEnvelope(context = {}, language = "es") {
  const identity = getOrderIdentity(context, language);
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
      { id: "role-source", passed: sourceAligned, detail: pickLang({ es: `Fuente esperada: ${expectedSource}.`, en: `Expected source: ${expectedSource}.` }, language) },
      { id: "selected-expedient", passed: Boolean(selectable), detail: pickLang({ es: "El expediente debe coincidir con la seleccion compartida.", en: "The file must match the shared selection." }, language) },
      { id: "demo-isolation", passed: !context.isDemo, detail: pickLang({ es: "Demo nunca habilita lectura real.", en: "Demo never enables real reads." }, language) },
    ],
    guardrails: [
      { es: "El envelope no concede permisos; solo refleja el contexto ya autorizado por backend.", en: "The envelope does not grant permissions; it only reflects context already authorized by the backend." },
      { es: "Ningun agente puede ampliar data-room shares, roles o acceso documental.", en: "No agent can expand data-room shares, roles or document access." },
      { es: "Toda decision material requiere revision humana y registro auditable.", en: "Every material decision requires human review and an auditable record." },
    ].map((guardrail) => pickLang(guardrail, language)),
  };
}

export function buildCaseOrchestration(context = {}, language = "es") {
  const identity = getOrderIdentity(context, language);
  const access = buildContextAccessEnvelope(context, language);
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

  const toValidateLabel = pickLang({ es: "por validar", en: "to validate" }, language);
  const evidencePackage = {
    status: identity.documentCount > 0 ? "partial-evidence-visible" : "evidence-required",
    items: [
      { id: "order", label: pickLang({ es: "Identidad del expediente", en: "File identity" }, language), status: "available", source: context.source },
      { id: "documents", label: pickLang({ es: "Documentos autorizados", en: "Authorized documents" }, language), status: identity.documentCount > 0 ? "available" : "missing", source: "data-room-summary" },
      { id: "score", label: pickLang({ es: "Scoring financiero", en: "Financial score" }, language), status: identity.score !== null ? "available" : "missing", source: "Finance" },
      { id: "risk", label: pickLang({ es: "Riesgo declarado", en: "Declared risk" }, language), status: identity.risk !== toValidateLabel ? "available" : "missing", source: "selected-order" },
      { id: "market", label: pickLang({ es: "Contexto de mercado", en: "Market context" }, language), status: "delayed-only", source: "Markets local provider" },
    ],
  };
  const availableEvidence = evidencePackage.items.filter((item) => item.status === "available").length;
  const confidence = pickLang(
    availableEvidence >= 4 ? { es: "media-alta", en: "medium-high" } : availableEvidence >= 2 ? { es: "media", en: "medium" } : { es: "baja", en: "low" },
    language
  );
  const insufficientLabel = pickLang({ es: "insuficiente", en: "insufficient" }, language);
  const agents = AGENT_DEFINITIONS.map(([id, label, objective, engine], index) => {
    const requiresDocuments = ["document", "compliance", "company", "quality", "report"].includes(id);
    const requiresScore = ["risk", "financial", "strategy", "report"].includes(id);
    const waiting = (requiresDocuments && identity.documentCount === 0) || (requiresScore && identity.score === null);
    return {
      id,
      label,
      objective: pickLang(objective, language),
      engine,
      status: waiting ? "waiting-evidence" : id === "orchestrator" ? "plan-ready" : "ready-for-human-trigger",
      input: pickLang({ es: `Expediente ${identity.id}; solo resumen autorizado y evidencia visible por rol.`, en: `File ${identity.id}; authorized summary and role-visible evidence only.` }, language),
      output: pickLang({ es: `Borrador ${engine} trazable; no vinculante y no persistido.`, en: `Traceable ${engine} draft; non-binding and not persisted.` }, language),
      sources: evidencePackage.items.filter((item) => item.status !== "missing").map((item) => item.id),
      model: "not-selected",
      version: "orchestration-v1",
      estimatedCostUsd: 0,
      estimatedSeconds: 0,
      confidence: waiting ? insufficientLabel : confidence,
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
