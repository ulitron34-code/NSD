import { error, debug, info, warn } from '../../../utils/logger';
import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../../utils/constants";
import { uiText, translateCopy } from "../../../utils/runtimeCopy";

const memoSections = [
  {
    title: "Resumen del expediente",
    status: "Listo para pre-comite",
    items: [
      "Solicitante con expediente corporativo, financiero y documental en revision.",
      "Score preliminar B+ con faltantes no bloqueantes y alertas mitigables.",
      "Uso de recursos declarado y trazabilidad documental suficiente para revision inicial.",
    ],
  },
  {
    title: "Riesgos observados",
    status: "Requiere validacion",
    items: [
      "Actualizar estados financieros y soporte de ingresos recurrentes.",
      "Confirmar beneficiario controlador y estructura corporativa vigente.",
      "Solicitar evidencia adicional sobre contratos clave y fuente de repago.",
    ],
  },
  {
    title: "Condiciones sugeridas",
    status: "Para term sheet",
    items: [
      "Liberacion condicionada a cierre de faltantes documentales.",
      "Seguimiento mensual de covenant financiero y documentacion fiscal.",
      "Data room abierto al comite hasta cierre de decision.",
    ],
  },
];

const decisionChecklist = [
  ["KYC/KYB", "Completo con observaciones menores", "Verde"],
  ["Documentos corporativos", "Acta, poderes y RFC revisados", "Verde"],
  ["Financieros", "Requiere actualizacion mensual", "Amarillo"],
  ["Riesgo antifraude", "Sin red flags criticas en demo", "Verde"],
  ["Garantias / soporte", "Pendiente confirmar estructura", "Amarillo"],
];

export default function CommitteeMemoTab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const copy = (val) => translateCopy(val, i18n.language);

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <section style={{
        background: "linear-gradient(135deg, #0F1F2E 0%, #1B3A5C 72%, #C9A227 145%)",
        color: COLORS.white,
        borderRadius: "16px",
        padding: "1.6rem",
        boxShadow: COLORS.shadowMd,
      }}>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.72)", fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {L("Memo para comite", "Committee memo")}
        </p>
        <h1 style={{ margin: "0.35rem 0", color: COLORS.white, fontSize: "1.6rem" }}>
          {L("Decision institucional asistida", "Assisted institutional decision")}
        </h1>
        <p style={{ maxWidth: "820px", margin: 0, color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>
          {L(
            "Esta vista convierte el expediente en una lectura ejecutiva para otorgantes: que se reviso, que falta, que riesgos existen y que condiciones podrian llevarse a comite.",
            "This view converts the file into an executive read for funders: what was reviewed, what is missing, which risks exist and which conditions could move to committee."
          )}
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.85rem" }}>
        {memoSections.map((section) => (
          <article key={section.title} style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
            <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>{copy(section.status)}</p>
            <h2 style={{ margin: "0.3rem 0 0.75rem", color: COLORS.navy, fontSize: "1.05rem" }}>{copy(section.title)}</h2>
            <ul style={{ margin: 0, paddingLeft: "1.1rem", color: COLORS.text, fontSize: "0.86rem", lineHeight: 1.55 }}>
              {section.items.map((item) => <li key={item}>{copy(item)}</li>)}
            </ul>
          </article>
        ))}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: "1rem" }}>
        <article style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm, overflowX: "auto" }}>
          <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {L("Checklist de decision", "Decision checklist")}
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0.85rem", minWidth: "620px" }}>
            <thead>
              <tr style={{ background: COLORS.navy, color: COLORS.white }}>
                {[L("Area", "Area"), L("Lectura", "Readout"), L("Semaforo", "Signal")].map((head) => (
                  <th key={head} style={{ textAlign: "left", padding: "0.7rem", fontSize: "0.78rem" }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {decisionChecklist.map(([area, readout, signal]) => (
                <tr key={area} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: "0.7rem", color: COLORS.navy, fontWeight: 800, fontSize: "0.86rem" }}>{copy(area)}</td>
                  <td style={{ padding: "0.7rem", color: COLORS.text, fontSize: "0.86rem" }}>{copy(readout)}</td>
                  <td style={{ padding: "0.7rem" }}>
                    <span style={{
                      display: "inline-flex",
                      borderRadius: "999px",
                      padding: "0.22rem 0.55rem",
                      background: signal === "Verde" ? "rgba(46,125,50,0.12)" : "rgba(201,162,39,0.18)",
                      color: signal === "Verde" ? "#2E7D32" : "#8A6A00",
                      fontWeight: 900,
                      fontSize: "0.76rem",
                    }}>
                      {L(signal, signal === "Verde" ? "Green" : "Yellow")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <aside style={{ background: "#102235", color: COLORS.white, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>
            {L("Recomendacion", "Recommendation")}
          </p>
          <h2 style={{ color: COLORS.white, fontSize: "1.05rem", margin: "0.35rem 0" }}>
            {L("Continuar a revision condicionada", "Continue to conditional review")}
          </h2>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.76)", fontSize: "0.86rem", lineHeight: 1.55 }}>
            {L(
              "El expediente puede avanzar a conversacion con el solicitante si se cierran los faltantes amarillos y se confirma la fuente de repago. NEXUS no aprueba credito; organiza evidencia para la decision del otorgante.",
              "The file may move to applicant conversation if yellow gaps are closed and repayment source is confirmed. NEXUS does not approve credit; it organizes evidence for the funder's decision."
            )}
          </p>
        </aside>
      </section>
    </div>
  );
}
