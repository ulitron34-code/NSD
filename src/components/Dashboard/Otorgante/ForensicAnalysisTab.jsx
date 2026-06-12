import { error, debug, info, warn } from '../../../utils/logger';
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../hooks/useAuth";
import { COLORS } from "../../../utils/constants";
import { ordersAPI, otorganteAPI } from "../../../services/api";
import { demoServiceOrders } from "../../../data/demoServiceOrders";
import {
  buildOtorgantePipeline,
  buildOtorgantePipelineFromEntries,
} from "../../../data/otorgantePipeline";
import { translateCopy, uiText } from "../../../utils/runtimeCopy";

const severityColor = {
  Critico: "#C62828",
  Alto: "#C46A1B",
  Medio: COLORS.amber,
  Bajo: COLORS.green,
};

function buildForensicFindings(opportunity, L, copy) {
  if (!opportunity) return [];

  const score = Number(opportunity.averageScore || 0);
  const docs = Number(opportunity.documentsCount || opportunity.documents?.length || 0);
  const isStartup = String(opportunity.sector || "").toLowerCase().includes("startup") || opportunity.country === "US";
  const highRisk = opportunity.risk === "Alto";
  const mediumRisk = opportunity.risk === "Medio";

  const base = [
    {
      area: L("Consistencia documental", "Document consistency"),
      severity: docs >= 5 ? "Bajo" : "Alto",
      finding: docs >= 5
        ? L("El data room contiene evidencia base suficiente para comparacion inicial.", "The data room contains enough base evidence for initial comparison.")
        : L("Data room corto: faltan documentos para validar narrativa, identidad o capacidad financiera.", "Thin data room: documents are missing to validate narrative, identity or financial capacity."),
      action: docs >= 5
        ? L("Mantener versionado y hash documental en auditoria.", "Keep versioning and document hash in audit.")
        : L("Solicitar paquete minimo antes de abrir contacto directo.", "Request minimum package before opening direct contact."),
    },
    {
      area: L("Narrativa vs evidencia", "Narrative vs evidence"),
      severity: score >= 82 ? "Bajo" : score >= 65 ? "Medio" : "Alto",
      finding: score >= 82
        ? L("La tesis del proyecto es compatible con documentos y uso de fondos visible.", "The project thesis is compatible with visible documents and use of funds.")
        : L("La narrativa es revisable, pero requiere soportes adicionales para monto, fuente de pago o contratos.", "The narrative is reviewable but needs additional support for amount, repayment source or contracts."),
      action: L("Contrastar monto solicitado contra estados financieros, contratos y presupuesto.", "Cross-check requested amount against financials, contracts and budget."),
    },
    {
      area: L("KYB / beneficiario controlador", "KYB / ultimate beneficial owner"),
      severity: highRisk ? "Critico" : mediumRisk ? "Medio" : "Bajo",
      finding: highRisk
        ? L("El perfil requiere validacion reforzada de estructura, beneficiario controlador y listas.", "The profile requires enhanced validation of structure, UBO and watchlists.")
        : L("No se observan alertas criticas en la lectura preliminar KYB demo.", "No critical alerts are observed in the preliminary demo KYB readout."),
      action: L("Validar poderes, RFC/tax ID, UBO, PEP, sanciones y relacion entre firmantes.", "Validate powers, tax ID, UBO, PEP, sanctions and relationship between signers."),
    },
    {
      area: L("Integridad de archivo", "File integrity"),
      severity: mediumRisk || highRisk ? "Medio" : "Bajo",
      finding: L("Revision preliminar preparada para detectar reemplazos, versiones, fechas y metadatos inconsistentes.", "Preliminary review prepared to detect replacements, versions, dates and inconsistent metadata."),
      action: L("Registrar hash, version, usuario, fecha de carga y motivo de sustitucion.", "Record hash, version, user, upload date and replacement reason."),
    },
  ];

  if (isStartup) {
    base.push({
      area: L("Metricas SaaS / traccion", "SaaS metrics / traction"),
      severity: "Alto",
      finding: L("Caso startup: MRR, churn, runway y cap table deben contrastarse antes de decision.", "Startup case: MRR, churn, runway and cap table must be cross-checked before decision."),
      action: L("Solicitar dashboard MRR, cohortes, contratos y conciliacion de ingresos.", "Request MRR dashboard, cohorts, contracts and revenue reconciliation."),
    });
  }

  return base;
}

