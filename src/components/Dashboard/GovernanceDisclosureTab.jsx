import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { uiText, translateCopy } from "../../utils/runtimeCopy";

const policies = [
  {
    title: "IA asistiva, no decisoria",
    detail: "La IA ayuda a revisar documentos, detectar faltantes, resumir riesgos y sugerir semaforos. No aprueba creditos, no sustituye abogados y no emite dictamen regulatorio final.",
  },
  {
    title: "Decision del otorgante",
    detail: "La entidad financiera conserva su propio comite, politicas de riesgo, apetito de credito, autorizaciones y decision final.",
  },
  {
    title: "Datos sensibles",
    detail: "Documentos, informacion financiera y biometricos deben operar con consentimiento, finalidad, control de acceso, trazabilidad y retencion limitada.",
  },
  {
    title: "Biometricos futuros",
    detail: "Rostro, huella u otra biometria deben integrarse con proveedor especializado, prueba de vida, cifrado, politica de eliminacion y opcion de no continuidad cuando aplique.",
  },
];

const checklist = [
  ["Terminos de uso", "Pendiente de version legal final", "Antes de publicar comercialmente"],
  ["Privacidad", "Requiere texto completo y consentimiento", "Antes de datos reales"],
  ["IA", "Agregar disclaimer en revision documental", "Antes de piloto"],
  ["Biometria", "Mantener como modulo futuro controlado", "Antes de integracion"],
  ["Auditoria", "Mapear eventos reales contra Supabase audit_logs", "Durante hardening"],
];

export default function GovernanceDisclosureTab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const copy = (val) => translateCopy(val, i18n.language);

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
          {L("Gobernanza y limites", "Governance and limits")}
        </p>
        <h1 style={{ margin: "0.35rem 0", color: COLORS.white, fontSize: "1.55rem" }}>
          {L("Como presentar NSD IF sin sobrerregular ni sobreprometer", "How to present NSD IF without overpromising")}
        </h1>
        <p style={{ margin: 0, maxWidth: "820px", color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>
          {L(
            "Esta capa ordena los disclaimers que deben acompañar la demo: IA asistiva, decision humana, privacidad, biometricos futuros y trazabilidad.",
            "This layer organizes the disclaimers that must accompany the demo: assistive AI, human decisioning, privacy, future biometrics and traceability."
          )}
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.85rem" }}>
        {policies.map((policy) => (
          <article key={policy.title} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
            <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>{copy("Control")}</p>
            <h2 style={{ margin: "0.3rem 0", color: COLORS.navy, fontSize: "1rem" }}>{copy(policy.title)}</h2>
            <p style={{ margin: 0, color: COLORS.text, fontSize: "0.85rem", lineHeight: 1.5 }}>{copy(policy.detail)}</p>
          </article>
        ))}
      </section>

      <section style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm, overflowX: "auto" }}>
        <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {L("Checklist legal minimo", "Minimum legal checklist")}
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "760px", marginTop: "0.85rem" }}>
          <thead>
            <tr style={{ background: COLORS.navy, color: COLORS.white }}>
              {[L("Tema", "Topic"), L("Estado", "Status"), L("Momento", "Timing")].map((head) => (
                <th key={head} style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.78rem" }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {checklist.map(([topic, status, timing]) => (
              <tr key={topic} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: "0.72rem", color: COLORS.navy, fontWeight: 900 }}>{copy(topic)}</td>
                <td style={{ padding: "0.72rem", color: COLORS.text, fontSize: "0.86rem" }}>{copy(status)}</td>
                <td style={{ padding: "0.72rem", color: COLORS.textMuted, fontSize: "0.84rem" }}>{copy(timing)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
