import { getEvidenceLedgerByEngine, getNuxeraEvidenceLedger } from "../evidence/evidenceLedger";
import { getGrantorCaseQueue, getGrantorDocumentSummary } from "../grantor/caseQueue";
const operationLanes = [
  {
    id: "operations",
    label: "Operacion",
    status: "watch",
    owner: "Ops NUXERA",
    signal: "Colas applicant/grantor activas en modo local.",
    action: "Revisar handoff, tareas abiertas y estados de migracion antes de habilitar persistencia.",
  },
  {
    id: "security",
    label: "Seguridad",
    status: "controlled",
    owner: "Security admin",
    signal: "No se agregaron permisos ni cambios de data room.",
    action: "Mantener revision de roles antes de publicar nuevas superficies.",
  },
  {
    id: "ai-agents",
    label: "IA y agentes",
    status: "limited",
    owner: "AI ops",
    signal: "Agentes representados como modelos locales/auditables, no ejecucion real.",
    action: "No activar automatismos sin trazabilidad, costo y fallback aprobados.",
  },
  {
    id: "system",
    label: "Sistema",
    status: "green",
    owner: "Platform",
    signal: "Build, lint y unit tests verdes en el ultimo handoff.",
    action: "Resolver E2E/manual cuando npm/browser automation esten disponibles.",
  },
];

const releaseGates = [
  {
    id: "feature-flag",
    label: "Feature flag",
    state: "enabled-by-env",
    requirement: "NUXERA permanece detras de VITE_NUXERA_EXPERIENCE_ENABLED=true.",
  },
  {
    id: "legacy-safe",
    label: "Legacy intacto",
    state: "required",
    requirement: "No retirar dashboard current/classic ni adaptadores legacy sin aceptacion formal.",
  },
  {
    id: "backend-contracts",
    label: "Contratos backend",
    state: "blocked",
    requirement: "Persistencia de mission, checklist, queue y workbench requiere diseno aprobado.",
  },
  {
    id: "human-review",
    label: "Decision humana",
    state: "required",
    requirement: "Ningun flujo NUXERA aprueba credito, term sheets o decisiones vinculantes.",
  },
];

const adminAuditEvents = [
  "Applicant mission y checklist montados como preparacion local.",
  "Grantor queue y workbench montados sin cambios de permisos.",
  "Markets realtime bloqueado salvo proveedor licenciado.",
  "Strategy mantiene gates, rollback y audit trail local.",
];

const rolloutReadiness = [
  {
    id: "applicant-surface",
    label: "Applicant surface",
    readiness: 72,
    status: "controlled-preview",
    evidence: "Mission, checklist y data-room readiness operan con fixtures locales.",
    gap: "Persistir progreso y documentos requiere contrato backend.",
  },
  {
    id: "grantor-surface",
    label: "Grantor surface",
    readiness: 68,
    status: "controlled-preview",
    evidence: "Queue y workbench priorizan casos con audit trail local.",
    gap: "Decision memo y estados de comite siguen sin persistencia.",
  },
  {
    id: "admin-surface",
    label: "Admin surface",
    readiness: 61,
    status: "release-gated",
    evidence: "Lanes, gates y politicas admin son visibles sin permisos nuevos.",
    gap: "Faltan contratos para incidentes reales, roles y telemetria.",
  },
];

const incidentControls = [
  {
    id: "browser-e2e",
    severity: "medium",
    status: "known-environment-blocker",
    signal: "Playwright/Chrome automation bloqueado por spawn EPERM.",
    response: "Mantener evidencia de lint, build, unit tests y revisar visualmente en servidor local.",
  },
  {
    id: "runtime-path",
    severity: "medium",
    status: "tooling-watch",
    signal: "npm no esta disponible en PATH del entorno actual.",
    response: "Usar Node/pnpm del runtime bundled hasta corregir PATH.",
  },
  {
    id: "data-contracts",
    severity: "high",
    status: "blocked-by-design",
    signal: "Persistencia de NUXERA state no tiene contrato aprobado.",
    response: "No escribir estado real hasta definir APIs, ownership, rollback y auditoria.",
  },
];

const complianceEvidence = [
  {
    id: "identity",
    label: "Identidad visible",
    status: "aligned",
    detail: "UI usa NUXERA Financial Intelligence y conserva identificadores tecnicos legacy.",
  },
  {
    id: "feature-flag",
    label: "Control de rollout",
    status: "aligned",
    detail: "La experiencia NUXERA depende de VITE_NUXERA_EXPERIENCE_ENABLED=true.",
  },
  {
    id: "decision-safety",
    label: "Decision safety",
    status: "aligned",
    detail: "Flujos applicant/grantor/admin requieren revision humana y no aprueban credito.",
  },
  {
    id: "market-data",
    label: "Market data",
    status: "aligned",
    detail: "Datos en tiempo real permanecen bloqueados sin proveedor licenciado.",
  },
];

