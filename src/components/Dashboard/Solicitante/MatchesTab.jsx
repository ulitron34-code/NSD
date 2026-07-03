import { error, debug, info, warn } from '../../../utils/logger';
import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../../utils/constants";
import { useNotification } from "../../../hooks/useNotification";
import { uiText } from "../../../utils/runtimeCopy";

export default function MatchesTab() {
  const { addNotification } = useNotification();
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);

  const matches = [
    {
      name: "Fondo Alpha Latam",
      tipo: L("Fondo de inversion", "Investment Fund"),
      ticket: "$1M - $5M USD",
      match: "98%",
      status: L("Oferta recibida", "Offer Received"),
      criteria: [L("EBITDA positivo", "Positive EBITDA"), L("Data room completo", "Complete Data Room"), L("Gobierno corporativo", "Corporate Governance")],
      next: L("Preparar memo y term sheet indicativo.", "Prepare memo and indicative term sheet."),
    },
    {
      name: "Fintech CreditCorp",
      tipo: "SOFOM",
      ticket: "$100K - $500K USD",
      match: "92%",
      status: L("En evaluacion", "Under Evaluation"),
      criteria: [L("Flujo mensual", "Monthly Cash Flow"), "KYC/KYB", L("Garantia o cobranza", "Guarantee or Collections")],
      next: L("Responder requerimientos y validar beneficiario controlador.", "Respond to requests and validate ultimate beneficial owner."),
    },
    {
      name: "Banco del Norte",
      tipo: L("Banco comercial", "Commercial Bank"),
      ticket: "$500K - $2M USD",
      match: "85%",
      status: L("Pre-aprobado", "Pre-approved"),
      criteria: [L("Historial fiscal", "Tax History"), L("Estados financieros", "Financial Statements"), L("Garantias", "Guarantees")],
      next: L("Completar documentacion fiscal y estados auditados.", "Complete tax documentation and audited financial statements."),
    },
  ];

  const presentationPack = [
    [L("Resumen ejecutivo", "Executive Summary"), L("Proyecto, uso de fondos, monto, estructura y etapa.", "Project, use of funds, amount, structure and stage.")],
    [L("Score NEXUS", "NEXUS Score"), L("Lectura A-E, riesgos visibles y brechas por subsanar.", "A-E reading, visible risks and gaps to remediate.")],
    [L("Data room", "Data Room"), L("Documentos clave, version, vigencia y permisos de acceso.", "Key documents, version, validity and access permissions.")],
    [L("Preguntas esperadas", "Expected Questions"), L("Requerimientos que probablemente pedira cada tipo de otorgante.", "Requirements each type of funding provider will likely request.")],
  ];

  const nextMilestones = [
    [L("Preparar", "Prepare"), L("Completar faltantes antes de compartir expediente.", "Complete missing items before sharing the file.")],
    [L("Autorizar", "Authorize"), L("Dar consentimiento para que un otorgante revise el data room.", "Give consent for a funding provider to review the data room.")],
    [L("Responder", "Respond"), L("Atender requerimientos con evidencia vinculada.", "Address requests with linked evidence.")],
    [L("Negociar", "Negotiate"), L("Comparar term sheet, condiciones, garantias y costos.", "Compare term sheet, terms, guarantees and costs.")],
  ];

  return (
    <div>
      <div style={{ marginBottom: "2rem", borderBottom: `1px solid ${COLORS.border}`, paddingBottom: "1.5rem" }}>
        <p style={{ color: COLORS.gold, fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem" }}>
          {L("Red de oportunidades", "Opportunity Network")}
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.navy, fontSize: "2.2rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          {L("Instituciones compatibles", "Compatible Institutions")}
        </h1>
        <p style={{ color: COLORS.textMuted, maxWidth: "820px", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.7 }}>
          {L(
            "La compatibilidad se calcula con score NEXUS, ticket, sector, documentos, riesgo visible y apetito institucional. No garantiza fondeo; ayuda a priorizar a que otorgantes conviene presentar el expediente.",
            "Compatibility is calculated with NEXUS score, ticket size, sector, documents, visible risk and institutional appetite. It does not guarantee funding; it helps prioritize which funding providers should receive the file."
          )}
        </p>
      </div>

      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", marginBottom: "1.5rem", boxShadow: COLORS.shadowSm }}>
        <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.35rem" }}>
          {L("Como se calcula el match", "How the Match Is Calculated")}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "0.75rem" }}>
          {[L("Ticket compatible", "Ticket compatible"), L("Sector aceptado", "Sector accepted"), L("Riesgo dentro de apetito", "Risk within appetite"), L("Data room suficiente", "Data room sufficient"), L("KYC/KYB verificable", "KYC/KYB verifiable")].map((item) => (
            <div key={item} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.8rem" }}>
              <p style={{ color: COLORS.navy, fontWeight: 900, fontSize: "0.82rem" }}>{item}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(300px, 0.9fr)", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.35rem" }}>
            {L("Paquete de presentacion", "Presentation Package")}
          </p>
          <h2 style={{ color: COLORS.navy, fontSize: "1.15rem", marginBottom: "0.75rem" }}>{L("Lo que vera el otorgante", "What the funder will see")}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "0.75rem" }}>
            {presentationPack.map(([title, detail], idx) => (
              <div key={idx} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.85rem" }}>
                <p style={{ color: COLORS.navy, fontWeight: 900, fontSize: "0.82rem", marginBottom: "0.25rem" }}>{title}</p>
                <p style={{ color: COLORS.textMuted, fontSize: "0.76rem", lineHeight: 1.45 }}>{detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.35rem" }}>
            {L("Ruta de acercamiento", "Approach Route")}
          </p>
          <h2 style={{ color: COLORS.navy, fontSize: "1.15rem", marginBottom: "0.75rem" }}>{L("Antes de abrir contacto", "Before opening contact")}</h2>
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {nextMilestones.map(([title, detail], index) => (
              <div key={index} style={{ display: "grid", gridTemplateColumns: "32px 1fr", gap: "0.7rem", alignItems: "start", padding: "0.75rem", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px" }}>
                <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: COLORS.gold, color: COLORS.navy, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>{index + 1}</span>
                <span>
                  <strong style={{ display: "block", color: COLORS.navy, fontSize: "0.84rem" }}>{title}</strong>
                  <span style={{ color: COLORS.textMuted, fontSize: "0.76rem", lineHeight: 1.45 }}>{detail}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
        {matches.map((m) => (
          <div key={m.name} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.5rem", boxShadow: COLORS.shadowSm, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, right: 0, background: COLORS.greenBg, color: COLORS.green, padding: "0.5rem 1rem", borderBottomLeftRadius: "10px", fontWeight: 700, fontSize: "0.85rem" }}>
              {m.match} {L("Match", "Match")}
            </div>
            <h3 style={{ color: COLORS.navy, fontSize: "1.2rem", marginBottom: "0.25rem", marginTop: "0.5rem" }}>{m.name}</h3>
            <p style={{ color: COLORS.textMuted, fontSize: "0.85rem", marginBottom: "1.2rem" }}>{m.tipo}</p>

            <div style={{ marginBottom: "1rem" }}>
              <p style={{ color: COLORS.text, fontSize: "0.85rem", marginBottom: "0.25rem" }}>{L("Rango de ticket", "Ticket Range")}</p>
              <p style={{ fontWeight: 700, color: COLORS.navy }}>{m.ticket}</p>
            </div>

            <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.85rem", marginBottom: "1rem" }}>
              <p style={{ color: COLORS.navy, fontWeight: 900, fontSize: "0.82rem", marginBottom: "0.45rem" }}>{L("Criterios que explican el match", "Criteria explaining match")}</p>
              {m.criteria.map((criterion, idx) => (
                <p key={idx} style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45, marginBottom: "0.2" }}>- {criterion}</p>
              ))}
            </div>

            <p style={{ color: COLORS.textMuted, fontSize: "0.82rem", lineHeight: 1.5, marginBottom: "1rem" }}>
              <strong style={{ color: COLORS.navy }}>{L("Siguiente paso:", "Next Step:")}</strong> {m.next}
            </p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ background: m.status === L("Oferta recibida", "Offer Received") ? "rgba(201,168,76,0.15)" : COLORS.bgSubtle, color: m.status === L("Oferta recibida", "Offer Received") ? COLORS.gold : COLORS.textMuted, padding: "0.3rem 0.6rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700 }}>
                {m.status}
              </span>
              <button
                onClick={() => addNotification(`${L("Preparando detalle para", "Preparing detail for")} ${m.name}`, "success")}
                style={{ background: COLORS.navy, color: "white", border: "none", padding: "0.55rem 1rem", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer", fontWeight: 800 }}
              >
                {L("Ver detalle", "View details")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
