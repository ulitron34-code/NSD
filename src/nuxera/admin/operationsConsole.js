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

export function getAdminOperationsConsole() {
  const blockedGates = releaseGates.filter((gate) => gate.state === "blocked");
  const watchLanes = operationLanes.filter((lane) => ["watch", "limited"].includes(lane.status));
  const highSeverityIncidents = incidentControls.filter((control) => control.severity === "high");
  const averageReadiness = Math.round(
    rolloutReadiness.reduce((total, item) => total + item.readiness, 0) / rolloutReadiness.length
  );

  return {
    status: blockedGates.length > 0 ? "release-gated" : "ready-for-controlled-review",
    lanes: operationLanes,
    releaseGates,
    auditEvents: adminAuditEvents,
    rolloutReadiness,
    incidentControls,
    complianceEvidence,
    summary: {
      lanes: operationLanes.length,
      watch: watchLanes.length,
      blockedGates: blockedGates.length,
      readiness: averageReadiness,
      highSeverityIncidents: highSeverityIncidents.length,
      complianceAligned: complianceEvidence.filter((item) => item.status === "aligned").length,
      requiresHumanReview: true,
    },
    policies: [
      "Admin observa salud y controles; no cambia permisos desde esta fundacion local.",
      "Toda persistencia NUXERA requiere contrato backend dedicado.",
      "La automatizacion IA debe permanecer asistiva y trazable.",
    ],
  };
}