function buildAdminAuditPackage({
  blockedGates,
  highSeverityIncidents,
  evidenceLedger,
  grantorDocumentReadiness,
  averageReadiness,
}) {
  const pendingDocumentCases = grantorDocumentReadiness.filter((item) => item.pending > 0);

  return {
    id: "nuxera-admin-audit-package-local",
    status: blockedGates.length > 0 ? "release-gated-audit-ready" : "controlled-review-ready",
    generatedFor: "internal-review",
    scope: ["release-gates", "readiness", "evidence-ledger", "grantor-documents", "incident-controls"],
    signals: [
      {
        id: "blocked-gates",
        label: "Release gates bloqueados",
        value: blockedGates.length,
        status: blockedGates.length > 0 ? "requires-action" : "clear",
      },
      {
        id: "readiness-average",
        label: "Readiness promedio",
        value: `${averageReadiness}%`,
        status: averageReadiness >= 70 ? "watch" : "needs-controls",
      },
      {
        id: "evidence-signals",
        label: "Senales de evidencia",
        value: evidenceLedger.summary.total,
        status: "read-only-indexed",
      },
      {
        id: "grantor-document-pending",
        label: "Casos grantor con documentos pendientes",
        value: pendingDocumentCases.length,
        status: pendingDocumentCases.length > 0 ? "authorized-summary-watch" : "authorized-summary-ready",
      },
      {
        id: "high-severity-incidents",
        label: "Incidentes high severity",
        value: highSeverityIncidents.length,
        status: highSeverityIncidents.length > 0 ? "blocked-by-design" : "clear",
      },
    ],
    nextActions: [
      ...blockedGates.map((gate) => `Resolver gate: ${gate.label}.`),
      ...highSeverityIncidents.map((control) => `Mantener control: ${control.signal}.`),
      ...pendingDocumentCases.map((item) => `Confirmar documentos pendientes para ${item.label}.`),
    ],
    guardrails: [
      "Paquete local de auditoria; no exporta archivos ni escribe backend.",
      "No cambia permisos, shares, data-room ni visibilidad documental.",
      "Solo consolida senales existentes para revision humana.",
    ],
  };
}

