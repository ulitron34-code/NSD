import React from "react";
import { NavLink } from "react-router-dom";
import { getApplicantGuidedMission, getApplicantMissionReadiness } from "../applicant/guidedMission";

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
          {mission.guardrails.map((guardrail) => (
            <p key={guardrail}>{guardrail}</p>
          ))}
        </section>
      </div>
    </section>
  );
}

export default function NuxeraHome({ role = "applicant", section = "home" }) {
  const copy = roleCopy[role] || roleCopy.applicant;
  const sectionLabel = section === "home" ? "Workspace" : section;

  if (role === "applicant") {
    return <ApplicantMissionHome sectionLabel={sectionLabel} />;
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
