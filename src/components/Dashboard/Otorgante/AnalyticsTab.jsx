import { error, debug, info, warn } from '../../../utils/logger';
﻿import React, { useEffect, useMemo, useState } from "react";
import { COLORS } from "../../../utils/constants";
import { ordersAPI, otorganteAPI } from "../../../services/api";
import { demoServiceOrders } from "../../../data/demoServiceOrders";
import { buildOtorganteAnalytics, buildOtorgantePipeline, buildOtorgantePipelineFromEntries, formatCurrency } from "../../../data/otorgantePipeline";
import { useAuth } from "../../../hooks/useAuth";
import { useTranslation } from "react-i18next";
import { translateCopy, uiText } from "../../../utils/runtimeCopy";

export default function AnalyticsTab() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const copy = (value) => translateCopy(value, i18n.language);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAnalyticsSource() {
      setLoading(true);
      setError("");

      try {
        let mapped = [];

        if (user?.demo) {
          mapped = buildOtorgantePipeline(demoServiceOrders);
        } else {
          const { data } = await otorganteAPI.pipeline();
          mapped = buildOtorgantePipelineFromEntries(data || []);

          if (mapped.length === 0) {
            const sourceOrders = (await ordersAPI.list()).data || [];
            mapped = buildOtorgantePipeline(sourceOrders);
          }
        }

        if (active) setOpportunities(mapped);
      } catch {
        if (!active) return;
        setError(L("No se pudieron cargar metricas reales; mostrando base demo.", "Could not load real metrics; showing demo baseline."));
        setOpportunities(buildOtorgantePipeline(demoServiceOrders));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAnalyticsSource();

    return () => {
      active = false;
    };
  }, [user?.demo]);

  const analytics = useMemo(() => buildOtorganteAnalytics(opportunities), [opportunities]);
  const riskRows = useMemo(() => ([
    { label: L("Bajo", "Low"), count: analytics.lowRisk, color: COLORS.green, action: L("Puede avanzar a comite si el data room esta completo.", "May advance to committee if the data room is complete.") },
    { label: L("Medio", "Medium"), count: analytics.mediumRisk, color: COLORS.amber, action: L("Requiere subsanacion o informacion adicional.", "Requires remediation or additional information.") },
    { label: L("Alto", "High"), count: analytics.highRisk, color: "#C62828", action: L("Pausar hasta aclarar alertas criticas.", "Pause until critical alerts are clarified.") },
  ]), [analytics, i18n.language]);
  const readinessRows = useMemo(() => {
    const grouped = opportunities.reduce((acc, item) => {
      const key = item.readinessLevel || "Sin clasificar";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(grouped).map(([label, count]) => ({ label, count }));
  }, [opportunities]);
  const rankedOpportunities = useMemo(() => opportunities
    .slice()
    .sort((a, b) => Number(b.averageScore || 0) - Number(a.averageScore || 0))
    .slice(0, 5), [opportunities]);
  const recurringSignals = useMemo(() => {
    const highRisk = opportunities.filter((item) => item.risk === "Alto").length;
    const early = opportunities.filter((item) => item.readinessLevel === "Preparacion inicial").length;
    const medium = opportunities.filter((item) => item.risk === "Medio").length;
    return [
      [L("Faltantes documentales", "Document Gaps"), early + medium, L("Requiere requerimientos y plan de subsanacion.", "Requires requests and a remediation plan.")],
      [L("Riesgo alto", "High Risk"), highRisk, L("Pausar o escalar a revision manual.", "Pause or escalate to manual review.")],
      [L("Listos para comite", "Ready for Committee"), opportunities.filter((item) => item.readinessLevel === "Listo para comite").length, L("Priorizar lectura ejecutiva y memo.", "Prioritize executive review and memo.")],
    ];
  }, [opportunities, i18n.language]);
  const actionQueue = useMemo(() => opportunities.map((item) => {
    const score = Number(item.averageScore || 0);
    const documents = Number(item.documentsCount || item.documents?.length || 0);
    const action = score >= 82 && item.risk !== "Alto"
      ? L("Preparar memo de comite", "Prepare committee memo")
      : score >= 65
        ? L("Solicitar informacion adicional", "Request additional information")
        : L("Pausar y pedir subsanacion", "Pause and request remediation");
    const reason = documents < 4
      ? L("Data room corto", "Thin data room")
      : item.risk === "Alto"
        ? L("Riesgo alto visible", "Visible high risk")
        : copy(item.readinessLevel || "Preparacion por validar");
    const priority = score >= 82 && item.risk === "Bajo" ? L("Alta", "High") : score >= 65 ? L("Media", "Medium") : L("Control", "Control");
    return { ...item, action, reason, priority };
  }).sort((a, b) => Number(b.averageScore || 0) - Number(a.averageScore || 0)).slice(0, 6), [opportunities, i18n.language]);
  const committeeQuestions = useMemo(() => ([
    [L("Hay evidencia suficiente?", "Is there enough evidence?"), opportunities.some((item) => Number(item.documentsCount || item.documents?.length || 0) >= 5) ? L("Si, existen expedientes con data room amplio.", "Yes, some files have a broad data room.") : L("Todavia hay que fortalecer data rooms.", "Data rooms still need strengthening.")],
    [L("Donde esta el cuello de botella?", "Where is the bottleneck?"), recurringSignals[0]?.[1] > 0 ? L("Faltantes documentales y subsanacion.", "Document gaps and remediation.") : L("Priorizacion de comite y contacto.", "Committee and contact prioritization.")],
    [L("Que revisa riesgo?", "What should risk review?"), analytics.highRisk > 0 ? L("Alertas altas, KYB, legal y uso de fondos.", "High alerts, KYB, legal and use of funds.") : L("Concentracion sectorial y supuestos de score.", "Sector concentration and scoring assumptions.")],
    [L("Que sigue comercialmente?", "What comes next commercially?"), analytics.lowRisk > 0 ? L("Contactar expedientes mejor preparados bajo gates.", "Contact better-prepared files under gates.") : L("Esperar subsanacion antes de abrir contacto.", "Wait for remediation before opening contact.")],
  ]), [analytics.highRisk, analytics.lowRisk, opportunities, recurringSignals, i18n.language]);
  const dataSource = user?.demo ? L("Datos demo enriquecidos localmente", "Enriched local demo data") : "Pipeline Supabase: otorganteAPI.pipeline(); fallback ordersAPI.list()";

  return (
    <div>
      <div style={{ marginBottom: "2rem", borderBottom: `1px solid ${COLORS.border}`, paddingBottom: "1.5rem" }}>
        <p style={{ color: COLORS.gold, fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem" }}>
          {L("Inteligencia de Negocio", "Business Intelligence")}
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.navy, fontSize: "2.2rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          {L("Analitica de Colocacion y Riesgo", "Placement and Risk Analytics")}
        </h1>
        <p style={{ color: COLORS.textMuted, maxWidth: "780px", fontWeight: 300, fontSize: "0.95rem" }}>
          {L("Visualiza el desempeno del pipeline disponible, embudos de conversion y exposicion de riesgo por sector.", "Visualize available pipeline performance, conversion funnels and risk exposure by sector.")}
        </p>
        {loading && <p style={{ color: COLORS.textMuted, fontSize: "0.85rem", marginTop: "0.75rem" }}>{L("Cargando metricas...", "Loading metrics...")}</p>}
        {error && <p style={{ color: "#C62828", fontSize: "0.85rem", marginTop: "0.75rem" }}>{error}</p>}
      </div>

      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem", boxShadow: COLORS.shadowSm }}>
        <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.35rem" }}>
          {L("Fuente de datos", "Data Source")}
        </p>
        <p style={{ color: COLORS.navy, fontWeight: 900, fontSize: "0.95rem", marginBottom: "0.45rem" }}>
          {dataSource}
        </p>
        <p style={{ color: COLORS.textMuted, fontSize: "0.82rem", lineHeight: 1.55 }}>
          {L("Esta pestana no decide credito. Resume el pipeline disponible para que el otorgante vea concentracion sectorial, exposicion, preparacion documental y prioridades de revision.", "This tab does not make credit decisions. It summarizes the available pipeline so the funder can see sector concentration, exposure, document readiness and review priorities.")}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.25fr) minmax(300px, 0.75fr)", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ background: COLORS.white, padding: "1.5rem", borderRadius: "8px", border: `1px solid ${COLORS.border}`, boxShadow: COLORS.shadowSm }}>
          <h2 style={{ fontSize: "1.1rem", color: COLORS.navy, marginBottom: "0.35rem" }}>{L("Cola de Accion Institucional", "Institutional Action Queue")}</h2>
          <p style={{ color: COLORS.textMuted, fontSize: "0.82rem", lineHeight: 1.5, marginBottom: "1rem" }}>
            {L("Traduce el pipeline a acciones concretas: comite, requerimientos, pausa o subsanacion.", "Translate the pipeline into concrete actions: committee, requests, pause or remediation.")}
          </p>
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {actionQueue.map((item) => (
              <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 90px 130px", gap: "0.75rem", alignItems: "center", padding: "0.8rem", borderRadius: "8px", background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                <div>
                  <strong style={{ display: "block", color: COLORS.navy, fontSize: "0.86rem" }}>{copy(item.name)}</strong>
                  <span style={{ color: COLORS.textMuted, fontSize: "0.76rem" }}>{copy(item.sector)} / {item.amountLabel} / {item.reason}</span>
                </div>
                <span style={{ color: item.priority === "Alta" ? COLORS.green : item.priority === "Media" ? COLORS.amber : "#C62828", fontWeight: 900 }}>{item.priority}</span>
                <span style={{ color: COLORS.navy, fontSize: "0.78rem", fontWeight: 900, textAlign: "right" }}>{item.action}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: COLORS.white, padding: "1.5rem", borderRadius: "8px", border: `1px solid ${COLORS.border}`, boxShadow: COLORS.shadowSm }}>
          <h2 style={{ fontSize: "1.1rem", color: COLORS.navy, marginBottom: "0.35rem" }}>{L("Preguntas para Comite", "Committee Questions")}</h2>
          <p style={{ color: COLORS.textMuted, fontSize: "0.82rem", lineHeight: 1.5, marginBottom: "1rem" }}>
            {L("Lectura rapida para decidir si el pipeline merece revision interna o mas informacion.", "Quick read to decide whether the pipeline deserves internal review or more information.")}
          </p>
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {committeeQuestions.map(([question, answer]) => (
              <div key={question} style={{ padding: "0.8rem", borderRadius: "8px", background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                <p style={{ color: COLORS.navy, fontWeight: 900, fontSize: "0.82rem", marginBottom: "0.25rem" }}>{question}</p>
                <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45 }}>{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ background: COLORS.white, padding: "1.5rem", borderRadius: "8px", border: `1px solid ${COLORS.border}`, boxShadow: COLORS.shadowSm }}>
          <h2 style={{ fontSize: "1.1rem", color: COLORS.navy, marginBottom: "1.5rem" }}>{L("Funnel del Pipeline", "Pipeline Funnel")}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {analytics.funnel.map((item, index) => (
              <div
                key={item.label}
                style={{
                  background: index === analytics.funnel.length - 1 ? COLORS.gold : `rgba(27,58,92,${Math.max(0.95 - index * 0.16, 0.48)})`,
                  color: index === analytics.funnel.length - 1 ? COLORS.navy : "white",
                  padding: "0.75rem 1rem",
                  borderRadius: "4px",
                  width: `${item.width}%`,
                  minWidth: "180px",
                  fontSize: "0.85rem",
                  display: "flex",
                  justifyContent: "space-between"
                }}
              >
                <span>{copy(item.label)}</span>
                <span style={{ fontWeight: 700 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: COLORS.white, padding: "1.5rem", borderRadius: "8px", border: `1px solid ${COLORS.border}`, boxShadow: COLORS.shadowSm }}>
          <h2 style={{ fontSize: "1.1rem", color: COLORS.navy, marginBottom: "1.5rem" }}>{L("Exposicion por Sector", "Exposure by Sector")}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {analytics.sectorExposure.length === 0 ? (
              <p style={{ color: COLORS.textMuted, fontSize: "0.9rem" }}>{L("Sin exposicion sectorial disponible.", "No sector exposure available.")}</p>
            ) : analytics.sectorExposure.map((item) => (
              <div key={item.sector}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.25rem", color: COLORS.text }}>
                  <span>{copy(item.sector)}</span>
                  <span style={{ fontWeight: 600 }}>{item.pct}%</span>
                </div>
                <div style={{ height: "8px", background: COLORS.bgSubtle, borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.max(item.pct, 4)}%`, background: COLORS.navy, borderRadius: "4px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: COLORS.white, padding: "1.5rem", borderRadius: "8px", border: `1px solid ${COLORS.border}`, boxShadow: COLORS.shadowSm }}>
        <h2 style={{ fontSize: "1.1rem", color: COLORS.navy, marginBottom: "1rem" }}>{L("Metricas Financieras", "Financial Metrics")}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <div style={{ padding: "1.25rem", background: COLORS.bg, borderRadius: "8px", borderTop: `3px solid ${COLORS.gold}` }}>
            <p style={{ color: COLORS.textMuted, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>{L("Pipeline total", "Total Pipeline")}</p>
            <p style={{ color: COLORS.navy, fontWeight: 700, fontSize: "1.5rem" }}>{formatCurrency(analytics.totalAmount)}</p>
          </div>
          <div style={{ padding: "1.25rem", background: COLORS.bg, borderRadius: "8px", borderTop: `3px solid ${COLORS.green}` }}>
            <p style={{ color: COLORS.textMuted, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>{L("Riesgo bajo", "Low Risk")}</p>
            <p style={{ color: COLORS.navy, fontWeight: 700, fontSize: "1.5rem" }}>{analytics.lowRisk}</p>
          </div>
          <div style={{ padding: "1.25rem", background: COLORS.bg, borderRadius: "8px", borderTop: `3px solid ${COLORS.navy}` }}>
            <p style={{ color: COLORS.textMuted, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>{L("Ticket promedio", "Average Ticket")}</p>
            <p style={{ color: COLORS.navy, fontWeight: 700, fontSize: "1.5rem" }}>{formatCurrency(analytics.averageTicket)}</p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "1.5rem", marginTop: "1.5rem" }}>
        <div style={{ background: COLORS.white, padding: "1.5rem", borderRadius: "8px", border: `1px solid ${COLORS.border}`, boxShadow: COLORS.shadowSm }}>
          <h2 style={{ fontSize: "1.1rem", color: COLORS.navy, marginBottom: "1rem" }}>{L("Mapa de Riesgo Accionable", "Actionable Risk Map")}</h2>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {riskRows.map((row) => (
              <div key={row.label} style={{ display: "grid", gridTemplateColumns: "70px 48px 1fr", gap: "0.75rem", alignItems: "center", padding: "0.75rem", background: COLORS.bg, borderRadius: "8px", border: `1px solid ${COLORS.border}` }}>
                <strong style={{ color: row.color }}>{row.label}</strong>
                <span style={{ color: COLORS.navy, fontWeight: 900, fontSize: "1.2rem" }}>{row.count}</span>
                <span style={{ color: COLORS.textMuted, fontSize: "0.8rem", lineHeight: 1.45 }}>{row.action}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: COLORS.white, padding: "1.5rem", borderRadius: "8px", border: `1px solid ${COLORS.border}`, boxShadow: COLORS.shadowSm }}>
          <h2 style={{ fontSize: "1.1rem", color: COLORS.navy, marginBottom: "1rem" }}>{L("Preparacion para Comite", "Committee Readiness")}</h2>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {readinessRows.length ? readinessRows.map((row) => (
              <div key={row.label} style={{ padding: "0.8rem", borderRadius: "8px", background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <strong style={{ color: COLORS.navy }}>{copy(row.label)}</strong>
                  <span style={{ color: COLORS.gold, fontWeight: 900 }}>{row.count}</span>
                </div>
                <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45 }}>
                  {row.label === "Listo para comite" ? L("Puede pasar a lectura ejecutiva.", "May advance to executive review.") : row.label === "Subsanable" ? L("Requiere requerimientos y evidencia adicional.", "Requires requests and additional evidence.") : L("Necesita preparacion documental antes de revisar.", "Needs document readiness before review.")}
                </p>
              </div>
            )) : (
              <p style={{ color: COLORS.textMuted }}>{L("Sin clasificacion de preparacion.", "No readiness classification.")}</p>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(300px, 0.9fr)", gap: "1.5rem", marginTop: "1.5rem" }}>
        <div style={{ background: COLORS.white, padding: "1.5rem", borderRadius: "8px", border: `1px solid ${COLORS.border}`, boxShadow: COLORS.shadowSm }}>
          <h2 style={{ fontSize: "1.1rem", color: COLORS.navy, marginBottom: "1rem" }}>{L("Ranking de Oportunidades", "Opportunity Ranking")}</h2>
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {rankedOpportunities.map((item, index) => (
              <div key={item.id} style={{ display: "grid", gridTemplateColumns: "34px 1fr auto", gap: "0.75rem", alignItems: "center", padding: "0.75rem", borderRadius: "8px", background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: COLORS.gold, color: COLORS.navy, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>{index + 1}</span>
                <span>
                  <strong style={{ display: "block", color: COLORS.navy, fontSize: "0.86rem" }}>{copy(item.name)}</strong>
                  <span style={{ color: COLORS.textMuted, fontSize: "0.76rem" }}>{copy(item.sector)} / {item.amountLabel} / {copy(item.readinessLevel)}</span>
                </span>
                <strong style={{ color: item.risk === "Bajo" ? COLORS.green : item.risk === "Medio" ? COLORS.amber : "#C62828" }}>{item.averageScore}/100</strong>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: COLORS.white, padding: "1.5rem", borderRadius: "8px", border: `1px solid ${COLORS.border}`, boxShadow: COLORS.shadowSm }}>
          <h2 style={{ fontSize: "1.1rem", color: COLORS.navy, marginBottom: "1rem" }}>{L("Senales Recurrentes", "Recurring Signals")}</h2>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {recurringSignals.map(([label, count, detail]) => (
              <div key={label} style={{ padding: "0.85rem", borderRadius: "8px", background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                  <strong style={{ color: COLORS.navy }}>{label}</strong>
                  <span style={{ color: count > 0 ? COLORS.amber : COLORS.green, fontWeight: 900 }}>{count}</span>
                </div>
                <p style={{ color: COLORS.textMuted, fontSize: "0.8rem", lineHeight: 1.45 }}>{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

