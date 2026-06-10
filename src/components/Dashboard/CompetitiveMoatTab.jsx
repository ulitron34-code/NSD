import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { uiText, translateCopy } from "../../utils/runtimeCopy";

const competitors = [
  ["Consultorias tradicionales", "Alto criterio humano", "Lentas, poco escalables y sin producto SaaS repetible."],
  ["Data rooms genericos", "Ordenan archivos", "No entienden requisitos, score, otorgantes ni subsanacion."],
  ["CRMs financieros", "Gestionan pipeline", "No preparan expediente ni validan evidencia documental."],
  ["Herramientas KYC/KYB", "Verifican identidad", "Cubren una pieza, no el flujo completo de financiamiento."],
  ["NSD", "Expediente + IA + data room + otorgantes + servicios", "Plataforma vertical para preparar y revisar solicitudes financieras."],
];

const moatLayers = [
  ["Workflow vertical", "El producto entiende solicitantes, otorgantes, expedientes, data room, requerimientos y comite."],
  ["Matriz documental", "Cada expediente se estructura por sector, monto, tipo de fondeo y requisitos exigibles."],
  ["Datos de interaccion", "Cada carga, faltante, requerimiento, score e interes institucional puede mejorar el sistema."],
  ["Servicios NSD IF", "La capa profesional ayuda a iniciar ingresos antes de que el SaaS este completamente maduro."],
  ["Confianza y auditoria", "Trazabilidad, permisos, disclaimers y revision humana reducen riesgo reputacional."],
];

const positioning = [
  ["No somos solo consultoria", "La consultoria no escala; NSD convierte conocimiento en flujo repetible."],
  ["No somos solo data room", "El data room es consecuencia; el valor esta en preparar, validar y explicar el expediente."],
  ["No somos aprobacion automatica", "La decision sigue en el otorgante; NSD acelera preparacion y revision."],
  ["No somos KYC aislado", "KYC/KYB es un modulo dentro de un expediente financiero completo."],
];

export default function CompetitiveMoatTab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const copy = (val) => translateCopy(val, i18n.language);

  return (
    <div>
      <section style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "14px", padding: "1.6rem", marginBottom: "1.5rem", boxShadow: COLORS.shadowSm }}>
        <p style={{ color: COLORS.gold, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 900, fontSize: "0.75rem", marginBottom: "0.5rem" }}>
          {L("Competencia / Moat", "Competition / Moat")}
        </p>
        <h1 style={{ color: COLORS.navy, fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 4vw, 2.8rem)", lineHeight: 1.1, marginBottom: "0.75rem" }}>
          {L("La defensa esta en el flujo vertical, no en una sola funcion.", "The moat is in the vertical workflow, not a single feature.")}
        </h1>
        <p style={{ color: COLORS.textMuted, maxWidth: "920px", lineHeight: 1.7 }}>
          {L("NSD se posiciona entre consultoria financiera, compliance, data room, KYC/KYB e inteligencia documental. La oportunidad es unificar esas piezas en un flujo repetible para solicitantes y otorgantes.", "NSD sits between financial consulting, compliance, data rooms, KYC/KYB and document intelligence. The opportunity is to unify those pieces into a repeatable workflow for applicants and funders.")}
        </p>
      </section>

      <section style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", boxShadow: COLORS.shadowSm, marginBottom: "1.5rem" }}>
        <h2 style={{ color: COLORS.navy, fontSize: "1.18rem", marginBottom: "1rem" }}>{L("Mapa competitivo", "Competitive Map")}</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "760px" }}>
            <thead>
              <tr>
                {[L("Categoria", "Category"), L("Fortaleza", "Strength"), L("Brecha", "Gap")].map((head) => (
                  <th key={head} style={{ textAlign: "left", padding: "0.75rem", color: COLORS.textMuted, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${COLORS.border}` }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {competitors.map(([category, strength, gap]) => (
                <tr key={category} style={{ background: category === "NSD" ? "rgba(201,168,76,0.12)" : "transparent" }}>
                  <td style={{ padding: "0.85rem", borderBottom: `1px solid ${COLORS.border}`, color: COLORS.navy, fontWeight: 900 }}>{copy(category)}</td>
                  <td style={{ padding: "0.85rem", borderBottom: `1px solid ${COLORS.border}`, color: COLORS.textMuted, fontSize: "0.84rem" }}>{copy(strength)}</td>
                  <td style={{ padding: "0.85rem", borderBottom: `1px solid ${COLORS.border}`, color: COLORS.textMuted, fontSize: "0.84rem" }}>{copy(gap)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(300px, 0.9fr)", gap: "1rem" }}>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", boxShadow: COLORS.shadowSm }}>
          <h2 style={{ color: COLORS.navy, fontSize: "1.18rem", marginBottom: "1rem" }}>{L("Capas de defensa", "Moat Layers")}</h2>
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {moatLayers.map(([title, detail]) => (
              <div key={title} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.9rem" }}>
                <strong style={{ color: COLORS.navy, fontSize: "0.86rem" }}>{copy(title)}</strong>
                <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45, marginTop: "0.25rem" }}>{copy(detail)}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", boxShadow: COLORS.shadowSm }}>
          <h2 style={{ color: COLORS.navy, fontSize: "1.18rem", marginBottom: "1rem" }}>{L("Posicionamiento para pitch", "Pitch Positioning")}</h2>
          {positioning.map(([title, detail]) => (
            <div key={title} style={{ borderBottom: `1px solid ${COLORS.border}`, padding: "0.75rem 0" }}>
              <strong style={{ color: COLORS.navy, fontSize: "0.86rem" }}>{copy(title)}</strong>
              <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45, marginTop: "0.25rem" }}>{copy(detail)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
