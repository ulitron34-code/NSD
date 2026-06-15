import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { uiText } from "../../utils/runtimeCopy";

const pillars = [
  ["IA explicable", "Revision documental, faltantes, semaforos y memo ejecutivo con evidencia."],
  ["Decision humana", "NSD IF no aprueba credito ni reemplaza al comite del otorgante."],
  ["Cumplimiento vivo", "Requisitos, trazabilidad y data room se ordenan por expediente."],
  ["Privacidad", "Datos sensibles y biometricos futuros requieren consentimiento y controles."],
];

export default function ResponsibleAISection() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);

  return (
    <section style={{ background: "#0F1F2E", padding: "4rem 1.5rem", color: COLORS.white }}>
      <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
        <p style={{ margin: 0, color: COLORS.gold, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", fontSize: "0.78rem" }}>
          {L("IA responsable para cumplimiento", "Responsible AI for compliance")}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.95fr) minmax(0, 1.05fr)", gap: "2rem", alignItems: "start", marginTop: "0.8rem" }}>
          <div>
            <h2 style={{ color: COLORS.white, fontSize: "clamp(1.7rem, 3vw, 2.45rem)", lineHeight: 1.1, margin: "0 0 1rem" }}>
              {L("Velocidad con control, no decisiones opacas.", "Speed with control, not opaque decisions.")}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.76)", lineHeight: 1.7, fontSize: "1rem", margin: 0 }}>
              {L(
                "NSD IF usa IA para organizar expedientes, detectar faltantes y preparar lecturas institucionales. La decision final permanece en manos de personas autorizadas, con evidencia, permisos y trazabilidad.",
                "NSD IF uses AI to organize files, detect gaps and prepare institutional readouts. Final decisions remain with authorized people, with evidence, permissions and traceability."
              )}
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.85rem" }}>
            {pillars.map(([title, detail]) => (
              <article key={title} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "1rem" }}>
                <h3 style={{ color: COLORS.gold, fontSize: "0.95rem", margin: "0 0 0.4rem" }}>{L(title, title)}</h3>
                <p style={{ color: "rgba(255,255,255,0.74)", margin: 0, fontSize: "0.86rem", lineHeight: 1.5 }}>{L(detail, detail)}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
