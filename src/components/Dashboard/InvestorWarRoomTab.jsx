import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { translateCopy, uiText } from "../../utils/runtimeCopy";

const tractionSignals = [
  ["Producto", "Demo funcional con tres perfiles, data room, scoring A-E, otorgantes, solicitantes y admin.", "Fuerte"],
  ["Mercado", "Dolor claro: expedientes incompletos, revision lenta, friccion entre solicitantes y otorgantes.", "Fuerte"],
  ["Monetizacion", "Fee por expediente, servicios profesionales, SaaS B2B y modulos premium.", "Validar"],
  ["Defensibilidad", "Flujo vertical, matriz documental, auditoria, scoring y data room especializado.", "Media"],
  ["Riesgo", "Regulatorio, datos sensibles, biometria futura y dependencia de integraciones.", "Controlar"],
];

const investorNarrative = [
  ["1. Dolor", "El financiamiento se retrasa porque solicitantes llegan con documentos incompletos y otorgantes pierden tiempo revisando casos no comparables."],
  ["2. Producto", "NSD estructura el expediente, revisa faltantes con IA, ordena data room, genera scoring y permite trazabilidad de requerimientos."],
  ["3. Comprador", "Otorgantes, asesores financieros, SOFOMES, fintechs, fondos y empresas que preparan solicitudes de credito o capital."],
  ["4. Modelo", "SaaS + fee por expediente + servicios profesionales + integraciones premium de verificacion, OCR, KYB y biometria."],
  ["5. Proxima meta", "Piloto con entidades financieras, 50 expedientes controlados, conversion a interes institucional y evidencia de ahorro de tiempo."],
];

const evidenceChecklist = [
  ["Demo end-to-end", "Mostrar solicitante, otorgante y admin sin cambiar de producto.", true],
  ["Caso de uso claro", "Subir proyecto, revisar con IA, liberar data room y generar decision 360.", true],
  ["Riesgos mitigados", "Aclarar que NSD no aprueba credito; organiza evidencia y reduce friccion.", true],
  ["Pricing final", "Definir paquete piloto y precio por expediente antes de hablar con clientes.", false],
  ["Metrica dura", "Medir dias ahorrados, faltantes detectados y conversion a revision interna.", false],
  ["Aliado piloto", "Conseguir carta de interes o prueba con entidad/asesor.", false],
];

const meetingFlow = [
  ["00:00", "Contexto", "Explicar el problema y por que los expedientes financieros fallan antes de llegar a comite."],
  ["01:30", "Solicitante", "Mostrar preparacion, carga de proyecto, data room y como lo vera un otorgante."],
  ["04:00", "Otorgante", "Mostrar pipeline, Sala de decision 360, inteligencia/riesgo y memo de comite."],
  ["07:00", "Admin", "Mostrar one pager, traccion, due diligence, roadmap, auditoria y go/no-go."],
  ["09:00", "Cierre", "Pedir piloto, inversion o introducciones a entidades financieras."],
];

