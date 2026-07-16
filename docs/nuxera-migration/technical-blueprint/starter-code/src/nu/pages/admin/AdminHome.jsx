import React from "react";

export default function AdminHome() {
  return (
    <section className="nu-page">
      <p className="nu-eyebrow">Administración N&U</p>
      <h1>Operación y control del sistema</h1>
      <div className="nu-grid">
        <article><h2>Operación</h2><p>Usuarios, empresas, solicitudes y soporte.</p></article>
        <article><h2>IA y agentes</h2><p>Modelos, versiones, costos y evaluación.</p></article>
        <article><h2>Seguridad</h2><p>Roles, permisos, auditoría e incidentes.</p></article>
        <article><h2>Sistema</h2><p>Integraciones, logs, colas y salud.</p></article>
      </div>
    </section>
  );
}
