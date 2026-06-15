import React, { useEffect, useState } from "react";
import { COLORS } from "../../utils/constants";
import { auditAPI, documentsAPI, informationRequestsAPI, otorganteAPI, scoringAPI, sharesAPI } from "../../services/api";
import AIReviewPanel from "./AIReviewPanel";
import ComplianceReadinessPanel from "./ComplianceReadinessPanel";
import DocumentMatrixPanel from "./DocumentMatrixPanel";
import RemediationPlanPanel from "./RemediationPlanPanel";
import { DOCUMENT_STATUSES, DOCUMENT_TYPES, formatDocumentStatus, formatDocumentType } from "../../utils/institutional";

const demoPanelDocuments = [
  { id: "demo-doc-1", filename: "Acta constitutiva.pdf", uploaded_at: "2026-05-24T17:10:00.000Z", document_type: "corporativo_legal", review_status: "approved" },
  { id: "demo-doc-2", filename: "Estados financieros 2024.xlsx", uploaded_at: "2026-05-24T17:18:00.000Z", document_type: "financiero", review_status: "observed" },
  { id: "demo-doc-3", filename: "Constancia situacion fiscal.pdf", uploaded_at: "2026-05-25T09:30:00.000Z", document_type: "fiscal", review_status: "in_review" },
];

const demoPanelReviews = [
  {
    id: "demo-review-1",
    document_id: "demo-doc-1",
    status: "green",
    score: 91,
    summary: "Documento consistente y legible.",
    findings: ["Objeto social identificado.", "Poderes localizados."],
    missing_items: [],
    created_at: "2026-05-25T10:00:00.000Z",
    documents: { filename: "Acta constitutiva.pdf" }
  },
  {
    id: "demo-review-2",
    document_id: "demo-doc-2",
    status: "yellow",
    score: 72,
    summary: "Requiere validacion manual de cifras.",
    findings: ["Estados financieros detectados."],
    missing_items: ["Estados financieros auditados 2025"],
    created_at: "2026-05-25T10:12:00.000Z",
    documents: { filename: "Estados financieros 2024.xlsx" }
  }
];

const demoPanelScoring = {
  finalScore: 78,
  readinessGrade: {
    grade: "C",
    label: "Incompleto pero corregible",
    color: "amber",
    explanation: "Tiene base documental, aunque faltan evidencias para una revision eficiente."
  },
  recommendation: {
    label: "Viable con condiciones",
    reason: "El expediente puede avanzar sujeto a subsanar faltantes y validar riesgos."
  },
  summary: {
    uploadedDocuments: 3,
    missingMandatory: 2
  },
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
  requirementResults: [
    { code: "MFG_FIN_001", name: "Estados Financieros (Ultimos 3 anos)", status: "review", mandatory: true },
    { code: "MFG_FIN_002", name: "Flujo de Caja Historico", status: "missing", mandatory: true },
    { code: "MFG_GAR_001", name: "Avaluo de Garantias Propuestas", status: "missing", mandatory: false }
  ]
};

const demoShareReadiness = {
  canPublish: false,
  manualApproval: false,
  grade: "C",
  finalScore: 78,
  complianceStatus: "pendiente",
  regulatoryStatus: "review",
  blockers: ["2 requisito(s) obligatorio(s) faltante(s)."],
  warnings: ["Score interno 78/100: compartir solo con contexto de pendientes."],
  nextAction: "Subsanar bloqueos o autorizar manualmente antes de compartir con otorgantes."
};

const auditActionLabels = {
  case_created: "Expediente creado",
  case_institutional_updated: "Expediente actualizado",
  document_uploaded: "Documento cargado",
  document_institutional_updated: "Documento clasificado",
  document_ai_review_completed: "Revisión IA completada",
  ai_review_completed: "Revisión IA completada",
  data_room_shared: "Data room compartido",
  data_room_invitation_accepted: "Invitación aceptada",
  shared_data_room_viewed: "Data room revisado",
  funder_interest_recorded: "Interés de otorgante",
  executive_report_generated: "Reporte generado",
};

function formatAuditAction(action = "") {
  return auditActionLabels[action] || action.replaceAll("_", " ");
}

