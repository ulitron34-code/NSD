import { getEvidenceLedgerByEngine, getNuxeraEvidenceLedger } from "../evidence/evidenceLedger";
import { getGrantorCaseQueue, getGrantorDocumentSummary } from "../grantor/caseQueue";
import { pickLang } from "../../data/requisitosMinimos";

const operationLanesSource = [
  {
    id: "operations",
    label: { es: "Operacion", en: "Operations" },
    status: "watch",
    owner: "Ops NUXERA",
    signal: { es: "Colas applicant/grantor activas en modo local.", en: "Applicant/grantor queues active in local mode." },
    action: { es: "Revisar handoff, tareas abiertas y estados de migracion antes de habilitar persistencia.", en: "Review handoff, open tasks and migration status before enabling persistence." },
  },
  {
    id: "security",
    label: { es: "Seguridad", en: "Security" },
    status: "controlled",
    owner: "Security admin",
    signal: { es: "No se agregaron permisos ni cambios de data room.", en: "No permissions or data room changes were added." },
    action: { es: "Mantener revision de roles antes de publicar nuevas superficies.", en: "Keep reviewing roles before publishing new surfaces." },
  },
  {
    id: "ai-agents",
    label: { es: "IA y agentes", en: "AI & agents" },
    status: "limited",
    owner: "AI ops",
    signal: { es: "Agentes representados como modelos locales/auditables, no ejecucion real.", en: "Agents represented as local/auditable models, not real execution." },
    action: { es: "No activar automatismos sin trazabilidad, costo y fallback aprobados.", en: "Do not activate automation without approved traceability, cost, and fallback." },
  },
  {
    id: "system",
    label: { es: "Sistema", en: "System" },
    status: "green",
    owner: "Platform",
    signal: { es: "Build, lint y unit tests verdes en el ultimo handoff.", en: "Build, lint and unit tests green in the latest handoff." },
    action: { es: "Resolver E2E/manual cuando npm/browser automation esten disponibles.", en: "Resolve E2E/manual testing once npm/browser automation is available." },
  },
];

const releaseGatesSource = [
  {
    id: "feature-flag",
    label: "Feature flag",
    state: "enabled-by-env",
    requirement: { es: "NUXERA permanece detras de VITE_NUXERA_EXPERIENCE_ENABLED=true.", en: "NUXERA remains behind VITE_NUXERA_EXPERIENCE_ENABLED=true." },
  },
  {
    id: "legacy-safe",
    label: { es: "Legacy intacto", en: "Legacy intact" },
    state: "required",
    requirement: { es: "No retirar dashboard current/classic ni adaptadores legacy sin aceptacion formal.", en: "Do not retire the current/classic dashboard or legacy adapters without formal acceptance." },
  },
  {
    id: "backend-contracts",
    label: { es: "Contratos backend", en: "Backend contracts" },
    state: "blocked",
    requirement: { es: "Persistencia de mission, checklist, queue y workbench requiere diseno aprobado.", en: "Persisting mission, checklist, queue and workbench requires an approved design." },
  },
  {
    id: "human-review",
    label: { es: "Decision humana", en: "Human decision" },
    state: "required",
    requirement: { es: "Ningun flujo NUXERA aprueba credito, term sheets o decisiones vinculantes.", en: "No NUXERA flow approves credit, term sheets, or binding decisions." },
  },
];

const adminAuditEventsSource = [
  { es: "Applicant mission y checklist montados como preparacion local.", en: "Applicant mission and checklist mounted as local preparation." },
  { es: "Grantor queue y workbench montados sin cambios de permisos.", en: "Grantor queue and workbench mounted without permission changes." },
  { es: "Markets realtime bloqueado salvo proveedor licenciado.", en: "Real-time Markets data blocked pending a licensed provider." },
  { es: "Strategy mantiene gates, rollback y audit trail local.", en: "Strategy keeps gates, rollback and a local audit trail." },
];

