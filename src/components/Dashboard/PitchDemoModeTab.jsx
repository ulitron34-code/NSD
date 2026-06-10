import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { uiText, translateCopy } from "../../utils/runtimeCopy";

const pitchSteps = [
  {
    minute: "0:00 - 1:00",
    title: "Problema",
    screen: "Landing / Modelo operativo",
    proof: "Solicitantes y otorgantes pierden tiempo por expedientes incompletos, baja comparabilidad y revisiones manuales.",
    investorLine: "No vendemos una pagina de cumplimiento; organizamos solicitudes financieras para que sean revisables institucionalmente.",
  },
  {
    minute: "1:00 - 2:30",
    title: "Solicitante",
    screen: "Subir Proyecto / IA",
    proof: "El solicitante registra proyecto, monto, sector, uso de fondos y documentos base.",
    investorLine: "El producto empieza antes del banco: prepara al solicitante para llegar con un expediente defendible.",
  },
  {
    minute: "2:30 - 4:00",
    title: "AI Compliance Engine",
    screen: "Diagnostico IA / Checklist",
    proof: "IA detecta faltantes, vencimientos, consistencia, requisitos y riesgos.",
    investorLine: "La IA no aprueba creditos; reduce friccion, ordena evidencia y acelera la revision humana.",
  },
  {
    minute: "4:00 - 6:00",
    title: "Otorgante",
    screen: "Oportunidades / Data room",
    proof: "El otorgante filtra oportunidades, abre data room, pide informacion y registra interes.",
    investorLine: "Aqui aparece el otro lado del marketplace: instituciones con mejor informacion y menos ruido operativo.",
  },
  {
    minute: "6:00 - 7:30",
    title: "NSD Admin",
    screen: "Vista inversion",
    proof: "La administracion ve pipeline, ingresos, score, conversion, trazabilidad y modulos premium.",
    investorLine: "El modelo combina SaaS, fee por expediente, servicios NSD IF y modulos avanzados.",
  },
  {
    minute: "7:30 - 9:00",
    title: "Expansion",
    screen: "Internacional",
    proof: "Mexico como mercado inicial, USA como expansion natural, Canada/UK despues de validacion legal.",
    investorLine: "La arquitectura se puede replicar, pero el rollout se controla para proteger margen, cumplimiento y reputacion.",
  },
  {
    minute: "9:00 - 10:00",
    title: "Cierre",
    screen: "Vista inversion / Modelo de negocio",
    proof: "Demo completa: solicitante, IA, otorgante, NSD Admin, monetizacion e internacional.",
    investorLine: "La ronda financia producto, pilotos, integraciones y go-to-market con entidades financieras.",
  },
];

const objectionCards = [
  ["Esto no reemplaza al banco", "Correcto. NSD prepara evidencia, trazabilidad y comparabilidad; la decision sigue siendo del otorgante."],
  ["La IA puede equivocarse", "Por eso se presenta como revision asistida, explicable y auditable, no como aprobacion automatica."],
  ["Como monetiza", "SaaS B2B, fee por expediente, servicios profesionales y modulos premium de compliance."],
  ["Por que ahora", "Las entidades necesitan revisar mas casos con menos tiempo, mas regulacion y mayor presion antifraude."],
];

