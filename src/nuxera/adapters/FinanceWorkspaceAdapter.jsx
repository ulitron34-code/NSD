import React, { Suspense, lazy } from "react";
import { NavLink } from "react-router-dom";
import { getFinanceJourney, getFinanceJourneyEvidenceLinks } from "../finance/financeJourney";

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
  const journey = getFinanceJourney(role);
  const evidenceLinks = getFinanceJourneyEvidenceLinks();
  const FinanceComponent = config.component;

  return (
    <section className="nuxera-adapter" aria-labelledby="nuxera-finance-title">
      <header className="nuxera-adapter-header">
        <div>
          <p className="nuxera-eyebrow">NUXERA Finance / Journey</p>
          <h1 id="nuxera-finance-title">{config.title}</h1>
          <p>{config.body}</p>
        </div>
        <div className="nuxera-adapter-status">
          <span>{journey.progressLabel}</span>
          <strong>{journey.progress}%</strong>
          <small>{journey.effort}</small>
        </div>
      </header>

      <section className="nuxera-finance-journey" aria-label="Resumen financiero guiado">
        <div className="nuxera-finance-next-action">
          <span>Siguiente accion</span>
          <h2>{journey.headline}</h2>
          <p>{journey.nextAction}</p>
          <div className="nuxera-progress-track" aria-label={`${journey.progress}% completado`}>
            <i style={{ width: `${journey.progress}%` }} />
          </div>
        </div>

        <div className="nuxera-finance-goals">
          {journey.goals.map((goal) => (
            <button type="button" key={goal}>{goal}</button>
          ))}
        </div>

        <div className="nuxera-finance-alerts">
          <h2>Alertas de decision</h2>
          {journey.alerts.map((alert) => (
            <p key={alert}>{alert}</p>
          ))}
        </div>

        <div className="nuxera-finance-evidence">
          <h2>Evidencia conectada</h2>
          {evidenceLinks.map((link) => (
            <NavLink key={link.id} to={link.path}>
              <strong>{link.label}</strong>
              <span>{link.detail}</span>
            </NavLink>
          ))}
        </div>
      </section>

      <div className="nuxera-adapter-body">
        <Suspense fallback={<AdapterLoading />}>
          <FinanceComponent />
        </Suspense>
      </div>
    </section>
  );
}