const rolloutReadinessSource = [
  {
    id: "applicant-surface",
    label: "Applicant surface",
    readiness: 72,
    status: "controlled-preview",
    evidence: { es: "Mission, checklist y data-room readiness operan con fixtures locales.", en: "Mission, checklist and data-room readiness run on local fixtures." },
    gap: { es: "Persistir progreso y documentos requiere contrato backend.", en: "Persisting progress and documents requires a backend contract." },
  },
  {
    id: "grantor-surface",
    label: "Grantor surface",
    readiness: 68,
    status: "controlled-preview",
    evidence: { es: "Queue y workbench priorizan casos con audit trail local.", en: "Queue and workbench prioritize cases with a local audit trail." },
    gap: { es: "Decision memo y estados de comite siguen sin persistencia.", en: "Decision memo and committee states are still not persisted." },
  },
  {
    id: "admin-surface",
    label: "Admin surface",
    readiness: 61,
    status: "release-gated",
    evidence: { es: "Lanes, gates y politicas admin son visibles sin permisos nuevos.", en: "Admin lanes, gates and policies are visible without new permissions." },
    gap: { es: "Faltan contratos para incidentes reales, roles y telemetria.", en: "Contracts are still missing for real incidents, roles and telemetry." },
  },
];

const incidentControlsSource = [
  {
    id: "browser-e2e",
    severity: "medium",
    status: "known-environment-blocker",
    signal: { es: "Playwright/Chrome automation bloqueado por spawn EPERM.", en: "Playwright/Chrome automation blocked by spawn EPERM." },
    response: { es: "Mantener evidencia de lint, build, unit tests y revisar visualmente en servidor local.", en: "Keep lint, build and unit test evidence, and review visually on a local server." },
  },
  {
    id: "runtime-path",
    severity: "medium",
    status: "tooling-watch",
    signal: { es: "npm no esta disponible en PATH del entorno actual.", en: "npm is not available in the current environment's PATH." },
    response: { es: "Usar Node/pnpm del runtime bundled hasta corregir PATH.", en: "Use the bundled runtime's Node/pnpm until PATH is fixed." },
  },
  {
    id: "data-contracts",
    severity: "high",
    status: "blocked-by-design",
    signal: { es: "Persistencia de NUXERA state no tiene contrato aprobado.", en: "NUXERA state persistence has no approved contract." },
    response: { es: "No escribir estado real hasta definir APIs, ownership, rollback y auditoria.", en: "Do not write real state until APIs, ownership, rollback and audit are defined." },
  },
];

const complianceEvidenceSource = [
  {
    id: "identity",
    label: { es: "Identidad visible", en: "Visible identity" },
    status: "aligned",
    detail: { es: "UI usa NUXERA Financial Intelligence y conserva identificadores tecnicos legacy.", en: "The UI uses NUXERA Financial Intelligence and keeps legacy technical identifiers." },
  },
  {
    id: "feature-flag",
    label: { es: "Control de rollout", en: "Rollout control" },
    status: "aligned",
    detail: { es: "La experiencia NUXERA depende de VITE_NUXERA_EXPERIENCE_ENABLED=true.", en: "The NUXERA experience depends on VITE_NUXERA_EXPERIENCE_ENABLED=true." },
  },
  {
    id: "decision-safety",
    label: "Decision safety",
    status: "aligned",
    detail: { es: "Flujos applicant/grantor/admin requieren revision humana y no aprueban credito.", en: "Applicant/grantor/admin flows require human review and do not approve credit." },
  },
  {
    id: "market-data",
    label: "Market data",
    status: "aligned",
    detail: { es: "Datos en tiempo real permanecen bloqueados sin proveedor licenciado.", en: "Real-time data remains blocked without a licensed provider." },
  },
];

function localizeEntries(entries, language) {
  return entries.map((entry) => {
    const localized = { ...entry };
    for (const key of Object.keys(entry)) {
      const value = entry[key];
      if (value && typeof value === "object" && !Array.isArray(value) && ("es" in value || "en" in value)) {
        localized[key] = pickLang(value, language);
      }
    }
    return localized;
  });
}

