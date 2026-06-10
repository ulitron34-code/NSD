import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { uiText, translateCopy } from "../../utils/runtimeCopy";

const qaGroups = [
  {
    title: "Mercado",
    items: [
      ["Quien paga?", "Entidades que revisan expedientes, solicitantes que necesitan prepararse y NSD IF por servicios profesionales asociados."],
      ["Por que es grande?", "Cada solicitud de credito, inversion o fondeo requiere documentos, revision, requisitos, evidencia y seguimiento. Ese trabajo hoy es lento y poco comparable."],
      ["Por que empezar en Mexico?", "Hay SOFOMES, fintechs, bancos, fondos y PyMEs con friccion documental; ademas permite validar producto con costos controlados antes de expandir."],
    ],
  },
  {
    title: "Producto",
    items: [
      ["Que hace distinto NSD?", "Une preparacion del solicitante, matriz documental, IA, data room, requerimientos, otorgantes y administracion en un flujo vertical."],
      ["Esto ya funciona?", "La demo local ya muestra landing, solicitante, otorgante, NSD Admin, vista de inversion, demo guiado, ronda, traccion y moat."],
      ["Que falta para producto comercial?", "Permisos robustos, pilotos reales, integraciones premium, optimizacion visual y endurecimiento de seguridad/operacion."],
    ],
  },
  {
    title: "IA y riesgo",
    items: [
      ["La IA aprueba creditos?", "No. La IA ayuda a preparar, revisar y explicar evidencia; la decision final permanece en el otorgante."],
      ["Como se evita riesgo reputacional?", "Con disclaimers, revision humana, trazabilidad, permisos, auditoria y separando scoring preliminar de decision crediticia."],
      ["Que hace el AI Compliance Engine?", "Detecta faltantes, inconsistencias, vencimientos, requisitos exigibles, riesgos y siguientes acciones."],
    ],
  },
  {
    title: "Negocio",
    items: [
      ["Como monetiza?", "SaaS B2B, fee por expediente, servicios NSD IF y modulos premium como OCR, biometria, KYB, antifraude e integraciones."],
      ["Como se consigue traccion?", "Pilotos con SOFOMES, fintechs, fondos, despachos financieros y empresas solicitantes usando expedientes reales controlados."],
      ["Que financia la ronda?", "Producto, IA/integraciones, pilotos, go-to-market y base legal/operativa para lanzar con menor riesgo."],
    ],
  },
];

const closingLines = [
  "NSD no compite por aprobar creditos; compite por hacer que los expedientes lleguen mejor preparados.",
  "La oportunidad esta en estandarizar un flujo que hoy vive entre correos, PDFs, hojas de calculo y revisiones manuales.",
  "El producto puede empezar con servicios profesionales y evolucionar hacia SaaS recurrente con datos operativos propios.",
];

export default function InvestorQATab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const copy = (val) => translateCopy(val, i18n.language);
  const [openKey, setOpenKey] = useState("Mercado-0");

  return (
    <div>
      <section style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "14px", padding: "1.6rem", marginBottom: "1.5rem", boxShadow: COLORS.shadowSm }}>
        <p style={{ color: COLORS.gold, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 900, fontSize: "0.75rem", marginBottom: "0.5rem" }}>
          {L("Q&A inversionista", "Investor Q&A")}
        </p>
        <h1 style={{ color: COLORS.navy, fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 4vw, 2.8rem)", lineHeight: 1.1, marginBottom: "0.75rem" }}>
          {L("Respuestas cortas para preguntas dificiles.", "Short answers for hard questions.")}
        </h1>
        <p style={{ color: COLORS.textMuted, maxWidth: "900px", lineHeight: 1.7 }}>
          {L("Esta vista ayuda a contestar sin improvisar durante la ronda: mercado, producto, IA, riesgo, monetizacion y traccion.", "This view helps answer without improvising during the round: market, product, AI, risk, monetization and traction.")}
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(260px, 0.7fr) minmax(0, 1.3fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        <aside style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 900, fontSize: "0.72rem", marginBottom: "0.75rem" }}>
            {L("Preguntas", "Questions")}
          </p>
          <div style={{ display: "grid", gap: "0.85rem" }}>
            {qaGroups.map((group) => (
              <div key={group.title}>
                <strong style={{ color: COLORS.gold, fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>{copy(group.title)}</strong>
                <div style={{ display: "grid", gap: "0.4rem", marginTop: "0.45rem" }}>
                  {group.items.map(([question], index) => {
                    const key = `${group.title}-${index}`;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setOpenKey(key)}
                        style={{
                          textAlign: "left",
                          padding: "0.65rem",
                          borderRadius: "8px",
                          border: openKey === key ? `1px solid ${COLORS.gold}` : `1px solid ${COLORS.border}`,
                          background: openKey === key ? "rgba(201,168,76,0.12)" : COLORS.bg,
                          color: COLORS.navy,
                          fontWeight: 800,
                          fontSize: "0.78rem",
                          cursor: "pointer",
                        }}
                      >
                        {copy(question)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <article style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.4rem", boxShadow: COLORS.shadowSm }}>
          {qaGroups.flatMap((group) => group.items.map((item, index) => ({ group: group.title, index, item })))
            .filter(({ group, index }) => `${group}-${index}` === openKey)
            .map(({ group, item }) => (
              <div key={`${group}-${item[0]}`}>
                <p style={{ color: COLORS.gold, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.72rem", fontWeight: 900, marginBottom: "0.55rem" }}>{copy(group)}</p>
                <h2 style={{ color: COLORS.navy, fontSize: "1.45rem", marginBottom: "0.9rem" }}>{copy(item[0])}</h2>
                <p style={{ color: COLORS.textMuted, fontSize: "1rem", lineHeight: 1.75, marginBottom: "1.2rem" }}>{copy(item[1])}</p>
                <div style={{ background: "rgba(15,31,46,0.04)", borderLeft: `4px solid ${COLORS.gold}`, borderRadius: "8px", padding: "1rem" }}>
                  <p style={{ color: COLORS.navy, fontWeight: 900, marginBottom: "0.3rem" }}>{L("Como decirlo", "How to say it")}</p>
                  <p style={{ color: COLORS.textMuted, fontSize: "0.86rem", lineHeight: 1.55 }}>
                    {L("Responder breve, regresar al flujo de producto y evitar prometer resultados crediticios.", "Answer briefly, return to the product workflow and avoid promising credit outcomes.")}
                  </p>
                </div>
              </div>
            ))}
        </article>
      </section>

      <section style={{ background: COLORS.navy, color: "white", borderRadius: "12px", padding: "1.4rem", boxShadow: "0 12px 28px rgba(15,31,46,0.22)" }}>
        <p style={{ color: COLORS.gold, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 900, fontSize: "0.72rem", marginBottom: "0.75rem" }}>
          {L("Frases de cierre", "Closing Lines")}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.8rem" }}>
          {closingLines.map((line) => (
            <p key={line} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "0.9rem", color: "rgba(255,255,255,0.82)", lineHeight: 1.55, fontSize: "0.86rem" }}>
              {copy(line)}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
