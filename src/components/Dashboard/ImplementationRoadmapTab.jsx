import { error, debug, info, warn } from '../../utils/logger';
import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { uiText, translateCopy } from "../../utils/runtimeCopy";

const lanes = [
  {
    lane: "Producto",
    now: "Demo SaaS navegable",
    next: "QA visual y flujo guiado",
    later: "Version piloto con datos reales controlados",
  },
  {
    lane: "Compliance",
    now: "Matriz documental, scoring y data room conceptual",
    next: "Escala A-E, politicas y disclaimers",
    later: "Auditoria completa y reglas por jurisdiccion",
  },
  {
    lane: "Otorgantes",
    now: "Pipeline, inteligencia, requerimientos y memo comite",
    next: "Interes institucional y feedback real",
    later: "Integraciones y comites por entidad",
  },
  {
    lane: "Solicitantes",
    now: "Perfil, expedientes, preparacion y carga IA",
    next: "Checklist dinamico y alertas por faltantes",
    later: "Onboarding asistido y paquetes por industria",
  },
  {
    lane: "Inversion",
    now: "One Pager, ronda, piloto, moat, Q&A y due diligence",
    next: "Deck final y data room de inversion",
    later: "Metricas de piloto y negociacion de ronda",
  },
];

const goNoGo = [
  ["Demo estable", "Build local OK y Netlify actualizado", "Listo"],
  ["Narrativa inversion", "Problema, solucion, mercado, moat y piloto", "Listo"],
  ["Legal minimo", "Terminos, privacidad, IA y biometria", "Pendiente"],
  ["Piloto comercial", "3-5 expedientes y 2 otorgantes", "Por iniciar"],
  ["Backend hardening", "CORS, RLS, auditoria y storage", "En curso"],
];

export default function ImplementationRoadmapTab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const copy = (val) => translateCopy(val, i18n.language);

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <section style={{
        background: "linear-gradient(135deg, #0F1F2E 0%, #1B3A5C 68%, #C9A227 145%)",
        color: COLORS.white,
        borderRadius: "16px",
        padding: "1.55rem",
        boxShadow: COLORS.shadowMd,
      }}>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.72)", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {L("Roadmap de implementacion", "Implementation roadmap")}
        </p>
        <h1 style={{ margin: "0.35rem 0", color: COLORS.white, fontSize: "1.55rem" }}>
          {L("De demo invertible a piloto operativo", "From investor demo to operating pilot")}
        </h1>
        <p style={{ margin: 0, maxWidth: "820px", color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>
          {L(
            "Esta vista resume que existe hoy, que debe cerrarse antes de publicar y que se deja para el piloto. Ayuda a ordenar prioridades sin sobredimensionar el MVP.",
            "This view summarizes what exists today, what must be closed before publishing and what remains for the pilot. It helps prioritize without overbuilding the MVP."
          )}
        </p>
      </section>

      <section style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "820px" }}>
          <thead>
            <tr style={{ background: COLORS.navy, color: COLORS.white }}>
              {[L("Frente", "Lane"), L("Hoy", "Now"), L("Siguiente", "Next"), L("Despues", "Later")].map((head) => (
                <th key={head} style={{ textAlign: "left", padding: "0.75rem", fontSize: "0.78rem" }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lanes.map((item) => (
              <tr key={item.lane} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: "0.75rem", color: COLORS.gold, fontWeight: 900 }}>{copy(item.lane)}</td>
                <td style={{ padding: "0.75rem", color: COLORS.text, fontSize: "0.84rem" }}>{copy(item.now)}</td>
                <td style={{ padding: "0.75rem", color: COLORS.text, fontSize: "0.84rem" }}>{copy(item.next)}</td>
                <td style={{ padding: "0.75rem", color: COLORS.textMuted, fontSize: "0.84rem" }}>{copy(item.later)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "0.85rem" }}>
        {goNoGo.map(([label, detail, status]) => (
          <article key={label} style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.7rem", alignItems: "flex-start" }}>
              <h2 style={{ margin: 0, color: COLORS.navy, fontSize: "0.98rem" }}>{copy(label)}</h2>
              <span style={{
                borderRadius: "999px",
                padding: "0.22rem 0.5rem",
                background: status === "Listo" ? "rgba(46,125,50,0.12)" : status === "En curso" ? "rgba(201,162,39,0.18)" : "rgba(27,58,92,0.10)",
                color: status === "Listo" ? "#2E7D32" : status === "En curso" ? "#8A6A00" : COLORS.navy,
                fontWeight: 900,
                fontSize: "0.72rem",
              }}>{copy(status)}</span>
            </div>
            <p style={{ margin: "0.45rem 0 0", color: COLORS.text, fontSize: "0.84rem", lineHeight: 1.45 }}>{copy(detail)}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