function buildAdminAuditPackage({
  blockedGates,
  highSeverityIncidents,
  evidenceLedger,
  grantorDocumentReadiness,
  averageReadiness,
}, language) {
  const pendingDocumentCases = grantorDocumentReadiness.filter((item) => item.pending > 0);

  return {
    id: "nuxera-admin-audit-package-local",
    status: blockedGates.length > 0 ? "release-gated-audit-ready" : "controlled-review-ready",
    generatedFor: "internal-review",
    scope: ["release-gates", "readiness", "evidence-ledger", "grantor-documents", "incident-controls"],
    signals: [
      {
        id: "blocked-gates",
        label: pickLang({ es: "Release gates bloqueados", en: "Blocked release gates" }, language),
        value: blockedGates.length,
        status: blockedGates.length > 0 ? "requires-action" : "clear",
      },
      {
        id: "readiness-average",
        label: pickLang({ es: "Readiness promedio", en: "Average readiness" }, language),
        value: `${averageReadiness}%`,
        status: averageReadiness >= 70 ? "watch" : "needs-controls",
      },
      {
        id: "evidence-signals",
        label: pickLang({ es: "Senales de evidencia", en: "Evidence signals" }, language),
        value: evidenceLedger.summary.total,
        status: "read-only-indexed",
      },
      {
        id: "grantor-document-pending",
        label: pickLang({ es: "Casos grantor con documentos pendientes", en: "Grantor cases with pending documents" }, language),
        value: pendingDocumentCases.length,
        status: pendingDocumentCases.length > 0 ? "authorized-summary-watch" : "authorized-summary-ready",
      },
      {
        id: "high-severity-incidents",
        label: pickLang({ es: "Incidentes high severity", en: "High-severity incidents" }, language),
        value: highSeverityIncidents.length,
        status: highSeverityIncidents.length > 0 ? "blocked-by-design" : "clear",
      },
    ],
    nextActions: [
      ...blockedGates.map((gate) => pickLang({ es: `Resolver gate: ${gate.label}.`, en: `Resolve gate: ${gate.label}.` }, language)),
      ...highSeverityIncidents.map((control) => pickLang({ es: `Mantener control: ${control.signal}.`, en: `Maintain control: ${control.signal}.` }, language)),
      ...pendingDocumentCases.map((item) => pickLang({ es: `Confirmar documentos pendientes para ${item.label}.`, en: `Confirm pending documents for ${item.label}.` }, language)),
    ],
    guardrails: [
      { es: "Paquete local de auditoria; no exporta archivos ni escribe backend.", en: "Local audit package; it does not export files or write to the backend." },
      { es: "No cambia permisos, shares, data-room ni visibilidad documental.", en: "It does not change permissions, shares, data room, or document visibility." },
      { es: "Solo consolida senales existentes para revision humana.", en: "It only consolidates existing signals for human review." },
    ].map((guardrail) => pickLang(guardrail, language)),
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
}, language) {
  const pendingDocuments = grantorDocumentReadiness.reduce((total, item) => total + item.pending, 0);
  const evidenceWatch = evidenceCoverage.reduce((total, item) => total + item.watch, 0);
  const runtimeIncidents = incidentControls.filter((control) => ["browser-e2e", "runtime-path"].includes(control.id));
  const aiLane = operationLanes.find((lane) => lane.id === "ai-agents");
  const decisionSafety = complianceEvidence.find((item) => item.id === "decision-safety");

  return [
    {
      id: "rollout-governance",
      label: pickLang({ es: "Gobernanza rollout", en: "Rollout governance" }, language),
      status: blockedGates.length > 0 ? "release-gated" : "controlled",
      severity: blockedGates.length > 0 ? "high" : "low",
      signal: pickLang({ es: `${blockedGates.length} gates requieren revision antes de persistencia.`, en: `${blockedGates.length} gates require review before persistence.` }, language),
      nextAction: blockedGates.length > 0
        ? pickLang({ es: "Mantener rollout bloqueado hasta cerrar contratos backend.", en: "Keep rollout blocked until backend contracts are closed." }, language)
        : pickLang({ es: "Preparar revision controlada.", en: "Prepare a controlled review." }, language),
    },
    {
      id: "runtime-tooling",
      label: pickLang({ es: "Runtime y tooling", en: "Runtime & tooling" }, language),
      status: runtimeIncidents.length > 0 ? "environment-watch" : "clear",
      severity: runtimeIncidents.length > 0 ? "medium" : "low",
      signal: pickLang({ es: `${runtimeIncidents.length} controles de entorno activos.`, en: `${runtimeIncidents.length} active environment controls.` }, language),
      nextAction: pickLang({ es: "Seguir validando con lint/build/unit tests mientras browser automation siga bloqueado.", en: "Keep validating with lint/build/unit tests while browser automation stays blocked." }, language),
    },
    {
      id: "evidence-observability",
      label: pickLang({ es: "Evidencia observable", en: "Observable evidence" }, language),
      status: evidenceWatch > 0 ? "read-only-watch" : "read-only-ready",
      severity: evidenceWatch > 0 ? "medium" : "low",
      signal: pickLang({ es: `${evidenceWatch} senales en watch dentro del ledger admin.`, en: `${evidenceWatch} signals on watch within the admin ledger.` }, language),
      nextAction: pickLang({ es: "Usar ledger como indice interno, no como fuente de permisos o exports.", en: "Use the ledger as an internal index, not as a source of permissions or exports." }, language),
    },
    {
      id: "document-visibility",
      label: pickLang({ es: "Visibilidad documental", en: "Document visibility" }, language),
      status: pendingDocuments > 0 ? "authorized-summary-watch" : "authorized-summary-ready",
      severity: pendingDocuments > 0 ? "medium" : "low",
      signal: pickLang({ es: `${pendingDocuments} senales documentales pendientes en casos grantor.`, en: `${pendingDocuments} pending document signals across grantor cases.` }, language),
      nextAction: pickLang({ es: "Confirmar faltantes sin abrir archivos ni cambiar data-room.", en: "Confirm gaps without opening files or changing the data room." }, language),
    },
    {
      id: "decision-safety",
      label: "Decision safety",
      status: decisionSafety?.status || "watch",
      severity: decisionSafety?.status === "aligned" ? "low" : "high",
      signal: decisionSafety?.detail || pickLang({ es: "Decision humana requerida antes de cualquier decision vinculante.", en: "Human decision required before any binding decision." }, language),
      nextAction: pickLang({ es: "Mantener revision humana y condiciones no vinculantes.", en: "Keep human review and non-binding conditions." }, language),
    },
    {
      id: "ai-automation",
      label: pickLang({ es: "IA y automatizacion", en: "AI & automation" }, language),
      status: aiLane?.status || "limited",
      severity: aiLane?.status === "limited" ? "medium" : "low",
      signal: aiLane?.signal || pickLang({ es: "Automatizacion IA limitada a senales auditables.", en: "AI automation limited to auditable signals." }, language),
      nextAction: pickLang({ es: "No activar agentes sin trazabilidad, costo y fallback aprobados.", en: "Do not activate agents without approved traceability, cost and fallback." }, language),
    },
    {
      id: "audit-readiness",
      label: "Audit readiness",
      status: auditPackage.status,
      severity: auditPackage.nextActions.length > 0 ? "medium" : "low",
      signal: pickLang({ es: `${auditPackage.nextActions.length} acciones abiertas en paquete local.`, en: `${auditPackage.nextActions.length} open actions in the local package.` }, language),
      nextAction: pickLang({ es: "Resolver acciones abiertas antes de conectar persistencia real.", en: "Resolve open actions before connecting real persistence." }, language),
    },
  ];
}

