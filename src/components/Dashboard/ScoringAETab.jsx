import { error, debug, info, warn } from '../../utils/logger';
import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { uiText } from "../../utils/runtimeCopy";

export default function ScoringAETab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);

  const grades = [
    ["A", L("Listo institucional", "Institutional Ready"), L("Expediente completo, sin alertas criticas y con evidencia suficiente para revision acelerada.", "Complete file, no critical alerts and sufficient evidence for accelerated review."), "#2E7D32"],
    ["B", L("Viable con observaciones", "Viable with Observations"), L("Faltantes menores o mitigables; puede avanzar con condiciones y seguimiento.", "Minor or mitigable gaps; can proceed with conditions and follow-up."), "#6A8E23"],
    ["C", L("Requiere saneamiento", "Requires Remediation"), L("Faltantes relevantes que impiden una lectura institucional completa.", "Relevant gaps that prevent a complete institutional readout."), "#C9A227"],
    ["D", L("Riesgo alto", "High Risk"), L("Inconsistencias, documentos vencidos o informacion critica incompleta.", "Inconsistencies, expired documents or incomplete critical information."), "#C46A1B"],
    ["E", L("No recomendable", "Not Recommended"), L("Red flags, opacidad o falta de evidencia suficiente para presentar a otorgantes.", "Red flags, opacity or lack of sufficient evidence to present to funders."), "#B3261E"],
  ];

  const dimensions = [
    [L("Identidad / KYB", "Identity & KYB"), "15%", L("Beneficiario controlador, poderes, RFC, identificaciones y estructura.", "Ultimate beneficial owner, powers of attorney, tax ID, identifications and structure.")],
    [L("Corporativo legal", "Corporate Legal"), "15%", L("Actas, estatutos, autorizaciones y capacidad de contratar financiamiento.", "Bylaws, articles, authorizations and financing capacity.")],
    [L("Financiero", "Financial"), "25%", L("Estados financieros, ingresos, deuda, flujo y fuente de repago.", "Financial statements, revenue, debt, cash flow and repayment source.")],
    [L("Proyecto", "Project"), "20%", L("Uso de recursos, presupuesto, hitos, contratos y evidencia operativa.", "Use of funds, budget, milestones, contracts and operational evidence.")],
    [L("Cumplimiento / antifraude", "Compliance & Anti-Fraud"), "15%", L("Listas, declaraciones, consistencia documental y alertas.", "Screening lists, declarations, document consistency and alerts.")],
    [L("Data room / trazabilidad", "Data Room & Traceability"), "10%", L("Versiones, permisos, auditoria y orden del expediente.", "Versions, permissions, audit logs and file organization.")],
  ];

  const guardrails = [
    L("El score no es aprobacion de credito ni dictamen legal.", "The score is not a credit approval or legal opinion."),
    L("La IA asiste revision, pero las decisiones finales corresponden a humanos autorizados.", "AI assists review, but final decisions belong to authorized humans."),
    L("Un grado A-E debe poder explicarse con evidencia documental.", "An A-E grade must be explainable with documentary evidence."),
    L("Red flags criticas pueden bloquear avance aunque el promedio numerico sea alto.", "Critical red flags can block progress even if the numerical average is high."),
  ];

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
            "La escala A-E traduce revision documental, riesgo y completitud en una lectura simple para solicitantes, NEXUS y otorgantes. No sustituye aprobacion crediticia.",
            "The A-E scale translates document review, risk and completeness into a simple readout for applicants, NEXUS and funders. It does not replace credit approval."
          )}
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "0.75rem" }}>
        {grades.map(([grade, title, detail, color]) => (
          <article key={grade} style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.55rem" }}>
              <span style={{ width: "38px", height: "38px", borderRadius: "50%", background: color, color: COLORS.white, display: "grid", placeItems: "center", fontWeight: 900 }}>{grade}</span>
              <strong style={{ color: COLORS.navy, fontSize: "0.92rem" }}>{title}</strong>
            </div>
            <p style={{ margin: 0, color: COLORS.text, fontSize: "0.83rem", lineHeight: 1.45 }}>{detail}</p>
          </article>
        ))}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: "1rem" }}>
        <article style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm, overflowX: "auto" }}>
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
              {dimensions.map(([dimension, weight, detail], idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: "0.7rem", color: COLORS.navy, fontWeight: 900, fontSize: "0.86rem" }}>{dimension}</td>
                  <td style={{ padding: "0.7rem", color: COLORS.gold, fontWeight: 900 }}>{weight}</td>
                  <td style={{ padding: "0.7rem", color: COLORS.text, fontSize: "0.84rem" }}>{detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <aside style={{ background: "#102235", borderRadius: "10px", color: COLORS.white, padding: "1rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>{L("Reglas de control", "Guardrails")}</p>
          <ul style={{ margin: "0.75rem 0 0", paddingLeft: "1.05rem", color: "rgba(255,255,255,0.78)", fontSize: "0.84rem", lineHeight: 1.55 }}>
            {guardrails.map((item, idx) => <li key={idx}>{item}</li>)}
          </ul>
        </aside>
      </section>
    </div>
  );
}
