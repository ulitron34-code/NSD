import React from "react";
import { NavLink } from "react-router-dom";
import { getApplicantDataRoomChecklist, getApplicantGuidedMission, getApplicantMissionReadiness } from "../applicant/guidedMission";
import { getGrantorCaseQueue, getGrantorQueueSummary } from "../grantor/caseQueue";

const roleCopy = {
  applicant: {
    eyebrow: "Solicitante",
    title: "Continua tu expediente con claridad",
    body: "NUXERA priorizara la siguiente accion, documentos faltantes y progreso real sin exponer complejidad tecnica antes de tiempo.",
    cards: ["Continuar expediente", "Mejorar mi proyecto", "Investigar mi empresa", "Dar seguimiento"],
  },
  grantor: {
    eyebrow: "Otorgante",
    title: "Mesa de decision orientada a evidencia",
    body: "La nueva experiencia concentrara cola, riesgo, documentos, hallazgos y decision en una entrada operativa.",
    cards: ["Casos prioritarios", "Pendientes de informacion", "Listos para dictamen", "Alertas de riesgo"],
  },
  admin: {
    eyebrow: "Administrador",
    title: "Consola NUXERA separada por responsabilidades",
    body: "Operaciones, configuracion, seguridad, IA, integraciones y salud del sistema se separaran sin perder capacidades heredadas.",
    cards: ["Operacion", "Configuracion", "Seguridad", "IA y agentes"],
  },
};

function ApplicantMissionHome({ sectionLabel }) {
  const mission = getApplicantGuidedMission("applicant");
  const readiness = getApplicantMissionReadiness("applicant");
  const checklist = getApplicantDataRoomChecklist("es");

  return (
    <section className="nuxera-home" aria-labelledby="nuxera-home-title">
      <p className="nuxera-eyebrow">NUXERA Financial Intelligence / Solicitante</p>
      <div className="nuxera-hero-row">
        <div>
          <h1 id="nuxera-home-title">{mission.title}</h1>
          <p>{mission.summary}</p>
        </div>
        <div className="nuxera-status-panel">
          <span>{readiness.status}</span>
          <strong>{readiness.progress}% listo</strong>
          <small>{sectionLabel}</small>
        </div>
      </div>

      <section className="nuxera-mission-next" aria-label="Siguiente accion del solicitante">
        <div>
          <span>Resultado esperado</span>
          <strong>{mission.outcome}</strong>
        </div>
        <p>{readiness.nextAction}</p>
      </section>

      <div className="nuxera-mission-grid">
        {mission.steps.map((step) => (
          <article className="nuxera-mission-step" key={step.id}>
            <span>{step.status}</span>
            <strong>{step.label}</strong>
            <p>{step.prompt}</p>
            <small>{step.owner}</small>
            <NavLink to={step.evidencePath}>{step.engine}</NavLink>
          </article>
        ))}
      </div>

      <section className="nuxera-applicant-checklist" aria-label="Checklist documental del solicitante">
        <header>
          <div>
            <span>Data room readiness</span>
            <h2>Checklist para preparar expediente</h2>
          </div>
          <strong>{checklist.summary.status}</strong>
        </header>
        <div className="nuxera-checklist-summary">
          <article><span>Listos</span><strong>{checklist.summary.ready}</strong></article>
          <article><span>En revision</span><strong>{checklist.summary.inReview}</strong></article>
          <article><span>Faltantes</span><strong>{checklist.summary.missing}</strong></article>
          <article><span>Criticos</span><strong>{checklist.summary.criticalMissing}</strong></article>
        </div>
        <div className="nuxera-data-room-folders">
          {checklist.folders.map((folder) => (
            <article key={folder.id}>
              <span>{folder.status}</span>
              <strong>{folder.label}</strong>
              <p>{folder.visibility}</p>
              <small>{folder.items.filter((item) => item.status === "ready").length}/{folder.items.length} documentos listos</small>
            </article>
          ))}
        </div>
        <div className="nuxera-next-evidence">
          <strong>Siguiente evidencia</strong>
          {checklist.nextEvidence.map((item) => (
            <p key={item.id}>{item.critical ? "Critico" : "Pendiente"}: {item.label}</p>
          ))}
          <small>{checklist.guardrail}</small>
        </div>
      </section>

      <div className="nuxera-mission-panels">
        <section>
          <h2>Evidencia conectada</h2>
          {mission.evidenceLinks.map((link) => (
            <NavLink className="nuxera-evidence-link" key={link.id} to={link.path}>
              <span>{link.engine}</span>
              <strong>{link.label}</strong>
              <p>{link.signal}</p>
            </NavLink>
          ))}
        </section>
        <section>
          <h2>Guardrails</h2>
          {mission.guardrails.map((guardrail) => <p key={guardrail}>{guardrail}</p>)}
        </section>
      </div>
    </section>
  );
}

