import React from "react";
import { NavLink } from "react-router-dom";
import { getStrategyActionPlan, getStrategyWorkspace } from "../strategy/strategyWorkspace";

export default function StrategyWorkspace({ role }) {
  const workspace = getStrategyWorkspace(role);
  const actionPlan = getStrategyActionPlan();

  return (
    <section className="nuxera-adapter" aria-labelledby="nuxera-strategy-title">
      <header className="nuxera-adapter-header">
        <div>
          <p className="nuxera-eyebrow">NUXERA Strategy / Decision support</p>
          <h1 id="nuxera-strategy-title">Soporte de decision</h1>
          <p>{workspace.focus}</p>
        </div>
        <div className="nuxera-adapter-status">
          <span>Estado</span>
          <strong>Borrador auditable</strong>
          <small>Revision humana requerida</small>
        </div>
      </header>

      <div className="nuxera-strategy-notice">
        <strong>{workspace.recommendation.summary}</strong>
        <span>{workspace.recommendation.uncertainty}</span>
      </div>

      <div className="nuxera-strategy-grid">
        <section>
          <h2>Preguntas guiadas</h2>
          {workspace.guidedQuestions.map((question, index) => (
            <article key={question}>
              <span>{index + 1}</span>
              <p>{question}</p>
            </article>
          ))}
        </section>

        <section>
          <h2>Supuestos e incertidumbre</h2>
          {workspace.assumptions.map((assumption) => (
            <article key={assumption.id}>
              <span>{assumption.confidence}</span>
              <strong>{assumption.label}</strong>
              <p>{assumption.uncertainty}</p>
            </article>
          ))}
        </section>
      </div>

      <section className="nuxera-scenario-table">
        <h2>Escenarios comparados</h2>
        <div>
          {workspace.scenarios.map((scenario) => (
            <article key={scenario.id}>
              <header>
                <strong>{scenario.name}</strong>
                <span>Probabilidad {scenario.probability}</span>
              </header>
              <p><b>Beneficio:</b> {scenario.benefit}</p>
              <p><b>Riesgo:</b> {scenario.risk}</p>
              <p><b>Accion:</b> {scenario.action}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="nuxera-strategy-grid">
        <section>
          <h2>Evidencia conectada</h2>
          {workspace.evidenceLinks.map((link) => (
            <NavLink className="nuxera-evidence-link" key={link.id} to={link.path}>
              <span>{link.engine}</span>
              <strong>{link.label}</strong>
              <p>{link.signal}</p>
            </NavLink>
          ))}
        </section>
        <section>
          <h2>Plan de accion</h2>
          {actionPlan.map((action, index) => (
            <article key={action}>
              <span>{index + 1}</span>
              <p>{action}</p>
            </article>
          ))}
        </section>
      </div>

      <div className="nuxera-strategy-audit">
        {workspace.recommendation.auditState}
      </div>
    </section>
  );
}