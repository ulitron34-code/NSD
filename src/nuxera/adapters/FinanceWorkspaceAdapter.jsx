import React, { Suspense, lazy } from "react";

const FundingReadinessTab = lazy(() => import("../../components/Dashboard/Solicitante/FundingReadinessTab"));
const PipelineTab = lazy(() => import("../../components/Dashboard/Otorgante/PipelineTab"));
const ServiceOrdersPage = lazy(() => import("../../pages/ServiceOrdersPage"));

const roleContent = {
  applicant: {
    title: "Preparacion financiera",
    body: "Readiness, documentos, requisitos y reporte para que el solicitante llegue a revision institucional con evidencia organizada.",
    component: FundingReadinessTab,
  },
  grantor: {
    title: "Pipeline financiero",
    body: "Oportunidades, data room, score, riesgo y acciones institucionales para el otorgante.",
    component: PipelineTab,
  },
  admin: {
    title: "Operacion financiera",
    body: "Expedientes, estado operativo y seguimiento administrativo sin retirar la consola heredada.",
    component: ServiceOrdersPage,
  },
};

function AdapterLoading() {
  return (
    <div className="nuxera-adapter-loading">
      Cargando workspace financiero...
    </div>
  );
}

export function getFinanceAdapterConfig(role) {
  return roleContent[role] || roleContent.applicant;
}

export default function FinanceWorkspaceAdapter({ role }) {
  const config = getFinanceAdapterConfig(role);
  const FinanceComponent = config.component;

  return (
    <section className="nuxera-adapter" aria-labelledby="nuxera-finance-title">
      <header className="nuxera-adapter-header">
        <div>
          <p className="nuxera-eyebrow">NUXERA Finance / Adapter controlado</p>
          <h1 id="nuxera-finance-title">{config.title}</h1>
          <p>{config.body}</p>
        </div>
        <div className="nuxera-adapter-status">
          <span>Rol activo</span>
          <strong>{role}</strong>
          <small>Legacy module mounted</small>
        </div>
      </header>

      <div className="nuxera-adapter-body">
        <Suspense fallback={<AdapterLoading />}>
          <FinanceComponent />
        </Suspense>
      </div>
    </section>
  );
}