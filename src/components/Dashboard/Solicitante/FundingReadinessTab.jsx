import { error, warn } from '../../../utils/logger';
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../../utils/constants";
import { uiText } from "../../../utils/runtimeCopy";
import { BRAND } from "../../../config/brand";
import { useMyOrders } from "../../../hooks/useMyOrders";
import { useReadinessChecklist } from "../../../hooks/useReadinessChecklist";
import ReadinessTemplatesPanel from "./ReadinessTemplatesPanel";
import { requisitosMinimosAPI, readinessChecklistAPI } from "../../../services/api";
import { REQUISITOS_CATEGORIAS, UN_SDG_GOALS, SUPPORTED_COUNTRIES, pickLang, generarRevisionIARequisitos } from "../../../data/requisitosMinimos";

export default function FundingReadinessTab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const { orderId, isDemo, loading: ordersLoading } = useMyOrders();
  const ordersChecked = !ordersLoading;
  const [uploadingItemId, setUploadingItemId] = useState(null);

  const requisitos = useReadinessChecklist(orderId, isDemo);
  const usaCargaReal = !isDemo && Boolean(orderId);

  const [revisionIA, setRevisionIA] = useState(null);
  const [cargandoIA, setCargandoIA] = useState(false);
  const [descargandoReporte, setDescargandoReporte] = useState(null);
  const [verificandoConsistencia, setVerificandoConsistencia] = useState(false);
  const [inconsistencias, setInconsistencias] = useState(null);

  const handleDescargarReporte = async (formato = "md") => {
    setDescargandoReporte(formato);
    try {
      const response = formato === "pdf"
        ? await readinessChecklistAPI.downloadMemoPdf(orderId)
        : formato === "anon"
        ? await readinessChecklistAPI.downloadAnonymizedSummary(orderId)
        : await readinessChecklistAPI.downloadMemo(orderId);
      const mime = formato === "pdf" ? "application/pdf" : "text/markdown";
      const url = URL.createObjectURL(new Blob([response.data], { type: mime }));
      const link = document.createElement("a");
      link.href = url;
      link.download = formato === "anon" ? "resumen-anonimizado-readiness.md" : `reporte-readiness.${formato}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      error("SVC", "Error descargando el reporte de readiness", err);
    } finally {
      setDescargandoReporte(null);
    }
  };

  const handleVerificarConsistencia = async () => {
    setVerificandoConsistencia(true);
    try {
      const { data } = await readinessChecklistAPI.crossCheck(orderId);
      setInconsistencias(data.inconsistencies || []);
    } catch (err) {
      error("SVC", "Error verificando consistencia entre documentos", err);
    } finally {
      setVerificandoConsistencia(false);
    }
  };

  const handleAdjuntar = async (itemId, file) => {
    if (!usaCargaReal) {
      requisitos.adjuntarEvidencia(itemId, file.name);
      return;
    }
    setUploadingItemId(itemId);
    try {
      await requisitos.uploadEvidence(itemId, file);
    } catch (err) {
      error("SVC", "Error subiendo evidencia real del checklist", err);
    } finally {
      setUploadingItemId(null);
    }
  };

  const handleRevisarIA = async () => {
    setCargandoIA(true);
    try {
      const { data } = await requisitosMinimosAPI.review(requisitos.items, i18n.language);
      setRevisionIA(data);
    } catch (err) {
      warn("No se pudo contactar la revisión IA del backend, usando heurística local", err);
      setRevisionIA(generarRevisionIARequisitos(requisitos.items, i18n.language));
    } finally {
      setCargandoIA(false);
    }
  };

  const readinessAreas = [
    {
      area: L("Identidad y KYB", "Identity & KYB"),
      grade: "A",
      signal: "Verde",
      progress: 92,
      next: L("Mantener poderes, RFC y beneficiario controlador actualizados.", "Keep powers of attorney, tax ID and ultimate beneficial owner updated."),
    },
    {
      area: L("Corporativo legal", "Corporate Legal"),
      grade: "B",
      signal: "Amarillo",
      progress: 78,
      next: L("Actualizar acta, organigrama y autorizaciones para financiamiento.", "Update bylaws, org chart and financing authorizations."),
    },
    {
      area: L("Financiero", "Financial"),
      grade: "B",
      signal: "Amarillo",
      progress: 74,
      next: L("Subir estados financieros recientes, flujo proyectado y soporte de ingresos.", "Upload recent financial statements, projected cash flow and revenue support."),
    },
    {
      area: L("Proyecto / uso de recursos", "Project / Use of Funds"),
      grade: "A",
      signal: "Verde",
      progress: 88,
      next: L("Agregar hitos, presupuesto y evidencia de avance operativo.", "Add milestones, budget and operational progress evidence."),
    },
    {
      area: L("Antifraude y cumplimiento", "Anti-Fraud & Compliance"),
      grade: "B",
      signal: "Amarillo",
      progress: 81,
      next: L("Completar declaraciones, listas internas y validaciones pendientes.", "Complete pending declarations, internal screening lists and validations."),
    },
  ];

  const financingSteps = [
    ["1", L("Preparar expediente", "Prepare File"), L("Completar documentos base y datos del proyecto.", "Complete base documents and project details.")],
    ["2", L(`Revision IA / ${BRAND.name}`, `AI / ${BRAND.name} Review`), L("Detectar faltantes, score, riesgos y memo ejecutivo.", "Detect gaps, score, risks and executive memo.")],
    ["3", L("Liberar data room", "Release Data Room"), L("Compartir expediente con otorgantes compatibles.", "Share file with compatible funding providers.")],
    ["4", L("Atender requerimientos", "Address Requests"), L("Responder solicitudes y sustituir documentos vencidos.", "Respond to requests and replace expired documents.")],
    ["5", L("Comite / term sheet", "Committee / Term Sheet"), L("Llegar con evidencia ordenada para decision del otorgante.", "Arrive with organized evidence for funding provider decision.")],
  ];

  const blockerItems = [
    L("Estados financieros con fecha mayor a 90 dias.", "Financial statements dated older than 90 days."),
    L("Poderes o actas sin version final digitalizada.", "Powers of attorney or bylaws without digitalized final version."),
    L("Uso de recursos sin presupuesto verificable.", "Use of funds without verifiable budget."),
    L("Contratos clave sin vigencia o firma completa.", "Key contracts without validity or complete signatures."),
    L("Beneficiario controlador pendiente de confirmacion.", "Ultimate beneficial owner pending confirmation."),
  ];

  const statCards = [
    [L("Score estimado", "Estimated Score"), "82", "B+"],
    [L("Faltantes criticos", "Critical Gaps"), "2", L("por atender", "to address")],
    [L("Dias ahorrados", "Days Saved"), "12", L("estimados", "estimated")],
    [L("Otorgantes compatibles", "Compatible Funders"), "7", L("potenciales", "potential")],
  ];

  const funderView = [
    [
      L("Claridad del uso de fondos", "Use-of-funds clarity"),
      L("Fuerte", "Strong"),
      L("El proyecto explica monto, destino, hitos y presupuesto base.", "The project explains amount, destination, milestones and base budget."),
      L("Agregar evidencia de cotizaciones, contratos o avance operativo.", "Add evidence of quotes, contracts or operational progress."),
    ],
    [
      L("Capacidad de repago", "Repayment capacity"),
      L("Revisable", "Reviewable"),
      L("Hay informacion financiera, pero faltan supuestos y sensibilidad.", "There is financial information, but assumptions and sensitivity are missing."),
      L("Subir flujo proyectado, supuestos y fuente primaria de pago.", "Upload projected cash flow, assumptions and primary repayment source."),
    ],
    [
      L("Cumplimiento y antifraude", "Compliance and anti-fraud"),
      L("Condicionado", "Conditional"),
      L("KYB esta avanzado, pero hay validaciones y declaraciones pendientes.", "KYB is advanced, but validations and declarations are pending."),
      L("Completar beneficiario controlador, listas y autorizaciones.", "Complete UBO, screenings and authorizations."),
    ],
  ];

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <section style={{
        background: "linear-gradient(135deg, #0F1F2E 0%, #1B3A5C 68%, #C9A227 145%)",
        color: COLORS.white,
        borderRadius: "16px",
        padding: "1.6rem",
        boxShadow: COLORS.shadowMd,
      }}>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {L("Preparacion para financiamiento", "Funding readiness")}
        </p>
        <h1 style={{ margin: "0.35rem 0", color: COLORS.white, fontSize: "1.6rem" }}>
          {L("Que tan listo esta tu expediente para un otorgante", "How ready your file is for a funder")}
        </h1>
        <p style={{ margin: 0, maxWidth: "820px", color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>
          {L(
            `${BRAND.name} organiza documentos, revisa faltantes, prioriza riesgos y prepara una lectura institucional para que el solicitante llegue mejor armado a una entidad financiera.`,
            `${BRAND.name} organizes documents, reviews gaps, prioritizes risks and prepares an institutional readout so the applicant reaches a financial institution better prepared.`
          )}
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "0.75rem" }}>
        {statCards.map(([label, value, suffix]) => (
          <article key={label} style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
            <p style={{ margin: 0, color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.45rem", marginTop: "0.35rem" }}>
              <strong style={{ color: COLORS.navy, fontSize: "1.75rem" }}>{value}</strong>
              <span style={{ color: COLORS.gold, fontWeight: 900, fontSize: "0.85rem" }}>{suffix}</span>
            </div>
          </article>
        ))}
      </section>

      <section style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "0.9rem" }}>
          <div>
            <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {L("Como te ve un otorgante", "How a funder sees you")}
            </p>
            <h2 style={{ color: COLORS.navy, fontSize: "1.08rem", margin: "0.35rem 0 0" }}>
              {L("Lectura institucional antes de liberar el data room", "Institutional readout before releasing the data room")}
            </h2>
          </div>
          <span style={{ padding: "0.45rem 0.65rem", borderRadius: "999px", background: "rgba(201,168,76,0.14)", color: COLORS.navy, fontWeight: 900, fontSize: "0.78rem" }}>
            {L("Listo condicionado", "Conditionally ready")}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem" }}>
          {funderView.map(([label, status, detail, action]) => (
            <article key={label} style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.9rem", background: COLORS.bg }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center", marginBottom: "0.45rem" }}>
                <strong style={{ color: COLORS.navy, fontSize: "0.88rem" }}>{label}</strong>
                <span style={{ color: status === L("Fuerte", "Strong") ? COLORS.green : COLORS.amber, fontWeight: 900, fontSize: "0.76rem" }}>{status}</span>
              </div>
              <p style={{ margin: 0, color: COLORS.textMuted, fontSize: "0.8rem", lineHeight: 1.45 }}>{detail}</p>
              <p style={{ margin: "0.55rem 0 0", color: COLORS.navy, fontSize: "0.78rem", lineHeight: 1.4, fontWeight: 800 }}>{action}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(280px, 0.85fr)", gap: "1rem" }}>
        <article style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {L("Matriz de preparacion", "Readiness matrix")}
          </p>
          <div style={{ display: "grid", gap: "0.7rem", marginTop: "0.85rem" }}>
            {readinessAreas.map((item, idx) => (
              <div key={idx} style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.75rem", background: COLORS.bg }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.8rem", alignItems: "center" }}>
                  <div>
                    <strong style={{ color: COLORS.navy, fontSize: "0.92rem" }}>{item.area}</strong>
                    <p style={{ margin: "0.25rem 0 0", color: COLORS.textMuted, fontSize: "0.8rem", lineHeight: 1.4 }}>{item.next}</p>
                  </div>
                  <span style={{ flex: "0 0 auto", minWidth: "38px", textAlign: "center", borderRadius: "999px", padding: "0.25rem 0.55rem", background: item.signal === "Verde" ? "rgba(46,125,50,0.12)" : "rgba(201,162,39,0.18)", color: item.signal === "Verde" ? "#2E7D32" : "#8A6A00", fontWeight: 900 }}>{item.grade}</span>
                </div>
                <div style={{ height: "7px", background: "#E8ECF2", borderRadius: "999px", marginTop: "0.65rem", overflow: "hidden" }}>
                  <div style={{ width: `${item.progress}%`, height: "100%", background: item.signal === "Verde" ? "#2E7D32" : COLORS.gold }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <aside style={{ display: "grid", gap: "1rem" }}>
          <article style={{ background: "#102235", color: COLORS.white, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
            <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>
              {L("Bloqueantes comunes", "Common blockers")}
            </p>
            <ul style={{ margin: "0.75rem 0 0", paddingLeft: "1.05rem", color: "rgba(255,255,255,0.78)", fontSize: "0.84rem", lineHeight: 1.55 }}>
              {blockerItems.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          </article>

          <article style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
            <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>
              {L("Siguiente accion recomendada", "Recommended next action")}
            </p>
            <h2 style={{ color: COLORS.navy, fontSize: "1rem", margin: "0.35rem 0" }}>{L("Cerrar faltantes amarillos", "Close yellow gaps")}</h2>
            <p style={{ margin: 0, color: COLORS.text, fontSize: "0.86rem", lineHeight: 1.5 }}>
              {L(
                "Prioriza financieros, poderes y fuente de repago antes de liberar el expediente a otorgantes.",
                "Prioritize financials, powers of attorney and repayment source before releasing the file to funders."
              )}
            </p>
          </article>
        </aside>
      </section>

      <section style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
        <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {L("Camino hasta decision", "Path to decision")}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))", gap: "0.75rem", marginTop: "0.85rem" }}>
          {financingSteps.map(([step, title, detail]) => (
            <div key={step} style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.85rem" }}>
              <span style={{ width: "30px", height: "30px", borderRadius: "50%", background: COLORS.gold, color: COLORS.navy, display: "grid", placeItems: "center", fontWeight: 900, marginBottom: "0.55rem" }}>{step}</span>
              <strong style={{ display: "block", color: COLORS.navy, fontSize: "0.9rem", marginBottom: "0.25rem" }}>{title}</strong>
              <p style={{ margin: 0, color: COLORS.textMuted, fontSize: "0.82rem", lineHeight: 1.45 }}>{detail}</p>
            </div>
          ))}
        </div>
      </section>

      {usaCargaReal && <ReadinessTemplatesPanel />}

      <section style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "0.9rem" }}>
          <div>
            <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {L(`Requisitos minimos ${BRAND.name}`, `${BRAND.name} Minimum Requirements`)}
            </p>
            <h2 style={{ color: COLORS.navy, fontSize: "1.08rem", margin: "0.35rem 0 0" }}>
              {L("Checklist de 13 requisitos minimos del proyecto", "Project's 13 minimum requirements checklist")}
            </h2>
            <p style={{ margin: "0.35rem 0 0", color: COLORS.textMuted, fontSize: "0.82rem", maxWidth: "620px", lineHeight: 1.5 }}>
              {L(
                `Todo proyecto debe cubrir estos 12 puntos antes de poder enviarse a prevalidacion ${BRAND.name}. Los marcados como criticos bloquean el envio si quedan pendientes.`,
                `Every project must cover these 12 points before it can be sent to ${BRAND.name} pre-validation. Items marked critical block submission while pending.`
              )}
            </p>
            {!isDemo && ordersChecked && !orderId && (
              <p style={{ margin: "0.5rem 0 0", color: COLORS.amber, fontSize: "0.78rem", fontWeight: 700, maxWidth: "620px" }}>
                {L(
                  "No encontramos un expediente real todavia — crea uno para adjuntar documentos y obtener revision IA sobre archivos reales. Mientras tanto se muestra el checklist de ejemplo.",
                  "We couldn't find a real file yet — create one to attach documents and get AI review on real files. Meanwhile the example checklist is shown."
                )}
              </p>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
            {requisitos.lifecycle && (
              <span title={requisitos.lifecycle.reason} style={{ padding: "0.3rem 0.65rem", borderRadius: "999px", background: "rgba(10,35,66,0.08)", color: COLORS.navy, fontSize: "0.7rem", fontWeight: 800, whiteSpace: "nowrap" }}>
                {requisitos.lifecycle.label}
              </span>
            )}
            {requisitos.country && (
              <span style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                {L("Pais: ", "Country: ")}
                {(() => {
                  const info = SUPPORTED_COUNTRIES.find((c) => c.code === requisitos.country);
                  return info ? L(info.es, info.en) : requisitos.country;
                })()}
              </span>
            )}
            {requisitos.financingType && (
              <span style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                {L("Financiamiento: ", "Financing: ")}{requisitos.financingType}
              </span>
            )}
            {requisitos.globalScore && (
              <span style={{ color: COLORS.navy, fontSize: "0.72rem", fontWeight: 900, whiteSpace: "nowrap" }}>
                {L("Score global: ", "Global score: ")}{requisitos.globalScore.score}/100
              </span>
            )}
            <span style={{
              padding: "0.5rem 0.8rem", borderRadius: "999px", fontWeight: 900, fontSize: "0.8rem",
              background: requisitos.listoParaEnviar ? "rgba(46,125,50,0.12)" : "rgba(198,40,40,0.1)",
              color: requisitos.listoParaEnviar ? COLORS.green : "#C62828",
              whiteSpace: "nowrap",
            }}>
              {requisitos.completados}/{requisitos.total} · {requisitos.criticosPendientes.length > 0
                ? L(`${requisitos.criticosPendientes.length} criticos pendientes`, `${requisitos.criticosPendientes.length} critical pending`)
                : L("Sin criticos pendientes", "No critical items pending")}
            </span>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
              {usaCargaReal && (
                <button
                  onClick={handleVerificarConsistencia}
                  disabled={verificandoConsistencia}
                  style={{ border: `1px solid ${COLORS.border}`, borderRadius: "6px", padding: "0.45rem 0.75rem", fontWeight: 900, fontSize: "0.75rem", cursor: verificandoConsistencia ? "wait" : "pointer", background: "white", color: COLORS.navy, opacity: verificandoConsistencia ? 0.7 : 1 }}
                >
                  {verificandoConsistencia ? L("Verificando…", "Checking…") : L("Verificar consistencia", "Check consistency")}
                </button>
              )}
              {usaCargaReal && (
                <button
                  onClick={() => handleDescargarReporte("md")}
                  disabled={Boolean(descargandoReporte)}
                  style={{ border: `1px solid ${COLORS.border}`, borderRadius: "6px", padding: "0.45rem 0.75rem", fontWeight: 900, fontSize: "0.75rem", cursor: descargandoReporte ? "wait" : "pointer", background: "white", color: COLORS.navy, opacity: descargandoReporte ? 0.7 : 1 }}
                >
                  {descargandoReporte === "md" ? L("Descargando…", "Downloading…") : L("Descargar reporte", "Download report")}
                </button>
              )}
              {usaCargaReal && (
                <button
                  onClick={() => handleDescargarReporte("pdf")}
                  disabled={Boolean(descargandoReporte)}
                  style={{ border: `1px solid ${COLORS.border}`, borderRadius: "6px", padding: "0.45rem 0.75rem", fontWeight: 900, fontSize: "0.75rem", cursor: descargandoReporte ? "wait" : "pointer", background: "white", color: COLORS.navy, opacity: descargandoReporte ? 0.7 : 1 }}
                >
                  {descargandoReporte === "pdf" ? L("Descargando…", "Downloading…") : L("Descargar PDF", "Download PDF")}
                </button>
              )}
              {usaCargaReal && (
                <button
                  onClick={() => handleDescargarReporte("anon")}
                  disabled={Boolean(descargandoReporte)}
                  title={L(
                    "Sin nombre de proyecto, número de expediente ni texto libre generado por IA — solo puntajes y conteos.",
                    "No project name, case number or AI-generated free text — only scores and counts."
                  )}
                  style={{ border: `1px solid ${COLORS.border}`, borderRadius: "6px", padding: "0.45rem 0.75rem", fontWeight: 900, fontSize: "0.75rem", cursor: descargandoReporte ? "wait" : "pointer", background: "white", color: COLORS.navy, opacity: descargandoReporte ? 0.7 : 1 }}
                >
                  {descargandoReporte === "anon" ? L("Descargando…", "Downloading…") : L("Resumen anonimizado", "Anonymized summary")}
                </button>
              )}
              <button
                onClick={handleRevisarIA}
                disabled={cargandoIA}
                style={{ border: "none", borderRadius: "6px", padding: "0.45rem 0.75rem", fontWeight: 900, fontSize: "0.75rem", cursor: cargandoIA ? "wait" : "pointer", background: COLORS.navy, color: "white", opacity: cargandoIA ? 0.7 : 1 }}
              >
                {cargandoIA ? L("Analizando…", "Analyzing…") : L("Revisar con IA", "Review with AI")}
              </button>
            </div>
          </div>
        </div>

        {inconsistencias && (
          <div style={{ background: inconsistencias.length ? "rgba(198,40,40,0.06)" : "rgba(46,125,50,0.08)", border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.85rem", marginBottom: "1rem" }}>
            <strong style={{ color: COLORS.navy, fontSize: "0.84rem", display: "block", marginBottom: "0.4rem" }}>
              {L("Consistencia entre documentos", "Cross-document consistency")}
            </strong>
            {inconsistencias.length === 0 && (
              <p style={{ margin: 0, color: COLORS.green, fontSize: "0.8rem" }}>
                {L("Sin inconsistencias detectadas entre los documentos cargados.", "No inconsistencies detected between the uploaded documents.")}
              </p>
            )}
            {inconsistencias.map((item, idx) => (
              <p key={idx} style={{ margin: "0 0 0.25rem", color: "#C62828", fontSize: "0.8rem", lineHeight: 1.45 }}>- {item.message}</p>
            ))}
          </div>
        )}

        <div style={{ height: "8px", background: "#E8ECF2", borderRadius: "999px", overflow: "hidden", marginBottom: "1rem" }}>
          <div style={{ width: `${requisitos.progreso}%`, height: "100%", background: requisitos.listoParaEnviar ? COLORS.green : COLORS.gold, transition: "width 0.3s" }} />
        </div>

        {revisionIA && (
          <div style={{ background: "rgba(201,168,76,0.08)", border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.85rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <strong style={{ color: COLORS.navy, fontSize: "0.84rem" }}>{L("Revisión IA del checklist", "AI review of the checklist")}</strong>
              <span style={{ color: revisionIA.score >= 80 ? COLORS.green : COLORS.amber, fontWeight: 900 }}>{revisionIA.score}/100</span>
            </div>
            {revisionIA.findings.map((finding) => (
              <p key={finding} style={{ margin: "0 0 0.25rem", color: COLORS.textMuted, fontSize: "0.8rem", lineHeight: 1.45 }}>- {finding}</p>
            ))}
          </div>
        )}

        {REQUISITOS_CATEGORIAS.map((categoria) => {
          const itemsCategoria = requisitos.items.filter((item) => item.categoria === categoria.id);
          return (
            <div key={categoria.id} style={{ marginBottom: "1.1rem" }}>
              <p style={{ margin: "0 0 0.5rem", color: COLORS.navy, fontSize: "0.82rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {pickLang(categoria.label, i18n.language)}
              </p>
              <div style={{ display: "grid", gap: "0.55rem" }}>
                {itemsCategoria.map((item) => {
                  const isListo = item.estado === "listo";
                  const isCriticoPendiente = item.critico && !isListo;
                  return (
                    <div key={item.id} style={{
                      border: `1px solid ${isCriticoPendiente ? "rgba(198,40,40,0.35)" : COLORS.border}`,
                      borderRadius: "8px", padding: "0.7rem 0.85rem",
                      background: isCriticoPendiente ? "rgba(198,40,40,0.04)" : COLORS.bg,
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
                      <div style={{ flex: "1 1 260px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <strong style={{ color: COLORS.navy, fontSize: "0.86rem" }}>{pickLang(item.label, i18n.language)}</strong>
                          {item.critico && (
                            <span style={{ fontSize: "0.65rem", fontWeight: 900, color: "#C62828", background: "rgba(198,40,40,0.1)", borderRadius: "999px", padding: "0.1rem 0.5rem" }}>
                              {L("CRITICO", "CRITICAL")}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: "0.2rem 0 0", color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.4 }}>{pickLang(item.detalle, i18n.language)}</p>
                        {item.evidenciaNombre && (
                          <p style={{ margin: "0.3rem 0 0", color: COLORS.green, fontSize: "0.74rem", fontWeight: 700 }}>
                            {L("Evidencia:", "Evidence:")} {item.evidenciaNombre}
                          </p>
                        )}
                        {usaCargaReal && item.enRevision && (
                          <p style={{ margin: "0.3rem 0 0", color: COLORS.amber, fontSize: "0.74rem", fontWeight: 700 }}>
                            {L("En revision IA…", "AI review in progress…")}
                          </p>
                        )}
                        {usaCargaReal && item.reviewScore != null && !item.enRevision && (
                          <p style={{ margin: "0.3rem 0 0", color: isListo ? COLORS.green : "#C62828", fontSize: "0.74rem", fontWeight: 700 }}>
                            {L("Score IA:", "AI score:")} {item.reviewScore}/100
                            {item.reviewFindings?.[0] ? ` — ${item.reviewFindings[0]}` : ""}
                          </p>
                        )}
                        {usaCargaReal && item.humanReviewRequired && !item.enRevision && (
                          <p style={{ margin: "0.2rem 0 0", color: COLORS.amber, fontSize: "0.7rem", fontWeight: 700 }}>
                            {L("Requiere revisión humana", "Requires human review")}
                          </p>
                        )}
                        {usaCargaReal && item.ocrStatus && item.ocrStatus !== "completed" && !item.enRevision && (
                          <p style={{ margin: "0.2rem 0 0", color: "#C62828", fontSize: "0.7rem", fontWeight: 700 }}>
                            {L("Calidad OCR:", "OCR quality:")} {item.ocrStatus}
                            {item.ocrNote ? ` — ${item.ocrNote}` : ""}
                          </p>
                        )}
                      </div>

                      <label style={{
                        fontSize: "0.72rem", fontWeight: 800, color: COLORS.navy, cursor: uploadingItemId === item.id ? "wait" : "pointer",
                        border: `1px solid ${COLORS.border}`, borderRadius: "6px", padding: "0.4rem 0.6rem",
                        opacity: uploadingItemId === item.id ? 0.6 : 1,
                      }}>
                        {uploadingItemId === item.id ? L("Subiendo…", "Uploading…") : L("Adjuntar", "Attach")}
                        <input
                          type="file"
                          disabled={uploadingItemId === item.id}
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleAdjuntar(item.id, file);
                            e.target.value = "";
                          }}
                        />
                      </label>

                      {!usaCargaReal && (
                        <button
                          onClick={() => requisitos.marcarEstado(item.id, isListo ? "pendiente" : "listo")}
                          style={{
                            border: "none", borderRadius: "6px", padding: "0.45rem 0.75rem", fontWeight: 900, fontSize: "0.76rem", cursor: "pointer",
                            background: isListo ? "rgba(46,125,50,0.12)" : COLORS.gold,
                            color: isListo ? COLORS.green : COLORS.navy,
                          }}
                        >
                          {isListo ? L("Listo", "Ready") : L("Marcar listo", "Mark ready")}
                        </button>
                      )}

                      {usaCargaReal && (
                        <span style={{
                          borderRadius: "6px", padding: "0.45rem 0.75rem", fontWeight: 900, fontSize: "0.76rem",
                          background: isListo ? "rgba(46,125,50,0.12)" : "rgba(201,168,76,0.14)",
                          color: isListo ? COLORS.green : COLORS.navy,
                        }}>
                          {isListo ? L("Listo", "Ready") : L("Pendiente", "Pending")}
                        </span>
                      )}
                    </div>

                    {item.id === "ods" && (
                      <div style={{ marginTop: "0.65rem", paddingTop: "0.65rem", borderTop: `1px solid ${COLORS.border}` }}>
                        <p style={{ margin: "0 0 0.4rem", color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase" }}>
                          {L("Selecciona los ODS aplicables (ONU)", "Select applicable SDGs (UN)")}
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                          {UN_SDG_GOALS.map((goal) => {
                            const selected = item.sdg.includes(goal.numero);
                            return (
                              <button
                                key={goal.numero}
                                onClick={() => requisitos.toggleSdg(item.id, goal.numero)}
                                title={pickLang(goal, i18n.language)}
                                style={{
                                  border: `1px solid ${selected ? COLORS.navy : COLORS.border}`,
                                  borderRadius: "999px", padding: "0.3rem 0.6rem", fontSize: "0.7rem", fontWeight: 800, cursor: "pointer",
                                  background: selected ? COLORS.navy : "white",
                                  color: selected ? "white" : COLORS.textMuted,
                                }}
                              >
                                ODS {goal.numero}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
