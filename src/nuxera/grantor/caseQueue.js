import { buildOtorganteAnalytics, buildOtorgantePipeline, buildOtorgantePipelineFromEntries } from "../../data/otorgantePipeline";
import { pickLang } from "../../data/requisitosMinimos";

const grantorDemoOrdersSource = [
  {
    id: "nuxera-gra-001",
    projectName: { es: "Expansion agroindustrial Bajio", en: "Bajio agribusiness expansion" },
    service_type: "combo-complete",
    status: "paid",
    amount: 18000000,
    created_at: "2026-07-10T15:30:00.000Z",
    metadata: {
      companyName: "AgroNova MX",
      sector: { es: "Agroindustria", en: "Agribusiness" },
      country: "MX",
      description: { es: "Capital para linea de empaque, certificaciones y contratos de exportacion.", en: "Capital for a packaging line, certifications and export contracts." },
      targetEntity: { es: "Banco de desarrollo", en: "Development bank" },
      structure: { es: "Credito senior con garantia mobiliaria", en: "Senior credit with chattel collateral" },
      complianceScore: 84,
      financialScore: 78,
      documentsCount: 11,
      documents: [
        { es: "Business plan", en: "Business plan" },
        { es: "Estados financieros", en: "Financial statements" },
        { es: "KYC/KYB", en: "KYC/KYB" },
        { es: "Contratos", en: "Contracts" },
        { es: "Permisos", en: "Permits" },
      ],
      infoRequests: [{ id: "req-risk", status: "open", title: { es: "Matriz de riesgos actualizada", en: "Updated risk matrix" } }],
    },
  },
  {
    id: "nuxera-gra-002",
    projectName: { es: "Plataforma SaaS compliance", en: "Compliance SaaS platform" },
    service_type: "financial-analysis",
    status: "in_progress",
    amount: 9500000,
    created_at: "2026-07-08T11:00:00.000Z",
    metadata: {
      companyName: "RegTech Andes",
      sector: "SaaS B2B",
      country: "CO",
      description: { es: "Financiamiento para ventas enterprise, seguridad y localizacion regional.", en: "Funding for enterprise sales, security and regional localization." },
      targetEntity: { es: "Fondo growth", en: "Growth fund" },
      structure: { es: "Deuda venture con covenants operativos", en: "Venture debt with operating covenants" },
      complianceScore: 88,
      financialScore: 82,
      documentsCount: 14,
      documents: [
        { es: "Modelo financiero", en: "Financial model" },
        { es: "MRR dashboard", en: "MRR dashboard" },
        { es: "KYC/KYB", en: "KYC/KYB" },
        { es: "SOC roadmap", en: "SOC roadmap" },
      ],
      interest: { status: "under_review" },
    },
  },
  {
    id: "nuxera-gra-003",
    projectName: { es: "Infraestructura energia distribuida", en: "Distributed energy infrastructure" },
    service_type: "business-plan",
    status: "pending",
    amount: 26000000,
    created_at: "2026-07-04T09:20:00.000Z",
    metadata: {
      companyName: "Luz Norte",
      sector: { es: "Energia", en: "Energy" },
      country: "MX",
      description: { es: "CAPEX para activos solares C&I y contratos PPA.", en: "CAPEX for C&I solar assets and PPA contracts." },
      targetEntity: { es: "Vehiculo privado de deuda", en: "Private debt vehicle" },
      structure: { es: "Project finance preliminar", en: "Preliminary project finance" },
      complianceScore: 64,
      financialScore: 58,
      documentsCount: 7,
      documents: [
        { es: "Resumen ejecutivo", en: "Executive summary" },
        { es: "PPA draft", en: "PPA draft" },
        { es: "KYC/KYB", en: "KYC/KYB" },
      ],
      infoRequests: [{ id: "req-permits", status: "open", title: { es: "Permisos y conexion", en: "Permits & grid connection" } }],
    },
  },
];

