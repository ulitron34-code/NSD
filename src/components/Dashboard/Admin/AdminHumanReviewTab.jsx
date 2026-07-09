import { error as logError } from '../../../utils/logger';
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminAPI, readinessChecklistAPI } from "../../../services/api";
import { COLORS } from "../../../utils/constants";
import { uiText } from "../../../utils/runtimeCopy";

export default function AdminHumanReviewTab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingOrderId, setDownloadingOrderId] = useState(null);
  const limit = 25;

  const fetchQueue = useCallback(async (nextOffset) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await adminAPI.listHumanReviewQueue({ limit, offset: nextOffset });
      setItems((prev) => (nextOffset === 0 ? data.items : [...prev, ...(data.items || [])]));
      setTotal(data.total ?? 0);
      setOffset(nextOffset);
    } catch (err) {
      logError("SVC", "No se pudo cargar la cola de revisión humana", err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQueue(0); }, [fetchQueue]);

  const handleDownloadAuditReport = async (orderId) => {
    setDownloadingOrderId(orderId);
    try {
      const response = await readinessChecklistAPI.downloadAuditReport(orderId);
      const url = URL.createObjectURL(new Blob([response.data], { type: "text/markdown" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `reporte-auditoria-${orderId}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      logError("SVC", "No se pudo descargar el reporte interno de auditoría", err);
    } finally {
      setDownloadingOrderId(null);
    }
  };

  return (
    <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", boxShadow: COLORS.shadowSm }}>
      <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {L("Administrador", "Administrator")}
      </p>
      <h2 style={{ color: COLORS.navy, fontSize: "1.08rem", margin: "0.35rem 0 0.25rem" }}>
        {L("Revisión humana pendiente", "Pending human review")}
      </h2>
      <p style={{ margin: "0 0 1rem", color: COLORS.textMuted, fontSize: "0.8rem" }}>
        {L(
          "Documentos donde el agente de IA marcó human_review_required=true (score bajo, banderas rojas o confianza baja), a través de todos los expedientes.",
          "Documents where the AI agent flagged human_review_required=true (low score, red flags, or low confidence), across all cases."
        )}
      </p>

      {loading && offset === 0 && <p style={{ color: COLORS.textMuted }}>{L("Cargando...", "Loading...")}</p>}
      {error && <p style={{ color: "#C62828", fontWeight: 700 }}>{error}</p>}

      {!error && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: `2px solid ${COLORS.border}` }}>
                <th style={{ padding: "0.5rem" }}>{L("Expediente", "Case")}</th>
                <th style={{ padding: "0.5rem" }}>{L("Documento", "Document")}</th>
                <th style={{ padding: "0.5rem" }}>{L("Score IA", "AI score")}</th>
                <th style={{ padding: "0.5rem" }}>{L("Confianza", "Confidence")}</th>
                <th style={{ padding: "0.5rem" }}>{L("Costo IA est.", "Est. AI cost")}</th>
                <th style={{ padding: "0.5rem" }}>{L("Evaluado", "Reviewed")}</th>
                <th style={{ padding: "0.5rem" }}>{L("Reporte de auditoría", "Audit report")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.documentId} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: "0.5rem", fontWeight: 700 }}>{item.caseNumber || item.orderId}</td>
                  <td style={{ padding: "0.5rem" }}>{item.filename}</td>
                  <td style={{ padding: "0.5rem", color: item.reviewScore != null && item.reviewScore < 60 ? "#C62828" : COLORS.textMuted, fontWeight: 700 }}>
                    {item.reviewScore != null ? `${item.reviewScore}/100` : "—"}
                  </td>
                  <td style={{ padding: "0.5rem" }}>{item.confidence != null ? item.confidence : "—"}</td>
                  <td style={{ padding: "0.5rem" }}>{item.costUsd != null ? `$${Number(item.costUsd).toFixed(4)}` : "—"}</td>
                  <td style={{ padding: "0.5rem", color: COLORS.textMuted }}>{item.reviewedAt ? new Date(item.reviewedAt).toLocaleString() : "—"}</td>
                  <td style={{ padding: "0.5rem" }}>
                    <button
                      onClick={() => handleDownloadAuditReport(item.orderId)}
                      disabled={downloadingOrderId === item.orderId}
                      style={{
                        fontSize: "0.72rem", fontWeight: 800, color: COLORS.navy, cursor: downloadingOrderId === item.orderId ? "wait" : "pointer",
                        border: `1px solid ${COLORS.border}`, borderRadius: "6px", padding: "0.3rem 0.55rem", background: "transparent",
                        opacity: downloadingOrderId === item.orderId ? 0.6 : 1
                      }}
                    >
                      {downloadingOrderId === item.orderId ? L("Descargando…", "Downloading…") : L("Descargar", "Download")}
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr><td colSpan={7} style={{ padding: "1rem", color: COLORS.textMuted }}>{L("Sin documentos pendientes de revisión humana.", "No documents pending human review.")}</td></tr>
              )}
            </tbody>
          </table>
          {items.length < total && (
            <button
              onClick={() => fetchQueue(offset + limit)}
              disabled={loading}
              style={{
                marginTop: "0.75rem", fontSize: "0.78rem", fontWeight: 800, color: COLORS.navy, cursor: loading ? "wait" : "pointer",
                border: `1px solid ${COLORS.border}`, borderRadius: "6px", padding: "0.4rem 0.7rem", background: "transparent"
              }}
            >
              {loading ? L("Cargando…", "Loading…") : L("Cargar más", "Load more")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
