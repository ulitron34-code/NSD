import React from "react";

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

export default function NuxeraHome({ role = "applicant", section = "home" }) {
  const copy = roleCopy[role] || roleCopy.applicant;
  const sectionLabel = section === "home" ? "Workspace" : section;

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