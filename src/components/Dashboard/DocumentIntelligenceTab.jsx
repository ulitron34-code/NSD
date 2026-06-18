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

  // Chatbot states
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Flowchart animation state
  const [activeAgentNode, setActiveAgentNode] = useState(null); // 'classifier', 'validator', 'financial', 'cross'

  // NEW: Consent & Signature State
  const [hasConsented, setHasConsented] = useState(() => {
    return localStorage.getItem("intel_consent") === "true";
  });
  const [consentChecks, setConsentChecks] = useState({ terms: false, ai: false, data: false });
  const [sigName, setSigName] = useState("");

  // NEW: Rules Management State
  const [jurisdiction, setJurisdiction] = useState("MX");
  const [activeRules, setActiveRules] = useState({
    RFC_FORMAT: true,
    CURP_FORMAT: true,
    CSF_ESTATUS_ACTIVO: true,
    OPINION_32D_POSITIVA: true,
    NUMEROS_REDONDOS: true,
    FRAUD_METADATA_EDIT: true,
    BENCHMARK_MARGEN_NETO: true,
    BENCHMARK_APALANCAMIENTO: true,
    BENCHMARK_DSCR: true,
  });

  // NEW: Stripe Simulation State
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [stripePlan, setStripePlan] = useState(null);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");
  const [billingSuccess, setBillingSuccess] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState(() => {
    return localStorage.getItem("intel_subscription") || "Básico";
  });

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
    // Reset chat
    setChatMessages([
      { sender: "ai", text: "Hola. Estoy listo para auditar este expediente. Pregúntame lo que necesites sobre los documentos." }
    ]);
  }, [selectedExpedienteId]);

  // Adjust rules dynamically based on selected jurisdiction
  useEffect(() => {
    if (jurisdiction === "US") {
      setActiveRules({
        RFC_FORMAT: false,
        CURP_FORMAT: false,
        CSF_ESTATUS_ACTIVO: false,
        OPINION_32D_POSITIVA: false,
        NUMEROS_REDONDOS: true,
        FRAUD_METADATA_EDIT: true,
        BENCHMARK_MARGEN_NETO: true,
        BENCHMARK_APALANCAMIENTO: true,
        BENCHMARK_DSCR: true,
      });
    } else if (jurisdiction === "INT") {
      setActiveRules({
        RFC_FORMAT: false,
        CURP_FORMAT: false,
        CSF_ESTATUS_ACTIVO: false,
        OPINION_32D_POSITIVA: false,
        NUMEROS_REDONDOS: false,
        FRAUD_METADATA_EDIT: true,
        BENCHMARK_MARGEN_NETO: true,
        BENCHMARK_APALANCAMIENTO: true,
        BENCHMARK_DSCR: true,
      });
    } else {
      // MX defaults
      setActiveRules({
        RFC_FORMAT: true,
        CURP_FORMAT: true,
        CSF_ESTATUS_ACTIVO: true,
        OPINION_32D_POSITIVA: true,
        NUMEROS_REDONDOS: true,
        FRAUD_METADATA_EDIT: true,
        BENCHMARK_MARGEN_NETO: true,
        BENCHMARK_APALANCAMIENTO: true,
        BENCHMARK_DSCR: true,
      });
    }
  }, [jurisdiction]);

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
    setActiveAgentNode("classifier");
    
    // Simulate orchestration animation
    setTimeout(() => setActiveAgentNode("validator"), 1000);
    setTimeout(() => setActiveAgentNode("financial"), 2000);
    setTimeout(() => setActiveAgentNode("cross"), 3000);

    try {
      await intelAPI.processAll(selectedExpedienteId);
      setTimeout(() => {
        loadExpedienteData(selectedExpedienteId);
        setActiveAgentNode(null);
      }, 4000);
    } catch (err) {
      console.error("Error al procesar lote:", err);
      setLoading(false);
      setActiveAgentNode(null);
    }
  };

  const handleValidateAll = async () => {
    if (!selectedExpedienteId) return;
    setLoading(true);
    setActiveAgentNode("validator");
    try {
      await intelAPI.validateAll(selectedExpedienteId);
      setTimeout(() => {
        loadExpedienteData(selectedExpedienteId);
        setActiveAgentNode(null);
      }, 2000);
    } catch (err) {
      console.error("Error al validar lote:", err);
      setLoading(false);
      setActiveAgentNode(null);
    }
  };

  const handleSingleClassify = async (docId) => {
    setProcessingId(docId);
    setActiveAgentNode("classifier");
    try {
      await intelAPI.classify(docId);
      await loadExpedienteData(selectedExpedienteId);
    } catch (err) {
      console.error("Error en clasificación unitaria:", err);
    } finally {
      setProcessingId(null);
      setActiveAgentNode(null);
    }
  };

  const handleSingleValidate = async (docId) => {
    setProcessingId(docId);
    setActiveAgentNode("validator");
    try {
      await intelAPI.validate(docId);
      await loadExpedienteData(selectedExpedienteId);
    } catch (err) {
      console.error("Error en validación unitaria:", err);
    } finally {
      setProcessingId(null);
      setActiveAgentNode(null);
    }
  };

  const handleShowVerifications = async (doc) => {
    setSelectedDocForVerifications(doc);
    setSelectedDocMetrics(null);
    try {
      const { data } = await intelAPI.getVerifications(doc.id);
      
      // Filter based on active rules set by the manager panel
      const filtered = (data || []).filter(v => activeRules[v.rule_code] !== false);
      setDocVerifications(filtered);

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

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedExpedienteId) return;
    
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const { data } = await intelAPI.chat(selectedExpedienteId, userMsg);
      setChatMessages(prev => [...prev, { sender: "ai", text: data.response }]);
    } catch (err) {
      console.error("Error consultando chatbot:", err);
      setChatMessages(prev => [...prev, { sender: "ai", text: "Error de comunicación con el Agente de Chat." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const getProgressPercentage = (value, min, max) => {
    if (value === undefined || value === null || Number.isNaN(value) || max === min) return 0;
    return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  };

  const handleExportReport = () => {
    if (!selectedExpedienteId || !summary) return;
    
    let reportMd = `# 🤖 REPORT EXECUTIVE COMPLIANCE AUDIT\n`;
    reportMd += `=========================================\n`;
    reportMd += `Expediente ID: ${selectedExpedienteId}\n`;
    reportMd += `Jurisdicción: ${jurisdiction}\n`;
    reportMd += `Plan de Suscripción: ${activeSubscription}\n`;
    reportMd += `Fecha de Generación: ${new Date().toLocaleString()}\n`;
    reportMd += `Semáforo de Estatus: ${summary.traffic_light.toUpperCase()}\n`;
    reportMd += `Documentos Analizados: ${summary.analyzed_documents} / ${summary.total_documents}\n`;
    reportMd += `Score Promedio del Expediente: ${summary.average_score || "N/A"}\n`;
    reportMd += `Alertas (Red Flags) Activas: ${summary.red_flags_count}\n\n`;

    reportMd += `## 📋 Estatus por Documentos\n`;
    documents.forEach(doc => {
      reportMd += `- **${doc.filename}**: [${doc.document_type || "No clasificado"}] - Score: ${doc.score?.composite_score || "N/A"}% - Semáforo: ${doc.score?.traffic_light || "N/A"}\n`;
    });

    reportMd += `\n## 🚨 Alertas Detectadas (Red Flags)\n`;
    if (redFlags.length === 0) {
      reportMd += `✓ No se detectaron alertas críticas de cumplimiento en el expediente.\n`;
    } else {
      redFlags.forEach(f => {
        reportMd += `- [${f.rule_code}] **${f.filename}**: ${f.findings} (Severidad: ${f.severity})\n`;
      });
    }

    reportMd += `\n## 🔗 Análisis de Cruces Transversales\n`;
    if (crossRefs.length === 0) {
      reportMd += `* Sin cruces de datos disponibles.\n`;
    } else {
      crossRefs.forEach(c => {
        reportMd += `- [${c.cross_reference_type}] **${c.status.toUpperCase()}**: ${c.details}\n`;
      });
    }

    reportMd += `\n=========================================\n`;
    reportMd += `NSD International Finance - Platform compliance Audit`;

    const blob = new Blob([reportMd], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `NSD-Reporte-Ejecutivo-${selectedExpedienteId.slice(0, 8)}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Rule Toggle Switch
  const toggleRule = (ruleKey) => {
    setActiveRules(prev => ({
      ...prev,
      [ruleKey]: !prev[ruleKey]
    }));
  };

  // Consent Form Submit
  const handleConsentSubmit = (e) => {
    e.preventDefault();
    if (consentChecks.terms && consentChecks.ai && consentChecks.data && sigName.trim()) {
      localStorage.setItem("intel_consent", "true");
      localStorage.setItem("intel_consent_signature", sigName);
      setHasConsented(true);
    }
  };

  // Stripe checkout processing
  const handleStripePay = (e) => {
    e.preventDefault();
    setBillingSuccess(true);
    setTimeout(() => {
      localStorage.setItem("intel_subscription", stripePlan.name);
      setActiveSubscription(stripePlan.name);
      setShowStripeModal(false);
      setBillingSuccess(false);
      setCardNumber("");
      setCardExpiry("");
      setCardCVC("");
    }, 2000);
  };

  // Simulador / Sandbox Handler
  const handleSimulateCase = (caseType) => {
    if (caseType === "reset") {
      loadExpedienteData(selectedExpedienteId);
      return;
    }

    let simulatedDocs = [...documents];
    let simulatedSummary = { ...summary };
    let simulatedFlags = [...redFlags];

    if (caseType === "suspended_csf") {
      simulatedSummary.traffic_light = "red";
      simulatedSummary.red_flags_count += 1;
      
      const csfDoc = simulatedDocs.find(d => d.document_type === 'RFC_CSF') || simulatedDocs[0];
      if (csfDoc) {
        csfDoc.score = {
          ...csfDoc.score,
          traffic_light: "red",
          composite_score: 45,
          authenticity_score: 30
        };
      }

      simulatedFlags.push({
        filename: csfDoc ? csfDoc.filename : "CSF.pdf",
        rule_code: "CSF_ESTATUS_ACTIVO",
        findings: "La CSF no indica estatus ACTIVO (Contribuyente en estatus SUSPENDIDO temporalmente)",
        severity: "critical"
      });
    }

    if (caseType === "altered_pdf") {
      simulatedSummary.traffic_light = "red";
      simulatedSummary.red_flags_count += 2;

      const ineDoc = simulatedDocs.find(d => d.document_type === 'INE_FRENTE') || simulatedDocs[0];
      if (ineDoc) {
        ineDoc.score = {
          ...ineDoc.score,
          traffic_light: "red",
          composite_score: 35,
          authenticity_score: 10
        };
      }

      simulatedFlags.push({
        filename: ineDoc ? ineDoc.filename : "Identificacion.pdf",
        rule_code: "FRAUD_METADATA_EDIT",
        findings: "Metadatos sospechosos detectados: El archivo fue modificado con software de edición (Adobe Photoshop CC). Fechas inconsistentes.",
        severity: "critical"
      });
    }

    if (caseType === "unbalanced_balance") {
      simulatedSummary.traffic_light = "yellow";
      simulatedSummary.red_flags_count += 1;

      const edosDoc = simulatedDocs.find(d => d.document_type === 'EDOS_FINANCIEROS') || simulatedDocs[0];
      if (edosDoc) {
        edosDoc.score = {
          ...edosDoc.score,
          traffic_light: "yellow",
          composite_score: 60,
          consistency_score: 40
        };
      }

      simulatedFlags.push({
        filename: edosDoc ? edosDoc.filename : "EstadosFinancieros.xlsx",
        rule_code: "BALANCE_CUADRA",
        findings: "La ecuación contable no cuadra: Activo ($15,400,000) vs Pasivo + Capital ($16,200,000). Diferencia: $800,000",
        severity: "error"
      });
    }

    setDocuments(simulatedDocs);
    setSummary(simulatedSummary);
    setRedFlags(simulatedFlags);
  };

  // Render Privacy Consent Gate
  if (!hasConsented) {
    return (
      <div style={{
        maxWidth: "680px",
        margin: "2rem auto",
        background: "white",
        borderRadius: "16px",
        padding: "2.5rem",
        boxShadow: "0 10px 30px rgba(27,58,92,0.1)",
        border: `1px solid ${COLORS.border}`
      }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <span style={{ fontSize: "3rem" }}>🔒</span>
          <h2 style={{ color: COLORS.navy, margin: "1rem 0 0.5rem 0", fontWeight: "800" }}>Consentimiento de Privacidad y Auditoría</h2>
          <p style={{ color: COLORS.textMuted, fontSize: "0.9rem" }}>Es obligatorio firmar de conformidad para habilitar las auditorías asistidas por Agentes IA de cumplimiento.</p>
        </div>

        <form onSubmit={handleConsentSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <label style={{ display: "flex", gap: "0.8rem", cursor: "pointer", fontSize: "0.88rem", color: COLORS.text }}>
            <input
              type="checkbox"
              checked={consentChecks.terms}
              onChange={(e) => setConsentChecks(prev => ({ ...prev, terms: e.target.checked }))}
              style={{ marginTop: "3px" }}
              required
            />
            Acepto los términos de servicio de NSD Platform y las políticas de retención limitada de documentos.
          </label>

          <label style={{ display: "flex", gap: "0.8rem", cursor: "pointer", fontSize: "0.88rem", color: COLORS.text }}>
            <input
              type="checkbox"
              checked={consentChecks.ai}
              onChange={(e) => setConsentChecks(prev => ({ ...prev, ai: e.target.checked }))}
              style={{ marginTop: "3px" }}
              required
            />
            Entiendo que los análisis son diagnósticos preliminares y que el Agente IA actúa de forma asistida, no sustituyendo el criterio de los otorgantes.
          </label>

          <label style={{ display: "flex", gap: "0.8rem", cursor: "pointer", fontSize: "0.88rem", color: COLORS.text }}>
            <input
              type="checkbox"
              checked={consentChecks.data}
              onChange={(e) => setConsentChecks(prev => ({ ...prev, data: e.target.checked }))}
              style={{ marginTop: "3px" }}
              required
            />
            Autorizo a la plataforma a procesar datos sensibles incluidos en los estados financieros, comprobantes e identificaciones proporcionadas.
          </label>

          <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.8rem", color: COLORS.textMuted, fontWeight: "700" }}>Firma Electrónica (Escribe tu nombre completo):</span>
            <input
              type="text"
              value={sigName}
              onChange={(e) => setSigName(e.target.value)}
              placeholder="Ej. Ulises Salgado Díaz"
              style={{
                padding: "0.8rem 1rem",
                borderRadius: "8px",
                border: `1px solid ${COLORS.border}`,
                outline: "none",
                fontSize: "0.95rem"
              }}
              required
            />
          </div>

          <button
            type="submit"
            style={{
              background: COLORS.navy,
              color: "white",
              padding: "1rem",
              borderRadius: "8px",
              border: "none",
              fontWeight: "700",
              cursor: "pointer",
              marginTop: "1.5rem",
              transition: "opacity 0.2s"
            }}
          >
            ✓ Desbloquear Panel de Inteligencia
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* Stripe Payment Simulator Modal */}
      {showStripeModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15,31,46,0.6)",
          zIndex: 1000,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "white",
            width: "100%",
            maxWidth: "450px",
            borderRadius: "16px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
            padding: "2rem",
            position: "relative"
          }}>
            <button
              onClick={() => setShowStripeModal(false)}
              style={{
                position: "absolute",
                top: "1.2rem",
                right: "1.2rem",
                background: "transparent",
                border: "none",
                fontSize: "1.2rem",
                cursor: "pointer",
                color: "#6B7280"
              }}
            >
              ✕
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "1.5rem" }}>💳</span>
              <h3 style={{ margin: 0, color: "#1B3A5C" }}>Stripe Checkout Simulator</h3>
            </div>

            {billingSuccess ? (
              <div style={{ textAlign: "center", padding: "2rem 0" }}>
                <span style={{ fontSize: "3rem" }}>🎉</span>
                <h4 style={{ color: "#2E7D32", margin: "1rem 0 0.5rem 0" }}>¡Pago Completado!</h4>
                <p style={{ color: COLORS.textMuted, fontSize: "0.85rem" }}>Tu suscripción ha sido actualizada a {stripePlan?.name}.</p>
              </div>
            ) : (
              <form onSubmit={handleStripePay} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ background: "#F3F4F6", padding: "1rem", borderRadius: "8px", marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: COLORS.text }}>
                    <span>Plan a contratar:</span>
                    <strong>{stripePlan?.name}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: COLORS.text, marginTop: "0.25rem" }}>
                    <span>Monto a pagar:</span>
                    <strong>{stripePlan?.price} {stripePlan?.period}</strong>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <span style={{ fontSize: "0.75rem", color: COLORS.textMuted, fontWeight: "700" }}>Número de Tarjeta:</span>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                    style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #D1D5DB" }}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    <span style={{ fontSize: "0.75rem", color: COLORS.textMuted, fontWeight: "700" }}>Vencimiento:</span>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/AA"
                      maxLength={5}
                      style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #D1D5DB" }}
                      required
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    <span style={{ fontSize: "0.75rem", color: COLORS.textMuted, fontWeight: "700" }}>CVC:</span>
                    <input
                      type="password"
                      value={cardCVC}
                      onChange={(e) => setCardCVC(e.target.value)}
                      placeholder="123"
                      maxLength={3}
                      style={{ padding: "0.6rem", borderRadius: "6px", border: "1px solid #D1D5DB" }}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  style={{
                    background: "#0055FF",
                    color: "white",
                    padding: "0.8rem",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "700",
                    cursor: "pointer",
                    marginTop: "1rem"
                  }}
                >
                  Confirmar Pago Simulado
                </button>
              </form>
            )}
          </div>
        </div>
      )}

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
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <span style={{ background: "rgba(255,255,255,0.15)", padding: "0.2rem 0.6rem", borderRadius: "4px", fontSize: "0.75rem" }}>
              Plan activo: <strong>{activeSubscription}</strong>
            </span>
          </div>
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
            <button
              onClick={handleExportReport}
              disabled={!selectedExpedienteId || !summary}
              style={{
                background: "rgba(255,255,255,0.2)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.3)",
                padding: "0.6rem 1.2rem",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              {t('intel.exportReport')}
            </button>
          </div>
        </div>
      </div>

      {/* Visualizador de Orquestación de Agentes IA */}
      <div style={{
        background: "#0F1F2E",
        borderRadius: "12px",
        padding: "1.5rem",
        color: "white",
        boxShadow: COLORS.shadowSm
      }}>
        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: COLORS.gold, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          🤖 {t('intel.flowTitle')}
        </h4>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          {/* Node 1: Classifier */}
          <div style={{
            flex: 1,
            minWidth: "150px",
            background: activeAgentNode === "classifier" ? "rgba(242, 201, 76, 0.2)" : "rgba(255,255,255,0.05)",
            border: `2px solid ${activeAgentNode === "classifier" ? COLORS.gold : "rgba(255,255,255,0.1)"}`,
            borderRadius: "8px",
            padding: "1rem",
            textAlign: "center",
            boxShadow: activeAgentNode === "classifier" ? "0 0 15px rgba(242,201,76,0.4)" : "none",
            transition: "all 0.3s ease"
          }}>
            <div style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>📁</div>
            <div style={{ fontWeight: "700", fontSize: "0.85rem" }}>{t('intel.flowClassifier')}</div>
            <div style={{ fontSize: "0.7rem", opacity: 0.6, marginTop: "0.25rem" }}>OCR & Triage</div>
          </div>

          <div style={{ color: "rgba(255,255,255,0.2)", fontSize: "1.5rem" }}>➔</div>

          {/* Node 2: Validator */}
          <div style={{
            flex: 1,
            minWidth: "150px",
            background: activeAgentNode === "validator" ? "rgba(242, 201, 76, 0.2)" : "rgba(255,255,255,0.05)",
            border: `2px solid ${activeAgentNode === "validator" ? COLORS.gold : "rgba(255,255,255,0.1)"}`,
            borderRadius: "8px",
            padding: "1rem",
            textAlign: "center",
            boxShadow: activeAgentNode === "validator" ? "0 0 15px rgba(242,201,76,0.4)" : "none",
            transition: "all 0.3s ease"
          }}>
            <div style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>🛡️</div>
            <div style={{ fontWeight: "700", fontSize: "0.85rem" }}>{t('intel.flowValidator')}</div>
            <div style={{ fontSize: "0.7rem", opacity: 0.6, marginTop: "0.25rem" }}>Rules & Anti-fraud</div>
          </div>

          <div style={{ color: "rgba(255,255,255,0.2)", fontSize: "1.5rem" }}>➔</div>

          {/* Node 3: Financial */}
          <div style={{
            flex: 1,
            minWidth: "150px",
            background: activeAgentNode === "financial" ? "rgba(242, 201, 76, 0.2)" : "rgba(255,255,255,0.05)",
            border: `2px solid ${activeAgentNode === "financial" ? COLORS.gold : "rgba(255,255,255,0.1)"}`,
            borderRadius: "8px",
            padding: "1rem",
            textAlign: "center",
            boxShadow: activeAgentNode === "financial" ? "0 0 15px rgba(242,201,76,0.4)" : "none",
            transition: "all 0.3s ease"
          }}>
            <div style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>📈</div>
            <div style={{ fontWeight: "700", fontSize: "0.85rem" }}>{t('intel.flowFinancial')}</div>
            <div style={{ fontSize: "0.7rem", opacity: 0.6, marginTop: "0.25rem" }}>Ratios & Benchmarks</div>
          </div>

          <div style={{ color: "rgba(255,255,255,0.2)", fontSize: "1.5rem" }}>➔</div>

          {/* Node 4: CrossRef */}
          <div style={{
            flex: 1,
            minWidth: "150px",
            background: activeAgentNode === "cross" ? "rgba(242, 201, 76, 0.2)" : "rgba(255,255,255,0.05)",
            border: `2px solid ${activeAgentNode === "cross" ? COLORS.gold : "rgba(255,255,255,0.1)"}`,
            borderRadius: "8px",
            padding: "1rem",
            textAlign: "center",
            boxShadow: activeAgentNode === "cross" ? "0 0 15px rgba(242,201,76,0.4)" : "none",
            transition: "all 0.3s ease"
          }}>
            <div style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>🔗</div>
            <div style={{ fontWeight: "700", fontSize: "0.85rem" }}>{t('intel.flowCrossRef')}</div>
            <div style={{ fontSize: "0.7rem", opacity: 0.6, marginTop: "0.25rem" }}>Identity Crosscheck</div>
          </div>
        </div>
      </div>

      {/* Rules Config Panel */}
      <div style={{
        background: COLORS.white,
        borderRadius: "12px",
        border: `1px solid ${COLORS.border}`,
        padding: "1.5rem",
        boxShadow: COLORS.shadowSm
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap", marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "1.1rem", color: COLORS.navy, fontWeight: "700", margin: 0 }}>
            ⚙️ Panel de Gestión de Reglas de Cumplimiento
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", color: COLORS.textMuted }}>Jurisdicción:</span>
            <select
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "6px",
                border: `1px solid ${COLORS.border}`,
                outline: "none"
              }}
            >
              <option value="MX">México (CSF/32-D)</option>
              <option value="US">USA (General Audit)</option>
              <option value="INT">Internacional (Fuzzy & Anti-fraud)</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {Object.entries(activeRules).map(([key, isActive]) => (
            <div key={key} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.8rem",
              background: COLORS.bg,
              borderRadius: "8px",
              border: `1px solid ${COLORS.border}`
            }}>
              <span style={{ fontSize: "0.82rem", fontWeight: "700", color: COLORS.navy }}>{key}</span>
              <button
                onClick={() => toggleRule(key)}
                style={{
                  background: isActive ? "#2E7D32" : "#9CA3AF",
                  color: "white",
                  border: "none",
                  padding: "0.3rem 0.7rem",
                  borderRadius: "12px",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  fontWeight: "700",
                  transition: "background 0.2s"
                }}
              >
                {isActive ? "Activo" : "Inactivo"}
              </button>
            </div>
          ))}
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

                {/* ROE */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                    <span style={{ fontWeight: "600" }}>{t('intel.roe')}</span>
                    <span style={{ fontWeight: "700", color: COLORS.gold }}>
                      {selectedDocMetrics?.roe !== undefined && selectedDocMetrics?.roe !== null
                        ? `${(selectedDocMetrics.roe * 100).toFixed(1)}%`
                        : "—"}
                    </span>
                  </div>
                  <div style={{ position: "relative", height: "12px", background: "#ECEFF1", borderRadius: "6px", overflow: "hidden" }}>
                    {/* Rango no sospechoso (0% - 50%) */}
                    <div style={{ position: "absolute", left: "0", width: "41.6%", height: "100%", background: "rgba(46, 125, 50, 0.15)" }} />
                    {/* Pin de valor actual */}
                    <div style={{
                      position: "absolute",
                      left: `${getProgressPercentage(
                        selectedDocMetrics?.roe !== undefined && selectedDocMetrics?.roe !== null
                          ? selectedDocMetrics.roe * 100
                          : 0,
                        0,
                        120
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
                    <span>{t('intel.financialBenchmarks')} (Sospechoso &gt;50%, Crítico &gt;100%)</span>
                    <span>120%</span>
                  </div>
                </div>

                {/* ROA */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                    <span style={{ fontWeight: "600" }}>{t('intel.roa')}</span>
                    <span style={{ fontWeight: "700", color: COLORS.gold }}>
                      {selectedDocMetrics?.roa !== undefined && selectedDocMetrics?.roa !== null
                        ? `${(selectedDocMetrics.roa * 100).toFixed(1)}%`
                        : "—"}
                    </span>
                  </div>
                  <div style={{ position: "relative", height: "12px", background: "#ECEFF1", borderRadius: "6px", overflow: "hidden" }}>
                    {/* Rango no sospechoso (0% - 30%) */}
                    <div style={{ position: "absolute", left: "0", width: "42.8%", height: "100%", background: "rgba(46, 125, 50, 0.15)" }} />
                    {/* Pin de valor actual */}
                    <div style={{
                      position: "absolute",
                      left: `${getProgressPercentage(
                        selectedDocMetrics?.roa !== undefined && selectedDocMetrics?.roa !== null
                          ? selectedDocMetrics.roa * 100
                          : 0,
                        0,
                        70
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
                    <span>{t('intel.financialBenchmarks')} (Anómalo &gt;30%, Crítico &gt;50%)</span>
                    <span>70%</span>
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

      {/* Dossier Chatbot Component */}
      <div style={{
        background: COLORS.white,
        borderRadius: "12px",
        border: `1px solid ${COLORS.border}`,
        padding: "1.5rem",
        boxShadow: COLORS.shadowSm,
        display: "flex",
        flexDirection: "column",
        gap: "1rem"
      }}>
        <h3 style={{ fontSize: "1.1rem", color: COLORS.navy, fontWeight: "700", margin: 0 }}>
          {t('intel.chatTitle')}
        </h3>
        
        <div style={{
          height: "250px",
          overflowY: "auto",
          border: `1px solid ${COLORS.border}`,
          borderRadius: "8px",
          padding: "1rem",
          background: "#F9FBFD",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem"
        }}>
          {chatMessages.map((msg, index) => (
            <div key={index} style={{
              alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
              background: msg.sender === "user" ? COLORS.navy : "#ECEFF1",
              color: msg.sender === "user" ? "white" : COLORS.navy,
              padding: "0.6rem 1rem",
              borderRadius: "12px",
              maxWidth: "80%",
              fontSize: "0.85rem",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}>
              {msg.text}
            </div>
          ))}
          {chatLoading && (
            <div style={{ alignSelf: "flex-start", color: COLORS.textMuted, fontSize: "0.8rem", fontStyle: "italic" }}>
              {t('intel.chatLoading')}
            </div>
          )}
        </div>

        <form onSubmit={handleSendChatMessage} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={t('intel.chatPlaceholder')}
            style={{
              flex: 1,
              padding: "0.6rem 1rem",
              borderRadius: "8px",
              border: `1px solid ${COLORS.border}`,
              fontSize: "0.85rem",
              outline: "none"
            }}
          />
          <button
            type="submit"
            disabled={chatLoading || !chatInput.trim()}
            style={{
              background: COLORS.navy,
              color: "white",
              border: "none",
              padding: "0.6rem 1.2rem",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            {t('intel.chatSend')}
          </button>
        </form>
      </div>

      {/* Billing Integration & Stripe Section */}
      <div style={{
        background: COLORS.white,
        borderRadius: "12px",
        border: `1px solid ${COLORS.border}`,
        padding: "1.5rem",
        boxShadow: COLORS.shadowSm
      }}>
        <h3 style={{ fontSize: "1.1rem", color: COLORS.navy, fontWeight: "700", marginBottom: "1rem" }}>
          💳 Suscripción de Compliance e Integración de Stripe
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
          {[
            { name: "Básico", price: "$299", desc: "Para solicitantes individuales", period: "/mes" },
            { name: "Profesional", price: "$699", desc: "Para empresas y startups", period: "/mes" },
            { name: "Empresarial", price: "$899", desc: "Para fondos e instituciones", period: "/mes" }
          ].map((plan) => (
            <div key={plan.name} style={{
              background: COLORS.bg,
              border: activeSubscription === plan.name ? `2px solid ${COLORS.gold}` : `1px solid ${COLORS.border}`,
              borderRadius: "10px",
              padding: "1.2rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: activeSubscription === plan.name ? "0 4px 12px rgba(201,168,76,0.15)" : "none"
            }}>
              <div>
                <h4 style={{ margin: "0 0 0.5rem 0", color: COLORS.navy }}>{plan.name}</h4>
                <p style={{ fontSize: "0.78rem", color: COLORS.textMuted, margin: "0 0 1rem 0" }}>{plan.desc}</p>
                <div style={{ fontSize: "1.5rem", fontWeight: "800", color: COLORS.navy }}>{plan.price} <span style={{ fontSize: "0.85rem", fontWeight: "normal" }}>{plan.period}</span></div>
              </div>
              <button
                onClick={() => {
                  setStripePlan(plan);
                  setShowStripeModal(true);
                }}
                disabled={activeSubscription === plan.name}
                style={{
                  background: activeSubscription === plan.name ? "#9CA3AF" : COLORS.gold,
                  color: COLORS.navy,
                  border: "none",
                  padding: "0.5rem",
                  borderRadius: "6px",
                  fontWeight: "700",
                  cursor: "pointer",
                  marginTop: "1rem"
                }}
              >
                {activeSubscription === plan.name ? "Plan Activo" : "Contratar con Stripe"}
              </button>
            </div>
          ))}
        </div>
      </div>

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

      {/* Simulator Playground Panel */}
      <div style={{
        background: "#F5F7FA",
        borderRadius: "12px",
        padding: "1.5rem",
        border: `2px dashed ${COLORS.gold}`,
        boxShadow: COLORS.shadowSm
      }}>
        <h3 style={{ fontSize: "1.1rem", color: COLORS.navy, fontWeight: "700", margin: "0 0 1rem 0" }}>
          {t('intel.sandboxTitle')}
        </h3>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button
            onClick={() => handleSimulateCase("suspended_csf")}
            style={{
              padding: "0.6rem 1rem",
              background: COLORS.white,
              border: `1px solid ${COLORS.navy}`,
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: "600",
              color: COLORS.navy
            }}
          >
            ⚠️ {t('intel.sandboxOption1')}
          </button>
          <button
            onClick={() => handleSimulateCase("altered_pdf")}
            style={{
              padding: "0.6rem 1rem",
              background: COLORS.white,
              border: `1px solid ${COLORS.navy}`,
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: "600",
              color: COLORS.navy
            }}
          >
            ⚠️ {t('intel.sandboxOption2')}
          </button>
          <button
            onClick={() => handleSimulateCase("unbalanced_balance")}
            style={{
              padding: "0.6rem 1rem",
              background: COLORS.white,
              border: `1px solid ${COLORS.navy}`,
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: "600",
              color: COLORS.navy
            }}
          >
            ⚠️ {t('intel.sandboxOption3')}
          </button>
          <button
            onClick={() => handleSimulateCase("reset")}
            style={{
              padding: "0.6rem 1rem",
              background: COLORS.gold,
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: "700",
              color: COLORS.navy
            }}
          >
            🔄 {t('intel.sandboxReset')}
          </button>
        </div>
      </div>

    </div>
  );
}
