import React from "react";
import { COLORS } from "../../utils/constants";

const GUIDES_BY_TAB = {
  perfil: (L) => ({
    title: L("Empieza aqui", "Start here"),
    lines: [L("Completa tu perfil financiero: identidad, datos legales y de contacto.", "Complete your financial profile: identity, legal and contact details.")],
  }),
  readiness: (L) => ({
    title: L("Paso 2: revisa tu preparacion", "Step 2: check your readiness"),
    lines: [L("Aqui ves que tan lista esta tu empresa por area (identidad, legal, financiero, proyecto, anti-fraude) antes de subir tu proyecto.", "See how ready your company is by area (identity, legal, financial, project, anti-fraud) before uploading your project.")],
  }),
  subir_proyecto: (L) => ({
    title: L("Paso 3: sube tu proyecto y corre los agentes IA", "Step 3: upload your project and run the AI agents"),
    lines: [L("Aqui subes documentos y datos del proyecto. Los agentes IA (triage, analisis forense y memo de riesgo) corren automaticamente y generan el resultado que veras en Instituciones Compatibles.", "Upload your project's documents and data here. The AI agents (triage, forensic analysis and risk memo) run automatically and produce the result you'll see in Compatible Institutions.")],
  }),
  data_room_index: (L) => ({
    title: L("Organiza tus documentos", "Organize your documents"),
    lines: [L("Vista de carpetas de tu Data Room, con version y estado de cada documento.", "Your Data Room's folder view, with version and status per document.")],
  }),
  document_intel: (L) => ({
    title: L("Analisis avanzado (opcional)", "Advanced analysis (optional)"),
    lines: [L("Herramienta adicional de clasificacion y validacion de documentos, mas alla del analisis automatico de Subir Proyecto.", "Additional document classification and validation tool, beyond the automatic analysis in Upload Project.")],
  }),
  scoring_ae: (L) => ({
    title: L("Entiende tu calificacion", "Understand your rating"),
    lines: [L("Explica como se calcula el Scoring A-E. La IA asiste, pero la decision final siempre es humana.", "Explains how the A-E Scoring is calculated. AI assists, but the final decision is always human.")],
  }),
  matches: (L) => ({
    title: L("Paso 4: revisa tu resultado", "Step 4: check your result"),
    lines: [L("Instituciones compatibles con tu proyecto, segun el score y analisis generado en Subir Proyecto.", "Institutions compatible with your project, based on the score and analysis generated in Upload Project.")],
  }),
  mensajeria: (L) => ({
    title: L("Contacto", "Contact"),
    lines: [L("Conversa directamente con el otorgante sobre tu expediente.", "Talk directly with the funder about your file.")],
  }),
  cumplimiento: (L) => ({
    title: L("Cumplimiento", "Compliance"),
    lines: [L("Estado de cumplimiento y documentos de tu expediente.", "Compliance status and documents for your file.")],
  }),
  command: (L) => ({
    title: L("Resumen de tu operacion", "Your operations overview"),
    lines: [L("Punto de partida del otorgante: metricas rapidas y el flujo recomendado para revisar oportunidades.", "The funder's starting point: quick metrics and the recommended flow for reviewing opportunities.")],
  }),
  pipeline: (L) => ({
    title: L("Paso 1: revisa e intake", "Step 1: review and intake"),
    lines: [L("Bandeja de oportunidades. Abre un expediente para ver su data room, score y acciones disponibles.", "Opportunity inbox. Open a file to see its data room, score and available actions.")],
  }),
  forensic_analysis: (L) => ({
    title: L("Paso 2: valida sin red flags", "Step 2: validate without red flags"),
    lines: [L("Hallazgos forenses del expediente: consistencia documental, KYB/UBO e integridad de archivos.", "Forensic findings for the file: document consistency, KYB/UBO and file integrity.")],
  }),
  analytics: (L) => ({
    title: L("Contexto de riesgo", "Risk context"),
    lines: [L("Vision de portafolio: exposicion por riesgo y cola de acciones recomendadas.", "Portfolio view: risk exposure and recommended action queue.")],
  }),
  decision_room: (L) => ({
    title: L("Paso 3: decide con las gates 360", "Step 3: decide with the 360 gates"),
    lines: [L("Vista ejecutiva de decision: confirma acceso, evidencia suficiente y score antes de avanzar.", "Executive decision view: confirm access, sufficient evidence and score before moving forward.")],
  }),
  requirements: (L) => ({
    title: L("Pide informacion adicional (opcional)", "Request additional information (optional)"),
    lines: [L("Solo si falta algo: registra requerimientos trazables con evidencia y responsable.", "Only if something is missing: log traceable requests with evidence and an owner.")],
  }),
  committee_memo: (L) => ({
    title: L("Paso final: cierra con el comite", "Final step: close with the committee"),
    lines: [L("Memo ejecutivo listo para revision interna y decision de comite.", "Executive memo ready for internal review and committee decision.")],
  }),
};

export function getGuideFor(activeTab, userMode, L) {
  const build = GUIDES_BY_TAB[activeTab];
  return build ? build(L) : null;
}

export default function SectionGuide({ title, lines }) {
  if (!title && (!lines || lines.length === 0)) return null;

  return (
    <div style={{
      background: COLORS.goldPale,
      borderLeft: `4px solid ${COLORS.gold}`,
      borderRadius: "8px",
      padding: "0.85rem 1rem",
      marginBottom: "1.25rem",
    }}>
      {title && (
        <p style={{ color: COLORS.navy, fontWeight: 800, fontSize: "0.82rem", marginBottom: lines?.length ? "0.25rem" : 0 }}>
          {title}
        </p>
      )}
      {lines?.map((line) => (
        <p key={line} style={{ color: COLORS.textMuted, fontSize: "0.8rem", lineHeight: 1.4 }}>
          {line}
        </p>
      ))}
    </div>
  );
}
