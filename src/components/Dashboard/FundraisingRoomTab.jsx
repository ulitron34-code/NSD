import { error, debug, info, warn } from '../../utils/logger';
import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { uiText, translateCopy } from "../../utils/runtimeCopy";

const useOfFunds = [
  ["Producto", "35%", "Cerrar flujos solicitante-otorgante, permisos, auditoria, data room y demo guiado."],
  ["IA / Integraciones", "25%", "OCR, KYB, biometria, antifraude, proveedores externos y scoring explicable."],
  ["Pilotos", "20%", "Pilotos con SOFOMES, fintechs, fondos, empresas solicitantes y aliados de servicios."],
  ["Go-to-market", "15%", "Ventas B2B, contenido, alianzas, demo institucional y materiales de inversion."],
  ["Legal / Operacion", "5%", "Contratos, privacidad, compliance, terminos, seguros y gobierno corporativo."],
];

const milestones = [
  ["0-90 dias", "Piloto cerrado", "3 entidades, 20 expedientes, flujo solicitante-otorgante completo y data room funcional."],
  ["90-180 dias", "MVP comercial", "Primeros ingresos por expedientes y servicios NEXUS; 2 modulos premium validados."],
  ["180-365 dias", "Traccion SaaS", "MRR inicial, repeticion por entidad, dashboard de administracion y auditoria robusta."],
  ["12-18 meses", "Expansion controlada", "Mexico consolidado, primeros casos USA y partners de integracion."],
];

const dataRoomItems = [
  ["Pitch deck", "Pendiente final", "Narrativa, mercado, producto, modelo, equipo, ask y uso de fondos."],
  ["Demo producto", "Listo local", "Landing, dashboard, solicitante, otorgante, NEXUS Admin y demo 10 min."],
  ["Modelo financiero", "Por preparar", "MRR, fee por expediente, servicios, CAC, margen, escenarios y runway."],
  ["Pilotos", "Por cerrar", "Cartas de interes, aliados, casos piloto y entidades objetivo."],
  ["Legal", "Base operativa", "Terminos, privacidad, consentimiento, disclaimers y revision legal pendiente."],
];

const riskPlan = [
  ["Riesgo regulatorio", "No prometer aprobacion crediticia; operar como preparacion, evidencia y trazabilidad."],
  ["Riesgo IA", "Mantener revision humana, explicabilidad, auditoria y disclaimers visibles."],
  ["Riesgo go-to-market", "Iniciar con pilotos acotados y servicios profesionales para aprender antes de escalar."],
  ["Riesgo tecnico", "Priorizar permisos, seguridad, respaldos, trazabilidad y observabilidad antes de abrir masivo."],
];

