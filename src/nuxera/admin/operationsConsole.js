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

export function getAdminOperationsConsole() {
  const blockedGates = releaseGates.filter((gate) => gate.state === "blocked");
  const watchLanes = operationLanes.filter((lane) => ["watch", "limited"].includes(lane.status));

  return {
    status: blockedGates.length > 0 ? "release-gated" : "ready-for-controlled-review",
    lanes: operationLanes,
    releaseGates,
    auditEvents: adminAuditEvents,
    summary: {
      lanes: operationLanes.length,
      watch: watchLanes.length,
      blockedGates: blockedGates.length,
      requiresHumanReview: true,
    },
    policies: [
      "Admin observa salud y controles; no cambia permisos desde esta fundacion local.",
      "Toda persistencia NUXERA requiere contrato backend dedicado.",
      "La automatizacion IA debe permanecer asistiva y trazable.",
    ],
  };
}