export default function PitchDemoModeTab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const copy = (val) => translateCopy(val, i18n.language);
  const [activeStep, setActiveStep] = useState(0);
  const current = pitchSteps[activeStep];

  return (
    <div>
      <section style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "14px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        boxShadow: COLORS.shadowSm,
      }}>
        <p style={{ color: COLORS.gold, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 900, fontSize: "0.75rem", marginBottom: "0.5rem" }}>
          {L("Modo demo 10 minutos", "10-Minute Demo Mode")}
        </p>
        <h1 style={{ color: COLORS.navy, fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 4vw, 2.8rem)", lineHeight: 1.1, marginBottom: "0.75rem" }}>
          {L("Guion ejecutivo para presentar NSD como startup.", "Executive script to present NSD as a startup.")}
        </h1>
        <p style={{ color: COLORS.textMuted, maxWidth: "860px", lineHeight: 1.7 }}>
          {L("Esta vista ordena la demostracion para inversionistas: que pantalla abrir, que probar y que frase decir en cada bloque.", "This view organizes the investor demo: which screen to open, what to prove and what line to say in each block.")}
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(260px, 0.75fr) minmax(0, 1.25fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        <aside style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 900, fontSize: "0.72rem", marginBottom: "0.75rem" }}>
            {L("Secuencia", "Sequence")}
          </p>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {pitchSteps.map((step, index) => (
              <button
                key={step.title}
                type="button"
                onClick={() => setActiveStep(index)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: activeStep === index ? `1px solid ${COLORS.gold}` : `1px solid ${COLORS.border}`,
                  background: activeStep === index ? "rgba(201,168,76,0.14)" : COLORS.bg,
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "block", color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900 }}>{step.minute}</span>
                <strong style={{ display: "block", color: COLORS.navy, fontSize: "0.88rem" }}>{copy(step.title)}</strong>
              </button>
            ))}
          </div>
        </aside>

        <article style={{
          background: "linear-gradient(135deg, rgba(15,31,46,0.97), rgba(27,58,92,0.94))",
          color: "white",
          borderRadius: "12px",
          padding: "1.5rem",
          boxShadow: "0 12px 30px rgba(15,31,46,0.22)",
        }}>
          <p style={{ color: COLORS.gold, fontWeight: 900, fontSize: "0.8rem", marginBottom: "0.35rem" }}>{current.minute}</p>
          <h2 style={{ color: "white", fontSize: "1.8rem", marginBottom: "0.75rem" }}>{copy(current.title)}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.9rem" }}>
            {[
              [L("Pantalla", "Screen"), current.screen],
              [L("Prueba", "Proof"), current.proof],
              [L("Frase para inversionista", "Investor line"), current.investorLine],
            ].map(([label, value]) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.13)", borderRadius: "8px", padding: "1rem" }}>
                <p style={{ color: "rgba(255,255,255,0.56)", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.68rem", fontWeight: 900, marginBottom: "0.45rem" }}>{label}</p>
                <p style={{ color: "rgba(255,255,255,0.86)", lineHeight: 1.55, fontSize: "0.9rem" }}>{copy(value)}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(300px, 0.8fr)", gap: "1rem" }}>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.2rem", boxShadow: COLORS.shadowSm }}>
          <h2 style={{ color: COLORS.navy, fontSize: "1.15rem", marginBottom: "1rem" }}>{L("Objeciones esperadas", "Expected Objections")}</h2>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {objectionCards.map(([title, answer]) => (
              <div key={title} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.9rem" }}>
                <strong style={{ color: COLORS.navy, fontSize: "0.88rem" }}>{copy(title)}</strong>
                <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45, marginTop: "0.25rem" }}>{copy(answer)}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.2rem", boxShadow: COLORS.shadowSm }}>
          <h2 style={{ color: COLORS.navy, fontSize: "1.15rem", marginBottom: "1rem" }}>{L("Checklist antes de presentar", "Pre-Presentation Checklist")}</h2>
          {[
            L("Entrar con usuario demo y selector de perfil visible.", "Enter with demo user and visible profile switcher."),
            L("Mostrar Solicitante, Otorgante y NSD Admin en menos de 10 minutos.", "Show Applicant, Funder and NSD Admin in under 10 minutes."),
            L("Evitar prometer aprobacion crediticia automatica.", "Avoid promising automatic credit approval."),
            L("Cerrar con modelo de negocio y uso de fondos de la ronda.", "Close with business model and use of funds for the round."),
          ].map((item) => (
            <p key={item} style={{ color: COLORS.textMuted, fontSize: "0.82rem", lineHeight: 1.55, marginBottom: "0.55rem" }}>- {item}</p>
          ))}
        </div>
      </section>
    </div>
  );
}