function localizeValue(value, language) {
  return typeof value === "object" && value !== null && !Array.isArray(value) && ("es" in value || "en" in value)
    ? pickLang(value, language)
    : value;
}

function getGrantorDemoOrders(language) {
  return grantorDemoOrdersSource.map((order) => ({
    ...order,
    projectName: localizeValue(order.projectName, language),
    metadata: {
      ...order.metadata,
      sector: localizeValue(order.metadata.sector, language),
      description: localizeValue(order.metadata.description, language),
      targetEntity: localizeValue(order.metadata.targetEntity, language),
      structure: localizeValue(order.metadata.structure, language),
      documents: order.metadata.documents.map((doc) => localizeValue(doc, language)),
      infoRequests: (order.metadata.infoRequests || []).map((request) => ({
        ...request,
        title: localizeValue(request.title, language),
      })),
    },
  }));
}

function formatAssignmentDueAt(value, language) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString(language === "en" ? "en-US" : "es-MX", {
    month: "short",
    day: "numeric"
  });
}

function formatAssignmentOwner(assignment, language) {
  if (!assignment) return null;
  const roleLabels = {
    analista: { es: "Analista", en: "Analyst" },
    agente_interno: { es: "Agente interno", en: "Internal agent" },
    compliance_officer: { es: "Compliance", en: "Compliance" },
    administrador: { es: "Administrador", en: "Administrator" }
  };
  const role = pickLang(roleLabels[assignment.assignedReviewerRole], language) || assignment.assignedReviewerRole;
  const reviewer = assignment.assignedReviewerId ? ` ${String(assignment.assignedReviewerId).slice(0, 8)}` : "";
  return `${role}${reviewer}`.trim();
}

function buildAssignmentAwareTriage(priority, assignment, language) {
  const fallback = {
    lane: priority === "committee-ready"
      ? pickLang({ es: "Mesa", en: "Desk" }, language)
      : priority === "needs-information"
        ? pickLang({ es: "Subsanacion", en: "Remediation" }, language)
        : pickLang({ es: "Observacion", en: "Watch" }, language),
    sla: priority === "committee-ready" ? "24h" : priority === "needs-information" ? "48h" : "7d",
    owner: priority === "committee-ready"
      ? pickLang({ es: "Analista senior", en: "Senior analyst" }, language)
      : priority === "needs-information"
        ? pickLang({ es: "Relacion solicitante", en: "Applicant relations" }, language)
        : pickLang({ es: "Monitoreo", en: "Monitoring" }, language),
    reason: priority === "committee-ready"
      ? pickLang({ es: "Readiness suficiente para memo humano.", en: "Enough readiness for a human memo." }, language)
      : priority === "needs-information"
        ? pickLang({ es: "Faltantes o riesgo impiden comite.", en: "Gaps or risk block committee." }, language)
        : pickLang({ es: "Sin accion inmediata; esperar nueva evidencia.", en: "No immediate action; wait for new evidence." }, language),
    source: "policy-fallback"
  };

  if (!assignment) return fallback;

  const dueAt = formatAssignmentDueAt(assignment.slaDueAt, language);
  return {
    ...fallback,
    sla: dueAt ? `${assignment.slaTier || fallback.sla} / ${dueAt}` : assignment.slaTier || fallback.sla,
    owner: formatAssignmentOwner(assignment, language) || fallback.owner,
    reason: assignment.reason || fallback.reason,
    status: assignment.status || "open",
    source: assignment.source || "assignment"
  };
}
function getPriority(opportunity) {
  if (opportunity.readinessKey === "committee-ready" && opportunity.riskLevel !== "high") return "committee-ready";
  if (opportunity.infoRequests?.some((request) => request.status === "open") || opportunity.riskLevel === "high") return "needs-information";
  return "watch";
}

