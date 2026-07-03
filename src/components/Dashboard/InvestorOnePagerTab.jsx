import { error, debug, info, warn } from '../../utils/logger';
import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { uiText, translateCopy } from "../../utils/runtimeCopy";

const memoBlocks = [
  ["Problema", "Solicitantes y entidades financieras pierden tiempo por expedientes incompletos, requisitos dispersos, baja comparabilidad documental y revisiones manuales."],
  ["Solucion", "NEXUS convierte solicitudes de financiamiento en expedientes institucionales con IA, data room, scoring, requerimientos y trazabilidad."],
  ["Producto", "Plataforma SaaS para solicitantes, otorgantes y NEXUS Admin: carga de proyecto, revision IA, data room, pipeline de oportunidades, mensajeria, requerimientos y auditoria."],
  ["Mercado inicial", "Mexico: PyMEs, startups, proyectos productivos, SOFOMES, fintechs, fondos, bancos y despachos financieros."],
  ["Modelo de negocio", "SaaS B2B, fee por expediente, servicios profesionales NEXUS y modulos premium como OCR, biometria, KYB, antifraude e integraciones."],
  ["Diferenciacion", "No es solo data room, KYC o consultoria. Es un flujo vertical que prepara al solicitante y reduce friccion para el otorgante."],
  ["Traccion buscada", "Pilotos con entidades y aliados, 50+ expedientes piloto, primera conversion a interes institucional y primer MRR demostrable."],
  ["Ask", "$250K - $500K pre-seed para producto, IA/integraciones, pilotos, go-to-market y base legal/operativa."],
];

const quickFacts = [
  ["Estado", "Demo local funcional"],
  ["Perfiles", "Solicitante / Otorgante / NEXUS Admin"],
  ["Mercado inicial", "Mexico"],
  ["Expansion", "USA despues de pilotos"],
  ["Riesgo clave", "Regulatorio / reputacional"],
  ["Mitigacion", "No aprobacion automatica, auditoria y revision humana"],
];

export default function InvestorOnePagerTab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const copy = (val) => translateCopy(val, i18n.language);

  return (
    <div>
      <section style={{
        background: "linear-gradient(135deg, #0F1F2E 0%, #1B3A5C 70%, #C9A84C 170%)",
        color: "white",
        borderRadius: "16px",
        padding: "1.8rem",
        marginBottom: "1.5rem",
        boxShadow: "0 14px 34px rgba(15,31,46,0.24)",
      }}>
        <p style={{ color: COLORS.gold, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 900, fontSize: "0.75rem", marginBottom: "0.55rem" }}>
          {L("One pager inversionista", "Investor One Pager")}
        </p>
        <h1 style={{ color: "white", fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 4vw, 2.9rem)", lineHeight: 1.05, marginBottom: "0.8rem" }}>
          {L("NEXUS Platform: infraestructura para preparar y revisar solicitudes financieras.", "NEXUS Platform: infrastructure to prepare and review financing requests.")}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.78)", maxWidth: "900px", lineHeight: 1.7 }}>
          {L("Una lectura ejecutiva para inversionistas: que problema resuelve, como monetiza, por que puede defenderse y que se financiaria.", "An executive read for investors: what problem it solves, how it monetizes, why it can be defended and what would be funded.")}
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(300px, 0.85fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", boxShadow: COLORS.shadowSm }}>
          <h2 style={{ color: COLORS.navy, fontSize: "1.2rem", marginBottom: "1rem" }}>{L("Memo ejecutivo", "Executive Memo")}</h2>
          <div style={{ display: "grid", gap: "0.7rem" }}>
            {memoBlocks.map(([title, detail]) => (
              <div key={title} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.9rem" }}>
                <p style={{ color: COLORS.gold, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 900, marginBottom: "0.25rem" }}>{copy(title)}</p>
                <p style={{ color: COLORS.navy, fontSize: "0.88rem", lineHeight: 1.55, fontWeight: 700 }}>{copy(detail)}</p>
              </div>
            ))}
          </div>
        </div>

        <aside style={{ display: "grid", gap: "1rem" }}>
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", boxShadow: COLORS.shadowSm }}>
            <h2 style={{ color: COLORS.navy, fontSize: "1.15rem", marginBottom: "1rem" }}>{L("Datos rapidos", "Quick Facts")}</h2>
            {quickFacts.map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", padding: "0.65rem 0", borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ color: COLORS.textMuted, fontSize: "0.78rem", fontWeight: 800 }}>{copy(label)}</span>
                <strong style={{ color: COLORS.navy, fontSize: "0.78rem", textAlign: "right" }}>{copy(value)}</strong>
              </div>
            ))}
          </div>

          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", boxShadow: COLORS.shadowSm }}>
            <h2 style={{ color: COLORS.navy, fontSize: "1.15rem", marginBottom: "0.75rem" }}>{L("Frase de 20 segundos", "20-second pitch")}</h2>
            <p style={{ color: COLORS.textMuted, fontSize: "0.9rem", lineHeight: 1.65 }}>
              {L("NEXUS ayuda a empresas y proyectos a preparar expedientes financieros con IA, data room y trazabilidad, para que bancos, SOFOMES, fintechs y fondos revisen oportunidades con menos friccion y mejor evidencia.", "NEXUS helps companies and projects prepare financing files with AI, data room and traceability, so banks, lenders, fintechs and funds can review opportunities with less friction and better evidence.")}
            </p>
          </div>

          <div style={{ background: "rgba(201,168,76,0.12)", border: `1px solid rgba(201,168,76,0.35)`, borderRadius: "10px", padding: "1.25rem" }}>
            <h2 style={{ color: COLORS.navy, fontSize: "1.15rem", marginBottom: "0.75rem" }}>{L("Uso inmediato", "Immediate Use")}</h2>
            <p style={{ color: COLORS.textMuted, fontSize: "0.86rem", lineHeight: 1.55 }}>
              {L("Usar esta pantalla como resumen antes o despues de la demo. Si el inversionista pide contexto rapido, esta es la vista para abrir.", "Use this screen as a summary before or after the demo. If the investor asks for quick context, this is the screen to open.")}
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
