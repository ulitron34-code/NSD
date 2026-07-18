import { error as logError } from '../../utils/logger';
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { uiText, translateCopy } from "../../utils/runtimeCopy";
import { adminAPI } from "../../services/api";
import { BRAND } from "../../config/brand";

const controls = [
  ["Auditoria", "Eventos clave con usuario, hora, tipo y resultado."],
  ["Evidencia", "Cada accion relevante debe apuntar a documento, expediente o requerimiento."],
  ["Permisos", `Las vistas dependen del rol: solicitante, otorgante, ${BRAND.name} Admin.`],
  ["Privacidad", "Biometricos y datos sensibles requieren consentimiento y proveedor especializado."],
];

const PAGE_SIZE = 50;

export default function TraceabilityLogTab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const copy = (val) => translateCopy(val, i18n.language);

  const translatedControls = controls.map(([title, detail]) => [copy(title), copy(detail)]);

  const [logs, setLogs] = useState([]);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = useCallback(async (nextOffset) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await adminAPI.listAuditLogs({ limit: PAGE_SIZE, offset: nextOffset });
      setLogs((prev) => (nextOffset === 0 ? data.logs : [...prev, ...data.logs]));
      setTotal(data.total);
      setOffset(nextOffset);
    } catch (err) {
      logError("SVC", "No se pudo cargar la bitacora global de auditoria", err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(0); }, [fetchLogs]);

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
          {L("Bitacora institucional (todos los expedientes)", "Institutional activity log (all files)")}
        </h1>
        <p style={{ margin: 0, maxWidth: "820px", color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>
          {L(
            "Eventos reales registrados por la plataforma: quien hizo que, sobre que expediente y cuando. Solo Administrador puede ver la bitacora completa de todos los expedientes.",
            "Real events recorded by the platform: who did what, on which file, and when. Only the Administrator role can see the full log across all files."
          )}
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.75rem" }}>
        {translatedControls.map(([title, detail]) => (
          <article key={title} style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
            <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>{title}</p>
            <p style={{ margin: "0.35rem 0 0", color: COLORS.text, fontSize: "0.86rem", lineHeight: 1.5 }}>{detail}</p>
          </article>
        ))}
      </section>

      <section style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm, overflowX: "auto" }}>
        {error && <p style={{ color: "#C62828", fontWeight: 700 }}>{error}</p>}
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "760px" }}>
          <thead>
            <tr style={{ background: COLORS.navy, color: COLORS.white }}>
              {[L("Fecha", "Date"), L("Accion", "Action"), L("Entidad", "Entity"), L("Expediente", "File"), L("Relevante", "Relevant")].map((head) => (
                <th key={head} style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.78rem" }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: "0.72rem", color: COLORS.gold, fontWeight: 900, whiteSpace: "nowrap" }}>{log.created_at ? new Date(log.created_at).toLocaleString() : "—"}</td>
                <td style={{ padding: "0.72rem", color: COLORS.navy, fontWeight: 900 }}>{log.action}</td>
                <td style={{ padding: "0.72rem", color: COLORS.textMuted, fontSize: "0.84rem" }}>{log.entity_type || "—"}</td>
                <td style={{ padding: "0.72rem", color: COLORS.text, fontSize: "0.82rem" }}>{log.order_id ? String(log.order_id).slice(0, 8) : "—"}</td>
                <td style={{ padding: "0.72rem" }}>
                  <span style={{
                    display: "inline-flex",
                    borderRadius: "999px",
                    padding: "0.22rem 0.55rem",
                    background: log.compliance_relevant === false ? "rgba(107,114,128,0.15)" : "rgba(46,125,50,0.12)",
                    color: log.compliance_relevant === false ? COLORS.textMuted : "#2E7D32",
                    fontWeight: 900,
                    fontSize: "0.75rem",
                  }}>
                    {log.compliance_relevant === false ? L("No", "No") : L("Sí", "Yes")}
                  </span>
                </td>
              </tr>
            ))}
            {!loading && logs.length === 0 && !error && (
              <tr><td colSpan={5} style={{ padding: "1rem", color: COLORS.textMuted }}>{L("Sin eventos registrados todavia.", "No events recorded yet.")}</td></tr>
            )}
          </tbody>
        </table>
        {loading && <p style={{ color: COLORS.textMuted, marginTop: "0.75rem" }}>{L("Cargando...", "Loading...")}</p>}
        {!loading && total != null && logs.length < total && (
          <button
            onClick={() => fetchLogs(offset + PAGE_SIZE)}
            style={{ marginTop: "0.75rem", padding: "0.5rem 1rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, background: "white", fontWeight: 800, cursor: "pointer" }}
          >
            {L("Cargar más", "Load more")}
          </button>
        )}
      </section>
    </div>
  );
}
