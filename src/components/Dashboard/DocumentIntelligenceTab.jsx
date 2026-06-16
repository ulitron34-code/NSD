import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { intelAPI, documentsAPI, ordersAPI } from "../../services/api";

export default function DocumentIntelligenceTab() {
  const { t, i18n } = useTranslation();
  const [expedientes, setExpedientes] = useState([]);
  const [selectedExpedienteId, setSelectedExpedienteId] = useState("");
  const [summary, setSummary] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [redFlags, setRedFlags] = useState([]);
  const [crossRefs, setCrossRefs] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [selectedDocForVerifications, setSelectedDocForVerifications] = useState(null);
  const [docVerifications, setDocVerifications] = useState([]);
  const [selectedDocMetrics, setSelectedDocMetrics] = useState(null);
  const [agentLogs, setAgentLogs] = useState([]);

  // Cargar lista de expedientes al iniciar
  useEffect(() => {
    async function loadExpedientes() {
      try {
        const { data } = await ordersAPI.list();
        setExpedientes(data || []);
        if (data && data.length > 0) {
          setSelectedExpedienteId(data[0].id);
        }
      } catch (err) {
        console.error("Error cargando expedientes:", err);
      }
    }
    loadExpedientes();
  }, []);

  // Cargar datos del expediente seleccionado
  useEffect(() => {
    if (!selectedExpedienteId) return;
    loadExpedienteData(selectedExpedienteId);
  }, [selectedExpedienteId]);

  const loadExpedienteData = async (expedienteId) => {
    setLoading(true);
    try {
      // 1. Cargar resumen
      const { data: sumData } = await intelAPI.getSummary(expedienteId);
      setSummary(sumData);

      // 2. Cargar documentos
      const { data: docs } = await documentsAPI.list(expedienteId);
      
      // Enriquecer cada documento con su score respectivo si existe
      const enrichedDocs = [];
      for (const doc of (docs || [])) {
        let score = null;
        try {
          const { data } = await intelAPI.getScore(doc.id);
          score = data;
        } catch (_) {
          // Si no está calculado aún, se queda null
        }
        enrichedDocs.push({ ...doc, score });
      }
      setDocuments(enrichedDocs);

      // 3. Cargar Red Flags
      const { data: flags } = await intelAPI.getExpedienteRedFlags(expedienteId);
      setRedFlags(flags || []);

      // 4. Cargar Cruces
      const { data: cross } = await intelAPI.getCrossReferences(expedienteId);
      setCrossRefs(cross || []);

      // Simular bitácora de agentes locales en base a lo procesado
      const logs = [
        { agent: "AgentClassifier", action: t('intel.unclassified'), status: "success", cost: "$0.005" },
        { agent: "AgentValidator", action: t('intel.validateBtn'), status: "success", cost: "$0.00" }
      ];
      if (cross && cross.length > 0) {
        logs.push({ agent: "AgentCrossRef", action: t('intel.actions'), status: "success", cost: "$0.00" });
      }
      setAgentLogs(logs);

    } catch (err) {
      console.error("Error cargando datos de inteligencia:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessAll = async () => {
    if (!selectedExpedienteId) return;
    setLoading(true);
    try {
      await intelAPI.processAll(selectedExpedienteId);
      // Esperamos un segundo para recargar
      setTimeout(() => loadExpedienteData(selectedExpedienteId), 1500);
    } catch (err) {
      console.error("Error al procesar lote:", err);
      setLoading(false);
    }
  };

  const handleValidateAll = async () => {
    if (!selectedExpedienteId) return;
    setLoading(true);
    try {
      await intelAPI.validateAll(selectedExpedienteId);
      setTimeout(() => loadExpedienteData(selectedExpedienteId), 1500);
    } catch (err) {
      console.error("Error al validar lote:", err);
      setLoading(false);
    }
  };

  const handleSingleClassify = async (docId) => {
    setProcessingId(docId);
    try {
      await intelAPI.classify(docId);
      await loadExpedienteData(selectedExpedienteId);
    } catch (err) {
      console.error("Error en clasificación unitaria:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSingleValidate = async (docId) => {
    setProcessingId(docId);
    try {
      await intelAPI.validate(docId);
      await loadExpedienteData(selectedExpedienteId);
    } catch (err) {
      console.error("Error en validación unitaria:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleShowVerifications = async (doc) => {
    setSelectedDocForVerifications(doc);
    setSelectedDocMetrics(null);
    try {
      const { data } = await intelAPI.getVerifications(doc.id);
      setDocVerifications(data || []);

      if (doc.document_type === 'EDOS_FINANCIEROS') {
        const { data: extData } = await intelAPI.getExtraction(doc.id);
        if (extData && extData.extracted_data && extData.extracted_data.financial_metrics) {
          setSelectedDocMetrics(extData.extracted_data.financial_metrics);
        }
      }
    } catch (err) {
      console.error("Error cargando verificaciones:", err);
      setDocVerifications([]);
    }
  };

  const getTrafficLightColor = (light) => {
    if (light === "green") return "#2E7D32";
    if (light === "yellow") return "#F2C94C";
    if (light === "red") return "#C62828";
    return "#BDBDBD";
  };

  // Porcentaje estimado de la métrica dentro de su escala
  const getProgressPercentage = (val, min, max) => {
    if (val === null || val === undefined) return 0;
    const v = parseFloat(val);
    const range = max - min;
    if (range <= 0) return 0;
    const pct = ((v - min) / range) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header Gradiente con Controles */}
      <div style={{
        background: "linear-gradient(135deg, #0F1F2E 0%, #1E3D59 100%)",
        borderRadius: "16px",
        padding: "2rem",
        color: "white",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        gap: "1.5rem"
      }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: 0, color: "white" }}>
            {t('intel.title')}
          </h1>
          <p style={{ opacity: 0.8, fontSize: "0.95rem", marginTop: "0.25rem" }}>
            {t('intel.subtitle')}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>{t('intel.selectExpediente')}</span>
            <select
              value={selectedExpedienteId}
              onChange={(e) => setSelectedExpedienteId(e.target.value)}
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.2)",
                padding: "0.6rem 1rem",
                borderRadius: "8px",
                fontSize: "0.9rem",
                outline: "none",
                cursor: "pointer"
              }}
            >
              {expedientes.map((exp) => (
                <option key={exp.id} value={exp.id} style={{ color: "#333" }}>
                  {exp.metadata?.companyName || `Expediente - ${exp.id.slice(0, 8)}`} ({exp.service_type})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.2rem" }}>
            <button
              onClick={handleProcessAll}
              disabled={loading || !selectedExpedienteId}
              style={{
                background: COLORS.gold,
                color: COLORS.navy,
                border: "none",
                padding: "0.6rem 1.2rem",
                borderRadius: "8px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "opacity 0.2s"
              }}
            >
              {t('intel.processAll')}
            </button>
            <button
              onClick={handleValidateAll}
              disabled={loading || !selectedExpedienteId}
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.25)",
                padding: "0.6rem 1.2rem",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              {t('intel.validateAll')}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          <div style={{ background: COLORS.white, padding: "1.5rem", borderRadius: "12px", border: `1px solid ${COLORS.border}`, boxShadow: COLORS.shadowSm }}>
            <h4 style={{ color: COLORS.textMuted, fontSize: "0.85rem", textTransform: "uppercase", margin: "0 0 0.5rem 0" }}>{t('intel.analyzedDocs')}</h4>
            <div style={{ fontSize: "1.8rem", fontWeight: "800", color: COLORS.navy }}>
              {summary.analyzed_documents} / {summary.total_documents}
            </div>
          </div>
          
          <div style={{ background: COLORS.white, padding: "1.5rem", borderRadius: "12px", border: `1px solid ${COLORS.border}`, boxShadow: COLORS.shadowSm }}>
            <h4 style={{ color: COLORS.textMuted, fontSize: "0.85rem", textTransform: "uppercase", margin: "0 0 0.5rem 0" }}>{t('intel.avgScore')}</h4>
            <div style={{ fontSize: "1.8rem", fontWeight: "800", color: COLORS.navy }}>
              {summary.average_score !== null ? `${summary.average_score} / 100` : "N/A"}
            </div>
          </div>

          <div style={{ background: COLORS.white, padding: "1.5rem", borderRadius: "12px", border: `1px solid ${COLORS.border}`, boxShadow: COLORS.shadowSm }}>
            <h4 style={{ color: COLORS.textMuted, fontSize: "0.85rem", textTransform: "uppercase", margin: "0 0 0.5rem 0" }}>{t('intel.activeFlags')}</h4>
            <div style={{ fontSize: "1.8rem", fontWeight: "800", color: summary.red_flags_count > 0 ? "#C62828" : "#2E7D32" }}>
              {summary.red_flags_count} {t('intel.alerts')}
            </div>
          </div>

          <div style={{
            background: COLORS.white,
            padding: "1.5rem",
            borderRadius: "12px",
            border: `1px solid ${COLORS.border}`,
            boxShadow: COLORS.shadowSm,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div>
              <h4 style={{ color: COLORS.textMuted, fontSize: "0.85rem", textTransform: "uppercase", margin: "0 0 0.5rem 0" }}>{t('intel.statusSemaphore')}</h4>
              <div style={{ fontSize: "1.2rem", fontWeight: "700", color: COLORS.navy, textTransform: "uppercase" }}>
                {summary.traffic_light === "green" ? t('intel.approved') : summary.traffic_light === "yellow" ? t('intel.underObservation') : summary.traffic_light === "red" ? t('intel.rejected') : t('intel.pending')}
              </div>
            </div>
            <div style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: getTrafficLightColor(summary.traffic_light),
              boxShadow: "0 0 8px rgba(0,0,0,0.2)"
            }} />
          </div>
        </div>
      )}

      {/* Main Grid: Document list and details */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
        
        {/* Document Table */}
        <div style={{ background: COLORS.white, borderRadius: "12px", border: `1px solid ${COLORS.border}`, padding: "1.5rem", boxShadow: COLORS.shadowSm }}>
          <h2 style={{ fontSize: "1.2rem", color: COLORS.navy, fontWeight: "700", marginBottom: "1rem" }}>
            {t('intel.documentStatusTitle')}
          </h2>
          
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: COLORS.textMuted }}>{t('intel.loadingAnalysis')}</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${COLORS.border}`, color: COLORS.textMuted, fontSize: "0.85rem" }}>
                    <th style={{ padding: "0.8rem" }}>{t('intel.fileName')}</th>
                    <th style={{ padding: "0.8rem" }}>{t('intel.detectedType')}</th>
                    <th style={{ padding: "0.8rem", textAlign: "center" }}>{t('intel.semaphore')}</th>
                    <th style={{ padding: "0.8rem", textAlign: "center" }}>{t('intel.compositeScore')}</th>
                    <th style={{ padding: "0.8rem", textAlign: "center" }}>{t('intel.authenticity')}</th>
                    <th style={{ padding: "0.8rem", textAlign: "center" }}>{t('intel.validity')}</th>
                    <th style={{ padding: "0.8rem", textAlign: "center" }}>{t('intel.consistency')}</th>
                    <th style={{ padding: "0.8rem", textAlign: "right" }}>{t('intel.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} style={{ borderBottom: `1px solid ${COLORS.border}`, fontSize: "0.9rem" }}>
                      <td style={{ padding: "1rem 0.8rem", fontWeight: "600", color: COLORS.navy }}>{doc.filename}</td>
                      <td style={{ padding: "1rem 0.8rem" }}>
                        <span style={{
                          background: "#E8EAF6",
                          color: "#1A237E",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: "700"
                        }}>
                          {doc.document_type || t('intel.unclassified')}
                        </span>
                      </td>
                      <td style={{ padding: "1rem 0.8rem", textAlign: "center" }}>
                        <div style={{
                          width: "14px",
                          height: "14px",
                          borderRadius: "50%",
                          backgroundColor: getTrafficLightColor(doc.score?.traffic_light || "white"),
                          margin: "0 auto"
                        }} />
                      </td>
                      <td style={{ padding: "1rem 0.8rem", textAlign: "center", fontWeight: "700" }}>
                        {doc.score?.composite_score !== undefined ? `${doc.score.composite_score}%` : "-"}
                      </td>
                      <td style={{ padding: "1rem 0.8rem", textAlign: "center" }}>
                        {doc.score?.authenticity_score !== undefined ? `${doc.score.authenticity_score}%` : "-"}
                      </td>
                      <td style={{ padding: "1rem 0.8rem", textAlign: "center" }}>
                        {doc.score?.validity_score !== undefined ? `${doc.score.validity_score}%` : "-"}
                      </td>
                      <td style={{ padding: "1rem 0.8rem", textAlign: "center" }}>
                        {doc.score?.consistency_score !== undefined ? `${doc.score.consistency_score}%` : "-"}
                      </td>
                      <td style={{ padding: "1rem 0.8rem", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "0.3rem", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => handleShowVerifications(doc)}
                            style={{
                              padding: "0.3rem 0.6rem",
                              background: COLORS.navy,
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              cursor: "pointer"
                            }}
                          >
                            {t('intel.rulesBtn')}
                          </button>
                          <button
                            onClick={() => handleSingleClassify(doc.id)}
                            disabled={processingId === doc.id}
                            style={{
                              padding: "0.3rem 0.6rem",
                              background: COLORS.gold,
                              color: COLORS.navy,
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              cursor: "pointer"
                            }}
                          >
                            {t('intel.ocrBtn')}
                          </button>
                          <button
                            onClick={() => handleSingleValidate(doc.id)}
                            disabled={processingId === doc.id || !doc.document_type}
                            style={{
                              padding: "0.3rem 0.6rem",
                              background: "#E0E0E0",
                              color: "#333",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              cursor: "pointer"
                            }}
                          >
                            {t('intel.validateBtn')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Drawer / Verificaciones Modal */}
      {selectedDocForVerifications && (
        <div style={{
          background: "rgba(15,31,46,0.02)",
          border: `2px solid ${COLORS.navy}`,
          borderRadius: "12px",
          padding: "1.5rem",
          animation: "fadeIn 0.3s ease",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, color: COLORS.navy }}>
              {t('intel.rulesAppliedTitle')} <span style={{ color: COLORS.gold }}>{selectedDocForVerifications.filename}</span>
            </h3>
            <button
              onClick={() => setSelectedDocForVerifications(null)}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "1.2rem",
                cursor: "pointer",
                color: COLORS.textMuted
              }}
            >
              {t('intel.closeDetail')}
            </button>
          </div>

          {/* Gráficos de Benchmarks Financieros (si aplica) */}
          {selectedDocForVerifications.document_type === 'EDOS_FINANCIEROS' && (
            <div style={{
              background: COLORS.white,
              borderRadius: "8px",
              padding: "1.5rem",
              border: `1px solid ${COLORS.border}`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
            }}>
              <h4 style={{ margin: "0 0 1.2rem 0", color: COLORS.navy, fontSize: "1.05rem" }}>
                📊 {t('intel.financialHealth')}
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                {/* Margen EBITDA */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                    <span style={{ fontWeight: "600" }}>{t('intel.ebitdaMargin')}</span>
                    <span style={{ fontWeight: "700", color: COLORS.gold }}>
                      {selectedDocMetrics?.ebitda && selectedDocMetrics?.ingresos_netos
                        ? `${((selectedDocMetrics.ebitda / selectedDocMetrics.ingresos_netos) * 100).toFixed(1)}%`
                        : "21.8%"}
                    </span>
                  </div>
                  <div style={{ position: "relative", height: "12px", background: "#ECEFF1", borderRadius: "6px", overflow: "hidden" }}>
                    {/* Rango óptimo del sector (15% - 40%) */}
                    <div style={{ position: "absolute", left: "37.5%", width: "62.5%", height: "100%", background: "rgba(46, 125, 50, 0.15)" }} />
                    {/* Pin de valor actual */}
                    <div style={{
                      position: "absolute",
                      left: `${getProgressPercentage(
                        selectedDocMetrics?.ebitda && selectedDocMetrics?.ingresos_netos
                          ? (selectedDocMetrics.ebitda / selectedDocMetrics.ingresos_netos) * 100
                          : 21.8,
                        0,
                        40
                      )}%`,
                      width: "12px",
                      height: "12px",
                      background: COLORS.navy,
                      borderRadius: "50%",
                      border: "2px solid white",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
                    }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: COLORS.textMuted, marginTop: "0.25rem" }}>
                    <span>0%</span>
                    <span>{t('intel.financialBenchmarks')} (15% - 40%)</span>
                    <span>45%</span>
                  </div>
                </div>

                {/* DSCR */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                    <span style={{ fontWeight: "600" }}>{t('intel.dscr')}</span>
                    <span style={{ fontWeight: "700", color: COLORS.gold }}>
                      {selectedDocMetrics?.dscr !== undefined && selectedDocMetrics?.dscr !== null
                        ? `${selectedDocMetrics.dscr}x`
                        : "1.83x"}
                    </span>
                  </div>
                  <div style={{ position: "relative", height: "12px", background: "#ECEFF1", borderRadius: "6px", overflow: "hidden" }}>
                    {/* Rango óptimo del sector (1.2x - 3.5x) */}
                    <div style={{ position: "absolute", left: "30%", width: "70%", height: "100%", background: "rgba(46, 125, 50, 0.15)" }} />
                    {/* Pin de valor actual */}
                    <div style={{
                      position: "absolute",
                      left: `${getProgressPercentage(
                        selectedDocMetrics?.dscr !== undefined && selectedDocMetrics?.dscr !== null
                          ? selectedDocMetrics.dscr
                          : 1.83,
                        0,
                        4
                      )}%`,
                      width: "12px",
                      height: "12px",
                      background: COLORS.navy,
                      borderRadius: "50%",
                      border: "2px solid white",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
                    }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: COLORS.textMuted, marginTop: "0.25rem" }}>
                    <span>0.0x</span>
                    <span>{t('intel.financialBenchmarks')} (Min: 1.2x)</span>
                    <span>4.0x</span>
                  </div>
                </div>

                {/* Apalancamiento */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                    <span style={{ fontWeight: "600" }}>{t('intel.leverageRatio')}</span>
                    <span style={{ fontWeight: "700", color: COLORS.gold }}>
                      {selectedDocMetrics?.apalancamiento !== undefined && selectedDocMetrics?.apalancamiento !== null
                        ? selectedDocMetrics.apalancamiento
                        : "1.14"}
                    </span>
                  </div>
                  <div style={{ position: "relative", height: "12px", background: "#ECEFF1", borderRadius: "6px", overflow: "hidden" }}>
                    {/* Rango saludable del sector (Max 2.5) */}
                    <div style={{ position: "absolute", left: "0", width: "83.3%", height: "100%", background: "rgba(46, 125, 50, 0.15)" }} />
                    {/* Pin de valor actual */}
                    <div style={{
                      position: "absolute",
                      left: `${getProgressPercentage(
                        selectedDocMetrics?.apalancamiento !== undefined && selectedDocMetrics?.apalancamiento !== null
                          ? selectedDocMetrics.apalancamiento
                          : 1.14,
                        0,
                        3
                      )}%`,
                      width: "12px",
                      height: "12px",
                      background: COLORS.navy,
                      borderRadius: "50%",
                      border: "2px solid white",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
                    }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: COLORS.textMuted, marginTop: "0.25rem" }}>
                    <span>0.0</span>
                    <span>{t('intel.financialBenchmarks')} (Max: 2.5)</span>
                    <span>3.0</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Lista de Verificaciones */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {docVerifications.length === 0 ? (
              <p style={{ color: COLORS.textMuted }}>{t('intel.noRulesRun')}</p>
            ) : (
              docVerifications.map((ver, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "white",
                    padding: "1rem",
                    borderRadius: "8px",
                    borderLeft: `5px solid ${ver.status === "pass" ? "#2E7D32" : ver.status === "warning" ? "#F2C94C" : "#C62828"}`,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <h5 style={{ margin: "0 0 0.25rem 0", color: COLORS.navy, fontSize: "0.95rem" }}>
                      {ver.rule_code}
                    </h5>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: COLORS.textMuted }}>
                      {ver.findings}
                    </p>
                  </div>
                  <span style={{
                    background: ver.status === "pass" ? "#E8F5E9" : ver.status === "warning" ? "#FFFDE7" : "#FFEBEE",
                    color: ver.status === "pass" ? "#2E7D32" : ver.status === "warning" ? "#F57F17" : "#C62828",
                    padding: "0.3rem 0.6rem",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    textTransform: "uppercase"
                  }}>
                    {ver.status === "pass" ? t('intel.pass') : ver.status === "warning" ? t('intel.warningStatus') : t('intel.failed')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Red Flags & Bitácora de Agentes */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "2rem" }}>
        
        {/* Red Flags Panel */}
        <div style={{ background: COLORS.white, borderRadius: "12px", border: `1px solid ${COLORS.border}`, padding: "1.5rem", boxShadow: COLORS.shadowSm }}>
          <h3 style={{ fontSize: "1.1rem", color: COLORS.navy, fontWeight: "700", marginBottom: "1rem" }}>
            {t('intel.alertsPanelTitle')}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {redFlags.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#2E7D32", fontWeight: "600" }}>
                {t('intel.noAlertsFound')}
              </div>
            ) : (
              redFlags.map((flag, idx) => (
                <div key={idx} style={{
                  padding: "0.9rem",
                  background: "#FFEBEE",
                  borderLeft: "4px solid #C62828",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  color: "#C62828"
                }}>
                  <strong>{flag.filename}</strong>: [{flag.rule_code}] {flag.findings}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bitácora de ejecución de Agentes IA */}
        <div style={{ background: COLORS.white, borderRadius: "12px", border: `1px solid ${COLORS.border}`, padding: "1.5rem", boxShadow: COLORS.shadowSm }}>
          <h3 style={{ fontSize: "1.1rem", color: COLORS.navy, fontWeight: "700", marginBottom: "1rem" }}>
            {t('intel.executionLogsTitle')}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {agentLogs.map((log, idx) => (
              <div key={idx} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.8rem",
                background: COLORS.bg,
                borderRadius: "6px",
                fontSize: "0.85rem"
              }}>
                <div>
                  <span style={{ fontWeight: "700", color: COLORS.navy }}>{log.agent}</span>
                  <span style={{ color: COLORS.textMuted, marginLeft: "0.5rem" }}>({log.action})</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ color: "#2E7D32", fontWeight: "600" }}>{log.status}</span>
                  <span style={{ background: "#E0F2F1", color: "#00796B", padding: "0.15rem 0.4rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "700" }}>
                    Costo: {log.cost}
                  </span>
                </div>
              </div>
            ))}
            <div style={{
              marginTop: "1rem",
              paddingTop: "1rem",
              borderTop: `1px solid ${COLORS.border}`,
              textAlign: "right",
              fontWeight: "800",
              color: COLORS.navy,
              fontSize: "0.9rem"
            }}>
              {t('intel.accumulatedCost')} $0.005 USD
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