function buildCustodyEvents(opportunity, L) {
  if (!opportunity) return [];

  const created = opportunity.createdAt || "2026-05-24T16:20:00.000Z";
  return [
    [L("Carga inicial", "Initial upload"), created, L("Solicitante cargo expediente base.", "Applicant uploaded base file.")],
    [L("Data room compartido", "Data room shared"), opportunity.share?.acceptedAt || created, opportunity.share ? L("Acceso otorgante registrado.", "Funder access recorded.") : L("Invitacion pendiente o no aceptada.", "Invitation pending or not accepted.")],
    [L("Interes institucional", "Institutional interest"), opportunity.interest?.created_at || created, opportunity.interest ? L("Otorgante registro apetito o revision interna.", "Funder recorded appetite or internal review.") : L("Sin interes registrado.", "No interest recorded.")],
    [L("Contacto controlado", "Controlled contact"), opportunity.contactRequest?.created_at || created, opportunity.contactRequest ? L("Solicitud de contacto registrada.", "Contact request recorded.") : L("Contacto no solicitado.", "Contact not requested.")],
  ];
}

function buildForensicVerdict(findings, opportunity, L) {
  const critical = findings.filter((item) => item.severity === "Critico").length;
  const high = findings.filter((item) => item.severity === "Alto").length;
  const score = Number(opportunity?.averageScore || 0);

  if (critical > 0) {
    return {
      label: L("Pausar por alerta critica", "Pause due to critical alert"),
      tone: "#C62828",
      detail: L("No conviene avanzar a comite hasta completar revision reforzada y preservar evidencia.", "Do not advance to committee until enhanced review is completed and evidence is preserved."),
    };
  }

  if (high > 0 || score < 70) {
    return {
      label: L("Revision reforzada", "Enhanced review"),
      tone: COLORS.amber,
      detail: L("El expediente es revisable, pero requiere aclaraciones forenses antes de contacto o term sheet.", "The file is reviewable but needs forensic clarifications before contact or term sheet."),
    };
  }

  return {
    label: L("Sin red flags criticas", "No critical red flags"),
    tone: COLORS.green,
    detail: L("La lectura forense preliminar no detecta alertas criticas; mantener trazabilidad y revision humana.", "The preliminary forensic readout does not detect critical alerts; keep traceability and human review."),
  };
}

function buildAgentPayload(opportunity, findings, custodyEvents, L, copy) {
  if (!opportunity) return null;

  return {
    endpoint: `/api/ai-agents/forensic/${opportunity.id}/analyze`,
    method: "POST",
    status: L("Preparado para integracion", "Ready for integration"),
    payload: {
      orderId: opportunity.id,
      applicant: opportunity.applicant,
      project: copy(opportunity.name),
      country: opportunity.country,
      sector: copy(opportunity.sector),
      requestedAmount: opportunity.amountLabel,
      score: opportunity.averageScore,
      visibleRisk: copy(opportunity.risk),
      documentsCount: opportunity.documentsCount || opportunity.documents?.length || 0,
      findings: findings.map((item) => ({
        area: item.area,
        severity: item.severity,
        finding: item.finding,
        action: item.action,
      })),
      custodyEvents: custodyEvents.map(([event, date, detail]) => ({ event, date, detail })),
      requiredOutputs: [
        "forensic_findings",
        "red_flags",
        "evidence_gaps",
        "kyb_checks",
        "document_integrity",
        "committee_memo",
      ],
    },
  };
}

function formatPayload(payload) {
  if (!payload) return "";
  return JSON.stringify(payload, null, 2);
}

function buildForensicMemo(opportunity, findings, verdict, custodyEvents, L, copy) {
  if (!opportunity) return "";

  return [
    `# ${L("Analisis forense preliminar NSD", "NSD Preliminary Forensic Analysis")}`,
    "",
    `- ${L("Expediente", "File")}: ${opportunity.id}`,
    `- ${L("Proyecto", "Project")}: ${copy(opportunity.name)}`,
    `- ${L("Solicitante", "Applicant")}: ${opportunity.applicant}`,
    `- ${L("Sector", "Sector")}: ${copy(opportunity.sector)}`,
    `- ${L("Ticket", "Ticket")}: ${opportunity.amountLabel}`,
    `- ${L("Score integral", "Integrated score")}: ${opportunity.averageScore}/100`,
    `- ${L("Riesgo visible", "Visible risk")}: ${copy(opportunity.risk)}`,
    `- ${L("Conclusion", "Conclusion")}: ${verdict.label}`,
    "",
    `## ${L("Hallazgos", "Findings")}`,
    ...findings.map((item) => `- ${item.severity} | ${item.area}: ${item.finding} ${L("Accion", "Action")}: ${item.action}`),
    "",
    `## ${L("Cadena de custodia", "Chain of custody")}`,
    ...custodyEvents.map(([event, date, detail]) => `- ${event} | ${date}: ${detail}`),
    "",
    `## ${L("Nota legal-operativa", "Legal-operational note")}`,
    L(
      "Este analisis es preliminar y asistido. No declara fraude ni sustituye investigacion humana, dictamen legal, decision crediticia o revision de cumplimiento del otorgante.",
      "This analysis is preliminary and assisted. It does not declare fraud or replace human investigation, legal opinion, credit decision or the funder's compliance review."
    ),
  ].join("\n");
}