export default function FundraisingRoomTab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const copy = (val) => translateCopy(val, i18n.language);

  return (
    <div>
      <section style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "14px",
        padding: "1.6rem",
        marginBottom: "1.5rem",
        boxShadow: COLORS.shadowSm,
      }}>
        <p style={{ color: COLORS.gold, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 900, fontSize: "0.75rem", marginBottom: "0.5rem" }}>
          {L("Ronda / Data room de inversion", "Round / Investor Data Room")}
        </p>
        <h1 style={{ color: COLORS.navy, fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 4vw, 2.8rem)", lineHeight: 1.1, marginBottom: "0.75rem" }}>
          {L("Una pagina para contestar: cuanto, para que y que se logra.", "One page to answer: how much, for what and what gets achieved.")}
        </h1>
        <p style={{ color: COLORS.textMuted, maxWidth: "900px", lineHeight: 1.7 }}>
          {L("Esta vista organiza la conversacion de inversion: uso de fondos, hitos, evidencias del data room, riesgos y proximos activos que deben prepararse para levantar capital.", "This view structures the fundraising conversation: use of funds, milestones, data room evidence, risks and the next assets required to raise capital.")}
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          ["Ask sugerido", "$250K - $500K", "Pre-seed para producto, pilotos e integraciones."],
          ["Runway objetivo", "12-18 meses", "Tiempo para validar pilots, ingresos y producto SaaS."],
          ["Primer mercado", "Mexico", "SOFOMES, fintechs, fondos, bancos y solicitantes empresariales."],
          ["Expansion", "USA despues", "Solo con pilotos, legal y costos de integracion validados."],
        ].map(([label, value, detail]) => (
          <article key={label} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.15rem", boxShadow: COLORS.shadowSm }}>
            <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 900, marginBottom: "0.35rem" }}>{copy(label)}</p>
            <p style={{ color: COLORS.navy, fontSize: "1.55rem", fontWeight: 900, marginBottom: "0.35rem" }}>{copy(value)}</p>
            <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45 }}>{copy(detail)}</p>
          </article>
        ))}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 0.9fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", boxShadow: COLORS.shadowSm }}>
          <h2 style={{ color: COLORS.navy, fontSize: "1.18rem", marginBottom: "1rem" }}>{L("Uso de fondos", "Use of Funds")}</h2>
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {useOfFunds.map(([label, pct, detail]) => (
              <div key={label} style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: "0.8rem", alignItems: "center", padding: "0.85rem", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px" }}>
                <strong style={{ color: COLORS.gold, fontSize: "1.2rem" }}>{pct}</strong>
                <span>
                  <strong style={{ color: COLORS.navy, display: "block", fontSize: "0.88rem" }}>{copy(label)}</strong>
                  <span style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45 }}>{copy(detail)}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", boxShadow: COLORS.shadowSm }}>
          <h2 style={{ color: COLORS.navy, fontSize: "1.18rem", marginBottom: "1rem" }}>{L("Hitos financiables", "Fundable Milestones")}</h2>
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {milestones.map(([time, title, detail]) => (
              <div key={time} style={{ padding: "0.85rem", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px" }}>
                <p style={{ color: COLORS.gold, fontWeight: 900, fontSize: "0.75rem", marginBottom: "0.2rem" }}>{copy(time)}</p>
                <strong style={{ color: COLORS.navy, display: "block", fontSize: "0.88rem" }}>{copy(title)}</strong>
                <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45, marginTop: "0.2rem" }}>{copy(detail)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", boxShadow: COLORS.shadowSm }}>
          <h2 style={{ color: COLORS.navy, fontSize: "1.15rem", marginBottom: "1rem" }}>{L("Data room de inversion", "Investor Data Room")}</h2>
          {dataRoomItems.map(([item, status, detail]) => (
            <div key={item} style={{ borderBottom: `1px solid ${COLORS.border}`, padding: "0.75rem 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                <strong style={{ color: COLORS.navy, fontSize: "0.84rem" }}>{copy(item)}</strong>
                <span style={{ color: status.includes("Listo") ? COLORS.green : COLORS.amber, fontSize: "0.72rem", fontWeight: 900 }}>{copy(status)}</span>
              </div>
              <p style={{ color: COLORS.textMuted, fontSize: "0.76rem", lineHeight: 1.45, marginTop: "0.25rem" }}>{copy(detail)}</p>
            </div>
          ))}
        </div>

        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", boxShadow: COLORS.shadowSm }}>
          <h2 style={{ color: COLORS.navy, fontSize: "1.15rem", marginBottom: "1rem" }}>{L("Riesgos y mitigacion", "Risks and Mitigation")}</h2>
          {riskPlan.map(([risk, mitigation]) => (
            <div key={risk} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.85rem", marginBottom: "0.65rem" }}>
              <strong style={{ color: COLORS.navy, fontSize: "0.84rem" }}>{copy(risk)}</strong>
              <p style={{ color: COLORS.textMuted, fontSize: "0.76rem", lineHeight: 1.45, marginTop: "0.25rem" }}>{copy(mitigation)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
