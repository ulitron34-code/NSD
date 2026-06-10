import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { uiText } from "../../utils/runtimeCopy";

const grades = [
  ["A", "Listo institucional", "Expediente completo, sin alertas criticas y con evidencia suficiente para revision acelerada.", "#2E7D32"],
  ["B", "Viable con observaciones", "Faltantes menores o mitigables; puede avanzar con condiciones y seguimiento.", "#6A8E23"],
  ["C", "Requiere saneamiento", "Faltantes relevantes que impiden una lectura institucional completa.", "#C9A227"],
  ["D", "Riesgo alto", "Inconsistencias, documentos vencidos o informacion critica incompleta.", "#C46A1B"],
  ["E", "No recomendable", "Red flags, opacidad o falta de evidencia suficiente para presentar a otorgantes.", "#B3261E"],
];

const dimensions = [
  ["Identidad / KYB", "15%", "Beneficiario controlador, poderes, RFC, identificaciones y estructura."],
  ["Corporativo legal", "15%", "Actas, estatutos, autorizaciones y capacidad de contratar financiamiento."],
  ["Financiero", "25%", "Estados financieros, ingresos, deuda, flujo y fuente de repago."],
  ["Proyecto", "20%", "Uso de recursos, presupuesto, hitos, contratos y evidencia operativa."],
  ["Cumplimiento / antifraude", "15%", "Listas, declaraciones, consistencia documental y alertas."],
  ["Data room / trazabilidad", "10%", "Versiones, permisos, auditoria y orden del expediente."],
];

const guardrails = [
  "El score no es aprobacion de credito ni dictamen legal.",
  "La IA asiste revision, pero las decisiones finales corresponden a humanos autorizados.",
  "Un grado A-E debe poder explicarse con evidencia documental.",
  "Red flags criticas pueden bloquear avance aunque el promedio numerico sea alto.",
];

export default function ScoringAETab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <section style={{
        background: "linear-gradient(135deg, #0F1F2E 0%, #1B3A5C 70%, #C9A227 145%)",
        color: COLORS.white,
        borderRadius: "16px",
        padding: "1.55rem",
        boxShadow: COLORS.shadowMd,
      }}>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.72)", fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {L("Scoring A-E", "A-E scoring")}
        </p>
        <h1 style={{ margin: "0.35rem 0", color: COLORS.white, fontSize: "1.55rem" }}>
          {L("Calificacion explicable del expediente", "Explainable file rating")}
        </h1>
        <p style={{ margin: 0, maxWidth: "820px", color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>
          {L(
            "La escala A-E traduce revision documental, riesgo y completitud en una lectura simple para solicitantes, NSD IF y otorgantes. No sustituye aprobacion crediticia.",
            "The A-E scale translates document review, risk and completeness into a simple readout for applicants, NSD IF and funders. It does not replace credit approval."
          )}
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "0.75rem" }}>
        {grades.map(([grade, title, detail, color]) => (
          <article key={grade} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.55rem" }}>
              <span style={{ width: "38px", height: "38px", borderRadius: "50%", background: color, color: COLORS.white, display: "grid", placeItems: "center", fontWeight: 900 }}>{grade}</span>
              <strong style={{ color: COLORS.navy, fontSize: "0.92rem" }}>{L(title, title)}</strong>
            </div>
            <p style={{ margin: 0, color: COLORS.text, fontSize: "0.83rem", lineHeight: 1.45 }}>{L(detail, detail)}</p>
          </article>
        ))}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: "1rem" }}>
        <article style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm, overflowX: "auto" }}>
          <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {L("Dimensiones sugeridas", "Suggested dimensions")}
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "620px", marginTop: "0.85rem" }}>
            <thead>
              <tr style={{ background: COLORS.navy, color: COLORS.white }}>
                {[L("Dimension", "Dimension"), L("Peso", "Weight"), L("Que mide", "What it measures")].map((head) => (
                  <th key={head} style={{ padding: "0.7rem", textAlign: "left", fontSize: "0.78rem" }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dimensions.map(([dimension, weight, detail]) => (
                <tr key={dimension} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: "0.7rem", color: COLORS.navy, fontWeight: 900, fontSize: "0.86rem" }}>{L(dimension, dimension)}</td>
                  <td style={{ padding: "0.7rem", color: COLORS.gold, fontWeight: 900 }}>{weight}</td>
                  <td style={{ padding: "0.7rem", color: COLORS.text, fontSize: "0.84rem" }}>{L(detail, detail)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <aside style={{ background: "#102235", borderRadius: "10px", color: COLORS.white, padding: "1rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>{L("Reglas de control", "Guardrails")}</p>
          <ul style={{ margin: "0.75rem 0 0", paddingLeft: "1.05rem", color: "rgba(255,255,255,0.78)", fontSize: "0.84rem", lineHeight: 1.55 }}>
            {guardrails.map((item) => <li key={item}>{L(item, item)}</li>)}
          </ul>
        </aside>
      </section>
    </div>
  );
}
