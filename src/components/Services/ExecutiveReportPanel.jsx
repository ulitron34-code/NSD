import React, { useState, useEffect } from "react";
import { COLORS } from "../../utils/constants";
import { scoringAPI } from "../../services/api";
import { BRAND } from "../../config/brand";

export default function ExecutiveReportPanel({ order }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerateReport = async () => {
    setLoading(true);
    setError("");
    try {
      if (order.demo || String(order.id).startsWith("demo-")) {
        setReport({
          globalScore: 78,
          decisionRecommendation: "conditional",
          executiveConclusion: "El expediente demo es viable para avanzar a comite sujeto a subsanar flujo de caja historico y validar estados financieros auditados.",
          matrix: { entity: "BANCA_COMERCIAL", sector: "Manufacturero" },
          agentResults: [
            {
              reviewArea: "documental",
              score: 78,
              decisionImpact: "conditional",
              keyFindings: ["3 documentos vinculados al expediente demo."],
              redFlags: ["Flujo de Caja Historico", "Estados financieros auditados 2025"]
            }
          ],
          criticalRisks: ["Estados financieros recientes pendientes de validacion."],
          mitigants: ["Acta constitutiva y constancia fiscal cargadas."],
          missingInformation: ["Flujo de Caja Historico", "Estados financieros auditados 2025"],
          recommendedConditions: ["Subsanar flujo de caja historico", "Cargar estados financieros auditados 2025"],
          regulatoryValidation: {
            country: "MX",
            status: "review",
            summary: { passed: 1, failed: 0, skipped: 2, total: 3 },
            checks: [
              { name: "Formato RFC", status: "pass", detail: "RFC con estructura valida." },
              { name: "Padron fiscal SAT", status: "skipped", detail: "Proveedor no configurado." },
              { name: "Listas restrictivas", status: "skipped", detail: "Proveedor no configurado." }
            ]
          },
          generatedAt: new Date().toISOString()
        });
        return;
      }

      const { data } = await scoringAPI.getInstitutionalMemo(order.id);
      setReport(data);
    } catch (err) {
      setError("Error al generar el reporte ejecutivo automatizado.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setReport(null);
    setError("");
  }, [order.id]);

  const getScoreColor = (score) => {
    if (score >= 80) return COLORS.green;
    if (score >= 60) return COLORS.amber;
    return "#dc2626"; // Red
  };

  const getRegulatoryStatusColor = (status) => {
    if (status === "pass" || status === "clear") return COLORS.green;
    if (status === "review" || status === "review_required" || status === "skipped" || status === "configured") return COLORS.amber;
    return "#dc2626";
  };

  const downloadMemo = () => {
    if (!report?.memo?.content) return;
    const blob = new Blob([report.memo.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.memo.title || "memo-institucional-nsd"}.md`.replace(/[\\/:*?"<>|]/g, "-");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyMemo = async () => {
    if (!report?.memo?.content) return;
    await navigator.clipboard.writeText(report.memo.content);
  };

  if (!report && !loading) {
    return (
      <div style={{ background: "white", padding: "3rem", textAlign: "center", borderRadius: "12px", border: `1px solid ${COLORS.border}` }}>
        <h3 style={{ color: COLORS.navy, marginBottom: "1rem" }}>Reporte Ejecutivo Pendiente</h3>
        <p style={{ color: COLORS.textMuted, marginBottom: "2rem" }}>
          Calcula la matriz documental, score, riesgos y condiciones sugeridas del expediente.
        </p>
        <button 
          onClick={handleGenerateReport}
          style={{
            background: COLORS.navy,
            color: "white",
            padding: "1rem 2rem",
            border: "none",
            borderRadius: "8px",
            fontWeight: 800,
            cursor: "pointer",
            fontSize: "1rem"
          }}
        >
          Generar Reporte Ejecutivo
        </button>
        {error && <p style={{ color: "#dc2626", marginTop: "1rem" }}>{error}</p>}
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ background: "white", padding: "3rem", textAlign: "center", borderRadius: "12px", border: `1px solid ${COLORS.border}` }}>
        <div style={{ animation: "pulse 1.5s infinite" }}>
          <h3 style={{ color: COLORS.navy }}>Analizando Expediente Completo...</h3>
          <p style={{ color: COLORS.textMuted }}>{`${BRAND.name} esta cruzando documentos, revisiones IA y matriz de requisitos.`}</p>
        </div>
      </div>
    );
  }

  const scoreColor = getScoreColor(report.globalScore);

  return (
    <div style={{ background: "white", borderRadius: "12px", border: `1px solid ${COLORS.border}`, overflow: "hidden", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
      {/* Header Ejecutivo */}
      <div style={{ background: COLORS.navy, padding: "2rem", color: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <div>
            <p style={{ color: COLORS.gold, fontWeight: 800, textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
              Reporte de Cumplimiento IA
            </p>
            <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "1.5rem" }}>
              Dictamen Expediente #{order.id.slice(0,8)}
            </h2>
            <p style={{ margin: 0, opacity: 0.8, fontSize: "0.95rem" }}>
              {`Generado automaticamente por ${BRAND.name} Scoring Engine`}
            </p>
            {report.memo?.content && (
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
                <button
                  onClick={downloadMemo}
                  style={{ padding: "0.65rem 0.9rem", border: "none", borderRadius: "6px", background: COLORS.gold, color: COLORS.navy, fontWeight: 900, cursor: "pointer" }}
                >
                  Descargar memo MD
                </button>
                <button
                  onClick={copyMemo}
                  style={{ padding: "0.65rem 0.9rem", border: "1px solid rgba(255,255,255,0.35)", borderRadius: "6px", background: "transparent", color: "white", fontWeight: 900, cursor: "pointer" }}
                >
                  Copiar memo
                </button>
              </div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ 
              background: "white", 
              color: scoreColor, 
              padding: "1rem", 
              borderRadius: "50%", 
              width: "80px", 
              height: "80px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              border: `4px solid ${scoreColor}`
            }}>
              <span style={{ fontSize: "1.8rem", fontWeight: 900, lineHeight: 1 }}>{report.globalScore}</span>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: COLORS.navy }}>/100</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "2rem" }}>
        {/* Recomendacion Preliminar */}
        <div style={{ marginBottom: "2rem", paddingBottom: "2rem", borderBottom: `1px solid ${COLORS.border}` }}>
          <h3 style={{ color: COLORS.navy, fontSize: "1.1rem", marginBottom: "1rem" }}>1. Conclusión Ejecutiva</h3>
          <p style={{ color: COLORS.text, lineHeight: 1.6, fontSize: "1rem" }}>
            {report.executiveConclusion}
          </p>
          <div style={{ 
            marginTop: "1.5rem", 
            padding: "1rem", 
            background: report.decisionRecommendation === 'approve' ? '#f0fdf4' : report.decisionRecommendation === 'conditional' ? '#fffbeb' : '#fef2f2',
            borderRadius: "8px",
            border: `1px solid ${report.decisionRecommendation === 'approve' ? COLORS.green : report.decisionRecommendation === 'conditional' ? COLORS.amber : '#dc2626'}`
          }}>
            <p style={{ margin: 0, fontWeight: 700, color: COLORS.navy }}>
              Decisión sugerida: <span style={{ textTransform: "uppercase" }}>{report.decisionRecommendation}</span>
            </p>
          </div>
        </div>

        {/* Desglose por area */}
        <div style={{ marginBottom: "2rem", paddingBottom: "2rem", borderBottom: `1px solid ${COLORS.border}` }}>
          <h3 style={{ color: COLORS.navy, fontSize: "1.1rem", marginBottom: "1rem" }}>2. Desglose por Agente de Revisión</h3>
          <div style={{ display: "grid", gap: "1rem" }}>
            {report.agentResults.map((agent, idx) => (
              <div key={idx} style={{ padding: "1rem", background: COLORS.bg, borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ margin: "0 0 0.25rem 0", color: COLORS.navy, textTransform: "capitalize" }}>
                    Agente {agent.reviewArea}
                  </h4>
                  <p style={{ margin: 0, color: COLORS.textMuted, fontSize: "0.85rem" }}>
                    {agent.keyFindings[0]}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span style={{ fontWeight: 800, color: getScoreColor(agent.score), fontSize: "1.1rem" }}>
                    {agent.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Riesgos y Mitigantes */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem", paddingBottom: "2rem", borderBottom: `1px solid ${COLORS.border}` }}>
          <div>
            <h3 style={{ color: COLORS.navy, fontSize: "1.1rem", marginBottom: "1rem" }}>3. Riesgos Críticos</h3>
            {report.criticalRisks.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: "1.5rem", color: "#dc2626", lineHeight: 1.5 }}>
                {report.criticalRisks.map((risk, i) => <li key={i}>{risk}</li>)}
              </ul>
            ) : (
              <p style={{ color: COLORS.textMuted }}>No se detectaron riesgos críticos.</p>
            )}
          </div>
          <div>
            <h3 style={{ color: COLORS.navy, fontSize: "1.1rem", marginBottom: "1rem" }}>4. Factores Mitigantes</h3>
            {report.mitigants.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: "1.5rem", color: COLORS.green, lineHeight: 1.5 }}>
                {report.mitigants.map((mit, i) => <li key={i}>{mit}</li>)}
              </ul>
            ) : (
              <p style={{ color: COLORS.textMuted }}>Sin mitigantes identificados.</p>
            )}
          </div>
        </div>

        {report.regulatoryValidation && (
          <div style={{ marginBottom: "2rem", paddingBottom: "2rem", borderBottom: `1px solid ${COLORS.border}` }}>
            <h3 style={{ color: COLORS.navy, fontSize: "1.1rem", marginBottom: "1rem" }}>5. Validacion Regulatoria</h3>
            <div style={{
              padding: "1rem",
              border: `1px solid ${getRegulatoryStatusColor(report.regulatoryValidation.status)}`,
              borderRadius: "8px",
              background: report.regulatoryValidation.status === "pass" || report.regulatoryValidation.status === "clear" ? "#f0fdf4" : report.regulatoryValidation.status === "fail" ? "#fef2f2" : "#fffbeb",
              marginBottom: "1rem"
            }}>
              <p style={{ margin: "0 0 0.35rem 0", color: COLORS.navy, fontWeight: 900 }}>
                Estatus: <span style={{ color: getRegulatoryStatusColor(report.regulatoryValidation.status), textTransform: "uppercase" }}>{report.regulatoryValidation.status}</span>
              </p>
              <p style={{ margin: 0, color: COLORS.textMuted, fontSize: "0.9rem" }}>
                País {report.regulatoryValidation.country || "N/D"} · {report.regulatoryValidation.summary?.passed || 0} aprobadas · {report.regulatoryValidation.summary?.failed || 0} fallidas · {report.regulatoryValidation.summary?.skipped || 0} sin proveedor
              </p>
            </div>
            <div style={{ display: "grid", gap: "0.65rem" }}>
              {(report.regulatoryValidation.checks || []).slice(0, 5).map((check, index) => (
                <div key={`${check.name}-${index}`} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", padding: "0.8rem", background: COLORS.bg, borderRadius: "8px" }}>
                  <div>
                    <p style={{ margin: "0 0 0.2rem 0", color: COLORS.navy, fontWeight: 800 }}>{check.name}</p>
                    <p style={{ margin: 0, color: COLORS.textMuted, fontSize: "0.82rem" }}>{check.detail}</p>
                  </div>
                  <span style={{ color: getRegulatoryStatusColor(check.status), fontWeight: 900, textTransform: "uppercase", fontSize: "0.78rem" }}>
                    {check.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Faltantes y Condiciones */}
        <div>
          <h3 style={{ color: COLORS.navy, fontSize: "1.1rem", marginBottom: "1rem" }}>{report.regulatoryValidation ? "6" : "5"}. Subsanaciones Recomendadas</h3>
          <ul style={{ margin: "0 0 1rem 0", paddingLeft: "1.5rem", color: COLORS.navy, lineHeight: 1.5, fontWeight: 600 }}>
            {report.missingInformation.map((info, i) => <li key={i}>{info}</li>)}
          </ul>
          <p style={{ color: COLORS.textMuted, fontSize: "0.9rem" }}>
            <strong>Condiciones Previas:</strong> {report.recommendedConditions.join('; ')}
          </p>
        </div>

        {report.memo?.content && (
          <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: `1px solid ${COLORS.border}` }}>
            <h3 style={{ color: COLORS.navy, fontSize: "1.1rem", marginBottom: "1rem" }}>Memo institucional</h3>
            <pre style={{
              whiteSpace: "pre-wrap",
              background: COLORS.bg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "8px",
              padding: "1rem",
              color: COLORS.text,
              fontSize: "0.82rem",
              lineHeight: 1.5,
              maxHeight: "360px",
              overflow: "auto"
            }}>
              {report.memo.content}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