export default function InvestorWarRoomTab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const copy = (value) => translateCopy(value, i18n.language);
  const completed = evidenceChecklist.filter(([, , done]) => done).length;
  const total = evidenceChecklist.length;

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <section style={{
        background: "linear-gradient(135deg, #0F1F2E 0%, #1B3A5C 62%, #C9A84C 150%)",
        color: COLORS.white,
        borderRadius: "16px",
        padding: "1.6rem",
        boxShadow: COLORS.shadowMd,
      }}>
        <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          {L("Ronda de inversion / War Room", "Fundraising / War Room")}
        </p>
        <h1 style={{ margin: "0.35rem 0", color: COLORS.white, fontSize: "1.7rem" }}>
          {L("Tablero para defender NSD como startup SaaS", "Board to defend NSD as a SaaS startup")}
        </h1>
        <p style={{ margin: 0, maxWidth: "900px", color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>
          {L(
            "Resume la narrativa, evidencia, riesgos y siguiente conversacion comercial para inversionistas o aliados piloto.",
            "Summarizes the narrative, evidence, risks and next commercial conversation for investors or pilot partners."
          )}
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.75rem" }}>
        {[
          [L("Evidencia lista", "Evidence ready"), `${completed}/${total}`, L("bloques defendibles", "defensible blocks")],
          [L("Demo", "Demo"), L("10 min", "10 min"), L("flujo recomendado", "recommended flow")],
          [L("Objetivo", "Goal"), L("Piloto pagado", "Paid pilot"), L("antes de escalar", "before scaling")],
          [L("Narrativa", "Narrative"), L("SaaS vertical", "Vertical SaaS"), L("compliance + financiamiento", "compliance + financing")],
        ].map(([label, value, note]) => (
          <article key={label} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
            <p style={{ margin: 0, color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>{label}</p>
            <strong style={{ display: "block", color: COLORS.navy, fontSize: "1.45rem", marginTop: "0.25rem" }}>{value}</strong>
            <span style={{ color: COLORS.gold, fontWeight: 900, fontSize: "0.8rem" }}>{note}</span>
          </article>
        ))}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(300px, 0.9fr)", gap: "1rem" }}>
        <article style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {L("Narrativa para inversionista", "Investor narrative")}
          </p>
          <div style={{ display: "grid", gap: "0.65rem", marginTop: "0.85rem" }}>
            {investorNarrative.map(([title, detail]) => (
              <div key={title} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "0.8rem", padding: "0.75rem", borderRadius: "8px", background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                <strong style={{ color: COLORS.navy, fontSize: "0.82rem" }}>{copy(title)}</strong>
                <p style={{ margin: 0, color: COLORS.textMuted, fontSize: "0.82rem", lineHeight: 1.5 }}>{copy(detail)}</p>
              </div>
            ))}
          </div>
        </article>

        <aside style={{ background: "#102235", color: COLORS.white, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>
            {L("Flujo de demo", "Demo flow")}
          </p>
          <div style={{ display: "grid", gap: "0.65rem", marginTop: "0.85rem" }}>
            {meetingFlow.map(([time, title, detail]) => (
              <div key={time} style={{ display: "grid", gridTemplateColumns: "54px 1fr", gap: "0.7rem" }}>
                <span style={{ color: COLORS.gold, fontWeight: 900, fontSize: "0.78rem" }}>{time}</span>
                <span>
                  <strong style={{ display: "block", color: "white", fontSize: "0.84rem" }}>{copy(title)}</strong>
                  <span style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.76rem", lineHeight: 1.4 }}>{copy(detail)}</span>
                </span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "1rem" }}>
        <article style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {L("Senales de traccion", "Traction signals")}
          </p>
          <div style={{ display: "grid", gap: "0.65rem", marginTop: "0.85rem" }}>
            {tractionSignals.map(([label, detail, status]) => (
              <div key={label} style={{ padding: "0.75rem", borderRadius: "8px", background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center", marginBottom: "0.25rem" }}>
                  <strong style={{ color: COLORS.navy, fontSize: "0.84rem" }}>{copy(label)}</strong>
                  <span style={{ color: status === "Fuerte" ? COLORS.green : status === "Controlar" ? "#C62828" : COLORS.amber, fontWeight: 900, fontSize: "0.74rem" }}>{copy(status)}</span>
                </div>
                <p style={{ margin: 0, color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45 }}>{copy(detail)}</p>
              </div>
            ))}
          </div>
        </article>

        <article style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {L("Evidencia para cerrar antes de ronda", "Evidence to close before fundraising")}
          </p>
          <div style={{ display: "grid", gap: "0.65rem", marginTop: "0.85rem" }}>
            {evidenceChecklist.map(([label, detail, done]) => (
              <div key={label} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: "0.65rem", padding: "0.75rem", borderRadius: "8px", background: done ? "rgba(46,125,50,0.07)" : COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: done ? COLORS.green : COLORS.textMuted, color: "white", display: "grid", placeItems: "center", fontSize: "0.68rem", fontWeight: 900 }}>
                  {done ? "OK" : "!"}
                </span>
                <span>
                  <strong style={{ display: "block", color: COLORS.navy, fontSize: "0.82rem" }}>{copy(label)}</strong>
                  <span style={{ color: COLORS.textMuted, fontSize: "0.76rem", lineHeight: 1.4 }}>{copy(detail)}</span>
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