function buildDecisionSignals(opportunity, language) {
  return [
    `Readiness: ${opportunity.readinessLevel}`,
    `${pickLang({ es: "Riesgo", en: "Risk" }, language)}: ${opportunity.risk}`,
    `${pickLang({ es: "Documentos visibles", en: "Visible documents" }, language)}: ${opportunity.documentsCount}`,
    `${pickLang({ es: "Ticket", en: "Ticket" }, language)}: ${opportunity.amountLabel}`,
  ];
}

function buildCaseQueue(opportunities, source, language) {
  const cases = opportunities
    .map((opportunity) => {
      const priority = getPriority(opportunity);
      return {
        ...opportunity,
        priority,
        decisionSignals: buildDecisionSignals(opportunity, language),
        triage: buildAssignmentAwareTriage(priority, opportunity.assignment, language),
        nextAction: priority === "committee-ready"
          ? pickLang({ es: "Preparar memo de comite y confirmar condiciones no vinculantes.", en: "Prepare the committee memo and confirm non-binding conditions." }, language)
          : priority === "needs-information"
            ? pickLang({ es: "Solicitar evidencia faltante antes de continuar revision.", en: "Request the missing evidence before continuing the review." }, language)
            : pickLang({ es: "Mantener en observacion y revisar cambios de evidencia.", en: "Keep under watch and review evidence changes." }, language),
        evidenceLinks: [
          { engine: "Finance", path: "/dashboard/nuxera/finance", label: pickLang({ es: "Score y estructura", en: "Score & structure" }, language) },
          { engine: "Intelligence", path: "/dashboard/nuxera/intelligence", label: pickLang({ es: "Documentos y hallazgos", en: "Documents & findings" }, language) },
          { engine: "Strategy", path: "/dashboard/nuxera/strategy", label: pickLang({ es: "Escenarios y rollback", en: "Scenarios & rollback" }, language) },
        ],
      };
    })
    .sort((a, b) => {
      const riskWeight = { high: 3, medium: 2, low: 1 };
      return (riskWeight[b.riskLevel] - riskWeight[a.riskLevel]) || (b.averageScore - a.averageScore);
    });

  return {
    source,
    cases,
    analytics: buildOtorganteAnalytics(cases, language),
    queueMode: { label: pickLang({ es: "Bandeja de expedientes", en: "File inbox" }, language), purpose: pickLang({ es: "Triage, SLA, asignacion y faltantes; no analiza condiciones de decision.", en: "Triage, SLA, assignment and gaps; it does not analyze decision conditions." }, language) },
    decisionDeskMode: { label: pickLang({ es: "Mesa de decision", en: "Decision desk" }, language), purpose: pickLang({ es: "Memo no vinculante, preguntas de comite, evidencia autorizada y condiciones humanas.", en: "Non-binding memo, committee questions, authorized evidence and human conditions." }, language) },
    policies: [
      { es: "La bandeja de expedientes no aprueba credito ni emite term sheets automaticamente.", en: "The file inbox does not approve credit or automatically issue term sheets." },
      { es: "Cada caso requiere revision humana antes de contacto, comite o decision vinculante.", en: "Every case requires human review before contact, committee, or a binding decision." },
      { es: "La visibilidad documental debe respetar permisos de data room existentes.", en: "Document visibility must respect existing data room permissions." },
      { es: "Las senales de riesgo son priorizacion operativa, no decision final.", en: "Risk signals are operational prioritization, not a final decision." },
    ].map((policy) => pickLang(policy, language)),
  };
}

export function getGrantorCaseQueue(language = "es") {
  return buildCaseQueue(buildOtorgantePipeline(getGrantorDemoOrders(language), language), "demo-local", language);
}

export function buildGrantorCaseQueueFromPipeline(entries = [], language = "es") {
  return buildCaseQueue(buildOtorgantePipelineFromEntries(entries, language), "authorized-pipeline", language);
}

export function resolveSelectedGrantorCase(queue, selectedCaseId) {
  const cases = Array.isArray(queue?.cases) ? queue.cases : [];
  return cases.find((item) => item.id === selectedCaseId) || cases[0] || null;
}