function GrantorQueueHome({ sectionLabel }) {
  const queue = getGrantorCaseQueue();
  const summary = getGrantorQueueSummary();

  return (
    <section className="nuxera-home" aria-labelledby="nuxera-home-title">
      <p className="nuxera-eyebrow">NUXERA Financial Intelligence / Otorgante</p>
      <div className="nuxera-hero-row">
        <div>
          <h1 id="nuxera-home-title">Cola de casos priorizada</h1>
          <p>Revisa oportunidades por evidencia, riesgo, readiness y siguiente accion sin ejecutar decisiones automaticas.</p>
        </div>
        <div className="nuxera-status-panel">
          <span>{summary.status}</span>
          <strong>{summary.total} casos</strong>
          <small>{sectionLabel}</small>
        </div>
      </div>

      <div className="nuxera-grantor-summary">
        <article><span>Comite</span><strong>{summary.committeeReady}</strong></article>
        <article><span>Faltantes</span><strong>{summary.needsInformation}</strong></article>
        <article><span>Riesgo alto</span><strong>{summary.observed}</strong></article>
        <article><span>Revision humana</span><strong>{summary.requiresHumanReview ? "Si" : "No"}</strong></article>
      </div>

      <div className="nuxera-grantor-queue">
        {queue.cases.map((item) => (
          <article key={item.id}>
            <header>
              <div>
                <span>{item.priority}</span>
                <strong>{item.name}</strong>
              </div>
              <em>{item.risk}</em>
            </header>
            <p>{item.applicant} / {item.sector} / {item.amountLabel}</p>
            <div>
              {item.decisionSignals.map((signal) => <small key={signal}>{signal}</small>)}
            </div>
            <p>{item.nextAction}</p>
            <footer>
              {item.evidenceLinks.map((link) => (
                <NavLink key={link.engine} to={link.path}>{link.engine}</NavLink>
              ))}
            </footer>
          </article>
        ))}
      </div>

      <section className="nuxera-grantor-policies" aria-label="Politicas de revision otorgante">
        <h2>Politicas de cola</h2>
        {queue.policies.map((policy) => <p key={policy}>{policy}</p>)}
      </section>
    </section>
  );
}

export default function NuxeraHome({ role = "applicant", section = "home" }) {
  const copy = roleCopy[role] || roleCopy.applicant;
  const sectionLabel = section === "home" ? "Workspace" : section;

  if (role === "applicant") {
    return <ApplicantMissionHome sectionLabel={sectionLabel} />;
  }

  if (role === "grantor") {
    return <GrantorQueueHome sectionLabel={sectionLabel} />;
  }

  return (
    <section className="nuxera-home" aria-labelledby="nuxera-home-title">
      <p className="nuxera-eyebrow">NUXERA Financial Intelligence / {copy.eyebrow}</p>
      <div className="nuxera-hero-row">
        <div>
          <h1 id="nuxera-home-title">{copy.title}</h1>
          <p>{copy.body}</p>
        </div>
        <div className="nuxera-status-panel">
          <span>Vista paralela</span>
          <strong>{sectionLabel}</strong>
          <small>Legacy intacto</small>
        </div>
      </div>

      <div className="nuxera-card-grid">
        {copy.cards.map((card) => (
          <article className="nuxera-card" key={card}>
            <span>{card}</span>
            <p>Placeholder controlado. La logica existente se conectara en tareas posteriores.</p>
          </article>
        ))}
      </div>
    </section>
  );
}
