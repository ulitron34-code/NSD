import React, { Suspense, lazy } from "react";
import { useNuxeraExpedient } from "../context/NuxeraExpedientContext";
import { useNuxeraLanguage } from "../hooks/useNuxeraLanguage";
import { buildResearchMissionForExpedient } from "../intelligence/researchMissions";

const DocumentIntelligenceTab = lazy(() => import("../../components/Dashboard/DocumentIntelligenceTab"));

function AdapterLoading({ L }) {
  return (
    <div className="nuxera-adapter-loading">
      {L("Cargando inteligencia documental...", "Loading document intelligence...")}
    </div>
  );
}

export default function DocumentIntelligenceAdapter({ role }) {
  const { L, language } = useNuxeraLanguage();
  const context = useNuxeraExpedient();
  const research = buildResearchMissionForExpedient({ ...context, role }, undefined, language);

  return (
    <section className="nuxera-adapter" aria-labelledby="nuxera-intelligence-title">
      <header className="nuxera-adapter-header">
        <div>
          <p className="nuxera-eyebrow">NUXERA Intelligence / Research missions</p>
          <h1 id="nuxera-intelligence-title">{L("Inteligencia documental", "Document intelligence")}</h1>
          <p>
            {research.roleFocus} {L(
              "El modulo operativo existente sigue disponible debajo para validar expedientes, documentos, reglas, cruces y hallazgos.",
              "The existing operational module remains available below to validate files, documents, rules, cross-checks and findings."
            )}
          </p>
        </div>
        <div className="nuxera-adapter-status">
          <span>{research.report.status}</span>
          <strong>{research.mission.label}</strong>
          <small>Evidence required</small>
        </div>
      </header>

      {context.options.length > 1 && (
        <div className="nuxera-context-selector" aria-label={L("Selector de expediente para Intelligence", "File selector for Intelligence")}>
          {context.options.map((option) => (
            <button type="button" key={option.id} onClick={() => context.selectExpedient(option.id)} aria-pressed={option.id === context.selectedId}>{option.label}</button>
          ))}
        </div>
      )}

      <section className="nuxera-intel-mission" aria-label={L("Mision de investigacion", "Research mission")}>
        <div className="nuxera-intel-subject">
          <span>{research.subject.label}</span>
          <h2>{research.subject.value}</h2>
          <p>{research.mission.objective}</p>
        </div>

        <div className="nuxera-intel-plan">
          <h2>{L("Plan de investigacion", "Research plan")}</h2>
          {research.plan.map((step, index) => (
            <article key={step}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </article>
          ))}
        </div>

        <div className="nuxera-intel-sources">
          <h2>{L("Fuentes y procedencia", "Sources & provenance")}</h2>
          {research.sources.map((source) => (
            <article key={source.id}>
              <span>{source.reliability}</span>
              <strong>{source.source}</strong>
              <p>{source.provenance} / {source.delay}</p>
            </article>
          ))}
        </div>

        <div className="nuxera-intel-findings">
          <h2>{L("Hallazgos con evidencia", "Evidence-backed findings")}</h2>
          {research.findings.map((finding) => (
            <article key={finding.id}>
              <span>{L("Confianza", "Confidence")} {finding.confidence}</span>
              <strong>{finding.claim}</strong>
              <p><b>{L("Riesgo:", "Risk:")}</b> {finding.risk}</p>
              <p><b>{L("Recomendacion:", "Recommendation:")}</b> {finding.recommendation}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="nuxera-intel-report-note">
        <strong>{research.report.title}</strong>
        <span>{research.report.auditNote}</span>
      </div>

      <div className="nuxera-adapter-body">
        <Suspense fallback={<AdapterLoading L={L} />}>
          <DocumentIntelligenceTab />
        </Suspense>
      </div>
    </section>
  );
}