export default function ForensicAnalysisTab() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const copy = (value) => translateCopy(value, i18n.language);
  const [opportunities, setOpportunities] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
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

        if (!active) return;
        setOpportunities(mapped);
        setSelectedId((current) => current || mapped[0]?.id || "");
      } catch {
        if (!active) return;
        const mapped = buildOtorgantePipeline(demoServiceOrders);
        setOpportunities(mapped);
        setSelectedId(mapped[0]?.id || "");
        setError(L("No se pudo cargar el pipeline real; mostrando base demo.", "Could not load live pipeline; showing demo baseline."));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [user?.demo, i18n.language]);

  const selected = useMemo(
    () => opportunities.find((item) => item.id === selectedId) || opportunities[0] || null,
    [opportunities, selectedId]
  );
  const findings = useMemo(() => buildForensicFindings(selected, L, copy), [selected, i18n.language]);
  const custodyEvents = useMemo(() => buildCustodyEvents(selected, L), [selected, i18n.language]);
  const verdict = useMemo(() => buildForensicVerdict(findings, selected, L), [findings, selected, i18n.language]);
  const agentPayload = useMemo(() => buildAgentPayload(selected, findings, custodyEvents, L, copy), [selected, findings, custodyEvents, i18n.language]);
  const criticalCount = findings.filter((item) => item.severity === "Critico").length;
  const highCount = findings.filter((item) => item.severity === "Alto").length;
  const mediumCount = findings.filter((item) => item.severity === "Medio").length;

  const downloadMemo = () => {
    const memo = buildForensicMemo(selected, findings, verdict, custodyEvents, L, copy);
    const blob = new Blob([memo], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${i18n.language === "en" ? "forensic-analysis" : "analisis-forense"}-${selected?.id || "expediente"}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <section style={{
        background: "linear-gradient(135deg, #0F1F2E 0%, #1B3A5C 68%, #7A1F1F 145%)",
        color: COLORS.white,
        borderRadius: "16px",
        padding: "1.6rem",
        boxShadow: COLORS.shadowMd,
      }}>
        <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          {L("Otorgantes / antifraude y evidencia", "Funders / anti-fraud and evidence")}
        </p>
        <h1 style={{ margin: "0.35rem 0", color: COLORS.white, fontSize: "1.7rem" }}>
          {L("Analisis forense preliminar", "Preliminary Forensic Analysis")}
        </h1>
        <p style={{ margin: 0, maxWidth: "920px", color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>
          {L(
            "Vista asistida para detectar inconsistencias, senales antifraude, brechas KYB y eventos de custodia antes de llevar un expediente a comite. No declara fraude: prioriza revision humana y evidencia trazable.",
            "Assisted view to detect inconsistencies, anti-fraud signals, KYB gaps and custody events before taking a file to committee. It does not declare fraud: it prioritizes human review and traceable evidence."
          )}
        </p>
        {loading && <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.82rem", marginTop: "0.7rem" }}>{L("Cargando expedientes...", "Loading files...")}</p>}
        {error && <p style={{ color: "#FFD4D4", fontSize: "0.82rem", marginTop: "0.7rem" }}>{error}</p>}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "0.75rem" }}>
        {[
          [L("Conclusion", "Conclusion"), verdict.label, verdict.tone],
          [L("Criticas", "Critical"), criticalCount, "#C62828"],
          [L("Altas", "High"), highCount, "#C46A1B"],
          [L("Medias", "Medium"), mediumCount, COLORS.amber],
        ].map(([label, value, color]) => (
          <article key={label} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
            <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "0.3rem" }}>{label}</p>
            <p style={{ color, fontSize: typeof value === "number" ? "1.5rem" : "0.98rem", fontWeight: 900, lineHeight: 1.25 }}>{value}</p>
          </article>
        ))}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem", alignItems: "start" }}>
        <aside style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
            {L("Expedientes", "Files")}
          </p>
          <div style={{ display: "grid", gap: "0.55rem" }}>
            {opportunities.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                style={{
                  padding: "0.78rem",
                  borderRadius: "8px",
                  border: `1px solid ${selected?.id === item.id ? COLORS.gold : COLORS.border}`,
                  background: selected?.id === item.id ? "rgba(201,168,76,0.12)" : COLORS.bg,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <strong style={{ display: "block", color: COLORS.navy, fontSize: "0.84rem", marginBottom: "0.2rem" }}>{copy(item.name)}</strong>
                <span style={{ display: "block", color: COLORS.textMuted, fontSize: "0.74rem", lineHeight: 1.35 }}>{copy(item.sector)} / {item.amountLabel}</span>
                <span style={{ display: "block", color: item.risk === "Bajo" ? COLORS.green : item.risk === "Medio" ? COLORS.amber : "#C62828", fontWeight: 900, fontSize: "0.76rem", marginTop: "0.25rem" }}>
                  {copy(item.risk)} / {item.averageScore}/100
                </span>
              </button>
            ))}
          </div>
        </aside>

        {selected ? (
          <main style={{ display: "grid", gap: "1rem" }}>
            <article style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "flex-start" }}>
                <div>
                  <p style={{ color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>
                    {L("Expediente seleccionado", "Selected file")}
                  </p>
                  <h2 style={{ color: COLORS.navy, fontSize: "1.2rem", marginBottom: "0.2rem" }}>{copy(selected.name)}</h2>
                  <p style={{ color: COLORS.textMuted, fontSize: "0.85rem" }}>{selected.applicant} / {copy(selected.sector)} / {selected.country}</p>
                </div>
                <button
                  type="button"
                  onClick={downloadMemo}
                  style={{ padding: "0.7rem 0.9rem", border: "none", borderRadius: "6px", background: COLORS.navy, color: COLORS.white, fontWeight: 900, cursor: "pointer" }}
                >
                  {L("Descargar memo forense", "Download forensic memo")}
                </button>
              </div>
              <div style={{ marginTop: "0.9rem", background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.35)", borderRadius: "8px", padding: "0.9rem" }}>
                <p style={{ color: COLORS.navy, fontWeight: 900, marginBottom: "0.25rem" }}>{verdict.label}</p>
                <p style={{ color: COLORS.textMuted, fontSize: "0.84rem", lineHeight: 1.5 }}>{verdict.detail}</p>
              </div>
            </article>

            <article style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
              <p style={{ color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.85rem" }}>
                {L("Matriz forense de hallazgos", "Forensic findings matrix")}
              </p>
              <div style={{ display: "grid", gap: "0.7rem" }}>
                {findings.map((item) => (
                  <div key={item.area} style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.85rem", background: COLORS.bg }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center", marginBottom: "0.35rem" }}>
                      <strong style={{ color: COLORS.navy, fontSize: "0.9rem" }}>{item.area}</strong>
                      <span style={{ color: severityColor[item.severity], fontWeight: 900, fontSize: "0.76rem" }}>{L(item.severity, item.severity === "Critico" ? "Critical" : item.severity === "Alto" ? "High" : item.severity === "Medio" ? "Medium" : "Low")}</span>
                    </div>
                    <p style={{ color: COLORS.textMuted, fontSize: "0.82rem", lineHeight: 1.5, marginBottom: "0.45rem" }}>{item.finding}</p>
                    <p style={{ color: COLORS.navy, fontSize: "0.78rem", lineHeight: 1.45, fontWeight: 800 }}>{item.action}</p>
                  </div>
                ))}
              </div>
            </article>

            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
              <article style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
                <p style={{ color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.85rem" }}>
                  {L("Cadena de custodia", "Chain of custody")}
                </p>
                <div style={{ display: "grid", gap: "0.65rem" }}>
                  {custodyEvents.map(([event, date, detail], index) => (
                    <div key={`${event}-${index}`} style={{ display: "grid", gridTemplateColumns: "32px 1fr", gap: "0.7rem" }}>
                      <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: COLORS.gold, color: COLORS.navy, display: "grid", placeItems: "center", fontWeight: 900, fontSize: "0.72rem" }}>{index + 1}</span>
                      <span>
                        <strong style={{ display: "block", color: COLORS.navy, fontSize: "0.82rem" }}>{event}</strong>
                        <span style={{ display: "block", color: COLORS.textMuted, fontSize: "0.74rem", lineHeight: 1.4 }}>{date}</span>
                        <span style={{ display: "block", color: COLORS.text, fontSize: "0.78rem", lineHeight: 1.4 }}>{detail}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </article>

              <article style={{ background: "#102235", color: COLORS.white, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
                <p style={{ color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.8rem" }}>
                  {L("Alcance y limites", "Scope and limits")}
                </p>
                <div style={{ display: "grid", gap: "0.65rem" }}>
                  {[
                    [L("No declara fraude", "Does not declare fraud"), L("Solo identifica senales que requieren revision humana.", "Only identifies signals requiring human review.")],
                    [L("No aprueba credito", "Does not approve credit"), L("El otorgante conserva su politica, comite y decision final.", "The funder keeps its policy, committee and final decision.")],
                    [L("Preserva evidencia", "Preserves evidence"), L("Recomienda hash, versionado, bitacora y motivo de sustitucion.", "Recommends hash, versioning, audit log and replacement reason.")],
                    [L("Escala por riesgo", "Escalates by risk"), L("Activa biometria, KYB reforzado u OCR cuando el caso lo amerite.", "Activates biometrics, enhanced KYB or OCR when the case requires it.")],
                  ].map(([title, detail]) => (
                    <div key={title} style={{ borderLeft: `3px solid ${COLORS.gold}`, paddingLeft: "0.7rem" }}>
                      <strong style={{ display: "block", color: COLORS.white, fontSize: "0.82rem" }}>{title}</strong>
                      <span style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.76rem", lineHeight: 1.4 }}>{detail}</span>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
              <article style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
                <p style={{ color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.85rem" }}>
                  {L("Agentes IA previstos", "Planned AI agents")}
                </p>
                <div style={{ display: "grid", gap: "0.7rem" }}>
                  {[
                    [
                      L("Agente documental", "Document agent"),
                      L("OCR, hash, versiones, metadatos, vigencias y sustituciones.", "OCR, hashes, versions, metadata, expirations and replacements."),
                      L("Listo para API", "API-ready"),
                    ],
                    [
                      L("Agente KYB / antifraude", "KYB / anti-fraud agent"),
                      L("UBO, PEP, sanciones, poderes, firmantes y estructura corporativa.", "UBO, PEP, sanctions, powers, signers and corporate structure."),
                      L("Listo para API", "API-ready"),
                    ],
                    [
                      L("Agente financiero", "Financial agent"),
                      L("Monto, fuente de pago, contratos, ingresos, MRR y runway.", "Amount, repayment source, contracts, revenue, MRR and runway."),
                      L("Listo para API", "API-ready"),
                    ],
                    [
                      L("Agente comite", "Committee agent"),
                      L("Sintesis de hallazgos, mitigantes y preguntas para decision interna.", "Findings synthesis, mitigants and questions for internal decision."),
                      L("Listo para API", "API-ready"),
                    ],
                  ].map(([title, detail, status]) => (
                    <div key={title} style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.85rem", background: COLORS.bg }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.65rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                        <strong style={{ color: COLORS.navy, fontSize: "0.86rem" }}>{title}</strong>
                        <span style={{ color: COLORS.green, fontSize: "0.72rem", fontWeight: 900 }}>{status}</span>
                      </div>
                      <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45 }}>{detail}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article style={{ background: "#0F1F2E", borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm, color: COLORS.white }}>
                <p style={{ color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.35rem" }}>
                  {L("Contrato API futuro", "Future API contract")}
                </p>
                <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.78rem", lineHeight: 1.45, marginBottom: "0.8rem" }}>
                  {L(
                    "Este bloque deja claro como se conectara la pestana FOR con agentes IA cuando el backend tenga OCR, hashing y servicios externos.",
                    "This block clarifies how the FOR tab will connect with AI agents once the backend has OCR, hashing and external services."
                  )}
                </p>
                <div style={{ display: "grid", gap: "0.6rem", marginBottom: "0.8rem" }}>
                  <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "0.75rem" }}>
                    <strong style={{ display: "block", color: COLORS.white, fontSize: "0.78rem", marginBottom: "0.2rem" }}>{agentPayload?.method} {agentPayload?.endpoint}</strong>
                    <span style={{ color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900 }}>{agentPayload?.status}</span>
                  </div>
                </div>
                <pre style={{
                  margin: 0,
                  maxHeight: "260px",
                  overflow: "auto",
                  background: "rgba(0,0,0,0.28)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  padding: "0.85rem",
                  color: "rgba(255,255,255,0.82)",
                  fontSize: "0.68rem",
                  lineHeight: 1.45,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}>
                  {formatPayload(agentPayload?.payload)}
                </pre>
              </article>
            </section>
          </main>
        ) : (
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", color: COLORS.textMuted }}>
            {L("No hay expedientes disponibles para analisis forense.", "No files available for forensic analysis.")}
          </div>
        )}
      </section>
    </div>
  );
}
