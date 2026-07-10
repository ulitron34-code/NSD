import { error as logError } from '../../../utils/logger';
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminAPI } from "../../../services/api";
import { COLORS } from "../../../utils/constants";
import { uiText } from "../../../utils/runtimeCopy";

function StatCard({ label, value, hint }) {
  return (
    <article style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.85rem", background: COLORS.bg }}>
      <p style={{ margin: 0, color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
      <strong style={{ display: "block", color: COLORS.navy, fontSize: "1.4rem", marginTop: "0.3rem" }}>{value}</strong>
      {hint && <p style={{ margin: "0.3rem 0 0", color: COLORS.textMuted, fontSize: "0.72rem", lineHeight: 1.4 }}>{hint}</p>}
    </article>
  );
}

function RankedList({ title, items, emptyLabel }) {
  return (
    <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.85rem", background: COLORS.bg }}>
      <p style={{ margin: "0 0 0.5rem", color: COLORS.navy, fontSize: "0.82rem", fontWeight: 800 }}>{title}</p>
      {!items?.length && <p style={{ margin: 0, color: COLORS.textMuted, fontSize: "0.78rem" }}>{emptyLabel}</p>}
      {items?.map((item) => (
        <div key={item.label} style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", padding: "0.3rem 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: "0.8rem" }}>
          <span style={{ color: COLORS.text }}>{item.label}</span>
          <strong style={{ color: COLORS.navy }}>{item.count}</strong>
        </div>
      ))}
    </div>
  );
}

export default function AdminMetricsTab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);

  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await adminAPI.getReadinessMetrics();
        setMetrics(data);
      } catch (err) {
        logError("SVC", "No se pudieron cargar las métricas del módulo Readiness", err);
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", boxShadow: COLORS.shadowSm }}>
      <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {L("Administrador", "Administrator")}
      </p>
      <h2 style={{ color: COLORS.navy, fontSize: "1.08rem", margin: "0.35rem 0 0.25rem" }}>
        {L("Métricas del módulo Readiness", "Readiness module metrics")}
      </h2>
      <p style={{ margin: "0 0 1rem", color: COLORS.textMuted, fontSize: "0.8rem" }}>
        {L(
          "Resumen agregado a través de todos los expedientes con documentos del checklist de 12/13 Requisitos Mínimos.",
          "Aggregated summary across all cases with documents in the 12/13 Minimum Requirements checklist."
        )}
      </p>

      {loading && <p style={{ color: COLORS.textMuted }}>{L("Cargando...", "Loading...")}</p>}
      {error && <p style={{ color: "#C62828", fontWeight: 700 }}>{error}</p>}

      {!loading && !error && metrics && (
        <div style={{ display: "grid", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.75rem" }}>
            <StatCard label={L("Expedientes con checklist", "Cases with checklist")} value={metrics.totalOrders} />
            <StatCard label={L("Score global promedio", "Avg. global score")} value={metrics.avgGlobalScore != null ? `${metrics.avgGlobalScore}/100` : "—"} />
            <StatCard label={L("% expedientes listos", "% cases ready")} value={metrics.readyOrdersPercentage != null ? `${metrics.readyOrdersPercentage}%` : "—"} hint={L("Score >= 75", "Score >= 75")} />
            <StatCard label={L("Documentos faltantes (prom.)", "Missing docs (avg.)")} value={metrics.avgMissingDocuments ?? "—"} />
            <StatCard label={L("Costo IA por expediente (prom.)", "Avg. AI cost per case")} value={metrics.avgCostUsdPerOrder != null ? `$${metrics.avgCostUsdPerOrder}` : "—"} />
            <StatCard label={L("Tasa docs. ilegibles", "Illegible docs. rate")} value={metrics.illegibleDocumentRate != null ? `${metrics.illegibleDocumentRate}%` : "—"} hint={L(`Sobre ${metrics.illegibleDocumentSample} documentos con estatus OCR`, `Over ${metrics.illegibleDocumentSample} documents with OCR status`)} />
            <StatCard label={L("Correcciones por documento (prom.)", "Corrections per document (avg.)")} value={metrics.avgCorrectionsPerDocument ?? "—"} />
            <StatCard label={L("Reportes descargados por otorgantes", "Reports downloaded by funders")} value={`${metrics.granteeReportDownloads} / ${metrics.totalReportDownloads}`} />
          </div>

          <div style={{ border: `1px dashed ${COLORS.border}`, borderRadius: "8px", padding: "0.7rem 0.85rem", background: "rgba(201,168,76,0.06)" }}>
            <strong style={{ color: COLORS.navy, fontSize: "0.78rem" }}>{L("Tiempo promedio de evaluación: no disponible", "Average evaluation time: not available")}</strong>
            <p style={{ margin: "0.25rem 0 0", color: COLORS.textMuted, fontSize: "0.76rem", lineHeight: 1.45 }}>{metrics.avgEvaluationNote}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.75rem" }}>
            <RankedList
              title={L("Banderas rojas más comunes", "Most common red flags")}
              items={metrics.topRedFlags}
              emptyLabel={L("Sin banderas rojas registradas.", "No red flags recorded.")}
            />
            <RankedList
              title={L("Contradicciones más comunes", "Most common inconsistencies")}
              items={metrics.topInconsistencies}
              emptyLabel={L("Sin contradicciones detectadas entre documentos.", "No inconsistencies detected between documents.")}
            />
          </div>
        </div>
      )}
    </div>
  );
}