function buildAuditMarkdown(order, auditLogs = [], auditSummary = null) {
  const lines = [
    "# Bitacora de auditoria NSD",
    "",
    `- Expediente: ${order.caseNumber || order.id}`,
    `- Proyecto: ${order.projectName || "Sin nombre"}`,
    `- Eventos totales: ${auditSummary?.totalEvents || auditLogs.length}`,
    `- Eventos relevantes: ${auditSummary?.complianceRelevantEvents || 0}`,
    `- Eventos criticos: ${auditSummary?.criticalEvents || 0}`,
    "",
    "## Eventos recientes",
    ...(auditLogs.length
      ? auditLogs.map((log, index) => {
        const date = log.created_at ? new Date(log.created_at).toLocaleString("es-MX") : "Fecha no disponible";
        return `${index + 1}. ${date} - ${formatAuditAction(log.action)} (${log.entity_type || "entidad"})`;
      })
      : ["Sin eventos registrados."]),
    "",
    "## Nota",
    "Esta bitacora resume acciones registradas en NSD para trazabilidad operativa y de cumplimiento."
  ];

  return lines.join("\n");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatRequestEventAction(action) {
  const labels = {
    created: "Requerimiento creado",
    updated: "Requerimiento actualizado",
  };

  return labels[action] || action || "Evento registrado";
}

function formatRequestEventDate(value) {
  if (!value) return "Fecha no disponible";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Fecha no disponible" : date.toLocaleString("es-MX");
}

export default function ServiceOrderDetailPanel({ order, onClose }) {
  const [message, setMessage] = useState("");
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [reviewingDocumentId, setReviewingDocumentId] = useState(null);
  const [savingDocumentId, setSavingDocumentId] = useState(null);
  const [documentStatus, setDocumentStatus] = useState("");
  const [aiReview, setAiReview] = useState(null);
  const [reviewHistory, setReviewHistory] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [shares, setShares] = useState([]);
  const [sharesLoading, setSharesLoading] = useState(true);
  const [shareForm, setShareForm] = useState({ recipientName: "", recipientEmail: "" });
  const [shareStatus, setShareStatus] = useState("");
  const [shareReadiness, setShareReadiness] = useState(null);
  const [shareReadinessLoading, setShareReadinessLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSummary, setAuditSummary] = useState(null);
  const [auditLoading, setAuditLoading] = useState(true);
  const [infoRequests, setInfoRequests] = useState([]);
  const [infoRequestsLoading, setInfoRequestsLoading] = useState(true);
  const [requestResponses, setRequestResponses] = useState({});
  const [savingRequestId, setSavingRequestId] = useState(null);
  const [uploadingRequestId, setUploadingRequestId] = useState(null);
  const [contactRequests, setContactRequests] = useState([]);
  const [contactRequestsLoading, setContactRequestsLoading] = useState(true);
  const [savingContactRequestId, setSavingContactRequestId] = useState(null);
  const [scoring, setScoring] = useState(null);
  const [scoringLoading, setScoringLoading] = useState(true);
  const [scoringStatus, setScoringStatus] = useState("");
  const [reportStatus, setReportStatus] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      author: "Carlos Mendoza",
      role: "Especialista",
      message: "Hola, he revisado tu proyecto. Necesito algunos documentos adicionales.",
      timestamp: "2026-05-20 10:30",
    },
  ]);

  const formatDateOrPending = (value) => {
    if (!value || value === "Pendiente" || value === "TBD") return "Pendiente";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Pendiente" : date.toLocaleDateString("es-MX");
  };

  const formatDateInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
  };

  const getExpiryStatus = (value) => {
    if (!value) return null;
    const expiry = new Date(value);
    if (Number.isNaN(expiry.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: "Vencido", color: "#C62828", background: "rgba(198,40,40,0.08)" };
    if (diffDays <= 30) return { label: "Por vencer", color: COLORS.amber, background: "rgba(201,168,76,0.14)" };
    return { label: "Vigente", color: COLORS.green, background: "rgba(46,125,50,0.08)" };
  };

  const getValidationColor = (status) => {
    if (status === "pass" || status === "clear") return COLORS.green;
    if (status === "review" || status === "review_required" || status === "skipped" || status === "configured") return COLORS.amber;
    return "#C62828";
  };

  const getGradeColor = (grade = "pendiente") => ({
    A: COLORS.green,
    B: COLORS.navy,
    C: COLORS.amber,
    D: "#C62828",
    E: "#8A1C1C",
  }[String(grade).toUpperCase()] || COLORS.textMuted);

  const formatStage = (stage = "captura") => ({
    captura: "Captura",
    revision_documental: "Revision documental",
    scoring: "Scoring",
    data_room: "Data room",
    presentado_otorgantes: "Con otorgantes",
    cerrado: "Cerrado",
  }[stage] || stage);

  const loadDocuments = async () => {
    setDocumentsLoading(true);
    try {
      if (order.demo) {
        setDocuments(demoPanelDocuments);
        return;
      }

      const { data } = await documentsAPI.list(order.id);
      setDocuments(data || []);
    } catch (error) {
      setDocumentStatus(error.response?.data?.error || "No se pudieron cargar los documentos");
    } finally {
      setDocumentsLoading(false);
    }
  };

  const loadReviewHistory = async () => {
    setReviewsLoading(true);
    try {
      if (order.demo) {
        setReviewHistory(demoPanelReviews);
        return;
      }

      const { data } = await documentsAPI.reviews(order.id);
      setReviewHistory(data || []);
    } catch (error) {
      setDocumentStatus(error.response?.data?.error || "No se pudo cargar el historial IA");
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadShares = async () => {
    setSharesLoading(true);
    try {
      if (order.demo) {
        setShares([
          {
            id: "demo-share-1",
            recipient_name: "Banco Demo",
            recipient_email: "analista@banco.demo",
            status: "shared",
            shareUrl: "/shared-data-room/demo-token"
          }
        ]);
        return;
      }

      const { data } = await sharesAPI.list(order.id);
      setShares((data || []).map((share) => ({
        ...share,
        shareUrl: `/shared-data-room/${share.access_token}`
      })));
    } catch (error) {
      setShareStatus(error.response?.data?.error || "No se pudieron cargar accesos compartidos");
    } finally {
      setSharesLoading(false);
    }
  };

  const loadShareReadiness = async () => {
    setShareReadinessLoading(true);
    try {
      if (order.demo) {
        setShareReadiness(demoShareReadiness);
        return;
      }

      const { data } = await sharesAPI.readiness(order.id);
      setShareReadiness(data?.publishability || null);
    } catch (error) {
      console.warn("No se pudo evaluar publicacion institucional", error.response?.data?.error || error.message);
      setShareReadiness(null);
    } finally {
      setShareReadinessLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      if (order.demo) {
        setAuditLogs([
          { id: "demo-audit-1", action: "document_uploaded", entity_type: "document", created_at: "2026-05-25T10:00:00.000Z" },
          { id: "demo-audit-2", action: "ai_review_completed", entity_type: "document_review", created_at: "2026-05-25T10:12:00.000Z" },
          { id: "demo-audit-3", action: "data_room_shared", entity_type: "data_room_share", created_at: "2026-05-25T10:24:00.000Z" }
        ]);
        setAuditSummary({ totalEvents: 3, complianceRelevantEvents: 3, criticalEvents: 3 });
        return;
      }

      const [{ data: logs }, { data: summary }] = await Promise.all([
        auditAPI.list(order.id),
        auditAPI.summary(order.id)
      ]);
      setAuditLogs(logs || []);
      setAuditSummary(summary || null);
    } catch (error) {
      console.warn("No se pudo cargar auditoria", error.response?.data?.error || error.message);
    } finally {
      setAuditLoading(false);
    }
  };

  const loadInformationRequests = async () => {
    setInfoRequestsLoading(true);
    try {
      if (order.demo) {
        setInfoRequests([
          {
            id: "demo-info-1",
            title: "Actualizar estados financieros auditados",
            description: "El otorgante solicita estados financieros auditados del ultimo ejercicio.",
            priority: "high",
            status: "open",
            created_at: new Date().toISOString()
          }
        ]);
        return;
      }

      const { data } = await informationRequestsAPI.list(order.id);
      setInfoRequests(data || []);
    } catch (error) {
      setInfoRequests([]);
    } finally {
      setInfoRequestsLoading(false);
    }
  };

  const loadContactRequests = async () => {
    setContactRequestsLoading(true);
    try {
      if (order.demo) {
        setContactRequests([
          {
            id: "demo-contact-1",
            funder_email: "analista@banco.demo",
            status: "requested",
            reason: "Solicitud demo de contacto posterior a revision institucional.",
            created_at: new Date().toISOString()
          }
        ]);
        return;
      }

      const { data } = await otorganteAPI.listContactRequests(order.id);
      setContactRequests(data || []);
    } catch (error) {
      setContactRequests([]);
    } finally {
      setContactRequestsLoading(false);
    }
  };

  const updateContactRequest = async (request, status) => {
    setSavingContactRequestId(request.id);
    try {
      if (order.demo || String(request.id).startsWith("demo-")) {
        setContactRequests((prev) => prev.map((item) => item.id === request.id ? {
          ...item,
          status,
          updated_at: new Date().toISOString()
        } : item));
        setShareStatus("Solicitud de contacto demo actualizada.");
        return;
      }

      const { data } = await otorganteAPI.updateContactRequest(request.id, {
        status,
        notes: status === "approved"
          ? "Contacto autorizado por solicitante/NSD."
          : "Contacto rechazado o pendiente de condiciones adicionales."
      });
      setContactRequests((prev) => prev.map((item) => item.id === request.id ? data : item));
      setShareStatus("Solicitud de contacto actualizada.");
      await loadAuditLogs();
    } catch (error) {
      setShareStatus(error.response?.data?.error || "No se pudo actualizar la solicitud de contacto.");
    } finally {
      setSavingContactRequestId(null);
    }
  };

  const updateInformationRequest = async (request, status = "in_progress") => {
    setSavingRequestId(request.id);
    try {
      const response = requestResponses[request.id] || request.response || "";

      if (order.demo || String(request.id).startsWith("demo-")) {
        setInfoRequests((prev) => prev.map((item) => (
          item.id === request.id
            ? { ...item, status, response, resolved_at: status === "resolved" ? new Date().toISOString() : item.resolved_at }
            : item
        )));
        setDocumentStatus("Respuesta demo guardada.");
        return;
      }

      const { data } = await informationRequestsAPI.update(request.id, {
        status,
        response,
        resolvedAt: status === "resolved" ? new Date().toISOString() : null
      });
      setInfoRequests((prev) => prev.map((item) => item.id === request.id ? data : item));
      setDocumentStatus("Requerimiento actualizado.");
      await loadAuditLogs();
    } catch (error) {
      setDocumentStatus(error.response?.data?.error || "No se pudo actualizar el requerimiento.");
    } finally {
      setSavingRequestId(null);
    }
  };

  const handleUploadForRequest = async (event, request) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingRequestId(request.id);
    setDocumentStatus("Subiendo evidencia del requerimiento...");

    try {
      const response = `Documento cargado para requerimiento: ${file.name}`;

      if (order.demo || String(request.id).startsWith("demo-")) {
        setDocuments((prev) => [
          {
            id: `demo-doc-${Date.now()}`,
            filename: file.name,
            uploaded_at: new Date().toISOString(),
            document_type: request.document_type || "otro",
            review_status: "uploaded"
          },
          ...prev
        ]);
        setInfoRequests((prev) => prev.map((item) => item.id === request.id ? {
          ...item,
          status: "resolved",
          response,
          resolved_at: new Date().toISOString()
        } : item));
        setDocumentStatus("Evidencia demo cargada y requerimiento resuelto.");
        return;
      }

      const { data: uploadedDocument } = await documentsAPI.upload(order.id, file);
      if (request.document_type && uploadedDocument?.id) {
        await documentsAPI.updateInstitutional(order.id, uploadedDocument.id, {
          documentType: request.document_type
        });
      }
      const { data } = await informationRequestsAPI.update(request.id, {
        status: "resolved",
        response,
        documentId: uploadedDocument?.id || null,
        resolvedAt: new Date().toISOString()
      });
      setInfoRequests((prev) => prev.map((item) => item.id === request.id ? data : item));
      setDocumentStatus("Evidencia cargada y requerimiento resuelto.");
      await loadDocuments();
      await loadAuditLogs();
      await loadScoring();
      await loadShareReadiness();
    } catch (error) {
      setDocumentStatus(error.response?.data?.error || "No se pudo subir la evidencia del requerimiento.");
    } finally {
      setUploadingRequestId(null);
      event.target.value = "";
    }
  };

  const loadScoring = async () => {
    setScoringLoading(true);
    try {
      if (order.demo) {
        setScoring(demoPanelScoring);
        setScoringStatus("");
        return;
      }

      const { data } = await scoringAPI.getOrderScoring(order.id);
      setScoring(data);
      setScoringStatus("");
    } catch (error) {
      setScoringStatus(error.response?.data?.error || "No se pudo calcular el scoring");
    } finally {
      setScoringLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
    loadReviewHistory();
    loadShares();
    loadShareReadiness();
    loadAuditLogs();
    loadInformationRequests();
    loadContactRequests();
    loadScoring();
  }, [order.id]);

  useEffect(() => {
    if (!aiReview || aiReview.status !== 'processing' || order.demo) return;

    let active = true;
    let attempts = 0;
    const maxAttempts = 20;

    const pollReview = async () => {
      try {
        attempts += 1;
        const { data } = await documentsAPI.reviews(order.id);
        const currentReview = (data || []).find((r) => r.id === aiReview.id);

        if (currentReview && currentReview.status !== 'processing') {
          if (active) {
            setAiReview({
              ...currentReview,
              filename: aiReview.filename
            });
            await loadReviewHistory();
            await loadScoring();
            await loadAuditLogs();
          }
          return;
        }

        if (active && attempts >= maxAttempts) {
          setDocumentStatus("La revision IA sigue en proceso. Puedes volver a abrir este expediente en unos minutos.");
          await loadReviewHistory();
          return;
        }

        if (active) {
          window.setTimeout(pollReview, 3000);
        }
      } catch (err) {
        console.error("Error polling review status:", err);
        if (active && attempts < maxAttempts) {
          window.setTimeout(pollReview, 5000);
        }
      }
    };

    const timeout = window.setTimeout(pollReview, 1500);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [aiReview, order.id]);

  const handleShareDataRoom = async (event) => {
    event.preventDefault();
    if (!shareForm.recipientName.trim()) {
      setShareStatus("Agrega el nombre del otorgante o entidad.");
      return;
    }

    setShareStatus("Generando acceso para otorgante...");

    try {
      const { data } = await sharesAPI.create(order.id, shareForm.recipientName.trim(), shareForm.recipientEmail.trim());
      setShareForm({ recipientName: "", recipientEmail: "" });
      setShareStatus(`Acceso generado: ${window.location.origin}${data.shareUrl}`);
      await loadShares();
      await loadShareReadiness();
      await loadAuditLogs();
    } catch (error) {
      const publishability = error.response?.data?.publishability;
      if (publishability) setShareReadiness(publishability);
      setShareStatus(error.response?.data?.error || "No se pudo compartir el data room");
    }
  };

  const handleUploadDocument = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setDocumentStatus("Subiendo documento al expediente...");

    try {
      if (order.demo) {
        setDocuments((prev) => [
          {
            id: `demo-doc-${Date.now()}`,
            filename: file.name,
            uploaded_at: new Date().toISOString()
          },
          ...prev
        ]);
        setDocumentStatus("Documento cargado correctamente en demo.");
        return;
      }

      await documentsAPI.upload(order.id, file);
      setDocumentStatus("Documento cargado correctamente.");
      await loadDocuments();
      await loadAuditLogs();
      await loadScoring();
      await loadShareReadiness();
    } catch (error) {
      setDocumentStatus(error.response?.data?.error || "Error al subir documento");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleOpenDocument = async (documentId) => {
    try {
      if (order.demo) {
        setDocumentStatus("Vista de documento simulada en modo demo.");
        return;
      }

      const { data } = await documentsAPI.getSignedUrl(order.id, documentId);
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setDocumentStatus(error.response?.data?.error || "No se pudo abrir el documento");
    }
  };

  const handleDocumentClassification = async (document, patch) => {
    setSavingDocumentId(document.id);
    setDocumentStatus("Actualizando clasificacion documental...");

    try {
      if (order.demo) {
        setDocuments((prev) => prev.map((item) => (
          item.id === document.id ? { ...item, ...patch } : item
        )));
        setDocumentStatus("Clasificacion actualizada en demo.");
        return;
      }

      await documentsAPI.updateInstitutional(order.id, document.id, patch);
      setDocumentStatus("Clasificacion documental actualizada.");
      await loadDocuments();
      await loadAuditLogs();
      await loadScoring();
      await loadShareReadiness();
    } catch (error) {
      setDocumentStatus(error.response?.data?.error || "No se pudo actualizar la clasificacion documental");
    } finally {
      setSavingDocumentId(null);
    }
  };

  const handleAiReview = async (document) => {
    setReviewingDocumentId(document.id);
    setDocumentStatus("Generando revision IA preliminar...");

    try {
      if (order.demo) {
        const review = {
          id: `demo-review-${Date.now()}`,
          document_id: document.id,
          status: "green",
          score: 88,
          summary: "Revision IA demo completada. Documento legible y vinculado al expediente.",
          findings: ["Formato reconocido.", "Datos principales localizados."],
          missing_items: ["Validacion externa pendiente"],
          created_at: new Date().toISOString(),
          documents: { filename: document.filename }
        };
        setAiReview({ ...review, filename: document.filename });
        setReviewHistory((prev) => [review, ...prev]);
        setDocumentStatus("Revision IA demo guardada en el expediente.");
        setScoring(demoPanelScoring);
        return;
      }

      const { data } = await documentsAPI.review(order.id, document.id);
      setAiReview({
        ...data.review,
        filename: data.document?.filename || document.filename
      });
      setDocumentStatus("Revisión IA guardada en el expediente.");
      await loadReviewHistory();
      await loadAuditLogs();
      await loadScoring();
      await loadShareReadiness();
    } catch (error) {
      setDocumentStatus(error.response?.data?.error || "No se pudo generar la revision IA");
    } finally {
      setReviewingDocumentId(null);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        author: "Tú",
        role: "Cliente",
        message: message,
        timestamp: new Date().toLocaleString(),
      },
    ]);
    setMessage("");
  };

  const copyAuditLog = async () => {
    try {
      await navigator.clipboard.writeText(buildAuditMarkdown(order, auditLogs, auditSummary));
      setDocumentStatus("Bitacora copiada al portapapeles.");
    } catch (error) {
      setDocumentStatus("No se pudo copiar la bitacora.");
    }
  };

  const downloadAuditLog = () => {
    const markdown = buildAuditMarkdown(order, auditLogs, auditSummary);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    downloadBlob(blob, `bitacora-${order.caseNumber || order.id}.md`);
  };

  const downloadInstitutionalMemo = async () => {
    setReportStatus("Preparando memo institucional...");
    try {
      if (order.demo) {
        const markdown = [
          "# Memo institucional NSD",
          "",
          `- Expediente: ${order.caseNumber || order.id}`,
          `- Proyecto: ${order.projectName || "Proyecto demo"}`,
          `- Score interno: ${scoring?.finalScore || 0}/100`,
          `- Grado: ${scoring?.readinessGrade?.grade || "C"} - ${scoring?.readinessGrade?.label || "Incompleto pero corregible"}`,
          "",
          "## Nota de alcance",
          "Este memo demo no constituye aprobacion crediticia ni decision vinculante."
        ].join("\n");
        downloadBlob(new Blob([markdown], { type: "text/markdown;charset=utf-8" }), `memo-${order.caseNumber || order.id}.md`);
        setReportStatus("Memo demo descargado.");
        return;
      }

      const { data } = await scoringAPI.downloadInstitutionalMemo(order.id);
      downloadBlob(data, `memo-${order.caseNumber || order.id}.md`);
      setReportStatus("Memo institucional descargado.");
      await loadAuditLogs();
    } catch (error) {
      setReportStatus(error.response?.data?.error || "No se pudo descargar el memo institucional.");
    }
  };

  const downloadAuditPackage = async (format = "md") => {
    setDocumentStatus(`Preparando auditoria ${format.toUpperCase()}...`);
    try {
      if (order.demo) {
        if (format === "csv") {
          const csv = [
            '"created_at","action","entity_type"',
            ...auditLogs.map((log) => `"${log.created_at || ""}","${log.action || ""}","${log.entity_type || ""}"`)
          ].join("\n");
          downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `auditoria-${order.caseNumber || order.id}.csv`);
        } else {
          downloadAuditLog();
        }
        setDocumentStatus("Auditoria demo descargada.");
        return;
      }

      const response = format === "csv"
        ? await auditAPI.exportCsv(order.id)
        : await auditAPI.exportMarkdown(order.id);
      downloadBlob(response.data, `auditoria-${order.caseNumber || order.id}.${format}`);
      setDocumentStatus("Paquete de auditoria descargado.");
    } catch (error) {
      setDocumentStatus(error.response?.data?.error || "No se pudo descargar el paquete de auditoria.");
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      height: "100%",
      width: "100%",
      maxWidth: "450px",
      background: "white",
      boxShadow: "-2px 0 12px rgba(0,0,0,0.15)",
      overflowY: "auto",
      zIndex: 999,
      animation: "slideInRight 0.3s ease",
    }}>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "1.5rem",
        borderBottom: `1px solid ${COLORS.border}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: COLORS.bg,
      }}>
        <div>
          <p style={{
            color: COLORS.gold,
            fontSize: "0.76rem",
            fontWeight: 900,
            marginBottom: "0.3rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}>
            {order.caseNumber || `NSD-${String(order.id).substring(0, 8).toUpperCase()}`}
          </p>
          <h2 style={{
            color: COLORS.navy,
            fontSize: "1.2rem",
            fontWeight: 700,
            marginBottom: "0.25rem",
          }}>
            {order.projectName}
          </h2>
          <p style={{
            color: COLORS.textMuted,
            fontSize: "0.85rem",
          }}>
            {order.serviceName}
          </p>
          <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", marginTop: "0.7rem" }}>
            <span style={{
              padding: "0.28rem 0.55rem",
              borderRadius: "999px",
              background: "rgba(27,58,92,0.08)",
              color: COLORS.navy,
              fontSize: "0.72rem",
              fontWeight: 900,
            }}>
              {formatStage(order.stage)}
            </span>
            <span style={{
              padding: "0.28rem 0.55rem",
              borderRadius: "999px",
              background: "rgba(201,168,76,0.12)",
              color: getGradeColor(order.readinessGrade),
              fontSize: "0.72rem",
              fontWeight: 900,
            }}>
              Grado {String(order.readinessGrade || "pendiente").toUpperCase()}
            </span>
            <span style={{
              padding: "0.28rem 0.55rem",
              borderRadius: "999px",
              background: "rgba(0,0,0,0.04)",
              color: COLORS.textMuted,
              fontSize: "0.72rem",
              fontWeight: 900,
            }}>
              Cumplimiento {order.complianceStatus || "pendiente"}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: "1.5rem",
            cursor: "pointer",
            color: COLORS.textMuted,
          }}
        >
          ✕
        </button>
      </div>

      {/* Timeline */}
      <div style={{ padding: "2rem 1.5rem", borderBottom: `1px solid ${COLORS.border}` }}>
        <h3 style={{
          color: COLORS.navy,
          fontSize: "0.95rem",
          fontWeight: 700,
          marginBottom: "1.5rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}>
          Timeline
        </h3>

        <div style={{ position: "relative", paddingLeft: "2rem" }}>
          {order.timeline.map((item, i) => (
            <div key={i} style={{ marginBottom: "1.5rem", position: "relative" }}>
              <div style={{
                position: "absolute",
                left: "-2rem",
                top: "0",
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: item.status === "completed" ? COLORS.green : item.status === "in_progress" ? COLORS.amber : COLORS.border,
                border: `2px solid white`,
              }} />

              {i < order.timeline.length - 1 && (
                <div style={{
                  position: "absolute",
                  left: "-1.92rem",
                  top: "16px",
                  width: "2px",
                  height: "30px",
                  background: COLORS.border,
                }} />
              )}

              <div>
                <p style={{
                  color: item.status === "completed" ? COLORS.green : item.status === "in_progress" ? COLORS.amber : COLORS.textMuted,
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  marginBottom: "0.25rem",
                }}>
                  {item.event}
                </p>
                <p style={{
                  color: COLORS.textMuted,
                  fontSize: "0.8rem",
                }}>
                  {item.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data room */}
      <div style={{ padding: "1.5rem", borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1rem",
        }}>
          <div>
            <h3 style={{
              color: COLORS.navy,
              fontSize: "0.95rem",
              fontWeight: 700,
              marginBottom: "0.25rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
              Data room del expediente
            </h3>
            <p style={{ color: COLORS.textMuted, fontSize: "0.8rem", lineHeight: 1.45 }}>
              Carga documentos para revision, IA y seguimiento con NSD.
            </p>
          </div>
          <label style={{
            padding: "0.65rem 0.9rem",
            background: uploading ? COLORS.border : COLORS.gold,
            color: COLORS.navy,
            borderRadius: "6px",
            fontWeight: 800,
            cursor: uploading ? "not-allowed" : "pointer",
            fontSize: "0.82rem",
            whiteSpace: "nowrap",
          }}>
            {uploading ? "Subiendo..." : "Subir docto"}
            <input
              type="file"
              onChange={handleUploadDocument}
              disabled={uploading}
              style={{ display: "none" }}
            />
          </label>
        </div>

        {documentStatus && (
          <p style={{
            color: documentStatus.includes("Error") || documentStatus.includes("No se") ? "#C62828" : COLORS.green,
            fontSize: "0.82rem",
            marginBottom: "0.9rem",
            lineHeight: 1.45,
          }}>
            {documentStatus}
          </p>
        )}

        {documentsLoading ? (
          <p style={{ color: COLORS.textMuted, fontSize: "0.9rem" }}>Cargando documentos...</p>
        ) : documents.length === 0 ? (
          <div style={{
            padding: "1rem",
            background: COLORS.bg,
            border: `1px dashed ${COLORS.border}`,
            borderRadius: "8px",
          }}>
            <p style={{ color: COLORS.textMuted, fontSize: "0.9rem", lineHeight: 1.5 }}>
              Aun no hay documentos cargados en este expediente.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {documents.map((document) => {
              const expiryStatus = getExpiryStatus(document.expires_at);
              return (
              <div key={document.id} style={{
                padding: "0.85rem",
                border: `1px solid ${COLORS.border}`,
                borderRadius: "8px",
                background: "white",
              }}>
                <p style={{
                  color: COLORS.navy,
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  marginBottom: "0.25rem",
                  wordBreak: "break-word",
                }}>
                  {document.filename}
                </p>
                <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", marginBottom: "0.75rem" }}>
                  Cargado: {new Date(document.uploaded_at).toLocaleString("es-MX")}
                </p>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                  <span style={{
                    padding: "0.22rem 0.48rem",
                    borderRadius: "999px",
                    background: "rgba(27,58,92,0.08)",
                    color: COLORS.navy,
                    fontSize: "0.7rem",
                    fontWeight: 800,
                  }}>
                    {formatDocumentType(document.document_type)}
                  </span>
                  <span style={{
                    padding: "0.22rem 0.48rem",
                    borderRadius: "999px",
                    background: "rgba(201,168,76,0.14)",
                    color: COLORS.gold,
                    fontSize: "0.7rem",
                    fontWeight: 800,
                  }}>
                    {formatDocumentStatus(document.review_status)}
                  </span>
                  {document.is_blocking && (
                    <span style={{
                      padding: "0.22rem 0.48rem",
                      borderRadius: "999px",
                      background: "rgba(198,40,40,0.08)",
                      color: "#C62828",
                      fontSize: "0.7rem",
                      fontWeight: 800,
                    }}>
                      Bloqueante
                    </span>
                  )}
                  {expiryStatus && (
                    <span style={{
                      padding: "0.22rem 0.48rem",
                      borderRadius: "999px",
                      background: expiryStatus.background,
                      color: expiryStatus.color,
                      fontSize: "0.7rem",
                      fontWeight: 800,
                    }}>
                      {expiryStatus.label}
                    </span>
                  )}
                  <span style={{
                    padding: "0.22rem 0.48rem",
                    borderRadius: "999px",
                    background: "rgba(0,0,0,0.04)",
                    color: COLORS.textMuted,
                    fontSize: "0.7rem",
                    fontWeight: 800,
                  }}>
                    V{document.version_number || 1}
                  </span>
                </div>

                <div style={{ display: "grid", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <select
                    value={document.document_type || "otro"}
                    disabled={savingDocumentId === document.id}
                    onChange={(event) => handleDocumentClassification(document, { documentType: event.target.value })}
                    style={{
                      padding: "0.55rem",
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "6px",
                      color: COLORS.navy,
                      background: "white",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                    }}
                  >
                    {Object.entries(DOCUMENT_TYPES).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <select
                    value={document.review_status || "uploaded"}
                    disabled={savingDocumentId === document.id}
                    onChange={(event) => handleDocumentClassification(document, { reviewStatus: event.target.value })}
                    style={{
                      padding: "0.55rem",
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "6px",
                      color: COLORS.navy,
                      background: "white",
                      fontWeight: 700,
                      fontSize: "0.78rem",
                    }}
                  >
                    {Object.entries(DOCUMENT_STATUSES).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <label style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: COLORS.textMuted,
                    fontSize: "0.76rem",
                    fontWeight: 800,
                  }}>
                    <input
                      type="checkbox"
                      checked={Boolean(document.is_blocking)}
                      disabled={savingDocumentId === document.id}
                      onChange={(event) => handleDocumentClassification(document, { isBlocking: event.target.checked })}
                    />
                    Documento bloqueante para presentación
                  </label>
                  <label style={{
                    display: "grid",
                    gap: "0.3rem",
                    color: COLORS.textMuted,
                    fontSize: "0.74rem",
                    fontWeight: 800,
                  }}>
                    Vigencia del documento
                    <input
                      type="date"
                      value={formatDateInput(document.expires_at)}
                      disabled={savingDocumentId === document.id}
                      onChange={(event) => handleDocumentClassification(document, { expiresAt: event.target.value || null })}
                      style={{
                        padding: "0.55rem",
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: "6px",
                        color: COLORS.navy,
                        background: "white",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                      }}
                    />
                  </label>
                  {savingDocumentId === document.id && (
                    <p style={{ color: COLORS.amber, fontSize: "0.74rem", fontWeight: 800 }}>
                      Guardando clasificacion...
                    </p>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleOpenDocument(document.id)}
                    style={{
                      padding: "0.55rem",
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "6px",
                      background: "white",
                      color: COLORS.navy,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Ver docto
                  </button>
                  <button
                    onClick={() => handleAiReview(document)}
                    disabled={reviewingDocumentId === document.id}
                    style={{
                      padding: "0.55rem",
                      border: "none",
                      borderRadius: "6px",
                      background: reviewingDocumentId === document.id ? COLORS.border : COLORS.navy,
                      color: "white",
                      fontWeight: 700,
                      cursor: reviewingDocumentId === document.id ? "not-allowed" : "pointer",
                    }}
                  >
                    {reviewingDocumentId === document.id ? "Revisando..." : "Revisar IA"}
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}

        <AIReviewPanel review={aiReview} />

        <div style={{
          marginTop: "1rem",
          paddingTop: "1rem",
          borderTop: `1px solid ${COLORS.border}`,
        }}>
          <h4 style={{
            color: COLORS.navy,
            fontSize: "0.85rem",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "0.75rem",
          }}>
            Historial de revisiones IA
          </h4>

          {reviewsLoading ? (
            <p style={{ color: COLORS.textMuted, fontSize: "0.82rem" }}>Cargando historial...</p>
          ) : reviewHistory.length === 0 ? (
            <p style={{ color: COLORS.textMuted, fontSize: "0.82rem", lineHeight: 1.45 }}>
              Aun no hay revisiones guardadas para este expediente.
            </p>
          ) : (
            <div style={{ display: "grid", gap: "0.65rem" }}>
              {reviewHistory.map((review) => (
                <button
                  key={review.id}
                  onClick={() => setAiReview({
                    ...review,
                    filename: review.documents?.filename || "Documento"
                  })}
                  style={{
                    textAlign: "left",
                    padding: "0.8rem",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "8px",
                    background: "white",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.25rem" }}>
                    <p style={{ color: COLORS.navy, fontWeight: 800, fontSize: "0.82rem", wordBreak: "break-word" }}>
                      {review.documents?.filename || "Documento"}
                    </p>
                    <p style={{
                      color: review.status === "processing" ? COLORS.amber : COLORS.gold,
                      fontWeight: 900,
                      fontSize: "0.82rem",
                      whiteSpace: "nowrap",
                      textTransform: "uppercase"
                    }}>
                      {review.status === "processing" ? "procesando" : review.score}
                    </p>
                  </div>
                  {review.status === "processing" && (
                    <p style={{ color: COLORS.amber, fontSize: "0.75rem", fontWeight: 800, marginBottom: "0.25rem" }}>
                      Analisis IA en segundo plano
                    </p>
                  )}
                  <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", lineHeight: 1.4 }}>
                    {new Date(review.created_at).toLocaleString("es-MX")}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scoring */}
      <div style={{ padding: "1.5rem", borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start", marginBottom: "1rem" }}>
          <div>
            <h3 style={{
              color: COLORS.navy,
              fontSize: "0.95rem",
              fontWeight: 700,
              marginBottom: "0.25rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
              Scoring del expediente
            </h3>
            <p style={{ color: COLORS.textMuted, fontSize: "0.8rem", lineHeight: 1.45 }}>
              Cruce de documentos cargados, revisiones IA y matriz de requisitos.
            </p>
          </div>
          <button
            onClick={loadScoring}
            disabled={scoringLoading}
            style={{
              padding: "0.55rem 0.75rem",
              border: `1px solid ${COLORS.border}`,
              borderRadius: "6px",
              background: "white",
              color: COLORS.navy,
              fontWeight: 800,
              cursor: scoringLoading ? "not-allowed" : "pointer",
              fontSize: "0.78rem",
              whiteSpace: "nowrap",
            }}
          >
            {scoringLoading ? "Calculando..." : "Actualizar"}
          </button>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.85rem" }}>
          <button
            type="button"
            onClick={downloadInstitutionalMemo}
            disabled={scoringLoading || !scoring}
            style={{
              padding: "0.55rem 0.75rem",
              border: "none",
              borderRadius: "6px",
              background: scoringLoading || !scoring ? COLORS.border : COLORS.navy,
              color: "white",
              fontWeight: 900,
              cursor: scoringLoading || !scoring ? "not-allowed" : "pointer",
              fontSize: "0.76rem",
            }}
          >
            Descargar memo
          </button>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(JSON.stringify(scoring || {}, null, 2))}
            disabled={!scoring}
            style={{
              padding: "0.55rem 0.75rem",
              border: `1px solid ${COLORS.border}`,
              borderRadius: "6px",
              background: "white",
              color: !scoring ? COLORS.textMuted : COLORS.navy,
              fontWeight: 900,
              cursor: !scoring ? "not-allowed" : "pointer",
              fontSize: "0.76rem",
            }}
          >
            Copiar scoring
          </button>
        </div>

        {reportStatus && (
          <p style={{
            color: reportStatus.includes("No se") ? "#C62828" : COLORS.green,
            fontSize: "0.8rem",
            lineHeight: 1.45,
            marginBottom: "0.75rem",
          }}>
            {reportStatus}
          </p>
        )}

        {scoringStatus && (
          <p style={{ color: "#C62828", fontSize: "0.82rem", lineHeight: 1.45, marginBottom: "0.75rem" }}>
            {scoringStatus}
          </p>
        )}

        {scoringLoading ? (
          <p style={{ color: COLORS.textMuted, fontSize: "0.9rem" }}>Calculando scoring...</p>
        ) : scoring ? (
          <div style={{ display: "grid", gap: "0.85rem" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "86px 1fr",
              gap: "1rem",
              alignItems: "center",
              padding: "1rem",
              border: `1px solid ${COLORS.border}`,
              borderRadius: "8px",
              background: COLORS.bg,
            }}>
              <div style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                border: `4px solid ${getGradeColor(scoring.readinessGrade?.grade)}`,
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: getGradeColor(scoring.readinessGrade?.grade),
                fontWeight: 900,
                fontSize: "1.4rem",
              }}>
                {scoring.readinessGrade?.grade || scoring.finalScore}
              </div>
              <div>
                <p style={{ color: COLORS.navy, fontWeight: 900, fontSize: "0.95rem", marginBottom: "0.25rem" }}>
                  {scoring.readinessGrade?.label || scoring.recommendation?.label || "Sin recomendacion"}
                </p>
                <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45 }}>
                  {scoring.readinessGrade?.explanation || scoring.recommendation?.reason}
                </p>
                <p style={{ color: COLORS.textMuted, fontSize: "0.74rem", lineHeight: 1.45, marginTop: "0.25rem" }}>
                  Score interno: {scoring.finalScore || 0}/100. No representa aprobacion crediticia.
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
              <div style={{ padding: "0.75rem", border: `1px solid ${COLORS.border}`, borderRadius: "8px" }}>
                <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase" }}>Documentos</p>
                <p style={{ color: COLORS.navy, fontWeight: 900 }}>{scoring.summary?.uploadedDocuments || 0}</p>
              </div>
              <div style={{ padding: "0.75rem", border: `1px solid ${COLORS.border}`, borderRadius: "8px" }}>
                <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase" }}>Faltantes</p>
                <p style={{ color: scoring.summary?.missingMandatory ? "#C62828" : COLORS.green, fontWeight: 900 }}>
                  {scoring.summary?.missingMandatory || 0}
                </p>
              </div>
            </div>

            {scoring.regulatoryValidation && (
              <div style={{ padding: "0.85rem", border: `1px solid ${COLORS.border}`, borderRadius: "8px", background: "white" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.6rem" }}>
                  <div>
                    <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase" }}>
                      Validacion regulatoria
                    </p>
                    <p style={{ color: COLORS.navy, fontWeight: 900, fontSize: "0.9rem" }}>
                      Pais {scoring.regulatoryValidation.country || "N/D"}
                    </p>
                  </div>
                  <span style={{ color: getValidationColor(scoring.regulatoryValidation.status), fontWeight: 900, textTransform: "uppercase", fontSize: "0.78rem" }}>
                    {scoring.regulatoryValidation.status}
                  </span>
                </div>
                <p style={{ color: COLORS.textMuted, fontSize: "0.76rem", lineHeight: 1.45, marginBottom: "0.65rem" }}>
                  {scoring.regulatoryValidation.summary?.passed || 0} aprobadas · {scoring.regulatoryValidation.summary?.failed || 0} fallidas · {scoring.regulatoryValidation.summary?.skipped || 0} sin proveedor
                </p>
                <div style={{ display: "grid", gap: "0.45rem" }}>
                  {(scoring.regulatoryValidation.checks || []).slice(0, 3).map((check, index) => (
                    <div key={`${check.name || check.label}-${index}`} style={{ display: "flex", justifyContent: "space-between", gap: "0.65rem", alignItems: "flex-start" }}>
                      <p style={{ color: COLORS.navy, fontSize: "0.76rem", lineHeight: 1.35, margin: 0 }}>
                        {check.name || check.label}
                      </p>
                      <span style={{ color: getValidationColor(check.status), fontWeight: 900, textTransform: "uppercase", fontSize: "0.7rem", whiteSpace: "nowrap" }}>
                        {check.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <RemediationPlanPanel scoring={scoring} shareReadiness={shareReadiness} />

            <DocumentMatrixPanel scoring={scoring} />
          </div>
        ) : (
          <p style={{ color: COLORS.textMuted, fontSize: "0.9rem" }}>Sin scoring disponible.</p>
        )}
      </div>

      {/* Information requests */}
      <div style={{ padding: "1.5rem", borderBottom: `1px solid ${COLORS.border}` }}>
        <h3 style={{
          color: COLORS.navy,
          fontSize: "0.95rem",
          fontWeight: 700,
          marginBottom: "0.4rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}>
          Requerimientos de otorgantes
        </h3>
        <p style={{ color: COLORS.textMuted, fontSize: "0.82rem", lineHeight: 1.45, marginBottom: "1rem" }}>
          Pendientes solicitados por entidades financieras durante la revision del data room.
        </p>

        {infoRequestsLoading ? (
          <p style={{ color: COLORS.textMuted, fontSize: "0.82rem" }}>Cargando requerimientos...</p>
        ) : infoRequests.length === 0 ? (
          <p style={{ color: COLORS.textMuted, fontSize: "0.82rem" }}>Aun no hay requerimientos de otorgantes.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {infoRequests.map((request) => (
              <div key={request.id} style={{ padding: "0.8rem", border: `1px solid ${COLORS.border}`, borderRadius: "8px", background: request.priority === "high" ? "rgba(198,40,40,0.04)" : "white" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.25rem" }}>
                  <p style={{ color: COLORS.navy, fontWeight: 900, fontSize: "0.84rem" }}>{request.title}</p>
                  <span style={{ color: request.priority === "high" ? "#C62828" : COLORS.amber, fontWeight: 900, fontSize: "0.72rem", textTransform: "uppercase" }}>
                    {request.priority || "medium"}
                  </span>
                </div>
                {request.description && (
                  <p style={{ color: COLORS.textMuted, fontSize: "0.76rem", lineHeight: 1.4, marginBottom: "0.35rem" }}>
                    {request.description}
                  </p>
                )}
                <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase" }}>
                  Estado: {request.status || "open"}
                </p>
                {request.evidence_document_id && (
                  <p style={{ color: COLORS.green, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", marginTop: "0.25rem" }}>
                    Evidencia vinculada
                  </p>
                )}
                {request.document_type && (
                  <p style={{ color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", marginTop: "0.25rem" }}>
                    Tipo solicitado: {formatDocumentType(request.document_type)}
                  </p>
                )}
                {request.events?.length > 0 && (
                  <div style={{ marginTop: "0.55rem", padding: "0.6rem", borderRadius: "6px", background: COLORS.bg }}>
                    <p style={{ color: COLORS.navy, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "0.35rem" }}>
                      Historial del requerimiento
                    </p>
                    <div style={{ display: "grid", gap: "0.35rem" }}>
                      {request.events.slice(0, 3).map((event) => (
                        <div key={event.id} style={{ borderLeft: `3px solid ${COLORS.gold}`, paddingLeft: "0.5rem" }}>
                          <p style={{ color: COLORS.navy, fontSize: "0.74rem", fontWeight: 800 }}>
                            {formatRequestEventAction(event.action)} {event.status ? `- ${event.status}` : ""}
                          </p>
                          <p style={{ color: COLORS.textMuted, fontSize: "0.7rem" }}>
                            {formatRequestEventDate(event.created_at)}
                          </p>
                          {event.note && (
                            <p style={{ color: COLORS.textMuted, fontSize: "0.7rem", lineHeight: 1.35 }}>
                              {event.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <textarea
                  value={requestResponses[request.id] ?? request.response ?? ""}
                  onChange={(event) => setRequestResponses((prev) => ({ ...prev, [request.id]: event.target.value }))}
                  rows={3}
                  placeholder="Respuesta o comentario para el otorgante..."
                  style={{
                    width: "100%",
                    marginTop: "0.65rem",
                    padding: "0.65rem",
                    borderRadius: "6px",
                    border: `1px solid ${COLORS.border}`,
                    resize: "vertical",
                    fontSize: "0.8rem",
                  }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.55rem", marginTop: "0.55rem" }}>
                  <button
                    type="button"
                    disabled={savingRequestId === request.id}
                    onClick={() => updateInformationRequest(request, "in_progress")}
                    style={{
                      padding: "0.55rem",
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "6px",
                      background: "white",
                      color: COLORS.navy,
                      fontWeight: 900,
                      cursor: savingRequestId === request.id ? "not-allowed" : "pointer",
                    }}
                  >
                    En proceso
                  </button>
                  <button
                    type="button"
                    disabled={savingRequestId === request.id}
                    onClick={() => updateInformationRequest(request, "resolved")}
                    style={{
                      padding: "0.55rem",
                      border: "none",
                      borderRadius: "6px",
                      background: COLORS.green,
                      color: "white",
                      fontWeight: 900,
                      cursor: savingRequestId === request.id ? "not-allowed" : "pointer",
                    }}
                  >
                    Resuelto
                  </button>
                </div>
                <label style={{
                  display: "block",
                  marginTop: "0.55rem",
                  padding: "0.6rem",
                  borderRadius: "6px",
                  background: uploadingRequestId === request.id ? COLORS.border : COLORS.gold,
                  color: COLORS.navy,
                  textAlign: "center",
                  fontWeight: 900,
                  cursor: uploadingRequestId === request.id ? "not-allowed" : "pointer",
                  fontSize: "0.8rem",
                }}>
                  {uploadingRequestId === request.id ? "Subiendo evidencia..." : "Subir evidencia y resolver"}
                  <input
                    type="file"
                    disabled={uploadingRequestId === request.id}
                    onChange={(event) => handleUploadForRequest(event, request)}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Authorized contact requests */}
      <div style={{ padding: "1.5rem", borderBottom: `1px solid ${COLORS.border}` }}>
        <h3 style={{
          color: COLORS.navy,
          fontSize: "0.95rem",
          fontWeight: 700,
          marginBottom: "0.4rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}>
          Contacto autorizado
        </h3>
        <p style={{ color: COLORS.textMuted, fontSize: "0.82rem", lineHeight: 1.45, marginBottom: "1rem" }}>
          Solicitudes de entidades financieras para avanzar de revision documental a contacto formal con trazabilidad NSD.
        </p>

        {contactRequestsLoading ? (
          <p style={{ color: COLORS.textMuted, fontSize: "0.82rem" }}>Cargando solicitudes de contacto...</p>
        ) : contactRequests.length === 0 ? (
          <p style={{ color: COLORS.textMuted, fontSize: "0.82rem" }}>Aun no hay solicitudes de contacto autorizado.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {contactRequests.map((request) => (
              <div key={request.id} style={{ padding: "0.8rem", border: `1px solid ${COLORS.border}`, borderRadius: "8px", background: "white" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "flex-start", marginBottom: "0.35rem" }}>
                  <div>
                    <p style={{ color: COLORS.navy, fontWeight: 900, fontSize: "0.84rem" }}>
                      {request.funder_email || "Otorgante autorizado"}
                    </p>
                    <p style={{ color: COLORS.textMuted, fontSize: "0.72rem" }}>
                      {request.created_at ? new Date(request.created_at).toLocaleString("es-MX") : "Fecha no disponible"}
                    </p>
                  </div>
                  <span style={{ color: request.status === "approved" ? COLORS.green : request.status === "rejected" ? "#C62828" : COLORS.amber, fontWeight: 900, fontSize: "0.72rem", textTransform: "uppercase" }}>
                    {request.status || "requested"}
                  </span>
                </div>
                {request.reason && (
                  <p style={{ color: COLORS.textMuted, fontSize: "0.76rem", lineHeight: 1.4, marginBottom: "0.5rem" }}>
                    {request.reason}
                  </p>
                )}
                {request.notes && (
                  <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", lineHeight: 1.35, marginBottom: "0.55rem" }}>
                    Nota: {request.notes}
                  </p>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.55rem" }}>
                  <button
                    type="button"
                    disabled={savingContactRequestId === request.id}
                    onClick={() => updateContactRequest(request, "approved")}
                    style={{
                      padding: "0.55rem",
                      border: "none",
                      borderRadius: "6px",
                      background: COLORS.green,
                      color: "white",
                      fontWeight: 900,
                      cursor: savingContactRequestId === request.id ? "not-allowed" : "pointer",
                    }}
                  >
                    Autorizar contacto
                  </button>
                  <button
                    type="button"
                    disabled={savingContactRequestId === request.id}
                    onClick={() => updateContactRequest(request, "rejected")}
                    style={{
                      padding: "0.55rem",
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "6px",
                      background: "white",
                      color: "#C62828",
                      fontWeight: 900,
                      cursor: savingContactRequestId === request.id ? "not-allowed" : "pointer",
                    }}
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share data room */}
      <div style={{ padding: "1.5rem", borderBottom: `1px solid ${COLORS.border}` }}>
        <h3 style={{
          color: COLORS.navy,
          fontSize: "0.95rem",
          fontWeight: 700,
          marginBottom: "0.4rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}>
          Compartir con otorgantes
        </h3>
        <p style={{ color: COLORS.textMuted, fontSize: "0.82rem", lineHeight: 1.45, marginBottom: "1rem" }}>
          Genera un acceso controlado para que una entidad financiera revise el data room del expediente.
        </p>

        <ComplianceReadinessPanel
          scoring={scoring}
          shareReadiness={shareReadiness}
          loading={shareReadinessLoading}
        />

        <form onSubmit={handleShareDataRoom} style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem" }}>
          <input
            value={shareForm.recipientName}
            onChange={(event) => setShareForm((prev) => ({ ...prev, recipientName: event.target.value }))}
            placeholder="Nombre de entidad u otorgante"
            style={{
              padding: "0.7rem 0.8rem",
              border: `1px solid ${COLORS.border}`,
              borderRadius: "6px",
              fontSize: "0.88rem",
            }}
          />
          <input
            value={shareForm.recipientEmail}
            onChange={(event) => setShareForm((prev) => ({ ...prev, recipientEmail: event.target.value }))}
            placeholder="Correo de contacto (opcional)"
            type="email"
            style={{
              padding: "0.7rem 0.8rem",
              border: `1px solid ${COLORS.border}`,
              borderRadius: "6px",
              fontSize: "0.88rem",
            }}
          />
          <button
            type="submit"
            disabled={shareReadinessLoading || shareReadiness?.canPublish === false}
            style={{
              padding: "0.75rem",
              border: "none",
              borderRadius: "6px",
              background: shareReadinessLoading || shareReadiness?.canPublish === false ? COLORS.textMuted : COLORS.navy,
              color: "white",
              fontWeight: 800,
              cursor: shareReadinessLoading || shareReadiness?.canPublish === false ? "not-allowed" : "pointer",
            }}
          >
            {shareReadiness?.canPublish === false ? "Resolver bloqueos antes de compartir" : "Generar acceso"}
          </button>
        </form>

        {shareStatus && (
          <p style={{
            color: shareStatus.includes("No se") ? "#C62828" : COLORS.green,
            fontSize: "0.82rem",
            lineHeight: 1.45,
            marginBottom: "0.75rem",
          }}>
            {shareStatus}
          </p>
        )}

        {sharesLoading ? (
          <p style={{ color: COLORS.textMuted, fontSize: "0.82rem" }}>Cargando accesos...</p>
        ) : shares.length === 0 ? (
          <p style={{ color: COLORS.textMuted, fontSize: "0.82rem", lineHeight: 1.45 }}>
            Aun no hay accesos compartidos para este expediente.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {shares.map((share) => (
              <div key={share.id} style={{
                padding: "0.8rem",
                border: `1px solid ${COLORS.border}`,
                borderRadius: "8px",
                background: COLORS.bg,
              }}>
                <p style={{ color: COLORS.navy, fontWeight: 800, fontSize: "0.85rem", marginBottom: "0.2rem" }}>
                  {share.recipient_name}
                </p>
                {share.recipient_email && (
                  <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", marginBottom: "0.25rem" }}>
                    {share.recipient_email}
                  </p>
                )}
                <p style={{ color: COLORS.gold, fontWeight: 800, fontSize: "0.78rem", textTransform: "uppercase" }}>
                  {share.status}
                </p>
                {share.shareUrl && (
                  <a
                    href={share.shareUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-block",
                      marginTop: "0.55rem",
                      color: COLORS.navy,
                      fontWeight: 800,
                      fontSize: "0.78rem",
                      textDecoration: "none",
                    }}
                  >
                    Abrir data room compartido
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit log */}
      <div style={{ padding: "1.5rem", borderBottom: `1px solid ${COLORS.border}` }}>
        <h3 style={{
          color: COLORS.navy,
          fontSize: "0.95rem",
          fontWeight: 700,
          marginBottom: "0.4rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}>
          Bitácora de auditoría
        </h3>
        <p style={{ color: COLORS.textMuted, fontSize: "0.82rem", lineHeight: 1.45, marginBottom: "1rem" }}>
          Registro de acciones sensibles del expediente para trazabilidad, cumplimiento y revisión institucional.
        </p>

        <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", marginBottom: "0.9rem" }}>
          <button
            type="button"
            onClick={copyAuditLog}
            disabled={auditLoading || auditLogs.length === 0}
            style={{
              padding: "0.5rem 0.7rem",
              border: `1px solid ${COLORS.border}`,
              borderRadius: "6px",
              background: "white",
              color: auditLoading || auditLogs.length === 0 ? COLORS.textMuted : COLORS.navy,
              fontSize: "0.72rem",
              fontWeight: 900,
              cursor: auditLoading || auditLogs.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            Copiar bitacora
          </button>
          <button
            type="button"
            onClick={() => downloadAuditPackage("md")}
            disabled={auditLoading || auditLogs.length === 0}
            style={{
              padding: "0.5rem 0.7rem",
              border: "none",
              borderRadius: "6px",
              background: auditLoading || auditLogs.length === 0 ? COLORS.border : COLORS.navy,
              color: "white",
              fontSize: "0.72rem",
              fontWeight: 900,
              cursor: auditLoading || auditLogs.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            Descargar MD
          </button>
          <button
            type="button"
            onClick={() => downloadAuditPackage("csv")}
            disabled={auditLoading || auditLogs.length === 0}
            style={{
              padding: "0.5rem 0.7rem",
              border: "none",
              borderRadius: "6px",
              background: auditLoading || auditLogs.length === 0 ? COLORS.border : COLORS.gold,
              color: COLORS.navy,
              fontSize: "0.72rem",
              fontWeight: 900,
              cursor: auditLoading || auditLogs.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            Descargar CSV
          </button>
        </div>

        {auditSummary && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "0.9rem" }}>
            {[
              ["Eventos", auditSummary.totalEvents || 0],
              ["Relevantes", auditSummary.complianceRelevantEvents || 0],
              ["Críticos", auditSummary.criticalEvents || 0],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: "0.65rem", border: `1px solid ${COLORS.border}`, borderRadius: "8px", background: COLORS.bg }}>
                <p style={{ color: COLORS.textMuted, fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase" }}>{label}</p>
                <p style={{ color: COLORS.navy, fontWeight: 900 }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {auditLoading ? (
          <p style={{ color: COLORS.textMuted, fontSize: "0.82rem" }}>Cargando bitácora...</p>
        ) : auditLogs.length === 0 ? (
          <p style={{ color: COLORS.textMuted, fontSize: "0.82rem" }}>Aún no hay eventos registrados.</p>
        ) : (
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {auditLogs.slice(0, 8).map((log) => (
              <div key={log.id} style={{
                padding: "0.75rem",
                border: `1px solid ${COLORS.border}`,
                borderRadius: "8px",
                background: "white",
              }}>
                <p style={{ color: COLORS.navy, fontWeight: 800, fontSize: "0.82rem", marginBottom: "0.25rem" }}>
                  {formatAuditAction(log.action)}
                </p>
                <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", lineHeight: 1.4 }}>
                  {new Date(log.created_at).toLocaleString("es-MX")} · {log.entity_type}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat */}
      <div style={{
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        height: "calc(100% - 400px)",
      }}>
        <h3 style={{
          color: COLORS.navy,
          fontSize: "0.95rem",
          fontWeight: 700,
          marginBottom: "1rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}>
          Chat con Especialista
        </h3>

        <div style={{
          flex: 1,
          overflowY: "auto",
          marginBottom: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{
              background: msg.role === "Cliente" ? COLORS.navy : COLORS.bg,
              color: msg.role === "Cliente" ? "white" : COLORS.text,
              padding: "0.9rem 1rem",
              borderRadius: "8px",
              fontSize: "0.9rem",
              lineHeight: 1.5,
            }}>
              <p style={{
                fontWeight: 600,
                marginBottom: "0.25rem",
                fontSize: "0.85rem",
                opacity: 0.8,
              }}>
                {msg.author}
              </p>
              <p style={{ marginBottom: "0.5rem" }}>{msg.message}</p>
              <p style={{
                fontSize: "0.75rem",
                opacity: 0.6,
              }}>
                {msg.timestamp}
              </p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} style={{
          display: "flex",
          gap: "0.5rem",
        }}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe tu mensaje..."
            style={{
              flex: 1,
              padding: "0.7rem 1rem",
              border: `1px solid ${COLORS.border}`,
              borderRadius: "6px",
              fontSize: "0.9rem",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "0.7rem 1.2rem",
              background: COLORS.gold,
              color: COLORS.navy,
              border: "none",
              borderRadius: "6px",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Enviar
          </button>
        </form>
      </div>

      {/* Footer */}
      <div style={{
        padding: "1.5rem",
        borderTop: `1px solid ${COLORS.border}`,
        background: COLORS.bg,
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
        }}>
          <div>
            <p style={{
              color: COLORS.textMuted,
              fontSize: "0.75rem",
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: "0.25rem",
            }}>
              Monto
            </p>
            <p style={{
              color: COLORS.navy,
              fontWeight: 700,
              fontSize: "1.2rem",
            }}>
              ${order.amount.toLocaleString()}
            </p>
          </div>
          <div>
            <p style={{
              color: COLORS.textMuted,
              fontSize: "0.75rem",
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: "0.25rem",
            }}>
              Entrega Estimada
            </p>
            <p style={{
              color: COLORS.navy,
              fontWeight: 700,
              fontSize: "1rem",
            }}>
              {formatDateOrPending(order.expectedDelivery)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
