import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { uiText, translateCopy } from "../../utils/runtimeCopy";

const events = [
  ["09:12", "Solicitante", "Cargo estados financieros 2025", "Documento", "Registrado"],
  ["09:18", "IA NSD", "Detecto faltante de flujo proyectado", "Revision", "Atencion"],
  ["09:24", "NSD Analyst", "Marco expediente como B+ preliminar", "Scoring", "Registrado"],
  ["09:31", "Otorgante", "Abrio data room compartido", "Acceso", "Registrado"],
  ["09:36", "Otorgante", "Solicito soporte de fuente de repago", "Requerimiento", "Pendiente"],
  ["09:42", "NSD Admin", "Genero memo para comite", "Comite", "Registrado"],
];

const controls = [
  ["Auditoria", "Eventos clave con usuario, hora, tipo y resultado."],
  ["Evidencia", "Cada accion relevante debe apuntar a documento, expediente o requerimiento."],
  ["Permisos", "Las vistas dependen del rol: solicitante, otorgante, NSD Admin."],
  ["Privacidad", "Biometricos y datos sensibles requieren consentimiento y proveedor especializado."],
];

export default function TraceabilityLogTab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const copy = (val) => translateCopy(val, i18n.language);

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <section style={{
        background: "linear-gradient(135deg, #0F1F2E 0%, #1B3A5C 72%, #C9A227 140%)",
        color: COLORS.white,
        borderRadius: "16px",
        padding: "1.55rem",
        boxShadow: COLORS.shadowMd,
      }}>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.72)", fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {L("Trazabilidad y auditoria", "Traceability and audit")}
        </p>
        <h1 style={{ margin: "0.35rem 0", color: COLORS.white, fontSize: "1.55rem" }}>
          {L("Bitacora institucional del expediente", "Institutional file activity log")}
        </h1>
        <p style={{ margin: 0, maxWidth: "820px", color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>
          {L(
            "La plataforma debe poder explicar que ocurrio, quien lo hizo, sobre que expediente y con que resultado. Esta vista muestra la capa de control que se formalizara con Supabase/auditoria.",
            "The platform must explain what happened, who did it, which file it affected and with what result. This view shows the control layer to be formalized with Supabase/audit."
          )}
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.75rem" }}>
        {controls.map(([title, detail]) => (
          <article key={title} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
            <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>{copy(title)}</p>
            <p style={{ margin: "0.35rem 0 0", color: COLORS.text, fontSize: "0.86rem", lineHeight: 1.5 }}>{copy(detail)}</p>
          </article>
        ))}
      </section>

      <section style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "760px" }}>
          <thead>
            <tr style={{ background: COLORS.navy, color: COLORS.white }}>
              {[L("Hora", "Time"), L("Actor", "Actor"), L("Evento", "Event"), L("Tipo", "Type"), L("Estado", "Status")].map((head) => (
                <th key={head} style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.78rem" }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map(([time, actor, event, type, status]) => (
              <tr key={`${time}-${event}`} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: "0.72rem", color: COLORS.gold, fontWeight: 900 }}>{time}</td>
                <td style={{ padding: "0.72rem", color: COLORS.navy, fontWeight: 900 }}>{copy(actor)}</td>
                <td style={{ padding: "0.72rem", color: COLORS.text, fontSize: "0.86rem" }}>{copy(event)}</td>
                <td style={{ padding: "0.72rem", color: COLORS.textMuted, fontSize: "0.84rem" }}>{copy(type)}</td>
                <td style={{ padding: "0.72rem" }}>
                  <span style={{
                    display: "inline-flex",
                    borderRadius: "999px",
                    padding: "0.22rem 0.55rem",
                    background: status === "Pendiente" || status === "Atencion" ? "rgba(201,162,39,0.18)" : "rgba(46,125,50,0.12)",
                    color: status === "Pendiente" || status === "Atencion" ? "#8A6A00" : "#2E7D32",
                    fontWeight: 900,
                    fontSize: "0.75rem",
                  }}>
                    {copy(status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