function buildAdminHealthSignals({
  operationLanes,
  blockedGates,
  incidentControls,
  evidenceCoverage,
  complianceEvidence,
  grantorDocumentReadiness,
  auditPackage,
}) {
  const pendingDocuments = grantorDocumentReadiness.reduce((total, item) => total + item.pending, 0);
  const evidenceWatch = evidenceCoverage.reduce((total, item) => total + item.watch, 0);
  const runtimeIncidents = incidentControls.filter((control) => ["browser-e2e", "runtime-path"].includes(control.id));
  const aiLane = operationLanes.find((lane) => lane.id === "ai-agents");
  const decisionSafety = complianceEvidence.find((item) => item.id === "decision-safety");

  return [
    {
      id: "rollout-governance",
      label: "Gobernanza rollout",
      status: blockedGates.length > 0 ? "release-gated" : "controlled",
      severity: blockedGates.length > 0 ? "high" : "low",
      signal: `${blockedGates.length} gates requieren revision antes de persistencia.`,
      nextAction: blockedGates.length > 0 ? "Mantener rollout bloqueado hasta cerrar contratos backend." : "Preparar revision controlada.",
    },
    {
      id: "runtime-tooling",
      label: "Runtime y tooling",
      status: runtimeIncidents.length > 0 ? "environment-watch" : "clear",
      severity: runtimeIncidents.length > 0 ? "medium" : "low",
      signal: `${runtimeIncidents.length} controles de entorno activos.`,
      nextAction: "Seguir validando con lint/build/unit tests mientras browser automation siga bloqueado.",
    },
    {
      id: "evidence-observability",
      label: "Evidencia observable",
      status: evidenceWatch > 0 ? "read-only-watch" : "read-only-ready",
      severity: evidenceWatch > 0 ? "medium" : "low",
      signal: `${evidenceWatch} senales en watch dentro del ledger admin.`,
      nextAction: "Usar ledger como indice interno, no como fuente de permisos o exports.",
    },
    {
      id: "document-visibility",
      label: "Visibilidad documental",
      status: pendingDocuments > 0 ? "authorized-summary-watch" : "authorized-summary-ready",
      severity: pendingDocuments > 0 ? "medium" : "low",
      signal: `${pendingDocuments} senales documentales pendientes en casos grantor.`,
      nextAction: "Confirmar faltantes sin abrir archivos ni cambiar data-room.",
    },
    {
      id: "decision-safety",
      label: "Decision safety",
      status: decisionSafety?.status || "watch",
      severity: decisionSafety?.status === "aligned" ? "low" : "high",
      signal: decisionSafety?.detail || "Decision humana requerida antes de cualquier decision vinculante.",
      nextAction: "Mantener revision humana y condiciones no vinculantes.",
    },
    {
      id: "ai-automation",
      label: "IA y automatizacion",
      status: aiLane?.status || "limited",
      severity: aiLane?.status === "limited" ? "medium" : "low",
      signal: aiLane?.signal || "Automatizacion IA limitada a senales auditables.",
      nextAction: "No activar agentes sin trazabilidad, costo y fallback aprobados.",
    },
    {
      id: "audit-readiness",
      label: "Audit readiness",
      status: auditPackage.status,
      severity: auditPackage.nextActions.length > 0 ? "medium" : "low",
      signal: `${auditPackage.nextActions.length} acciones abiertas en paquete local.`,
      nextAction: "Resolver acciones abiertas antes de conectar persistencia real.",
    },
  ];
}
export function getAdminOperationsConsole() {
  const blockedGates = releaseGates.filter((gate) => gate.state === "blocked");
  const watchLanes = operationLanes.filter((lane) => ["watch", "limited"].includes(lane.status));
  const highSeverityIncidents = incidentControls.filter((control) => control.severity === "high");
  const evidenceLedger = getNuxeraEvidenceLedger("admin");
  const evidenceByEngine = getEvidenceLedgerByEngine("admin");
  const evidenceCoverage = Object.entries(evidenceByEngine).map(([engine, items]) => ({
    engine,
    total: items.length,
    ready: items.filter((item) => item.status === "ready").length,
    watch: items.filter((item) => item.status !== "ready").length,
    visibility: "internal-review",
    policy: "Read-only compliance mapping; no grants, exports or backend writes.",
  }));
  const grantorQueue = getGrantorCaseQueue();
  const grantorDocumentReadiness = grantorQueue.cases.map((caseItem) => {
    const documentSummary = getGrantorDocumentSummary(caseItem.id);

    return {
      caseId: caseItem.id,
      label: caseItem.name,
      applicant: caseItem.applicant,
      status: documentSummary.status,
      visible: documentSummary.summary.visible,
      pending: documentSummary.summary.pending,
      total: documentSummary.summary.total,
      nextAction: documentSummary.nextAction,
      policy: documentSummary.guardrails[0],
    };
  });
  const averageReadiness = Math.round(
    rolloutReadiness.reduce((total, item) => total + item.readiness, 0) / rolloutReadiness.length
  );
  const auditPackage = buildAdminAuditPackage({
    blockedGates,
    highSeverityIncidents,
    evidenceLedger,
    grantorDocumentReadiness,
    averageReadiness,
  });
  const adminHealthSignals = buildAdminHealthSignals({
    operationLanes,
    blockedGates,
    incidentControls,
    evidenceCoverage,
    complianceEvidence,
    grantorDocumentReadiness,
    auditPackage,
  });

  return {
    status: blockedGates.length > 0 ? "release-gated" : "ready-for-controlled-review",
    lanes: operationLanes,
    releaseGates,
    auditEvents: adminAuditEvents,
    rolloutReadiness,
    incidentControls,
    complianceEvidence,
    evidenceLedger,
    evidenceCoverage,
    grantorDocumentReadiness,
    auditPackage,
    adminHealthSignals,
    summary: {
      lanes: operationLanes.length,
      watch: watchLanes.length,
      blockedGates: blockedGates.length,
      readiness: averageReadiness,
      highSeverityIncidents: highSeverityIncidents.length,
      complianceAligned: complianceEvidence.filter((item) => item.status === "aligned").length,
      evidenceSignals: evidenceLedger.summary.total,
      grantorDocumentCases: grantorDocumentReadiness.length,
      grantorDocumentPending: grantorDocumentReadiness.reduce((total, item) => total + item.pending, 0),
      auditPackageSignals: auditPackage.signals.length,
      auditPackageActions: auditPackage.nextActions.length,
      adminHealthSignals: adminHealthSignals.length,
      adminHealthWatch: adminHealthSignals.filter((item) => item.severity !== "low").length,
      requiresHumanReview: true,
    },
    policies: [
      "Admin observa salud y controles; no cambia permisos desde esta fundacion local.",
      "Toda persistencia NUXERA requiere contrato backend dedicado.",
      "Readiness documental grantor es summary-only y no otorga acceso a documentos.",
      "La automatizacion IA debe permanecer asistiva y trazable.",
    ],
  };
}
