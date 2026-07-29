import React from "react";

export default function GrantorHome() {
  return (
    <section className="nu-page">
      <p className="nu-eyebrow">Mesa de decisión</p>
      <h1>Lo que requiere atención hoy</h1>
      <div className="nu-grid">
        <article><h2>17</h2><p>Solicitudes nuevas</p></article>
        <article><h2>6</h2><p>Esperando documentos</p></article>
        <article><h2>3</h2><p>Listas para dictamen</p></article>
        <article><h2>2</h2><p>Alertas de riesgo alto</p></article>
      </div>
    </section>
  );
}
