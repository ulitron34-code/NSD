import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { uiText } from "../../utils/runtimeCopy";

export default function InvestorPilotSection() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);

  const cards = [
    [
      L("Dolor comprobable", "Provable pain"),
      L("Los solicitantes llegan incompletos y los otorgantes gastan horas revisando evidencia dispersa.", "Applicants arrive incomplete and funders spend hours reviewing scattered evidence."),
    ],
    [
      L("Flujo vertical", "Vertical workflow"),
      L("NSD conecta preparacion, IA, data room, requerimientos, scoring y memo de decision.", "NSD connects readiness, AI, data room, requests, scoring and decision memo."),
    ],
    [
      L("Piloto medible", "Measurable pilot"),
      L("Puede medirse ahorro de tiempo, faltantes detectados, expedientes revisables e interes institucional.", "Time saved, detected gaps, reviewable files and institutional interest can be measured."),
    ],
  ];

  const pilotMetrics = [
    [L("50", "50"), L("expedientes piloto", "pilot files")],
    [L("3", "3"), L("perfiles operativos", "operating profiles")],
    [L("A-E", "A-E"), L("scoring explicable", "explainable scoring")],
    [L("10 min", "10 min"), L("demo ejecutiva", "executive demo")],
  ];

  return (
    <section style={{ background: COLORS.bg, padding: "4rem 2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.05fr) minmax(320px, 0.95fr)", gap: "1.5rem", alignItems: "stretch" }}>
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "12px", padding: "1.6rem", boxShadow: COLORS.shadowSm }}>
            <p style={{ color: COLORS.gold, fontSize: "0.74rem", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 900, marginBottom: "0.7rem" }}>
              {L("Inversionistas y aliados piloto", "Investors and pilot partners")}
            </p>
            <h2 style={{ color: COLORS.navy, fontSize: "clamp(1.7rem, 3vw, 2.35rem)", lineHeight: 1.1, marginBottom: "0.85rem" }}>
              {L("Una demo que ya cuenta una tesis de startup defendible.", "A demo that already tells a defensible startup thesis.")}
            </h2>
            <p style={{ color: COLORS.textMuted, lineHeight: 1.75, fontSize: "0.96rem", marginBottom: "1.2rem" }}>
              {L(
                "NSD no se presenta solo como consultoria ni como data room generico: es una infraestructura SaaS para preparar solicitudes financieras, reducir friccion documental y dar a los otorgantes una lectura mas ordenada del riesgo.",
                "NSD is not presented only as consulting or a generic data room: it is SaaS infrastructure to prepare financing requests, reduce document friction and give funders a more organized risk readout."
              )}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "0.75rem" }}>
              {cards.map(([title, detail]) => (
                <article key={title} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.9rem" }}>
                  <strong style={{ display: "block", color: COLORS.navy, fontSize: "0.9rem", marginBottom: "0.35rem" }}>{title}</strong>
                  <p style={{ color: COLORS.textMuted, fontSize: "0.8rem", lineHeight: 1.5 }}>{detail}</p>
                </article>
              ))}
            </div>
          </div>

          <aside style={{ background: "linear-gradient(135deg, #0F1F2E 0%, #1B3A5C 100%)", borderRadius: "12px", padding: "1.6rem", color: COLORS.white, boxShadow: COLORS.shadowMd }}>
            <p style={{ color: COLORS.gold, fontSize: "0.74rem", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 900, marginBottom: "0.75rem" }}>
              {L("Prueba piloto sugerida", "Suggested pilot")}
            </p>
            <h3 style={{ color: COLORS.white, fontSize: "1.35rem", marginBottom: "0.7rem" }}>
              {L("Validar antes de escalar", "Validate before scaling")}
            </h3>
            <p style={{ color: "rgba(255,255,255,0.76)", lineHeight: 1.65, fontSize: "0.88rem", marginBottom: "1rem" }}>
              {L(
                "La siguiente meta no es prometer automatizacion total. Es demostrar que NSD reduce ciclos de revision y mejora la calidad del expediente.",
                "The next goal is not to promise total automation. It is to prove NSD reduces review cycles and improves file quality."
              )}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {pilotMetrics.map(([value, label]) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "8px", padding: "0.85rem" }}>
                  <strong style={{ display: "block", color: COLORS.gold, fontSize: "1.25rem" }}>{value}</strong>
                  <span style={{ color: "rgba(255,255,255,0.76)", fontSize: "0.78rem", lineHeight: 1.35 }}>{label}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
