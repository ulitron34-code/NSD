import { lazy, Suspense } from "react";

const AdminUsersTab = lazy(() => import("../../components/Dashboard/Admin/AdminUsersTab"));
const AdminHumanReviewTab = lazy(() => import("../../components/Dashboard/Admin/AdminHumanReviewTab"));
const AdminMetricsTab = lazy(() => import("../../components/Dashboard/Admin/AdminMetricsTab"));
const AdminReferenceSourcesTab = lazy(() => import("../../components/Dashboard/Admin/AdminReferenceSourcesTab"));
const AdminRubricsTab = lazy(() => import("../../components/Dashboard/Admin/AdminRubricsTab"));
const TraceabilityLogTab = lazy(() => import("../../components/Dashboard/TraceabilityLogTab"));
const AIAgentOpsTab = lazy(() => import("../../components/Dashboard/AIAgentOpsTab"));
const PredeployGoNoGoTab = lazy(() => import("../../components/Dashboard/PredeployGoNoGoTab"));

const ADMIN_WORKSPACES = Object.freeze({
  operations: {
    title: "Operacion administrativa",
    description: "Usuarios, revision humana, metricas, fuentes y rubricas desde contratos administrativos protegidos.",
    modules: [
      ["users", "Usuarios y permisos", AdminUsersTab],
      ["human-review", "Revision humana", AdminHumanReviewTab],
      ["metrics", "Metricas", AdminMetricsTab],
      ["sources", "Fuentes", AdminReferenceSourcesTab],
      ["rubrics", "Rubricas", AdminRubricsTab],
    ],
  },
  security: {
    title: "Seguridad y trazabilidad",
    description: "Bitacora global, segregacion y evidencia operativa sin ampliar permisos.",
    modules: [["traceability", "Trazabilidad", TraceabilityLogTab]],
  },
  ai: {
    title: "IA y agentes",
    description: "Supervision de agentes, costos, errores y revision humana; no activa ejecucion automatica.",
    modules: [["ai-ops", "Operaciones de IA", AIAgentOpsTab]],
  },
  system: {
    title: "Sistema y despliegue",
    description: "Controles go/no-go, salud y preparacion de despliegue.",
    modules: [["predeploy", "Predeploy", PredeployGoNoGoTab]],
  },
});

export function getAdminWorkspaceConfig(section) {
  return ADMIN_WORKSPACES[section] || ADMIN_WORKSPACES.operations;
}

function AdminModuleLoading() {
  return <div className="nuxera-adapter-loading">Cargando modulo administrativo protegido...</div>;
}

export default function AdminWorkspaceAdapter({ section }) {
  const config = getAdminWorkspaceConfig(section);

  return (
    <section className="nuxera-adapter" aria-labelledby="nuxera-admin-workspace-title">
      <header className="nuxera-adapter-header">
        <div>
          <p className="nuxera-eyebrow">NUXERA Admin / {section}</p>
          <h1 id="nuxera-admin-workspace-title">{config.title}</h1>
          <p>{config.description}</p>
        </div>
        <div className="nuxera-adapter-status">
          <span>Acceso</span>
          <strong>Administrador</strong>
          <small>Autorizacion aplicada por backend</small>
        </div>
      </header>

      <div className="nuxera-admin-workspace-modules">
        {config.modules.map(([id, label, Module]) => (
          <section key={id} aria-label={label}>
            <header><span>Modulo protegido</span><h2>{label}</h2></header>
            <Suspense fallback={<AdminModuleLoading />}><Module /></Suspense>
          </section>
        ))}
      </div>
    </section>
  );
}
