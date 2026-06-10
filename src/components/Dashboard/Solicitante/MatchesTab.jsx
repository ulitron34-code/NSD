import React from "react";
import { COLORS } from "../../../utils/constants";
import { useNotification } from "../../../hooks/useNotification";

export default function MatchesTab() {
  const { addNotification } = useNotification();

  const matches = [
    {
      name: "Fondo Alpha Latam",
      tipo: "Fondo de inversion",
      ticket: "$1M - $5M USD",
      match: "98%",
      status: "Oferta recibida",
      criteria: ["EBITDA positivo", "Data room completo", "Gobierno corporativo"],
      next: "Preparar memo y term sheet indicativo.",
    },
    {
      name: "Fintech CreditCorp",
      tipo: "SOFOM",
      ticket: "$100K - $500K USD",
      match: "92%",
      status: "En evaluacion",
      criteria: ["Flujo mensual", "KYC/KYB", "Garantia o cobranza"],
      next: "Responder requerimientos y validar beneficiario controlador.",
    },
    {
      name: "Banco del Norte",
      tipo: "Banco comercial",
      ticket: "$500K - $2M USD",
      match: "85%",
      status: "Pre-aprobado",
      criteria: ["Historial fiscal", "Estados financieros", "Garantias"],
      next: "Completar documentacion fiscal y estados auditados.",
    },
  ];
  const presentationPack = [
    ["Resumen ejecutivo", "Proyecto, uso de fondos, monto, estructura y etapa."],
    ["Score NSD", "Lectura A-E, riesgos visibles y brechas por subsanar."],
    ["Data room", "Documentos clave, version, vigencia y permisos de acceso."],
    ["Preguntas esperadas", "Requerimientos que probablemente pedira cada tipo de otorgante."],
  ];
  const nextMilestones = [
    ["Preparar", "Completar faltantes antes de compartir expediente."],
    ["Autorizar", "Dar consentimiento para que un otorgante revise el data room."],
    ["Responder", "Atender requerimientos con evidencia vinculada."],
    ["Negociar", "Comparar term sheet, condiciones, garantias y costos."],
  ];

  return (
    <div>
      <div style={{ marginBottom: "2rem", borderBottom: `1px solid ${COLORS.border}`, paddingBottom: "1.5rem" }}>
        <p style={{ color: COLORS.gold, fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem" }}>
          Red de oportunidades
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.navy, fontSize: "2.2rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          Instituciones compatibles
        </h1>
        <p style={{ color: COLORS.textMuted, maxWidth: "820px", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.7 }}>
          La compatibilidad se calcula con score NSD, ticket, sector, documentos, riesgo visible y apetito institucional. No garantiza fondeo; ayuda a priorizar a que otorgantes conviene presentar el expediente.
        </p>
      </div>

      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", marginBottom: "1.5rem", boxShadow: COLORS.shadowSm }}>
        <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.35rem" }}>
          Como se calcula el match
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "0.75rem" }}>
          {["Ticket compatible", "Sector aceptado", "Riesgo dentro de apetito", "Data room suficiente", "KYC/KYB verificable"].map((item) => (
            <div key={item} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.8rem" }}>
              <p style={{ color: COLORS.navy, fontWeight: 900, fontSize: "0.82rem" }}>{item}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(300px, 0.9fr)", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.35rem" }}>
            Paquete de presentacion
          </p>
          <h2 style={{ color: COLORS.navy, fontSize: "1.15rem", marginBottom: "0.75rem" }}>Lo que vera el otorgante</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "0.75rem" }}>
            {presentationPack.map(([title, detail]) => (
              <div key={title} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.85rem" }}>
                <p style={{ color: COLORS.navy, fontWeight: 900, fontSize: "0.82rem", marginBottom: "0.25rem" }}>{title}</p>
                <p style={{ color: COLORS.textMuted, fontSize: "0.76rem", lineHeight: 1.45 }}>{detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.35rem" }}>
            Ruta de acercamiento
          </p>
          <h2 style={{ color: COLORS.navy, fontSize: "1.15rem", marginBottom: "0.75rem" }}>Antes de abrir contacto</h2>
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {nextMilestones.map(([title, detail], index) => (
              <div key={title} style={{ display: "grid", gridTemplateColumns: "32px 1fr", gap: "0.7rem", alignItems: "start", padding: "0.75rem", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px" }}>
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
              {m.match} Match
            </div>
            <h3 style={{ color: COLORS.navy, fontSize: "1.2rem", marginBottom: "0.25rem", marginTop: "0.5rem" }}>{m.name}</h3>
            <p style={{ color: COLORS.textMuted, fontSize: "0.85rem", marginBottom: "1.2rem" }}>{m.tipo}</p>

            <div style={{ marginBottom: "1rem" }}>
              <p style={{ color: COLORS.text, fontSize: "0.85rem", marginBottom: "0.25rem" }}>Rango de ticket</p>
              <p style={{ fontWeight: 700, color: COLORS.navy }}>{m.ticket}</p>
            </div>

            <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.85rem", marginBottom: "1rem" }}>
              <p style={{ color: COLORS.navy, fontWeight: 900, fontSize: "0.82rem", marginBottom: "0.45rem" }}>Criterios que explican el match</p>
              {m.criteria.map((criterion) => (
                <p key={criterion} style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45, marginBottom: "0.2rem" }}>- {criterion}</p>
              ))}
            </div>

            <p style={{ color: COLORS.textMuted, fontSize: "0.82rem", lineHeight: 1.5, marginBottom: "1rem" }}>
              <strong style={{ color: COLORS.navy }}>Siguiente paso:</strong> {m.next}
            </p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ background: m.status === "Oferta recibida" ? "rgba(201,168,76,0.15)" : COLORS.bgSubtle, color: m.status === "Oferta recibida" ? COLORS.gold : COLORS.textMuted, padding: "0.3rem 0.6rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700 }}>
                {m.status}
              </span>
              <button
                onClick={() => addNotification(`Preparando detalle para ${m.name}`, "success")}
                style={{ background: COLORS.navy, color: "white", border: "none", padding: "0.55rem 1rem", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer", fontWeight: 800 }}
              >
                Ver detalle
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
