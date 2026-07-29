import { lazy, Suspense } from "react";
import { pickLang } from "../../data/requisitosMinimos";
import { useNuxeraLanguage } from "../hooks/useNuxeraLanguage";

const AdminUsersTab = lazy(() => import("../../components/Dashboard/Admin/AdminUsersTab"));
const AdminHumanReviewTab = lazy(() => import("../../components/Dashboard/Admin/AdminHumanReviewTab"));
const AdminMetricsTab = lazy(() => import("../../components/Dashboard/Admin/AdminMetricsTab"));
const AdminReferenceSourcesTab = lazy(() => import("../../components/Dashboard/Admin/AdminReferenceSourcesTab"));
const AdminRubricsTab = lazy(() => import("../../components/Dashboard/Admin/AdminRubricsTab"));
const TraceabilityLogTab = lazy(() => import("../../components/Dashboard/TraceabilityLogTab"));
const AIAgentOpsTab = lazy(() => import("../../components/Dashboard/AIAgentOpsTab"));
const PredeployGoNoGoTab = lazy(() => import("../../components/Dashboard/PredeployGoNoGoTab"));

const ADMIN_WORKSPACES_SOURCE = Object.freeze({
  operations: {
    title: { es: "Operacion administrativa", en: "Administrative operations" },
    description: { es: "Usuarios, revision humana, metricas, fuentes y rubricas desde contratos administrativos protegidos.", en: "Users, human review, metrics, sources and rubrics through protected administrative contracts." },
    modules: [
      ["users", { es: "Usuarios y permisos", en: "Users & permissions" }, AdminUsersTab],
      ["human-review", { es: "Revision humana", en: "Human review" }, AdminHumanReviewTab],
      ["metrics", { es: "Metricas", en: "Metrics" }, AdminMetricsTab],
      ["sources", { es: "Fuentes", en: "Sources" }, AdminReferenceSourcesTab],
      ["rubrics", { es: "Rubricas", en: "Rubrics" }, AdminRubricsTab],
    ],
  },
  security: {
    title: { es: "Seguridad y trazabilidad", en: "Security & traceability" },
    description: { es: "Bitacora global, segregacion y evidencia operativa sin ampliar permisos.", en: "Global log, segregation and operational evidence without expanding permissions." },
    modules: [["traceability", { es: "Trazabilidad", en: "Traceability" }, TraceabilityLogTab]],
  },
  ai: {
    title: { es: "IA y agentes", en: "AI & agents" },
    description: { es: "Supervision de agentes, costos, errores y revision humana; no activa ejecucion automatica.", en: "Oversight of agents, costs, errors and human review; it does not activate automated execution." },
    modules: [["ai-ops", { es: "Operaciones de IA", en: "AI operations" }, AIAgentOpsTab]],
  },
  system: {
    title: { es: "Sistema y despliegue", en: "System & deployment" },
    description: { es: "Controles go/no-go, salud y preparacion de despliegue.", en: "Go/no-go controls, health and deployment readiness." },
    modules: [["predeploy", { es: "Predeploy", en: "Predeploy" }, PredeployGoNoGoTab]],
  },
});

export function getAdminWorkspaceConfig(section, language = "es") {
  const config = ADMIN_WORKSPACES_SOURCE[section] || ADMIN_WORKSPACES_SOURCE.operations;
  return {
    title: pickLang(config.title, language),
    description: pickLang(config.description, language),
    modules: config.modules.map(([id, label, Module]) => [id, pickLang(label, language), Module]),
  };
}

function AdminModuleLoading({ L }) {
  return <div className="nuxera-adapter-loading">{L("Cargando modulo administrativo protegido...", "Loading protected administrative module...")}</div>;
}

export default function AdminWorkspaceAdapter({ section }) {
  const { L, language } = useNuxeraLanguage();
  const config = getAdminWorkspaceConfig(section, language);

  return (
    <section className="nuxera-adapter" aria-labelledby="nuxera-admin-workspace-title">
      <header className="nuxera-adapter-header">
        <div>
          <p className="nuxera-eyebrow">NUXERA Admin / {section}</p>
          <h1 id="nuxera-admin-workspace-title">{config.title}</h1>
          <p>{config.description}</p>
        </div>
        <div className="nuxera-adapter-status">
          <span>{L("Acceso", "Access")}</span>
          <strong>{L("Administrador", "Administrator")}</strong>
          <small>{L("Autorizacion aplicada por backend", "Authorization enforced by the backend")}</small>
        </div>
      </header>

      <div className="nuxera-admin-workspace-modules">
        {config.modules.map(([id, label, Module]) => (
          <section key={id} aria-label={label}>
            <header><span>{L("Modulo protegido", "Protected module")}</span><h2>{label}</h2></header>
            <Suspense fallback={<AdminModuleLoading L={L} />}><Module /></Suspense>
          </section>
        ))}
      </div>
    </section>
  );
}
