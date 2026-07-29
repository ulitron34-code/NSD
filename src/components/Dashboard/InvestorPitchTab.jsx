import { error, debug, info, warn } from '../../utils/logger';
import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { uiText, translateCopy } from "../../utils/runtimeCopy";
import { BRAND } from "../../config/brand";

const demoMetrics = [
  ["Expedientes demo", "128", "Pipeline simulado para bancos, SOFOMES, fintechs y fondos."],
  ["Tiempo ahorrado", "62%", "Reduccion estimada en ida y vuelta documental antes de comite."],
  ["Score promedio", "84/100", "Lectura unificada de preparacion financiera, legal y documental."],
  ["Ingresos potenciales", "$42K", "MRR demo combinando SaaS, expedientes y servicios profesionales."],
];

const storySteps = [
  ["1", "Solicitante", "Sube proyecto, monto, sector, uso de fondos y documentos base."],
  ["2", "AI Compliance Engine", "Detecta faltantes, vencimientos, inconsistencias, riesgos y requisitos exigibles."],
  ["3", `Preparacion ${BRAND.name}`, "Convierte el caso en expediente, data room, score, memo y plan de subsanacion."],
  ["4", "Otorgante", "Filtra oportunidades, revisa data room, solicita informacion y registra interes."],
  ["5", `${BRAND.name} Admin`, "Monitorea actividad, conversion, ingresos, auditoria y calidad operativa."],
];

const revenueStreams = [
  ["SaaS entidades", "Suscripcion mensual por usuarios, data room, roles, auditoria y pipeline."],
  ["Fee por expediente", "Cobro por evaluacion, checklist, scoring, data room y requerimientos."],
  [`Servicios ${BRAND.name}`, "Business plan, modelo financiero, pitch deck, memo y preparacion institucional."],
  ["Premium", "Biometria, OCR, antifraude, KYB, integraciones y monitoreo avanzado."],
];

const aiEngine = [
  ["Matriz viva", "Cruza tipo de proyecto, sector, monto, jurisdiccion y perfil de otorgante."],
  ["Scoring explicable", "Score A-E y 0-100 con razonamiento, hallazgos y semaforo de riesgo."],
  ["Data room inteligente", "Ordena evidencia por carpetas y permisos para revision institucional."],
  ["Auditoria", "Registra cargas, revisiones, requerimientos, accesos y cambios de estado."],
];

const launchRoadmap = [
  ["Mexico", "Mercado inicial", "SOFOMES, fintechs, bancos, fondos y empresas solicitantes."],
  ["USA", "Expansion natural", "Preparacion documental, investor readiness y capital partners."],
  ["Canada / UK", "Fase posterior", "Solo despues de validacion legal, privacidad y pilotos."],
];

