import React from "react";
import { NavLink } from "react-router-dom";
import { useNuxeraExpedient } from "../context/NuxeraExpedientContext";
import { useNuxeraLanguage } from "../hooks/useNuxeraLanguage";
import { buildCaseOrchestration } from "../orchestration/caseOrchestration";
import { buildStrategyDecisionPackageForWorkspace, buildStrategyWorkspaceForExpedient, getStrategyActionPlan } from "../strategy/strategyWorkspace";

export default function StrategyWorkspace({ role }) {
  const { L, language } = useNuxeraLanguage();
  const context = useNuxeraExpedient();
  const workspace = buildStrategyWorkspaceForExpedient({ ...context, role }, language);
  const actionPlan = getStrategyActionPlan(language);
  const decisionPackage = buildStrategyDecisionPackageForWorkspace(workspace, language);
  const orchestration = buildCaseOrchestration({ ...context, role }, language);

  return (
    <section className="nuxera-adapter" aria-labelledby="nuxera-strategy-title">
      <header className="nuxera-adapter-header">
        <div>
          <p className="nuxera-eyebrow">NUXERA Strategy / Decision support</p>
          <h1 id="nuxera-strategy-title">{L("Soporte de decision", "Decision support")}</h1>
          <p>{workspace.focus}</p>
        </div>
        <div className="nuxera-adapter-status">
          <span>{L("Estado", "Status")}</span>
          <strong>{L("Borrador auditable", "Auditable draft")}</strong>
          <small>{L("Revision humana requerida", "Human review required")}</small>
        </div>
      </header>

      {context.options.length > 1 && (
        <div className="nuxera-context-selector" aria-label={L("Selector de expediente para Strategy", "File selector for Strategy")}>
          {context.options.map((option) => (
            <button type="button" key={option.id} onClick={() => context.selectExpedient(option.id)} aria-pressed={option.id === context.selectedId}>{option.label}</button>
          ))}
        </div>
      )}

      <div className="nuxera-strategy-notice">
        <strong>{workspace.recommendation.summary}</strong>
        <span>{workspace.recommendation.uncertainty}</span>
      </div>

      <section className="nuxera-agent-orchestration" aria-label={L("Orquestacion multiagente segura", "Secure multi-agent orchestration")}>
        <header>
          <div>
            <span>{orchestration.status}</span>
            <h2>{L("Orquestacion auditable del expediente", "Auditable file orchestration")}</h2>
          </div>
          <strong>{orchestration.summary.ready}/{orchestration.summary.agents} {L("agentes listos", "agents ready")}</strong>
        </header>
        <div className="nuxera-admin-summary">
          <article><span>{L("Agentes", "Agents")}</span><strong>{orchestration.summary.agents}</strong></article>
          <article><span>{L("Listos", "Ready")}</span><strong>{orchestration.summary.ready}</strong></article>
          <article><span>{L("Esperan evidencia", "Waiting on evidence")}</span><strong>{orchestration.summary.waitingEvidence}</strong></article>
          <article><span>{L("Revision humana", "Human review")}</span><strong>{orchestration.summary.humanReview}</strong></article>
        </div>
        {!orchestration.access.allowed && <p>{L("Bloqueado: no existe un contexto real autorizado y seleccionado para este rol.", "Blocked: there is no authorized, selected real context for this role.")}</p>}
        <div>
          {orchestration.agents.map((agent) => (
            <article key={agent.id}>
              <span>{agent.status}</span>
              <strong>{agent.label}</strong>
              <p>{agent.objective}</p>
              <small>{agent.engine} / {L("confianza", "confidence")} {agent.confidence} / {L("costo estimado", "estimated cost")} ${agent.estimatedCostUsd}</small>
              <em>{agent.traceId}</em>
            </article>
          ))}
        </div>
        <footer>{orchestration.access.guardrails.join(" ")}</footer>
      </section>

      <section className="nuxera-decision-flow" aria-label={L("Flujo de decision Strategy", "Strategy decision flow")}>
        <header>
          <div>
            <span>Decision flow</span>
            <h2>{L("Gates antes de comprometer accion", "Gates before committing to action")}</h2>
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
          <h2>{L("Preguntas guiadas", "Guided questions")}</h2>
          {workspace.guidedQuestions.map((question, index) => (
            <article key={question}>
              <span>{index + 1}</span>
              <p>{question}</p>
            </article>
          ))}
        </section>

        <section>
          <h2>{L("Supuestos e incertidumbre", "Assumptions & uncertainty")}</h2>
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
        <h2>{L("Escenarios comparados", "Compared scenarios")}</h2>
        <div>
          {workspace.scenarios.map((scenario) => (
            <article key={scenario.id}>
              <header>
                <strong>{scenario.name}</strong>
                <span>{L("Probabilidad", "Probability")} {scenario.probability}</span>
              </header>
              <p><b>{L("Beneficio:", "Benefit:")}</b> {scenario.benefit}</p>
              <p><b>{L("Riesgo:", "Risk:")}</b> {scenario.risk}</p>
              <p><b>{L("Accion:", "Action:")}</b> {scenario.action}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="nuxera-strategy-grid">
        <section>
          <h2>{L("Evidencia conectada", "Connected evidence")}</h2>
          {workspace.evidenceLinks.map((link) => (
            <NavLink className="nuxera-evidence-link" key={link.id} to={link.path}>
              <span>{link.engine}</span>
              <strong>{link.label}</strong>
              <p>{link.signal}</p>
            </NavLink>
          ))}
        </section>
        <section>
          <h2>{L("Criterios de preparacion", "Readiness criteria")}</h2>
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
          <h2>{L("Plan de accion", "Action plan")}</h2>
          {actionPlan.map((action, index) => (
            <article key={action}>
              <span>{index + 1}</span>
              <p>{action}</p>
            </article>
          ))}
        </section>
        <section>
          <h2>{L("Paquete auditable", "Auditable package")}</h2>
          <article>
            <span>{decisionPackage.decisionType}</span>
            <strong>{decisionPackage.summary}</strong>
            <p>{L("Evidencia requerida:", "Required evidence:")} {decisionPackage.requiredEvidenceIds.join(", ")}</p>
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
