import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { uiText, translateCopy } from "../../utils/runtimeCopy";

const tractionMetrics = [
  ["Pilotos objetivo", "8", "Entidades y aliados para validar flujo real."],
  ["Expedientes piloto", "50+", "Casos para probar solicitante, IA, data room y otorgante."],
  ["Conversion meta", "20%", "De expediente preparado a interes institucional registrado."],
  ["Primer MRR meta", "$8K", "Suscripciones iniciales y servicios recurrentes."],
];

const pilotPipeline = [
  ["SOFOM crecimiento", "Alta prioridad", "Pipeline de PyMEs, credito empresarial y revision documental."],
  ["Fintech credito", "Piloto tecnico", "KYB, antifraude, scoring y carga documental asistida."],
  ["Fondo deuda privada", "Validacion comercial", "Data room, memo, ticket, riesgo y seguimiento de oportunidades."],
  ["Despacho financiero", "Canal aliado", "Captura de solicitantes, business plan y preparacion para fondeo."],
  ["Empresa solicitante", "Caso demo", "Expediente completo, IA, matriz documental y presentacion a otorgantes."],
];

const evidenceSignals = [
  ["Dolor validable", "Los solicitantes no saben que documentos preparar y los otorgantes reciben informacion desigual."],
  ["Producto demostrable", "Ya existe flujo local de solicitante, otorgante, admin, data room, IA y demo guiado."],
  ["Monetizacion mixta", "SaaS B2B, fee por expediente, servicios profesionales y modulos premium."],
  ["Expansion gradual", "Mexico primero, USA despues, otros mercados solo con validacion legal."],
];

const nextExperiments = [
  ["Landing + demo", "Medir interes de entidades y solicitantes con CTA hacia demo guiada."],
  ["Piloto 30 dias", "Procesar 10 expedientes con un aliado y medir faltantes, tiempos y acciones."],
  ["Pricing test", "Comparar fee por expediente vs. SaaS mensual + servicios NSD IF."],
  ["Otorgante workflow", "Validar si data room, memo y requerimientos reducen tiempo de primera revision."],
];

export default function TractionPilotsTab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const copy = (val) => translateCopy(val, i18n.language);

  return (
    <div>
      <section style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "14px", padding: "1.6rem", marginBottom: "1.5rem", boxShadow: COLORS.shadowSm }}>
        <p style={{ color: COLORS.gold, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 900, fontSize: "0.75rem", marginBottom: "0.5rem" }}>
          {L("Traccion / pilotos", "Traction / Pilots")}
        </p>
        <h1 style={{ color: COLORS.navy, fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 4vw, 2.8rem)", lineHeight: 1.1, marginBottom: "0.75rem" }}>
          {L("La demo debe convertirse en pilotos medibles.", "The demo must become measurable pilots.")}
        </h1>
        <p style={{ color: COLORS.textMuted, maxWidth: "900px", lineHeight: 1.7 }}>
          {L("Esta vista resume a quien se le venderia primero, que hipotesis se validan y que metricas deben demostrar traccion para una ronda pre-seed.", "This view summarizes who to sell to first, which hypotheses are being validated and which metrics should prove traction for a pre-seed round.")}
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {tractionMetrics.map(([label, value, detail]) => (
          <article key={label} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.15rem", boxShadow: COLORS.shadowSm }}>
            <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 900, marginBottom: "0.35rem" }}>{copy(label)}</p>
            <p style={{ color: COLORS.navy, fontSize: "1.9rem", fontWeight: 900, marginBottom: "0.35rem" }}>{value}</p>
            <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45 }}>{copy(detail)}</p>
          </article>
        ))}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 0.9fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", boxShadow: COLORS.shadowSm }}>
          <h2 style={{ color: COLORS.navy, fontSize: "1.18rem", marginBottom: "1rem" }}>{L("Pipeline de pilotos", "Pilot Pipeline")}</h2>
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {pilotPipeline.map(([name, stage, detail]) => (
              <div key={name} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 130px", gap: "0.75rem", padding: "0.85rem", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px" }}>
                <span>
                  <strong style={{ color: COLORS.navy, display: "block", fontSize: "0.9rem" }}>{copy(name)}</strong>
                  <span style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45 }}>{copy(detail)}</span>
                </span>
                <span style={{ color: COLORS.gold, fontWeight: 900, fontSize: "0.78rem", textAlign: "right" }}>{copy(stage)}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", boxShadow: COLORS.shadowSm }}>
          <h2 style={{ color: COLORS.navy, fontSize: "1.18rem", marginBottom: "1rem" }}>{L("Senales de validacion", "Validation Signals")}</h2>
          {evidenceSignals.map(([signal, detail]) => (
            <div key={signal} style={{ borderBottom: `1px solid ${COLORS.border}`, padding: "0.75rem 0" }}>
              <strong style={{ color: COLORS.navy, fontSize: "0.86rem" }}>{copy(signal)}</strong>
              <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45, marginTop: "0.25rem" }}>{copy(detail)}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", boxShadow: COLORS.shadowSm }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "1rem" }}>
          <div>
            <p style={{ color: COLORS.gold, fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 900, marginBottom: "0.35rem" }}>
              {L("Experimentos siguientes", "Next Experiments")}
            </p>
            <h2 style={{ color: COLORS.navy, fontSize: "1.18rem" }}>{L("Que medir antes de pedir mas capital", "What to measure before raising more capital")}</h2>
          </div>
          <span style={{ background: "rgba(46,125,50,0.12)", color: COLORS.green, borderRadius: "999px", padding: "0.45rem 0.75rem", fontWeight: 900, fontSize: "0.78rem" }}>
            {L("Enfoque pre-seed", "Pre-seed focus")}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "0.8rem" }}>
          {nextExperiments.map(([title, detail]) => (
            <div key={title} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.9rem" }}>
              <strong style={{ color: COLORS.navy, fontSize: "0.86rem" }}>{copy(title)}</strong>
              <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45, marginTop: "0.25rem" }}>{copy(detail)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
