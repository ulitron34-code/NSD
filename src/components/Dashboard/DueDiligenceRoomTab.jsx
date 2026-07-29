import { error, debug, info, warn } from '../../utils/logger';
import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { uiText, translateCopy } from "../../utils/runtimeCopy";
import { BRAND } from "../../config/brand";

const readinessBlocks = [
  {
    title: "Producto",
    status: "Demo invertible",
    score: "82%",
    points: [
      "Pagina publica SaaS con narrativa de cumplimiento, otorgantes, solicitantes e internacional.",
      `Dashboard demo con tres perfiles: solicitante, otorgante y ${BRAND.name} Admin.`,
      "Flujo de expediente, carga documental, data room y revision con IA simulado/operativo.",
    ],
  },
  {
    title: "Mercado",
    status: "Tesis clara",
    score: "78%",
    points: [
      "Dolor identificable: solicitudes de financiamiento lentas, incompletas y costosas.",
      "Dos lados de mercado: solicitantes que requieren capital y entidades que necesitan certeza documental.",
      "Extension internacional planteada como expansion gradual, no promesa inmediata.",
    ],
  },
  {
    title: "Cumplimiento",
    status: "Base defendible",
    score: "74%",
    points: [
      "Matriz documental, trazabilidad, scoring y semaforos como capas principales de control.",
      "Biometricos planteados como modulo futuro con consentimiento, privacidad y proveedor especializado.",
      "Separacion responsable entre asistencia de cumplimiento y decision crediticia final.",
    ],
  },
  {
    title: "Modelo de negocio",
    status: "Validable en piloto",
    score: "70%",
    points: [
      "Ingresos por expediente, servicios profesionales, paquetes SaaS y comisiones condicionadas.",
      "Piloto de 4 semanas para medir disposicion de pago, conversion e interes de otorgantes.",
      "Pricing sujeto a aprendizaje real antes de comprometer escala.",
    ],
  },
];

const evidenceItems = [
  ["Demo navegable", "Pagina publica, dashboard y perfiles demo listos para presentacion."],
  ["Backend conectado", "Render + Supabase como base para autenticacion, ordenes, documentos y revisiones."],
  ["Data room", "Estructura para compartir expediente, documentos, permisos y evidencias."],
  ["Otorgantes", "Pipeline, oportunidades, solicitudes de informacion e interes institucional."],
  ["IA aplicada", "Revision documental, scoring, faltantes, memo ejecutivo y alertas de riesgo."],
  ["Internacional", "Ruta inicial para expansion por jurisdiccion, requisitos y aliados locales."],
];

const investorRisks = [
  ["Regulatorio", `Aclarar que ${BRAND.name} no sustituye dictamen legal, regulatorio ni decision crediticia.`],
  ["Datos sensibles", "Fortalecer consentimiento, auditoria, retencion documental y politicas de acceso."],
  ["Dependencia IA", "Mantener revision asistida y explicable; evitar decisiones automaticas opacas."],
  ["Adopcion otorgantes", "Validar con pilotos pequenos antes de escalar equipo comercial."],
  ["Carga operacional", "Evitar servicios manuales excesivos sin precio suficiente por expediente."],
];

const nextMilestones = [
  "Cerrar narrativa final de ronda y demo guiado de 10 minutos.",
  "Ejecutar piloto controlado con 3 a 5 expedientes y al menos 2 otorgantes.",
  "Documentar resultados: tiempos, faltantes, conversion, interes y aprendizaje de pricing.",
  "Definir paquete minimo legal, privacidad, terminos y consentimiento para demo comercial.",
  "Preparar data room de inversion: one pager, deck, modelo, roadmap, riesgos y evidencias.",
];

