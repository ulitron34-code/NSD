import React from "react";
import { NavLink } from "react-router-dom";
import { useNuxeraExpedient } from "../context/NuxeraExpedientContext";
import { buildCaseOrchestration } from "../orchestration/caseOrchestration";
import { buildStrategyDecisionPackageForWorkspace, buildStrategyWorkspaceForExpedient, getStrategyActionPlan } from "../strategy/strategyWorkspace";

export default function StrategyWorkspace({ role }) {
  const context = useNuxeraExpedient();
  const workspace = buildStrategyWorkspaceForExpedient({ ...context, role });
  const actionPlan = getStrategyActionPlan();
  const decisionPackage = buildStrategyDecisionPackageForWorkspace(workspace);
  const orchestration = buildCaseOrchestration({ ...context, role });

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

      {context.options.length > 1 && (
        <div className="nuxera-context-selector" aria-label="Selector de expediente para Strategy">
          {context.options.map((option) => (
            <button type="button" key={option.id} onClick={() => context.selectExpedient(option.id)} aria-pressed={option.id === context.selectedId}>{option.label}</button>
          ))}
        </div>
      )}

      <div className="nuxera-strategy-notice">
        <strong>{workspace.recommendation.summary}</strong>
        <span>{workspace.recommendation.uncertainty}</span>
      </div>

      <section className="nuxera-agent-orchestration" aria-label="Orquestacion multiagente segura">
        <header>
          <div>
            <span>{orchestration.status}</span>
            <h2>Orquestacion auditable del expediente</h2>
          </div>
          <strong>{orchestration.summary.ready}/{orchestration.summary.agents} agentes listos</strong>
        </header>
        <div className="nuxera-admin-summary">
          <article><span>Agentes</span><strong>{orchestration.summary.agents}</strong></article>
          <article><span>Listos</span><strong>{orchestration.summary.ready}</strong></article>
          <article><span>Esperan evidencia</span><strong>{orchestration.summary.waitingEvidence}</strong></article>
          <article><span>Revision humana</span><strong>{orchestration.summary.humanReview}</strong></article>
        </div>
        {!orchestration.access.allowed && <p>Bloqueado: no existe un contexto real autorizado y seleccionado para este rol.</p>}
        <div>
          {orchestration.agents.map((agent) => (
            <article key={agent.id}>
              <span>{agent.status}</span>
              <strong>{agent.label}</strong>
              <p>{agent.objective}</p>
              <small>{agent.engine} / confianza {agent.confidence} / costo estimado ${agent.estimatedCostUsd}</small>
              <em>{agent.traceId}</em>
            </article>
          ))}
        </div>
        <footer>{orchestration.access.guardrails.join(" ")}</footer>
      </section>

      <section className="nuxera-decision-flow" aria-label="Flujo de decision Strategy">
        <header>
          <div>
            <span>Decision flow</span>
            <h2>Gates antes de comprometer accion</h2>
          </div>
          <strong>{decisionPackage.status}</strong>
        </header>
        <div>
          {workspace.decisionFlowStages.map((stage) => (
            <article key={stage.id}>
              <span>{stage.status}</span>
              <strong>{stage.label}</strong>
              <p>{stage.gate}</p>
              <small>{stage.owner}</small>
              <em>{stage.rollback}</em>
            </article>
          ))}
        </div>
      </section>

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
          <h2>Criterios de preparacion</h2>
          {workspace.decisionReadinessCriteria.map((criterion) => (
            <article key={criterion.id}>
              <span>{criterion.state}</span>
              <strong>{criterion.label}</strong>
              <p>{criterion.requirement}</p>
            </article>
          ))}
        </section>
      </div>

      <div className="nuxera-strategy-grid">
        <section>
          <h2>Plan de accion</h2>
          {actionPlan.map((action, index) => (
            <article key={action}>
              <span>{index + 1}</span>
              <p>{action}</p>
            </article>
          ))}
        </section>
        <section>
          <h2>Paquete auditable</h2>
          <article>
            <span>{decisionPackage.decisionType}</span>
            <strong>{decisionPackage.summary}</strong>
            <p>Evidencia requerida: {decisionPackage.requiredEvidenceIds.join(", ")}</p>
          </article>
          {decisionPackage.auditTrail.map((entry) => (
            <article key={entry}>
              <span>Audit</span>
              <p>{entry}</p>
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