export function getGrantorQueueSummary(queue = getGrantorCaseQueue()) {
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
export function filterGrantorInboxCases(cases = [], filter = "all") {
  if (filter === "committee-ready") return cases.filter((item) => item.priority === "committee-ready");
  if (filter === "needs-information") return cases.filter((item) => item.priority === "needs-information");
  if (filter === "high-risk") return cases.filter((item) => item.riskLevel === "high");
  if (filter === "watch") return cases.filter((item) => item.priority === "watch");
  return cases;
}

export function getGrantorInboxFilters(queue = getGrantorCaseQueue(), language = "es") {
  const cases = Array.isArray(queue?.cases) ? queue.cases : [];
  const filters = [
    {
      id: "all",
      label: pickLang({ es: "Todos", en: "All" }, language),
      description: pickLang({ es: "Todos los expedientes autorizados.", en: "All authorized files." }, language),
    },
    {
      id: "committee-ready",
      label: pickLang({ es: "Listos para mesa", en: "Ready for desk" }, language),
      description: pickLang({ es: "Casos con evidencia suficiente para analisis.", en: "Files with enough evidence for analysis." }, language),
    },
    {
      id: "needs-information",
      label: pickLang({ es: "Faltantes", en: "Gaps" }, language),
      description: pickLang({ es: "Casos que requieren evidencia antes de avanzar.", en: "Files that need evidence before moving forward." }, language),
    },
    {
      id: "high-risk",
      label: pickLang({ es: "Riesgo alto", en: "High risk" }, language),
      description: pickLang({ es: "Expedientes que deben revisarse por alerta.", en: "Files that need risk-alert review." }, language),
    },
    {
      id: "watch",
      label: pickLang({ es: "Observacion", en: "Watch" }, language),
      description: pickLang({ es: "Casos activos sin accion inmediata.", en: "Active files without immediate action." }, language),
    },
  ];

  return filters.map((filter) => ({
    ...filter,
    count: filterGrantorInboxCases(cases, filter.id).length,
  }));
}
function getWorkbenchQuestions(caseItem, language) {
  return [
    {
      id: "risk-gap",
      label: pickLang({ es: "Riesgo y faltantes", en: "Risk & gaps" }, language),
      prompt: pickLang(
        { es: `Que evidencia falta para bajar riesgo ${caseItem.risk} antes de comite?`, en: `What evidence is missing to lower the ${caseItem.risk} risk before committee?` },
        language
      ),
      owner: pickLang({ es: "Analista de riesgo", en: "Risk analyst" }, language),
    },
    {
      id: "structure-fit",
      label: pickLang({ es: "Estructura", en: "Structure" }, language),
      prompt: pickLang(
        { es: `La estructura ${caseItem.structure} calza con ticket, plazo y garantias?`, en: `Does the ${caseItem.structure} structure fit the ticket size, term and collateral?` },
        language
      ),
      owner: pickLang({ es: "Otorgante", en: "Grantor" }, language),
    },
    {
      id: "permission-check",
      label: pickLang({ es: "Permisos", en: "Permissions" }, language),
      prompt: pickLang(
        { es: "El data room permite revisar todos los documentos citados sin ampliar acceso indebidamente?", en: "Does the data room allow reviewing all cited documents without improperly expanding access?" },
        language
      ),
      owner: pickLang({ es: "Operacion NUXERA", en: "NUXERA Operations" }, language),
    },
  ];
}

function getWorkbenchConditions(caseItem, language) {
  return [
    pickLang(
      { es: `Confirmar ${caseItem.documentsCount} documentos visibles y vigentes antes de contacto formal.`, en: `Confirm ${caseItem.documentsCount} visible, current documents before formal contact.` },
      language
    ),
    pickLang({ es: "Cerrar informacion abierta antes de emitir condiciones no vinculantes.", en: "Close open information requests before issuing non-binding conditions." }, language),
    pickLang({ es: "Registrar decision humana, supuestos y rollback si cambian score, mercado o permisos.", en: "Record the human decision, assumptions and rollback if score, market or permissions change." }, language),
  ];
}

export function getGrantorCaseWorkbench(caseId, queue = getGrantorCaseQueue(), language = "es") {
  const selectedCase = queue.cases.find((item) => item.id === caseId) || queue.cases[0];

  return {
    case: selectedCase,
    status: selectedCase.priority === "committee-ready" ? "ready-for-memo" : "evidence-required",
    questions: getWorkbenchQuestions(selectedCase, language),
    requiredEvidence: selectedCase.documents.map((documentName, index) => ({
      id: `${selectedCase.id}-doc-${index + 1}`,
      label: documentName,
      status: index < Math.max(selectedCase.documents.length - 1, 1) ? "visible" : "verify",
    })),
    conditions: getWorkbenchConditions(selectedCase, language),
    auditTrail: [
      { es: "Workbench local para revision del otorgante.", en: "Local workbench for grantor review." },
      { es: "No emite term sheet ni aprobacion vinculante.", en: "It does not issue a term sheet or a binding approval." },
      { es: "Respeta permisos existentes del data room; no concede accesos nuevos.", en: "It respects existing data room permissions; it does not grant new access." },
    ].map((entry) => pickLang(entry, language)),
  };
}
function getMemoRecommendation(caseItem, language) {
  if (caseItem.priority === "committee-ready") {
    return pickLang({ es: "Preparar comite interno con condiciones no vinculantes y confirmacion documental.", en: "Prepare an internal committee with non-binding conditions and documentary confirmation." }, language);
  }

  if (caseItem.priority === "needs-information") {
    return pickLang({ es: "No avanzar a comite hasta cerrar evidencia faltante y actualizar riesgo.", en: "Do not move to committee until the missing evidence is closed and risk is updated." }, language);
  }

  return pickLang({ es: "Mantener en observacion hasta recibir nueva evidencia o cambio de apetito.", en: "Keep under watch until new evidence arrives or risk appetite changes." }, language);
}

export function getGrantorDocumentSummary(caseId, queue = getGrantorCaseQueue(), language = "es") {
  const workbench = getGrantorCaseWorkbench(caseId, queue, language);
  const caseItem = workbench.case;
  const visible = workbench.requiredEvidence.filter((item) => item.status === "visible");
  const verify = workbench.requiredEvidence.filter((item) => item.status !== "visible");
  const folders = [
    {
      id: "identity-kyb",
      label: pickLang({ es: "Identidad y KYB", en: "Identity & KYB" }, language),
      status: visible.some((item) => item.label.includes("KYC") || item.label.includes("KYB")) ? "summary-visible" : "verify-required",
      evidence: workbench.requiredEvidence.filter((item) => item.label.includes("KYC") || item.label.includes("KYB")),
    },
    {
      id: "project-file",
      label: pickLang({ es: "Proyecto y estructura", en: "Project & structure" }, language),
      status: "summary-visible",
      evidence: workbench.requiredEvidence.filter((item) => !item.label.includes("KYC") && !item.label.includes("KYB")).slice(0, 3),
    },
    {
      id: "risk-requests",
      label: pickLang({ es: "Faltantes y requests", en: "Gaps & requests" }, language),
      status: caseItem.infoRequests?.some((request) => request.status === "open") ? "needs-information" : "ready-for-review",
      evidence: (caseItem.infoRequests || []).map((request) => ({
        id: request.id,
        label: request.title,
        status: request.status === "open" ? "verify" : "visible",
      })),
    },
  ];
  const pending = [...verify, ...folders.flatMap((folder) => folder.evidence).filter((item) => item.status !== "visible")];

  return {
    id: `${caseItem.id}-document-summary-local`,
    caseId: caseItem.id,
    status: pending.length > 0 ? "authorized-summary-needs-review" : "authorized-summary-ready",
    summary: {
      visible: visible.length,
      pending: pending.length,
      total: workbench.requiredEvidence.length,
      folders: folders.length,
    },
    folders,
    nextAction: pending.length > 0
      ? pickLang({ es: `Confirmar ${pending[0].label} antes de comite o condiciones.`, en: `Confirm ${pending[0].label} before committee or conditions.` }, language)
      : pickLang({ es: "Mantener revision documental dentro de permisos existentes.", en: "Keep document review within existing permissions." }, language),
    guardrails: [
      { es: "Resumen documental para otorgante; no abre archivos y no concede acceso nuevo.", en: "Document summary for the grantor; it does not open files or grant new access." },
      { es: "La disponibilidad real depende de permisos vigentes del data room.", en: "Real availability depends on current data room permissions." },
      { es: "No permite descarga, share, upload ni cambios de visibilidad.", en: "It does not allow download, sharing, upload, or visibility changes." },
    ].map((guardrail) => pickLang(guardrail, language)),
  };
}
export function getGrantorDecisionMemo(caseId, queue = getGrantorCaseQueue(), language = "es") {
  const workbench = getGrantorCaseWorkbench(caseId, queue, language);
  const caseItem = workbench.case;
  const visibleEvidence = workbench.requiredEvidence.filter((item) => item.status === "visible");
  const pendingEvidence = workbench.requiredEvidence.filter((item) => item.status !== "visible");

  return {
    id: `${caseItem.id}-memo-local`,
    case: caseItem,
    title: pickLang({ es: `Memo local no vinculante: ${caseItem.name}`, en: `Local non-binding memo: ${caseItem.name}` }, language),
    status: caseItem.priority === "committee-ready" ? "draft-ready" : "evidence-blocked",
    recommendation: getMemoRecommendation(caseItem, language),
    thesis: [
      pickLang({ es: `${caseItem.applicant} solicita ${caseItem.amountLabel} para ${caseItem.sector}.`, en: `${caseItem.applicant} is requesting ${caseItem.amountLabel} for ${caseItem.sector}.` }, language),
      pickLang({ es: `Estructura preliminar: ${caseItem.structure}.`, en: `Preliminary structure: ${caseItem.structure}.` }, language),
      pickLang({ es: `Readiness reportado: ${caseItem.readinessLevel}; riesgo operativo: ${caseItem.risk}.`, en: `Reported readiness: ${caseItem.readinessLevel}; operating risk: ${caseItem.risk}.` }, language),
    ],
    evidenceSnapshot: {
      visible: visibleEvidence.length,
      pending: pendingEvidence.length,
      documents: workbench.requiredEvidence,
    },
    riskNotes: [
      pickLang({ es: `Score promedio observado: ${caseItem.averageScore}/100.`, en: `Observed average score: ${caseItem.averageScore}/100.` }, language),
      pickLang({ es: `Faltantes abiertos: ${pendingEvidence.length}.`, en: `Open gaps: ${pendingEvidence.length}.` }, language),
      pickLang({ es: "La decision final requiere revision humana y evidencia vigente.", en: "The final decision requires human review and current evidence." }, language),
    ],
    proposedConditions: workbench.conditions,
    nextActions: workbench.questions.map((question) => ({
      id: question.id,
      owner: question.owner,
      action: question.prompt,
    })),
    guardrails: [
      { es: "Memo local para preparacion; no es term sheet ni aprobacion de credito.", en: "Local preparation memo; it is not a term sheet or a credit approval." },
      { es: "No cambia permisos del data room ni comparte documentos fuera del flujo existente.", en: "It does not change data room permissions or share documents outside the existing flow." },
      { es: "No persiste estado ni crea compromisos vinculantes sin contrato backend aprobado.", en: "It does not persist state or create binding commitments without an approved backend contract." },
    ].map((guardrail) => pickLang(guardrail, language)),
  };
}
