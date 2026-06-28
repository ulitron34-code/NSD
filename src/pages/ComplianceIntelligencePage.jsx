import React from "react";
import { useNavigate } from "react-router-dom";
import { COLORS } from "../utils/constants";
import Footer from "../components/Landing/Footer";

const AGENTS = [
  { name: "Agente Clasificador", desc: "Identifica el tipo de documento, extrae metadatos clave y lo asigna al flujo de validación correcto." },
  { name: "Agente Validador", desc: "Aplica reglas regulatorias por tipo de documento, detecta inconsistencias y genera alertas con evidencia." },
  { name: "Agente Financiero", desc: "Analiza estados financieros, calcula ratios clave y prepara el resumen para el responsable de crédito o inversión." },
  { name: "Agente de Cruces", desc: "Cruza información entre documentos para detectar discrepancias en nombres, fechas, montos y estructuras." },
  { name: "Agente de Riesgo", desc: "Pondera factores de riesgo según la jurisdicción, sector y tipo de relación y produce un score explicable." },
  { name: "Agente de Chat", desc: "Responde preguntas sobre el expediente utilizando los documentos procesados como contexto." },
];

const CAPABILITIES = [
  { title: "Motor de Riesgo Configurables", desc: "Matrices, reglas, factores, ponderaciones, excepciones y niveles de riesgo por jurisdicción y sector. Cada resultado incluye explicación." },
  { title: "Gestión de Casos con SLA", desc: "Bandejas de trabajo, asignaciones, escalamiento, solicitudes de aclaración, dictámenes y aprobaciones con trazabilidad completa." },
  { title: "Bitácora de Auditoría", desc: "Registro inmutable de cada acción: quién revisó, qué regla se aplicó, qué fuente se consultó y cuándo se tomó la decisión." },
  { title: "Monitoreo Continuo", desc: "Alertas automáticas por vencimiento de documentos, cambios corporativos, re-screening y revisiones periódicas programadas." },
];

export default function ComplianceIntelligencePage() {
  const navigate = useNavigate();

  return (
    <div style={{ background: "#F2EFE9", minHeight: "100vh" }}>
      <section style={{ background: `linear-gradient(135deg, ${COLORS.navy} 0%, #0F2D4A 100%)`, padding: "5rem 2rem 4rem", textAlign: "center" }}>
        <p style={{ color: COLORS.gold, fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1rem" }}>INTELIGENCIA DE CUMPLIMIENTO</p>
        <h1 style={{ color: "#fff", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 700, lineHeight: 1.2, maxWidth: "700px", margin: "0 auto 1.25rem" }}>
          IA con supervisión humana para decisiones institucionales
        </h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "1.05rem", maxWidth: "620px", margin: "0 auto 2rem", lineHeight: 1.65 }}>
          Seis agentes especializados apoyan el análisis. La aprobación, rechazo, escalamiento o excepción corresponde a las personas autorizadas por su organización.
        </p>
        <button onClick={() => navigate("/contacto")} style={{ background: COLORS.gold, color: COLORS.navy, border: "none", borderRadius: "8px", padding: "0.85rem 2rem", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer" }}>
          Conocer la plataforma →
        </button>
      </section>

      <section style={{ padding: "4rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
        <p style={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.navy, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem", textAlign: "center" }}>AGENTES DE IA ESPECIALIZADOS</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem", marginBottom: "3rem" }}>
          {AGENTS.map((a) => (
            <div key={a.name} style={{ background: "#fff", borderRadius: "12px", padding: "1.5rem", border: "1px solid rgba(27,58,92,0.08)" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: COLORS.navy, marginBottom: "0.5rem" }}>{a.name}</h3>
              <p style={{ fontSize: "0.87rem", color: COLORS.textMuted, lineHeight: 1.55, margin: 0 }}>{a.desc}</p>
            </div>
          ))}
        </div>

        <p style={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.navy, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem", textAlign: "center" }}>CAPACIDADES DE PLATAFORMA</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {CAPABILITIES.map((c) => (
            <div key={c.title} style={{ background: "#fff", borderRadius: "12px", padding: "1.5rem", border: "1px solid rgba(27,58,92,0.08)" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: COLORS.navy, marginBottom: "0.5rem" }}>{c.title}</h3>
              <p style={{ fontSize: "0.87rem", color: COLORS.textMuted, lineHeight: 1.55, margin: 0 }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