function buildAdminActionQueue(adminHealthSignals, auditPackage, language) {
  const severityRank = { high: 0, medium: 1, low: 2 };
  const healthActions = adminHealthSignals
    .filter((signal) => signal.severity !== "low")
    .map((signal) => ({
      id: `health-${signal.id}`,
      domain: signal.label,
      priority: signal.severity === "high" ? "critical-path" : "watch",
      status: "local-open",
      owner: signal.id === "ai-automation" ? "AI ops" : "Ops NUXERA",
      action: signal.nextAction,
      source: "admin-health-signal",
      guardrail: pickLang({ es: "Seguimiento local; no ejecuta cambios ni escribe backend.", en: "Local follow-up; it does not execute changes or write to the backend." }, language),
      sortRank: severityRank[signal.severity] ?? 3,
    }));
  const auditActions = auditPackage.nextActions.slice(0, 4).map((action, index) => ({
    id: `audit-action-${index + 1}`,
    domain: "Audit package",
    priority: "review",
    status: "local-open",
    owner: "Security admin",
    action,
    source: "admin-audit-package",
    guardrail: pickLang({ es: "Accion informativa; requiere revision humana antes de persistencia.", en: "Informational action; it requires human review before persistence." }, language),
    sortRank: 2 + index,
  }));

  return [...healthActions, ...auditActions]
    .sort((a, b) => a.sortRank - b.sortRank)
    .map(({ sortRank, ...item }) => item);
}
export function getAdminOperationsConsole(language = "es") {
  const operationLanes = localizeEntries(operationLanesSource, language);
  const releaseGates = localizeEntries(releaseGatesSource, language);
  const adminAuditEvents = adminAuditEventsSource.map((event) => pickLang(event, language));
  const rolloutReadiness = localizeEntries(rolloutReadinessSource, language);
  const incidentControls = localizeEntries(incidentControlsSource, language);
  const complianceEvidence = localizeEntries(complianceEvidenceSource, language);

  const blockedGates = releaseGates.filter((gate) => gate.state === "blocked");
  const watchLanes = operationLanes.filter((lane) => ["watch", "limited"].includes(lane.status));
  const highSeverityIncidents = incidentControls.filter((control) => control.severity === "high");
  const evidenceLedger = getNuxeraEvidenceLedger("admin", language);
  const evidenceByEngine = getEvidenceLedgerByEngine("admin", language);
  const evidenceCoverage = Object.entries(evidenceByEngine).map(([engine, items]) => ({
    engine,
    total: items.length,
    ready: items.filter((item) => item.status === "ready").length,
    watch: items.filter((item) => item.status !== "ready").length,
    visibility: "internal-review",
    policy: "Read-only compliance mapping; no grants, exports or backend writes.",
  }));
  const grantorQueue = getGrantorCaseQueue(language);
  const grantorDocumentReadiness = grantorQueue.cases.map((caseItem) => {
    const documentSummary = getGrantorDocumentSummary(caseItem.id, grantorQueue, language);

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
  }, language);
  const adminHealthSignals = buildAdminHealthSignals({
    operationLanes,
    blockedGates,
    incidentControls,
    evidenceCoverage,
    complianceEvidence,
    grantorDocumentReadiness,
    auditPackage,
  }, language);
  const adminActionQueue = buildAdminActionQueue(adminHealthSignals, auditPackage, language);

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
    adminActionQueue,
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
      adminActionQueue: adminActionQueue.length,
      adminCriticalActions: adminActionQueue.filter((item) => item.priority === "critical-path").length,
      requiresHumanReview: true,
    },
    policies: [
      { es: "Admin observa salud y controles; no cambia permisos desde esta fundacion local.", en: "Admin observes health and controls; it does not change permissions from this local foundation." },
      { es: "Toda persistencia NUXERA requiere contrato backend dedicado.", en: "Any NUXERA persistence requires a dedicated backend contract." },
      { es: "Readiness documental grantor es summary-only y no otorga acceso a documentos.", en: "Grantor document readiness is summary-only and does not grant document access." },
      { es: "La automatizacion IA debe permanecer asistiva y trazable.", en: "AI automation must remain assistive and traceable." },
    ].map((policy) => pickLang(policy, language)),
  };
}