export default function InvestorPitchTab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const copy = (val) => translateCopy(val, i18n.language);

  return (
    <div>
      <section style={{
        background: "linear-gradient(135deg, #0F1F2E 0%, #1B3A5C 58%, #C9A84C 160%)",
        borderRadius: "16px",
        padding: "2rem",
        color: "white",
        marginBottom: "1.5rem",
        boxShadow: "0 14px 34px rgba(15,31,46,0.22)",
      }}>
        <p style={{ color: "rgba(255,255,255,0.68)", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 900, fontSize: "0.75rem", marginBottom: "0.6rem" }}>
          {L("Vista para ronda de inversion", "Investor Round View")}
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05, marginBottom: "0.8rem" }}>
          {L(`${BRAND.name} convierte solicitudes financieras dispersas en expedientes institucionales revisables.`, `${BRAND.name} turns scattered financing requests into institution-ready review files.`)}
        </h1>
        <p style={{ maxWidth: "880px", color: "rgba(255,255,255,0.78)", fontSize: "1rem", lineHeight: 1.75 }}>
          {L(`La demo muestra el puente completo entre solicitantes, otorgantes y ${BRAND.name}: preparacion documental, IA, data room, score, requerimientos, trazabilidad y monetizacion.`, `The demo shows the complete bridge between applicants, funders and ${BRAND.name}: document readiness, AI, data room, score, requests, traceability and monetization.`)}
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {demoMetrics.map(([label, value, detail]) => (
          <article key={label} style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.2rem", boxShadow: COLORS.shadowSm }}>
            <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 900, marginBottom: "0.45rem" }}>{copy(label)}</p>
            <p style={{ color: COLORS.navy, fontSize: "2rem", fontWeight: 900, marginBottom: "0.45rem" }}>{value}</p>
            <p style={{ color: COLORS.textMuted, fontSize: "0.8rem", lineHeight: 1.45 }}>{copy(detail)}</p>
          </article>
        ))}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(300px, 0.9fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.4rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ color: COLORS.gold, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 900, fontSize: "0.72rem", marginBottom: "0.45rem" }}>
            {L("Demo story mode", "Demo Story Mode")}
          </p>
          <h2 style={{ color: COLORS.navy, fontSize: "1.25rem", marginBottom: "1rem" }}>{L("Flujo que debe verse en una presentacion", "Flow investors should see in the presentation")}</h2>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {storySteps.map(([num, title, detail]) => (
              <div key={num} style={{ display: "grid", gridTemplateColumns: "34px 1fr", gap: "0.75rem", alignItems: "start", padding: "0.85rem", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px" }}>
                <span style={{ width: "32px", height: "32px", borderRadius: "50%", background: COLORS.gold, color: COLORS.navy, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>{num}</span>
                <span>
                  <strong style={{ display: "block", color: COLORS.navy, fontSize: "0.9rem", marginBottom: "0.2rem" }}>{copy(title)}</strong>
                  <span style={{ color: COLORS.textMuted, fontSize: "0.8rem", lineHeight: 1.45 }}>{copy(detail)}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.4rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ color: COLORS.gold, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 900, fontSize: "0.72rem", marginBottom: "0.45rem" }}>
            {copy("AI Compliance Engine")}
          </p>
          <h2 style={{ color: COLORS.navy, fontSize: "1.25rem", marginBottom: "1rem" }}>{L("Nucleo tecnologico visible", "Visible technology core")}</h2>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {aiEngine.map(([title, detail]) => (
              <div key={title} style={{ padding: "0.85rem", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px" }}>
                <strong style={{ display: "block", color: COLORS.navy, fontSize: "0.86rem", marginBottom: "0.22rem" }}>{copy(title)}</strong>
                <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45 }}>{copy(detail)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.4rem", boxShadow: COLORS.shadowSm }}>
          <h2 style={{ color: COLORS.navy, fontSize: "1.15rem", marginBottom: "1rem" }}>{L("Modelo de monetizacion", "Monetization Model")}</h2>
          {revenueStreams.map(([title, detail]) => (
            <div key={title} style={{ padding: "0.75rem 0", borderBottom: `1px solid ${COLORS.border}` }}>
              <strong style={{ color: COLORS.navy, fontSize: "0.86rem" }}>{copy(title)}</strong>
              <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45, marginTop: "0.2rem" }}>{copy(detail)}</p>
            </div>
          ))}
        </div>

        <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.4rem", boxShadow: COLORS.shadowSm }}>
          <h2 style={{ color: COLORS.navy, fontSize: "1.15rem", marginBottom: "1rem" }}>{L("Ruta internacional controlada", "Controlled International Roadmap")}</h2>
          {launchRoadmap.map(([market, status, detail]) => (
            <div key={market} style={{ padding: "0.8rem", borderRadius: "8px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, marginBottom: "0.65rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.6rem" }}>
                <strong style={{ color: COLORS.navy }}>{market}</strong>
                <span style={{ color: COLORS.gold, fontWeight: 900, fontSize: "0.72rem" }}>{copy(status)}</span>
              </div>
              <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45, marginTop: "0.35rem" }}>{copy(detail)}</p>
            </div>
          ))}
        </div>

        <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.4rem", boxShadow: COLORS.shadowSm }}>
          <h2 style={{ color: COLORS.navy, fontSize: "1.15rem", marginBottom: "1rem" }}>{L("Lo que se debe demostrar", "What the demo must prove")}</h2>
          {[
            L("Existe un dolor real: tiempos, documentos, cumplimiento y baja comparabilidad.", "There is a real pain: time, documents, compliance and low comparability."),
            L("La plataforma conecta a los dos lados del mercado con trazabilidad.", "The platform connects both sides of the market with traceability."),
            L("La IA no promete aprobar creditos; acelera preparacion, revision y decisiones internas.", "AI does not promise credit approval; it accelerates readiness, review and internal decisions."),
            L("El modelo puede monetizar por SaaS, expediente, servicios y modulos premium.", "The model can monetize through SaaS, files, services and premium modules."),
          ].map((item) => (
            <p key={item} style={{ color: COLORS.textMuted, fontSize: "0.82rem", lineHeight: 1.55, marginBottom: "0.55rem" }}>- {item}</p>
          ))}
        </div>
      </section>
    </div>
  );
}