export default function DueDiligenceRoomTab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const copy = (val) => translateCopy(val, i18n.language);

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <section style={{
        background: "linear-gradient(135deg, #0F1F2E 0%, #19395D 58%, #C9A227 135%)",
        color: COLORS.white,
        borderRadius: "16px",
        padding: "1.7rem",
        boxShadow: COLORS.shadowMd,
      }}>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.72)", fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {L("Sala de due diligence", "Due diligence room")}
        </p>
        <h1 style={{ margin: "0.35rem 0", color: COLORS.white, fontSize: "1.65rem" }}>
          {L("Lectura ejecutiva para inversionistas", "Executive investor readiness view")}
        </h1>
        <p style={{ maxWidth: "820px", margin: 0, color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>
          {L(
            "Esta vista resume que existe, que esta validado, que falta probar y cuales son los riesgos que deben explicarse con transparencia antes de una ronda.",
            "This view summarizes what exists, what is validated, what still needs proof and which risks should be explained transparently before a round."
          )}
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "0.8rem" }}>
        {readinessBlocks.map((block) => (
          <article key={block.title} style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.7rem", alignItems: "flex-start" }}>
              <div>
                <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>{block.title}</p>
                <h2 style={{ margin: "0.25rem 0", color: COLORS.navy, fontSize: "1rem" }}>{block.status}</h2>
              </div>
              <strong style={{ color: COLORS.navy, background: "#F7F2DF", border: `1px solid ${COLORS.gold}`, borderRadius: "999px", padding: "0.25rem 0.55rem", fontSize: "0.78rem" }}>
                {block.score}
              </strong>
            </div>
            <ul style={{ margin: "0.8rem 0 0", paddingLeft: "1.05rem", color: COLORS.text, lineHeight: 1.55, fontSize: "0.86rem" }}>
              {block.points.map((point) => <li key={point}>{copy(point)}</li>)}
            </ul>
          </article>
        ))}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(280px, 0.85fr)", gap: "1rem" }}>
        <article style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {L("Evidencia disponible", "Available evidence")}
          </p>
          <div style={{ display: "grid", gap: "0.65rem", marginTop: "0.8rem" }}>
            {evidenceItems.map(([label, detail]) => (
              <div key={label} style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "0.75rem", padding: "0.7rem", border: `1px solid ${COLORS.border}`, borderRadius: "8px", background: COLORS.bg }}>
                <strong style={{ color: COLORS.navy, fontSize: "0.86rem" }}>{copy(label)}</strong>
                <span style={{ color: COLORS.text, fontSize: "0.86rem", lineHeight: 1.45 }}>{copy(detail)}</span>
              </div>
            ))}
          </div>
        </article>

        <article style={{ background: "#102235", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", padding: "1rem", color: COLORS.white, boxShadow: COLORS.shadowSm }}>
          <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {L("Riesgos a explicar", "Risks to explain")}
          </p>
          <div style={{ display: "grid", gap: "0.65rem", marginTop: "0.8rem" }}>
            {investorRisks.map(([label, detail]) => (
              <div key={label} style={{ borderBottom: "1px solid rgba(255,255,255,0.11)", paddingBottom: "0.55rem" }}>
                <strong style={{ display: "block", color: COLORS.white, fontSize: "0.86rem", marginBottom: "0.2rem" }}>{copy(label)}</strong>
                <span style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.82rem", lineHeight: 1.45 }}>{copy(detail)}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
        <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {L("Siguientes hitos para estar listo para ronda", "Next milestones for fundraising readiness")}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "0.75rem", marginTop: "0.85rem" }}>
          {nextMilestones.map((item, index) => (
            <div key={item} style={{ display: "flex", gap: "0.65rem", alignItems: "flex-start", padding: "0.75rem", border: `1px solid ${COLORS.border}`, borderRadius: "8px" }}>
              <span style={{ flex: "0 0 auto", width: "28px", height: "28px", borderRadius: "50%", background: COLORS.gold, color: COLORS.navy, display: "grid", placeItems: "center", fontWeight: 900, fontSize: "0.78rem" }}>{index + 1}</span>
              <p style={{ margin: 0, color: COLORS.text, fontSize: "0.86rem", lineHeight: 1.45 }}>{copy(item)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
