import React, { Suspense, lazy } from "react";
import { NavLink } from "react-router-dom";
import { useNuxeraExpedient } from "../context/NuxeraExpedientContext";
import { useNuxeraLanguage } from "../hooks/useNuxeraLanguage";
import { buildFinanceJourneyFromExpedient, getFinanceJourney, getFinanceJourneyEvidenceLinks } from "../finance/financeJourney";
import { pickLang } from "../../data/requisitosMinimos";

const FundingReadinessTab = lazy(() => import("../../components/Dashboard/Solicitante/FundingReadinessTab"));
const PipelineTab = lazy(() => import("../../components/Dashboard/Otorgante/PipelineTab"));
const ServiceOrdersPage = lazy(() => import("../../pages/ServiceOrdersPage"));

const roleContentSource = {
  applicant: {
    title: { es: "Preparacion financiera", en: "Financial preparation" },
    body: { es: "Readiness, documentos, requisitos y reporte para que el solicitante llegue a revision institucional con evidencia organizada.", en: "Readiness, documents, requirements and report so the applicant reaches institutional review with organized evidence." },
    component: FundingReadinessTab,
  },
  grantor: {
    title: { es: "Pipeline financiero", en: "Financial pipeline" },
    body: { es: "Oportunidades, data room, score, riesgo y acciones institucionales para el otorgante.", en: "Opportunities, data room, score, risk and institutional actions for the grantor." },
    component: PipelineTab,
  },
  admin: {
    title: { es: "Operacion financiera", en: "Financial operations" },
    body: { es: "Expedientes, estado operativo y seguimiento administrativo sin retirar la consola heredada.", en: "Files, operational status and administrative follow-up without retiring the legacy console." },
    component: ServiceOrdersPage,
  },
};

function AdapterLoading({ L }) {
  return (
    <div className="nuxera-adapter-loading">
      {L("Cargando workspace financiero...", "Loading financial workspace...")}
    </div>
  );
}

export function getFinanceAdapterConfig(role, language = "es") {
  const config = roleContentSource[role] || roleContentSource.applicant;
  return { ...config, title: pickLang(config.title, language), body: pickLang(config.body, language) };
}

function FinanceJourneyPanel({ journey, options = [], selectedId, onSelect, L, language }) {
  const evidenceLinks = getFinanceJourneyEvidenceLinks(language);

  return (
    <section className="nuxera-finance-journey" aria-label={L("Resumen financiero guiado", "Guided financial summary")}>
      <div className="nuxera-finance-next-action">
        <span>{journey.source === "real-expedient" ? L("Expediente real", "Real file") : L("Siguiente accion", "Next action")}</span>
        <h2>{journey.headline}</h2>
        <p>{journey.nextAction}</p>
        <div className="nuxera-progress-track" aria-label={`${journey.progress}% ${L("completado", "complete")}`}>
          <i style={{ width: `${journey.progress}%` }} />
        </div>
      </div>

      {options.length > 1 && (
        <div className="nuxera-finance-goals" aria-label={L("Selector financiero de expediente", "Financial file selector")}>
          {options.map((option) => (
            <button type="button" key={option.id} onClick={() => onSelect(option.id)} aria-pressed={option.id === selectedId}>
              {option.label}
            </button>
          ))}
        </div>
      )}

      <div className="nuxera-finance-alerts">
        <h2>{L("Alertas de decision", "Decision alerts")}</h2>
        {journey.alerts.map((alert) => <p key={alert}>{alert}</p>)}
      </div>

      <div className="nuxera-finance-evidence">
        <h2>{L("Evidencia conectada", "Connected evidence")}</h2>
        {evidenceLinks.map((link) => (
          <NavLink key={link.id} to={link.path}>
            <strong>{link.label}</strong>
            <span>{link.detail}</span>
          </NavLink>
        ))}
      </div>
    </section>
  );
}

function RoleFinanceJourney({ role, L, language }) {
  const context = useNuxeraExpedient();
  const journey = context.isDemo || !context.expedient
    ? getFinanceJourney(role, language)
    : buildFinanceJourneyFromExpedient(context.expedient, role, language);
  return (
    <FinanceJourneyPanel
      journey={journey}
      options={context.options}
      selectedId={context.selectedId}
      onSelect={context.selectExpedient}
      L={L}
      language={language}
    />
  );
}

export default function FinanceWorkspaceAdapter({ role }) {
  const { L, language } = useNuxeraLanguage();
  const config = getFinanceAdapterConfig(role, language);
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
          <span>{L("Workspace financiero", "Financial workspace")}</span>
          <strong>{role}</strong>
          <small>{L("Lectura contextual por expediente", "Contextual read by file")}</small>
        </div>
      </header>

      <RoleFinanceJourney role={role} L={L} language={language} />

      <div className="nuxera-adapter-body">
        <Suspense fallback={<AdapterLoading L={L} />}>
          <FinanceComponent />
        </Suspense>
      </div>
    </section>
  );
}
