import React from "react";

export default function ApplicantHome() {
  return (
    <section className="nu-page">
      <p className="nu-eyebrow">Tu expediente</p>
      <h1>Continúa donde te quedaste</h1>
      <p className="nu-lead">
        Completa la información pendiente y deja que N&U organice la revisión.
      </p>

      <div className="nu-progress-card">
        <div>
          <strong>35% completado</strong>
          <p>Faltan documentos financieros y datos del proyecto.</p>
        </div>
        <button type="button">Continuar expediente</button>
      </div>

      <div className="nu-grid">
        <article><h2>Solicitar financiamiento</h2><p>Prepara y presenta tu expediente.</p></article>
        <article><h2>Mejorar mi proyecto</h2><p>Detecta faltantes antes de enviarlo.</p></article>
        <article><h2>Investigar mi empresa</h2><p>Obtén una investigación profunda.</p></article>
        <article><h2>Dar seguimiento</h2><p>Consulta avances y solicitudes.</p></article>
      </div>
    </section>
  );
}
