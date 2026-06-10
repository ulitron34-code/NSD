import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../../utils/constants";
import { uiText } from "../../../utils/runtimeCopy";

const readinessAreas = [
  {
    area: "Identidad y KYB",
    grade: "A",
    signal: "Verde",
    progress: 92,
    next: "Mantener poderes, RFC y beneficiario controlador actualizados.",
  },
  {
    area: "Corporativo legal",
    grade: "B",
    signal: "Amarillo",
    progress: 78,
    next: "Actualizar acta, organigrama y autorizaciones para financiamiento.",
  },
  {
    area: "Financiero",
    grade: "B",
    signal: "Amarillo",
    progress: 74,
    next: "Subir estados financieros recientes, flujo proyectado y soporte de ingresos.",
  },
  {
    area: "Proyecto / uso de recursos",
    grade: "A",
    signal: "Verde",
    progress: 88,
    next: "Agregar hitos, presupuesto y evidencia de avance operativo.",
  },
  {
    area: "Antifraude y cumplimiento",
    grade: "B",
    signal: "Amarillo",
    progress: 81,
    next: "Completar declaraciones, listas internas y validaciones pendientes.",
  },
];

const financingSteps = [
  ["1", "Preparar expediente", "Completar documentos base y datos del proyecto."],
  ["2", "Revision IA / NSD", "Detectar faltantes, score, riesgos y memo ejecutivo."],
  ["3", "Liberar data room", "Compartir expediente con otorgantes compatibles."],
  ["4", "Atender requerimientos", "Responder solicitudes y sustituir documentos vencidos."],
  ["5", "Comite / term sheet", "Llegar con evidencia ordenada para decision del otorgante."],
];

const blockerItems = [
  "Estados financieros con fecha mayor a 90 dias.",
  "Poderes o actas sin version final digitalizada.",
  "Uso de recursos sin presupuesto verificable.",
  "Contratos clave sin vigencia o firma completa.",
  "Beneficiario controlador pendiente de confirmacion.",
];

export default function FundingReadinessTab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <section style={{
        background: "linear-gradient(135deg, #0F1F2E 0%, #1B3A5C 68%, #C9A227 145%)",
        color: COLORS.white,
        borderRadius: "16px",
        padding: "1.6rem",
        boxShadow: COLORS.shadowMd,
      }}>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {L("Preparacion para financiamiento", "Funding readiness")}
        </p>
        <h1 style={{ margin: "0.35rem 0", color: COLORS.white, fontSize: "1.6rem" }}>
          {L("Que tan listo esta tu expediente para un otorgante", "How ready your file is for a funder")}
        </h1>
        <p style={{ margin: 0, maxWidth: "820px", color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>
          {L(
            "NSD IF organiza documentos, revisa faltantes, prioriza riesgos y prepara una lectura institucional para que el solicitante llegue mejor armado a una entidad financiera.",
            "NSD IF organizes documents, reviews gaps, prioritizes risks and prepares an institutional readout so the applicant reaches a financial institution better prepared."
          )}
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "0.75rem" }}>
        {[
          ["Score estimado", "82", "B+"],
          ["Faltantes criticos", "2", "por atender"],
          ["Dias ahorrados", "12", "estimados"],
          ["Otorgantes compatibles", "7", "potenciales"],
        ].map(([label, value, suffix]) => (
          <article key={label} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
            <p style={{ margin: 0, color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>{L(label, label)}</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.45rem", marginTop: "0.35rem" }}>
              <strong style={{ color: COLORS.navy, fontSize: "1.75rem" }}>{value}</strong>
              <span style={{ color: COLORS.gold, fontWeight: 900, fontSize: "0.85rem" }}>{L(suffix, suffix)}</span>
            </div>
          </article>
        ))}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(280px, 0.85fr)", gap: "1rem" }}>
        <article style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {L("Matriz de preparacion", "Readiness matrix")}
          </p>
          <div style={{ display: "grid", gap: "0.7rem", marginTop: "0.85rem" }}>
            {readinessAreas.map((item) => (
              <div key={item.area} style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.75rem", background: COLORS.bg }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.8rem", alignItems: "center" }}>
                  <div>
                    <strong style={{ color: COLORS.navy, fontSize: "0.92rem" }}>{L(item.area, item.area)}</strong>
                    <p style={{ margin: "0.25rem 0 0", color: COLORS.textMuted, fontSize: "0.8rem", lineHeight: 1.4 }}>{L(item.next, item.next)}</p>
                  </div>
                  <span style={{ flex: "0 0 auto", minWidth: "38px", textAlign: "center", borderRadius: "999px", padding: "0.25rem 0.55rem", background: item.signal === "Verde" ? "rgba(46,125,50,0.12)" : "rgba(201,162,39,0.18)", color: item.signal === "Verde" ? "#2E7D32" : "#8A6A00", fontWeight: 900 }}>{item.grade}</span>
                </div>
                <div style={{ height: "7px", background: "#E8ECF2", borderRadius: "999px", marginTop: "0.65rem", overflow: "hidden" }}>
                  <div style={{ width: `${item.progress}%`, height: "100%", background: item.signal === "Verde" ? "#2E7D32" : COLORS.gold }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <aside style={{ display: "grid", gap: "1rem" }}>
          <article style={{ background: "#102235", color: COLORS.white, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
            <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>
              {L("Bloqueantes comunes", "Common blockers")}
            </p>
            <ul style={{ margin: "0.75rem 0 0", paddingLeft: "1.05rem", color: "rgba(255,255,255,0.78)", fontSize: "0.84rem", lineHeight: 1.55 }}>
              {blockerItems.map((item) => <li key={item}>{L(item, item)}</li>)}
            </ul>
          </article>

          <article style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
            <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>
              {L("Siguiente accion recomendada", "Recommended next action")}
            </p>
            <h2 style={{ color: COLORS.navy, fontSize: "1rem", margin: "0.35rem 0" }}>{L("Cerrar faltantes amarillos", "Close yellow gaps")}</h2>
            <p style={{ margin: 0, color: COLORS.text, fontSize: "0.86rem", lineHeight: 1.5 }}>
              {L(
                "Prioriza financieros, poderes y fuente de repago antes de liberar el expediente a otorgantes.",
                "Prioritize financials, powers of attorney and repayment source before releasing the file to funders."
              )}
            </p>
          </article>
        </aside>
      </section>

      <section style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
        <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {L("Camino hasta decision", "Path to decision")}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))", gap: "0.75rem", marginTop: "0.85rem" }}>
          {financingSteps.map(([step, title, detail]) => (
            <div key={step} style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.85rem" }}>
              <span style={{ width: "30px", height: "30px", borderRadius: "50%", background: COLORS.gold, color: COLORS.navy, display: "grid", placeItems: "center", fontWeight: 900, marginBottom: "0.55rem" }}>{step}</span>
              <strong style={{ display: "block", color: COLORS.navy, fontSize: "0.9rem", marginBottom: "0.25rem" }}>{L(title, title)}</strong>
              <p style={{ margin: 0, color: COLORS.textMuted, fontSize: "0.82rem", lineHeight: 1.45 }}>{L(detail, detail)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
