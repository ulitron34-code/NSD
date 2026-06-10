import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../../utils/constants";
import { useNotification } from "../../../hooks/useNotification";
import { useAuth } from "../../../hooks/useAuth";
import { ordersAPI } from "../../../services/api";
import { translateCopy, uiText } from "../../../utils/runtimeCopy";
import { createDocument } from "../../../services/documentService";
import { getExpedientesForUser } from "../../../services/expedienteService";

export default function SubirProyectoTab() {
  const { i18n } = useTranslation();
  const copy = (value) => translateCopy(value, i18n.language);
  const L = (es, en) => uiText(i18n, es, en);

  const { addNotification } = useNotification();
  const { user } = useAuth();

  // FASE 5: Estados para expedientes y documentos
  const [expedientes, setExpedientes] = useState([]);
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [uploadedDocs, setUploadedDocs] = useState([]);

  const [analysis, setAnalysis] = useState(null);
  const [project, setProject] = useState({
    name: "Expansion comercial 2026",
    amount: "$500,000 USD",
    use: "Capital de crecimiento, equipo comercial y tecnología",
    sector: "Tecnología / SaaS",
    stage: "Listo para revisión",
  });

  const [requirements, setRequirements] = useState(null);

  // FASE 5: Cargar expedientes del usuario
  useEffect(() => {
    if (!user) return;

    const loadExpedientes = async () => {
      try {
        const exps = await getExpedientesForUser(user.id);
        setExpedientes(exps);
        // Auto-seleccionar el primero
        if (exps.length > 0 && !selectedExpediente) {
          setSelectedExpediente(exps[0]);
        }
      } catch (err) {
        console.error('Error loading expedientes:', err);
      }
    };

    loadExpedientes();

    // Auto-refresh cada 10 segundos
    const interval = setInterval(loadExpedientes, 10000);
    return () => clearInterval(interval);
  }, [user, selectedExpediente]);

  React.useEffect(() => {
    ordersAPI.requirements()
      .then(({ data }) => data)
      .then((data) => setRequirements(data))
      .catch((err) => console.error("Error cargando requisitos", err));
  }, []);

  const currentMatrix = React.useMemo(() => {
    if (!requirements) return null;
    if (project.sector.includes("Tecnología") || project.sector.includes("Tecnologia") || project.sector.includes("Startup")) {
      return requirements["MX_FO_STARTUP"];
    }
    if (project.sector.includes("SOFOM")) {
      return requirements["MX_SOFOM"];
    }
    if (project.sector.includes("Fintech")) {
      return requirements["MX_FINTECH"];
    }
    if (project.sector.includes("Inmobiliario") || project.sector.includes("Real Estate")) {
      return requirements["MX_RE_DEV"];
    }
    if (project.sector.includes("Deuda Privada") || project.sector.includes("Fondo")) {
      return requirements["MX_PVT_DEBT"];
    }
    return requirements["MX_BANCA_MFG"];
  }, [project.sector, requirements]);

  const documents = currentMatrix 
    ? currentMatrix.requirements.map((req) => ({
        name: req.name,
        status: req.is_mandatory ? "Pendiente (Obligatorio)" : "Opcional"
      }))
    : [
        { name: "Cargando requisitos...", status: "Pendiente" }
      ];
  const expectedFunderQuestions = [
    [L("Uso de fondos", "Use of funds"), L("Como se aplicara el dinero, en que calendario y que hitos desbloquea.", "How the money will be deployed, on what schedule and what milestones it unlocks.")],
    [L("Capacidad de pago", "Repayment capacity"), L("Flujo, EBITDA, cobranza, contratos o fuente de repago.", "Cash flow, EBITDA, collections, contracts or repayment source.")],
    [L("Control legal", "Legal control"), L("Poderes, beneficiario controlador, obligaciones vigentes y garantias.", "Powers of attorney, beneficial owner, current obligations and guarantees.")],
    [L("Evidencia", "Evidence"), L("Documentos que soportan afirmaciones financieras, comerciales y legales.", "Documents supporting financial, commercial and legal claims.")],
  ];
  const remediationRoadmap = [
    [L("48 horas", "48 hours"), L("Completar documentos obligatorios y corregir datos inconsistentes.", "Complete mandatory documents and correct inconsistent data.")],
    [L("7 dias", "7 days"), L("Agregar soporte financiero, contrato clave y escenario conservador.", "Add financial support, key contract and conservative scenario.")],
    [L("14 dias", "14 days"), L("Validar KYC/KYB, data room y autorizaciones para otorgantes.", "Validate KYC/KYB, data room and authorizations for funding providers.")],
  ];
  const shareReadiness = [
    [L("Diagnostico IA", "AI Diagnosis"), analysis ? L("Listo", "Ready") : L("Pendiente", "Pending"), analysis ? L("Score y hallazgos generados.", "Score and findings generated.") : L("Ejecuta analisis IA del proyecto.", "Run AI analysis of the project.")],
    [L("Matriz documental", "Document Matrix"), currentMatrix ? L("Activa", "Active") : L("Cargando", "Loading"), currentMatrix ? L(`${currentMatrix.requirements.length} requisito(s) detectados.`, `${currentMatrix.requirements.length} requirement(s) detected.`) : L("Esperando matriz por sector.", "Waiting for sector matrix.")],
    [L("Data room", "Data Room"), documents.length > 1 ? L("Preparado", "Prepared") : L("Inicial", "Initial"), L("Documentos organizados para revision institucional.", "Documents organized for institutional review.")],
    [L("Otorgantes", "Funding Providers"), analysis ? L("Sugeridos", "Suggested") : L("Pendiente", "Pending"), analysis ? L(`${analysis.matches.length} perfil(es) compatibles.`, `${analysis.matches.length} compatible profile(s).`) : L("Se calculan despues del analisis.", "Calculated after analysis.")],
  ];

  const preparationPlan = React.useMemo(() => {
    const mandatory = documents.filter((doc) => doc.status.includes("Obligatorio")).length;
    const sectorRisk = project.sector.includes("Fintech") || project.sector.includes("SOFOM")
      ? L("Regulatorio alto", "High regulatory risk")
      : project.sector.includes("Inmobiliario")
        ? L("Garantias y permisos", "Collateral and permits")
        : L("Presentacion financiera", "Financial presentation");
    const amountTone = project.amount.includes("USD")
      ? L("Validar moneda, fuente de pago y sensibilidad cambiaria.", "Validate currency, repayment source and exchange rate sensitivity.")
      : L("Confirmar moneda y calendario de desembolso.", "Confirm currency and disbursement schedule.");

    return [
      [L("Estructura sugerida", "Suggested structure"), project.sector.includes("Startup") || project.sector.includes("Tecnolog") ? L("Deuda flexible, venture debt o revenue based financing.", "Flexible debt, venture debt or revenue based financing.") : L("Credito estructurado, deuda senior o capital partner.", "Structured credit, senior debt or capital partner.")],
      [L("Riesgo principal", "Main risk"), sectorRisk],
      [L("Documentos criticos", "Critical documents"), L(`${mandatory || documents.length} requisito(s) deben cerrarse antes de compartir.`, `${mandatory || documents.length} requirement(s) must be closed before sharing.`)],
      [L("Lectura financiera", "Financial reading"), amountTone],
    ];
  }, [documents, project.amount, project.sector, i18n.language]);

  const updateProject = (field, value) => {
    setProject((current) => ({ ...current, [field]: value }));
  };

  // FASE 5: Conectado al documentService
  const uploadDocument = async (docName) => {
    if (!user || !selectedExpediente) {
      addNotification("Selecciona un expediente primero", "error");
      return;
    }

    try {
      const doc = await createDocument({
        userId: user.id,
        expedienteId: selectedExpediente.id,
        fileName: docName + ".pdf",
        documentType: "general",
        description: `${docName} subido desde Subir Proyecto`
      });

      setUploadedDocs([...uploadedDocs, doc.id]);
      addNotification(`${docName} subido al expediente ${selectedExpediente.id}`, "success");
    } catch (err) {
      console.error('Error uploading document:', err);
      addNotification(`Error al subir ${docName}`, "error");
    }
  };

  const analyzeProject = () => {
    setAnalysis({
      score: 86,
      readiness: "Apto para revisión preliminar",
      matches: ["SOFOM de crecimiento", "Fondo de deuda privada", "Fintech de crédito empresarial"],
      findings: [
        "El uso de fondos es claro y compatible con productos de deuda empresarial.",
        "Falta completar pitch deck para mejorar presentación ante fondos.",
        "KYC/KYB requiere validación final de beneficiario controlador.",
        "Modelo financiero consistente; se recomienda agregar escenario conservador.",
      ],
    });
    addNotification(copy("Proyecto analizado con agentes IA"), "success");
  };

  return (
    <div>
      <div style={{ marginBottom: "2rem", borderBottom: `1px solid ${COLORS.border}`, paddingBottom: "1.5rem" }}>
        <p style={{ color: COLORS.gold, fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 800, marginBottom: "0.5rem" }}>
          {copy("Solicitantes / Nuevo proyecto")}
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.navy, fontSize: "2.2rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          {copy("Subir proyecto y analizarlo con IA")}
        </h1>
        <p style={{ color: COLORS.textMuted, maxWidth: "860px", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.75 }}>
          {copy("Carga la información base del proyecto, arma el data room y usa agentes IA para revisar viabilidad, faltantes, requisitos de otorgantes y preparación para financiamiento.")}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(340px, 0.85fr)", gap: "1.5rem", alignItems: "start" }}>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.5rem", boxShadow: COLORS.shadowSm }}>
          <h2 style={{ color: COLORS.navy, fontSize: "1.2rem", marginBottom: "1rem" }}>{copy("Informacion del proyecto")}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            {[
              ["name", "Nombre del proyecto"],
              ["amount", "Monto solicitado"],
              ["stage", "Etapa"],
            ].map(([field, label]) => (
              <label key={field} style={{ color: COLORS.navy, fontWeight: 700, fontSize: "0.86rem" }}>
                {copy(label)}
                <input value={project[field]} onChange={(event) => updateProject(field, event.target.value)} style={{ marginTop: "0.4rem" }} />
              </label>
            ))}
            <label style={{ color: COLORS.navy, fontWeight: 700, fontSize: "0.86rem" }}>
              {copy("Sector")}
              <select value={project.sector} onChange={(event) => updateProject("sector", event.target.value)} style={{ marginTop: "0.4rem", width: "100%", padding: "0.4rem", border: `1px solid ${COLORS.border}`, borderRadius: "4px" }}>
                <option value="Tecnología / SaaS">{copy("Tecnología / Startup")}</option>
                <option value="Manufactura / Industrial">{copy("Manufactura / Industrial")}</option>
                <option value="SOFOM / Financiera No Regulada">{copy("SOFOM / Financiera No Regulada")}</option>
                <option value="Fintech / Institución de Tecnología Financiera">{copy("Fintech / Institución de Tecnología Financiera")}</option>
                <option value="Desarrollo Inmobiliario / Real Estate">{copy("Desarrollo Inmobiliario / Real Estate")}</option>
                <option value="Deuda Privada y Fondos de Capital">{copy("Deuda Privada y Fondos de Capital")}</option>
              </select>
            </label>
          </div>
          <label style={{ display: "block", color: COLORS.navy, fontWeight: 700, fontSize: "0.86rem", marginTop: "1rem" }}>
            {copy("Uso de fondos")}
            <textarea value={project.use} onChange={(event) => updateProject("use", event.target.value)} rows={4} style={{ marginTop: "0.4rem", resize: "vertical" }} />
          </label>

          <div style={{ marginTop: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <button onClick={() => addNotification(copy("Proyecto guardado como borrador"), "success")} style={{ padding: "0.85rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, background: COLORS.white, color: COLORS.navy, fontWeight: 800 }}>
              {copy("Guardar borrador")}
            </button>
            <button onClick={analyzeProject} style={{ padding: "0.85rem", borderRadius: "6px", border: "none", background: COLORS.navy, color: COLORS.white, fontWeight: 800 }}>
              {copy("Analizar proyecto con IA")}
            </button>
          </div>
        </div>

        <aside style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.5rem", boxShadow: COLORS.shadowSm }}>
          <h2 style={{ color: COLORS.navy, fontSize: "1.2rem", marginBottom: "1rem" }}>{copy("Data room del proyecto")}</h2>
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {documents.map((doc) => (
              <div key={copy(doc.name)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderRadius: "6px", background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                <div>
                  <p style={{ color: COLORS.navy, fontWeight: 800, fontSize: "0.9rem" }}>{copy(doc.name)}</p>
                  <p style={{ color: doc.status === "Pendiente" ? COLORS.amber : COLORS.green, fontSize: "0.78rem", fontWeight: 700 }}>{copy(doc.status)}</p>
                </div>
                <button onClick={() => uploadDocument(doc.name)} style={{ padding: "0.45rem 0.75rem", borderRadius: "5px", border: "none", background: doc.status === "Pendiente" ? COLORS.gold : COLORS.navy, color: doc.status === "Pendiente" ? COLORS.navy : COLORS.white, fontWeight: 800 }}>
                  {copy("Subir")}
                </button>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div style={{ marginTop: "1.5rem", display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(300px, 0.85fr)", gap: "1.5rem" }}>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.5rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ color: COLORS.gold, fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 800, marginBottom: "0.35rem" }}>
            {copy("Diagnostico de estructura")}
          </p>
          <h2 style={{ color: COLORS.navy, fontSize: "1.2rem", marginBottom: "1rem" }}>{copy("Como llegaria a un otorgante")}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.8rem" }}>
            {preparationPlan.map(([label, value]) => (
              <div key={copy(label)} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.9rem" }}>
                <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "0.25rem" }}>{copy(label)}</p>
                <p style={{ color: COLORS.navy, fontWeight: 900, fontSize: "0.86rem", lineHeight: 1.45 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.5rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ color: COLORS.gold, fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 800, marginBottom: "0.35rem" }}>
            {copy("Preguntas esperadas")}
          </p>
          <h2 style={{ color: COLORS.navy, fontSize: "1.2rem", marginBottom: "1rem" }}>{copy("Lo que probablemente pedira el otorgante")}</h2>
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {expectedFunderQuestions.map(([label, detail]) => (
              <div key={copy(label)} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.8rem" }}>
                <p style={{ color: COLORS.navy, fontWeight: 900, fontSize: "0.84rem", marginBottom: "0.25rem" }}>{copy(label)}</p>
                <p style={{ color: COLORS.textMuted, fontSize: "0.76rem", lineHeight: 1.45 }}>{copy(detail)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {analysis && (
        <div style={{ marginTop: "1.5rem", background: "linear-gradient(135deg, rgba(15,31,46,0.04), rgba(201,168,76,0.12))", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
            <div>
              <p style={{ color: COLORS.gold, fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 800 }}>{copy("Resultado IA")}</p>
              <h2 style={{ color: COLORS.navy, fontSize: "1.25rem" }}>{copy(analysis.readiness)}</h2>
            </div>
            <span style={{ color: COLORS.green, fontSize: "2rem", fontWeight: 900 }}>{analysis.score}/100</span>
          </div>
 
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(260px, 0.8fr)", gap: "1rem" }}>
            <div style={{ background: COLORS.white, borderRadius: "8px", padding: "1rem", border: `1px solid ${COLORS.border}` }}>
              <p style={{ color: COLORS.navy, fontWeight: 800, marginBottom: "0.6rem" }}>{copy("Hallazgos")}</p>
              {analysis.findings.map((finding) => (
                <p key={finding} style={{ color: COLORS.textMuted, fontSize: "0.88rem", lineHeight: 1.55, marginBottom: "0.35rem" }}>- {copy(finding)}</p>
              ))}
            </div>
            <div style={{ background: COLORS.white, borderRadius: "8px", padding: "1rem", border: `1px solid ${COLORS.border}` }}>
              <p style={{ color: COLORS.navy, fontWeight: 800, marginBottom: "0.6rem" }}>{copy("Otorgantes sugeridos")}</p>
              {analysis.matches.map((match) => (
                <p key={match} style={{ color: COLORS.textMuted, fontSize: "0.88rem", lineHeight: 1.55, marginBottom: "0.35rem" }}>- {copy(match)}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: "1.5rem", background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.5rem", boxShadow: COLORS.shadowSm }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "1rem" }}>
          <div>
            <p style={{ color: COLORS.gold, fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 800 }}>{copy("Antes de compartir con otorgantes")}</p>
            <h2 style={{ color: COLORS.navy, fontSize: "1.2rem" }}>{copy("Checklist de preparacion institucional")}</h2>
          </div>
          <button onClick={() => addNotification("Checklist listo para prevalidacion NSD", "success")} style={{ padding: "0.75rem 1rem", borderRadius: "6px", border: "none", background: COLORS.gold, color: COLORS.navy, fontWeight: 900, cursor: "pointer" }}>
            {copy("Solicitar prevalidacion")}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.8rem" }}>
          {shareReadiness.map(([label, status, detail]) => (
            <div key={copy(label)} style={{ padding: "0.9rem", borderRadius: "8px", background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.35rem" }}>
                <strong style={{ color: COLORS.navy, fontSize: "0.86rem" }}>{copy(label)}</strong>
                <span style={{ color: status === "Pendiente" ? COLORS.amber : COLORS.green, fontWeight: 900, fontSize: "0.72rem" }}>{copy(status)}</span>
              </div>
              <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45 }}>{copy(detail)}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "1.2rem", paddingTop: "1.2rem", borderTop: `1px solid ${COLORS.border}` }}>
          <h3 style={{ color: COLORS.navy, fontSize: "1rem", marginBottom: "0.75rem" }}>{copy("Plan de subsanacion sugerido")}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
            {remediationRoadmap.map(([time, detail]) => (
              <div key={time} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.85rem" }}>
                <p style={{ color: COLORS.gold, fontWeight: 900, fontSize: "0.78rem", marginBottom: "0.25rem" }}>{time}</p>
                <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45 }}>{copy(detail)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


