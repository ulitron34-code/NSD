import { error, debug, info, warn } from '../../../utils/logger';
import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../../utils/constants";
import { uiText } from "../../../utils/runtimeCopy";

export default function FundingReadinessTab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);

  const readinessAreas = [
    {
      area: L("Identidad y KYB", "Identity & KYB"),
      grade: "A",
      signal: "Verde",
      progress: 92,
      next: L("Mantener poderes, RFC y beneficiario controlador actualizados.", "Keep powers of attorney, tax ID and ultimate beneficial owner updated."),
    },
    {
      area: L("Corporativo legal", "Corporate Legal"),
      grade: "B",
      signal: "Amarillo",
      progress: 78,
      next: L("Actualizar acta, organigrama y autorizaciones para financiamiento.", "Update bylaws, org chart and financing authorizations."),
    },
    {
      area: L("Financiero", "Financial"),
      grade: "B",
      signal: "Amarillo",
      progress: 74,
      next: L("Subir estados financieros recientes, flujo proyectado y soporte de ingresos.", "Upload recent financial statements, projected cash flow and revenue support."),
    },
    {
      area: L("Proyecto / uso de recursos", "Project / Use of Funds"),
      grade: "A",
      signal: "Verde",
      progress: 88,
      next: L("Agregar hitos, presupuesto y evidencia de avance operativo.", "Add milestones, budget and operational progress evidence."),
    },
    {
      area: L("Antifraude y cumplimiento", "Anti-Fraud & Compliance"),
      grade: "B",
      signal: "Amarillo",
      progress: 81,
      next: L("Completar declaraciones, listas internas y validaciones pendientes.", "Complete pending declarations, internal screening lists and validations."),
    },
  ];

  const financingSteps = [
    ["1", L("Preparar expediente", "Prepare File"), L("Completar documentos base y datos del proyecto.", "Complete base documents and project details.")],
    ["2", L("Revision IA / NEXUS", "AI / NEXUS Review"), L("Detectar faltantes, score, riesgos y memo ejecutivo.", "Detect gaps, score, risks and executive memo.")],
    ["3", L("Liberar data room", "Release Data Room"), L("Compartir expediente con otorgantes compatibles.", "Share file with compatible funding providers.")],
    ["4", L("Atender requerimientos", "Address Requests"), L("Responder solicitudes y sustituir documentos vencidos.", "Respond to requests and replace expired documents.")],
    ["5", L("Comite / term sheet", "Committee / Term Sheet"), L("Llegar con evidencia ordenada para decision del otorgante.", "Arrive with organized evidence for funding provider decision.")],
  ];

  const blockerItems = [
    L("Estados financieros con fecha mayor a 90 dias.", "Financial statements dated older than 90 days."),
    L("Poderes o actas sin version final digitalizada.", "Powers of attorney or bylaws without digitalized final version."),
    L("Uso de recursos sin presupuesto verificable.", "Use of funds without verifiable budget."),
    L("Contratos clave sin vigencia o firma completa.", "Key contracts without validity or complete signatures."),
    L("Beneficiario controlador pendiente de confirmacion.", "Ultimate beneficial owner pending confirmation."),
  ];

  const statCards = [
    [L("Score estimado", "Estimated Score"), "82", "B+"],
    [L("Faltantes criticos", "Critical Gaps"), "2", L("por atender", "to address")],
    [L("Dias ahorrados", "Days Saved"), "12", L("estimados", "estimated")],
    [L("Otorgantes compatibles", "Compatible Funders"), "7", L("potenciales", "potential")],
  ];

  const funderView = [
    [
      L("Claridad del uso de fondos", "Use-of-funds clarity"),
      L("Fuerte", "Strong"),
      L("El proyecto explica monto, destino, hitos y presupuesto base.", "The project explains amount, destination, milestones and base budget."),
      L("Agregar evidencia de cotizaciones, contratos o avance operativo.", "Add evidence of quotes, contracts or operational progress."),
    ],
    [
      L("Capacidad de repago", "Repayment capacity"),
      L("Revisable", "Reviewable"),
      L("Hay informacion financiera, pero faltan supuestos y sensibilidad.", "There is financial information, but assumptions and sensitivity are missing."),
      L("Subir flujo proyectado, supuestos y fuente primaria de pago.", "Upload projected cash flow, assumptions and primary repayment source."),
    ],
    [
      L("Cumplimiento y antifraude", "Compliance and anti-fraud"),
      L("Condicionado", "Conditional"),
      L("KYB esta avanzado, pero hay validaciones y declaraciones pendientes.", "KYB is advanced, but validations and declarations are pending."),
      L("Completar beneficiario controlador, listas y autorizaciones.", "Complete UBO, screenings and authorizations."),
    ],
  ];

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
            "NEXUS organiza documentos, revisa faltantes, prioriza riesgos y prepara una lectura institucional para que el solicitante llegue mejor armado a una entidad financiera.",
            "NEXUS organizes documents, reviews gaps, prioritizes risks and prepares an institutional readout so the applicant reaches a financial institution better prepared."
          )}
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "0.75rem" }}>
        {statCards.map(([label, value, suffix]) => (
          <article key={label} style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
            <p style={{ margin: 0, color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.45rem", marginTop: "0.35rem" }}>
              <strong style={{ color: COLORS.navy, fontSize: "1.75rem" }}>{value}</strong>
              <span style={{ color: COLORS.gold, fontWeight: 900, fontSize: "0.85rem" }}>{suffix}</span>
            </div>
          </article>
        ))}
      </section>

      <section style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "0.9rem" }}>
          <div>
            <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {L("Como te ve un otorgante", "How a funder sees you")}
            </p>
            <h2 style={{ color: COLORS.navy, fontSize: "1.08rem", margin: "0.35rem 0 0" }}>
              {L("Lectura institucional antes de liberar el data room", "Institutional readout before releasing the data room")}
            </h2>
          </div>
          <span style={{ padding: "0.45rem 0.65rem", borderRadius: "999px", background: "rgba(201,168,76,0.14)", color: COLORS.navy, fontWeight: 900, fontSize: "0.78rem" }}>
            {L("Listo condicionado", "Conditionally ready")}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem" }}>
          {funderView.map(([label, status, detail, action]) => (
            <article key={label} style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.9rem", background: COLORS.bg }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center", marginBottom: "0.45rem" }}>
                <strong style={{ color: COLORS.navy, fontSize: "0.88rem" }}>{label}</strong>
                <span style={{ color: status === L("Fuerte", "Strong") ? COLORS.green : COLORS.amber, fontWeight: 900, fontSize: "0.76rem" }}>{status}</span>
              </div>
              <p style={{ margin: 0, color: COLORS.textMuted, fontSize: "0.8rem", lineHeight: 1.45 }}>{detail}</p>
              <p style={{ margin: "0.55rem 0 0", color: COLORS.navy, fontSize: "0.78rem", lineHeight: 1.4, fontWeight: 800 }}>{action}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(280px, 0.85fr)", gap: "1rem" }}>
        <article style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {L("Matriz de preparacion", "Readiness matrix")}
          </p>
          <div style={{ display: "grid", gap: "0.7rem", marginTop: "0.85rem" }}>
            {readinessAreas.map((item, idx) => (
              <div key={idx} style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.75rem", background: COLORS.bg }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.8rem", alignItems: "center" }}>
                  <div>
                    <strong style={{ color: COLORS.navy, fontSize: "0.92rem" }}>{item.area}</strong>
                    <p style={{ margin: "0.25rem 0 0", color: COLORS.textMuted, fontSize: "0.8rem", lineHeight: 1.4 }}>{item.next}</p>
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
              {blockerItems.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          </article>

          <article style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
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

      <section style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
        <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {L("Camino hasta decision", "Path to decision")}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))", gap: "0.75rem", marginTop: "0.85rem" }}>
          {financingSteps.map(([step, title, detail]) => (
            <div key={step} style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.85rem" }}>
              <span style={{ width: "30px", height: "30px", borderRadius: "50%", background: COLORS.gold, color: COLORS.navy, display: "grid", placeItems: "center", fontWeight: 900, marginBottom: "0.55rem" }}>{step}</span>
              <strong style={{ display: "block", color: COLORS.navy, fontSize: "0.9rem", marginBottom: "0.25rem" }}>{title}</strong>
              <p style={{ margin: 0, color: COLORS.textMuted, fontSize: "0.82rem", lineHeight: 1.45 }}>{detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
