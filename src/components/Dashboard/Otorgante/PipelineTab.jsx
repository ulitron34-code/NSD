import { error, debug, info, warn } from '../../../utils/logger';
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNotification } from "../../../hooks/useNotification";
import { COLORS } from "../../../utils/constants";
import { informationRequestsAPI, ordersAPI, otorganteAPI, scoringAPI } from "../../../services/api";
import { demoServiceOrders } from "../../../data/demoServiceOrders";
import { buildOtorganteAnalytics, buildOtorgantePipeline, buildOtorgantePipelineFromEntries } from "../../../data/otorgantePipeline";
import { useAuth } from "../../../hooks/useAuth";
import { useSelectedExpediente } from "../../../hooks/useSelectedExpediente";
import { DOCUMENT_TYPES } from "../../../utils/institutional";
import { buildInternationalReadiness } from "../../../utils/localization";
import { translateCopy, uiText } from "../../../utils/runtimeCopy";

const riskColor = {
  Bajo: COLORS.green,
  Medio: COLORS.amber,
  Alto: "#C62828",
};

const dataRoomFolders = [
  "00 Resumen ejecutivo",
  "01 Identidad y KYC",
  "02 Corporativo legal",
  "03 Fiscal",
  "04 Financiero",
  "05 Tecnico",
  "06 Garantias",
  "08 Compliance",
  "09 Reportes NEXUS",
  "10 Observaciones",
];

const trustStack = [
  ["Privacidad", "Consentimiento, acceso autorizado y revision bajo proposito institucional."],
  ["Seguridad documental", "Permisos, versionado, evidencia vinculada y bitacora de consulta."],
  ["Compliance", "KYC/KYB, fiscal, listas, alertas y subsanacion trazable."],
  ["Auditoria", "Eventos por expediente, requerimiento, evidencia e interes institucional."],
];

const appetiteDefaults = {
  sector: "Todos",
  minScore: 0,
  minAmount: "",
  maxAmount: "",
  risk: "Todos",
  region: "Todos",
  structure: "Todos",
  readiness: "Todos",
};

const regionOptions = ["Todos", "MX", "US", "CA", "LATAM", "EU"];
const readinessOptions = ["Todos", "Listo para comite", "Subsanable", "Preparacion inicial"];

function buildGateStatus(selected, interestStatus, aiReview, copy = (value) => value) {
  const share = selected?.share || {};
  const score = aiReview?.score || selected?.averageScore || 0;
  const contactStatus = selected?.contactRequest?.status;
  const ndaReady = ["accepted", "shared"].includes(share.status) || Boolean(share.acceptedAt);
  const mfaReady = Boolean(selected?.invitationStatus) || ndaReady;
  const committeeReady = ["under_review", "term_sheet", "closed"].includes(interestStatus) && score >= 65;
  const contactPrerequisitesReady = ndaReady && mfaReady && committeeReady;
  const contactReady = contactStatus === "approved";

  return [
    {
      key: "nda",
      label: copy("NDA / acceso autorizado"),
      complete: ndaReady,
      detail: ndaReady ? copy("Data room aceptado o compartido bajo acceso controlado.") : copy("Pendiente aceptar invitacion o NDA operativo.")
    },
    {
      key: "mfa",
      label: copy("MFA / usuario validado"),
      complete: mfaReady,
      detail: mfaReady ? copy("Otorgante identificado para revision institucional.") : copy("Pendiente validacion de usuario autorizado.")
    },
    {
      key: "committee",
      label: copy("Revision interna"),
      complete: committeeReady,
      detail: committeeReady ? copy("Puede documentarse para comite interno.") : copy("Registrar interes y validar score minimo.")
    },
    {
      key: "contact",
      label: copy("Contacto autorizado"),
      complete: contactReady,
      requestable: contactPrerequisitesReady,
      detail: contactReady
        ? copy("Contacto aprobado por solicitante/NEXUS.")
        : contactStatus === "requested"
          ? copy("Solicitud enviada; pendiente de autorizacion del solicitante/NEXUS.")
          : contactPrerequisitesReady
            ? copy("Listo para solicitar contacto formal con trazabilidad NEXUS.")
            : copy("Bloqueado hasta cerrar NDA, usuario y revision.")
    }
  ];
}

function buildWorkflowSteps(selected, aiReview, copy = (value) => value) {
  const interestStatus = selected?.interest?.status;

  return [
    {
      key: "triage",
      label: copy("Triage inicial"),
      detail: selected?.risk === "Alto" ? copy("Validar alertas antes de avanzar.") : copy("Perfil listo para lectura ejecutiva."),
      complete: Boolean(selected),
      active: Boolean(selected) && !aiReview,
    },
    {
      key: "data_room",
      label: copy("Data room"),
      detail: `${selected?.documentsCount || selected?.documents?.length || 0} ${copy("documento(s) disponibles para revision.")}`,
      complete: Boolean(selected?.documentsCount || selected?.documents?.length),
      active: false,
    },
    {
      key: "ai_review",
      label: copy("Revision IA"),
      detail: aiReview ? copy(aiReview.status) : copy("Ejecutar agentes sobre documento o data room completo."),
      complete: Boolean(aiReview),
      active: Boolean(selected) && !aiReview,
    },
    {
      key: "internal_review",
      label: copy("Decision interna"),
      detail: interestStatus === "under_review" ? copy("En comite interno del otorgante.") : copy("Registrar interes o declinar."),
      complete: ["under_review", "term_sheet", "closed", "declined"].includes(interestStatus),
      active: interestStatus === "interested",
    },
    {
      key: "term_sheet",
      label: copy("Term sheet / cierre"),
      detail: interestStatus === "term_sheet" ? copy("Term sheet marcado para seguimiento.") : copy("Pendiente de oferta o cierre."),
      complete: ["term_sheet", "closed"].includes(interestStatus),
      active: interestStatus === "under_review",
    },
  ];
}

function buildExecutiveBrief(selected, aiReview, infoRequests, copy = (value) => value) {
  if (!selected) return [];

  const openRequests = infoRequests.filter((request) => !["resolved", "waived"].includes(request.status)).length;
  const score = aiReview?.score || selected.averageScore || 0;
  const recommendation = score >= 82
    ? copy("Apto para revision institucional inicial.")
    : score >= 65
      ? copy("Apto condicionado a subsanar faltantes.")
      : copy("Requiere fortalecimiento antes de comite.");

  return [
    [copy("Tesis NEXUS"), selected.use || copy("Uso de fondos pendiente de confirmar")],
    [copy("Solicitante"), selected.applicant || copy("Solicitante NEXUS")],
    [copy("Monto / ticket"), selected.amountLabel || copy("Por definir")],
    [copy("Score integral"), `${score}/100 - ${copy("Riesgo")} ${copy(selected.risk)}`],
    [copy("Riesgos visibles"), selected.risk === "Alto" ? copy("Riesgo alto: revisar alertas, faltantes y consistencia.") : copy("Sin alertas criticas en lectura preliminar.")],
    [copy("Requerimientos abiertos"), `${openRequests} ${copy("pendiente(s) de respuesta o evidencia.")}`],
    [copy("Conclusion"), recommendation],
  ];
}

function buildDecisionBoard(selected, aiReview, infoRequests, copy = (value) => value) {
  if (!selected) return [];

  const score = aiReview?.score || selected.averageScore || 0;
  const openRequests = infoRequests.filter((request) => !["resolved", "waived"].includes(request.status)).length;
  const hasContact = selected.contactRequest?.status === "approved";

  return [
    {
      label: "Lectura institucional",
      value: score >= 82 ? copy("Avanzar") : score >= 65 ? copy("Condicionado") : copy("Pausar"),
      tone: score >= 82 ? COLORS.green : score >= 65 ? COLORS.amber : "#C62828",
      detail: score >= 82
        ? copy("Expediente apto para comite o propuesta indicativa.")
        : score >= 65
          ? copy("Revisable si se atienden faltantes documentales.")
          : copy("No conviene pasar a comite sin subsanar alertas.")
    },
    {
      label: "Data room",
      value: selected.documentsCount || selected.documents?.length || 0,
      tone: COLORS.navy,
      detail: copy("Documentos organizados por carpeta, acceso y trazabilidad NEXUS.")
    },
    {
      label: "Pendientes",
      value: openRequests,
      tone: openRequests ? COLORS.amber : COLORS.green,
      detail: openRequests ? copy("Hay requerimientos abiertos para el solicitante.") : copy("Sin requerimientos abiertos.")
    },
    {
      label: "Contacto",
      value: hasContact ? copy("Autorizado") : copy("Controlado"),
      tone: hasContact ? COLORS.green : COLORS.gold,
      detail: hasContact ? copy("Puede habilitarse contacto formal.") : copy("Requiere gates y solicitud auditada.")
    }
  ];
}

function buildCommitteePack(selected, aiReview, infoRequests, gateStatus, copy = (value) => value) {
  if (!selected) return [];

  const score = aiReview?.score || selected.averageScore || 0;
  const openRequests = infoRequests.filter((request) => !["resolved", "waived"].includes(request.status)).length;
  const gatesClosed = gateStatus.filter((gate) => gate.complete).length;
  const totalGates = gateStatus.length || 1;

  return [
    {
      title: "1. Tesis y uso de fondos",
      status: selected.use ? copy("Listo") : copy("Pendiente"),
      detail: selected.use || copy("Uso de fondos pendiente de confirmar.")
    },
    {
      title: "2. Score y riesgos",
      status: score >= 65 ? copy("Revisable") : copy("Subsanar"),
      detail: `${copy("Score")} ${score}/100, ${copy("riesgo")} ${copy(selected.risk)}. ${selected.risk === "Alto" ? copy("Requiere aclaraciones antes de comite.") : copy("Puede pasar a lectura ejecutiva.")}`
    },
    {
      title: "3. Evidencia documental",
      status: selected.documents?.length ? copy("Integrada") : copy("Incompleta"),
      detail: `${selected.documents?.length || 0} ${copy("documentos visibles en data room institucional.")}`
    },
    {
      title: "4. Requerimientos",
      status: openRequests ? copy("Abiertos") : copy("Cerrados"),
      detail: openRequests ? `${openRequests} ${copy("pendiente(s) de respuesta o evidencia.")}` : copy("Sin requerimientos abiertos.")
    },
    {
      title: "5. Gates y contacto",
      status: `${gatesClosed}/${totalGates}`,
      detail: gatesClosed === totalGates ? copy("Gates closed for contact or closing.") : copy("Cerrar NDA, usuario, revision interna y contacto autorizado.")
    }
  ];
}

function buildTermSheetReadiness(selected, aiReview, infoRequests, copy = (value) => value) {
  if (!selected) return [];

  const score = aiReview?.score || selected.averageScore || 0;
  const openRequests = infoRequests.filter((request) => !["resolved", "waived"].includes(request.status)).length;
  const documents = selected.documentsCount || selected.documents?.length || 0;

  return [
    {
      label: "Condicion documental",
      status: documents >= 5 ? copy("Cubierta") : copy("Condicionada"),
      detail: documents >= 5 ? copy("Data room suficiente para propuesta indicativa.") : copy("Pedir evidencia adicional antes de term sheet.")
    },
    {
      label: "Condicion de riesgo",
      status: selected.risk === "Bajo" ? copy("Aceptable") : selected.risk === "Medio" ? copy("Mitigable") : copy("Alta"),
      detail: selected.risk === "Alto" ? copy("No avanzar sin mitigantes claros.") : copy("Riesgo compatible con revision institucional.")
    },
    {
      label: "Condicion de score",
      status: score >= 82 ? copy("Fuerte") : score >= 65 ? copy("Revisable") : copy("Debil"),
      detail: `${copy("Score base")} ${score}/100 ${copy("para calibrar precio, garantias y covenants.")}`
    },
    {
      label: "Condicion de pendientes",
      status: openRequests ? copy("Abierta") : copy("Cerrada"),
      detail: openRequests ? `${openRequests} ${copy("requerimiento(s) deben resolverse antes de oferta.")}` : copy("Sin requerimientos abiertos visibles.")
    },
  ];
}

function buildPhase7Checklist(opportunities = [], copy = (value) => value) {
  const hasPipeline = opportunities.length > 0;
  const hasSharedRooms = opportunities.some((item) => item.share || item.invitationStatus);
  const hasScoring = opportunities.some((item) => Number(item.averageScore || 0) > 0);
  const hasInterest = opportunities.some((item) => item.interest);
  const hasContactRequest = opportunities.some((item) => item.contactRequest);

  return [
    [copy("Pipeline filtrable"), true, copy("Filtros por sector, region, monto, estructura, preparacion, riesgo y score.")],
    [copy("Data room autorizado"), hasSharedRooms, hasSharedRooms ? copy("Hay data rooms vinculados al otorgante.") : copy("Pendiente probar con data rooms reales compartidos.")],
    [copy("Score visible"), hasScoring, hasScoring ? copy("Cada oportunidad puede mostrar score y riesgo.") : copy("Pendiente scoring real de expediente.")],
    [copy("Interes institucional"), hasInterest, hasInterest ? copy("Existe estado de interes registrado.") : copy("Pendiente registrar interes real o demo.")],
    [copy("Contacto autorizado"), hasContactRequest, hasContactRequest ? copy("Existe solicitud de contacto en pipeline.") : copy("Pendiente solicitar/aprobar contacto con Supabase.")],
    [copy("Memo de comite"), true, copy("Disponible como descarga Markdown desde el expediente seleccionado.")],
    [copy("Prueba punta a punta"), false, copy("Pendiente ejecutar SQL actualizado y validar solicitante/otorgante reales.")]
  ];
}

function buildCommitteeMemo(selected, aiReview, infoRequests, interestStatus, interestNotes, gateStatus, copy = (value) => value) {
  if (!selected) return "";

  const openRequests = infoRequests.filter((request) => !["resolved", "waived"].includes(request.status));
  const resolvedRequests = infoRequests.filter((request) => request.status === "resolved");
  const score = aiReview?.score || selected.averageScore || 0;
  const recommendation = score >= 82
    ? "Avanzar a revision institucional inicial."
    : score >= 65
      ? "Avanzar condicionado a subsanacion documental."
      : "No pasar a comite hasta fortalecer expediente.";

  return [
    "# Memo de comite NEXUS",
    "",
    `- Expediente: ${selected.id}`,
    `- Proyecto: ${copy(selected.name)}`,
    `- Solicitante: ${selected.applicant}`,
    `- Sector: ${selected.sector}`,
    `- Estructura: ${selected.structure || "Por definir"}`,
    `- Nivel de preparacion: ${selected.readinessLevel || "Por definir"}`,
    `- Region/Pais: ${selected.country}`,
    `- Ticket: ${selected.amountLabel}`,
    `- Estado otorgante: ${interestStatus}`,
    `- Contacto autorizado: ${gateStatus?.find((item) => item.key === "contact")?.complete ? "Si" : "No"}`,
    "",
    "## Tesis del proyecto",
    selected.use || "Uso de fondos pendiente de confirmar.",
    "",
    "## Score y riesgo",
    `- Score integral: ${score}/100`,
    `- Score financiero: ${selected.financialScore}/100`,
    `- Score compliance: ${selected.complianceScore}/100`,
    `- Riesgo visible: ${selected.risk}`,
    "",
    "## Documentos clave",
    ...(selected.documents?.length ? selected.documents.map((doc) => `- ${doc}`) : ["- Sin documentos listados."]),
    "",
    "## Requerimientos",
    `- Abiertos: ${openRequests.length}`,
    `- Resueltos: ${resolvedRequests.length}`,
    ...(openRequests.length ? openRequests.map((request) => `- Pendiente: ${copy(request.title)}`) : ["- Sin pendientes abiertos."]),
    "",
    "## Observaciones internas",
    interestNotes || "Sin observaciones internas registradas.",
    "",
    "## Control de acceso",
    ...(gateStatus || []).map((gate) => `- ${copy(gate.label)}: ${gate.complete ? "Completo" : "Pendiente"} - ${copy(gate.detail)}`),
    selected.contactRequest ? `- Solicitud de contacto: ${selected.contactRequest.status}` : "- Solicitud de contacto: No registrada",
    "",
    "## Recomendacion NEXUS",
    recommendation,
    "",
    "## Nota",
    "NEXUS no autoriza credito ni sustituye el criterio del otorgante. Este memo organiza evidencia, riesgos y contexto para una decision institucional."
  ].join("\n");
}

function formatRequestEventAction(action) {
  const labels = {
    created: "Creado",
    updated: "Actualizado",
  };

  return labels[action] || action || "Evento";
}

function formatRequestEventDate(value) {
  if (!value) return "Fecha no disponible";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Fecha no disponible" : date.toLocaleString("es-MX");
}

export default function PipelineTab() {
  const { i18n } = useTranslation();
  const copy = (value) => translateCopy(value, i18n.language);
  const L = (es, en) => uiText(i18n, es, en);

  const { addNotification } = useNotification();
  const { user } = useAuth();
  const { getSelectedExpedienteId, setSelectedExpedienteId } = useSelectedExpediente();
  const [filter, setFilter] = useState("Todos");
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState("");
  const [aiReview, setAiReview] = useState(null);
  const [interestStatus, setInterestStatus] = useState("interested");
  const [interestNotes, setInterestNotes] = useState("");
  const [savingInterest, setSavingInterest] = useState(false);
  const [infoRequests, setInfoRequests] = useState([]);
  const [requestForm, setRequestForm] = useState({ title: "", description: "", priority: "medium", documentType: "otro" });
  const [savingRequest, setSavingRequest] = useState(false);
  const [openingEvidenceId, setOpeningEvidenceId] = useState(null);
  const [appetite, setAppetite] = useState(appetiteDefaults);

  useEffect(() => {
    let active = true;

    async function loadPipeline() {
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
        setSelected((current) => {
          if (current && mapped.find((item) => item.id === current.id)) return current;
          const persistedId = getSelectedExpedienteId();
          return mapped.find((item) => item.id === persistedId) || mapped[0] || null;
        });
        setSelectedDoc(mapped[0]?.documents?.[0] || "");
      } catch (err) {
        if (!active) return;
        setError("No se pudo cargar el pipeline de otorgante.");
        const mapped = buildOtorgantePipeline(demoServiceOrders);
        setOpportunities(mapped);
        setSelected(mapped[0] || null);
        setSelectedDoc(mapped[0]?.documents?.[0] || "");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPipeline();

    return () => {
      active = false;
    };
  }, [user?.demo]);

  const analytics = useMemo(() => buildOtorganteAnalytics(opportunities), [opportunities]);
  const phase7Checklist = useMemo(() => buildPhase7Checklist(opportunities, copy), [opportunities, i18n.language]);
  const sectorOptions = useMemo(() => ["Todos", ...Array.from(new Set(opportunities.map((item) => item.sector).filter(Boolean)))], [opportunities]);
  const structureOptions = useMemo(() => ["Todos", ...Array.from(new Set(opportunities.map((item) => item.structure).filter(Boolean)))], [opportunities]);
  const filtered = opportunities.filter((item) => {
    const statusMatch = filter === "Todos" || item.status === filter;
    const sectorMatch = appetite.sector === "Todos" || item.sector === appetite.sector;
    const riskMatch = appetite.risk === "Todos" || item.risk === appetite.risk;
    const regionMatch = appetite.region === "Todos" || item.country === appetite.region;
    const structureMatch = appetite.structure === "Todos" || item.structure === appetite.structure;
    const readinessMatch = appetite.readiness === "Todos" || item.readinessLevel === appetite.readiness;
    const scoreMatch = Number(item.averageScore || 0) >= Number(appetite.minScore || 0);
    const minAmountMatch = appetite.minAmount === "" || Number(item.amount || 0) >= Number(appetite.minAmount || 0);
    const maxAmountMatch = appetite.maxAmount === "" || Number(item.amount || 0) <= Number(appetite.maxAmount || 0);
    return statusMatch && sectorMatch && riskMatch && regionMatch && structureMatch && readinessMatch && scoreMatch && minAmountMatch && maxAmountMatch;
  });
  const workflowSteps = useMemo(() => buildWorkflowSteps(selected, aiReview, copy), [selected, aiReview, selected?.interest?.status, i18n.language]);
  const executiveBrief = useMemo(() => buildExecutiveBrief(selected, aiReview, infoRequests, copy), [selected, aiReview, infoRequests, i18n.language]);
  const decisionBoard = useMemo(() => buildDecisionBoard(selected, aiReview, infoRequests, copy), [selected, aiReview, infoRequests, i18n.language]);
  const gateStatus = useMemo(() => buildGateStatus(selected, interestStatus, aiReview, copy), [selected, interestStatus, aiReview, i18n.language]);
  const committeePack = useMemo(() => buildCommitteePack(selected, aiReview, infoRequests, gateStatus, copy), [selected, aiReview, infoRequests, gateStatus, i18n.language]);
  const termSheetReadiness = useMemo(() => buildTermSheetReadiness(selected, aiReview, infoRequests, copy), [selected, aiReview, infoRequests, i18n.language]);
  const internationalReadiness = useMemo(() => buildInternationalReadiness(selected?.country || "MX"), [selected?.country]);
  const committeeMemo = useMemo(
    () => buildCommitteeMemo(selected, aiReview, infoRequests, interestStatus, interestNotes, gateStatus, copy),
    [selected, aiReview, infoRequests, interestStatus, interestNotes, gateStatus, i18n.language]
  );

  useEffect(() => {
    if (!selected) return;
    setInterestStatus(selected.interest?.status || "interested");
    setInterestNotes(selected.interest?.notes || "");
    setInfoRequests(selected.infoRequests || []);
  }, [selected?.id, selected?.interest?.status, selected?.interest?.notes]);

  useEffect(() => {
    if (!selected || user?.demo || String(selected.id).startsWith("demo-")) return;

    let active = true;
    informationRequestsAPI.list(selected.id)
      .then(({ data }) => {
        if (active) setInfoRequests(data || []);
      })
      .catch(() => {
        if (active) setInfoRequests([]);
      });

    return () => {
      active = false;
    };
  }, [selected?.id, user?.demo]);

  const markInterest = () => {
    if (!selected) return;
    saveInterest("interested");
  };

  const saveInterest = async (nextStatus = interestStatus) => {
    if (!selected) return;

    if (user?.demo || String(selected.id).startsWith("demo-")) {
      const nextInterest = {
        status: nextStatus,
        notes: interestNotes,
        created_at: new Date().toISOString()
      };
      setSelected((current) => current ? { ...current, interest: nextInterest } : current);
      setOpportunities((current) => current.map((item) => item.id === selected.id ? { ...item, interest: nextInterest } : item));
      setInterestStatus(nextStatus);
      addNotification(`Interés demo registrado para ${selected.id}`, "success");
      return;
    }

    setSavingInterest(true);
    try {
      const { data } = await otorganteAPI.recordInterest(selected.id, {
        status: nextStatus,
        notes: interestNotes
      });
      setSelected((current) => current ? { ...current, interest: data } : current);
      setOpportunities((current) => current.map((item) => item.id === selected.id ? { ...item, interest: data } : item));
      setInterestStatus(data.status || nextStatus);
      addNotification(`Interés institucional guardado para ${selected.id}`, "success");
    } catch (err) {
      addNotification(err.response?.data?.error || "No se pudo guardar el interés institucional", "error");
    } finally {
      setSavingInterest(false);
    }
  };

  const selectOpportunity = (item) => {
    setSelected(item);
    setSelectedExpedienteId(item.id);
    setSelectedDoc(item.documents?.[0] || "");
    setAiReview(null);
    setInterestStatus(item.interest?.status || "interested");
    setInterestNotes(item.interest?.notes || "");
  };

  const viewDocument = () => {
    if (!selected) return;
    addNotification(`Abriendo enlace seguro: ${selectedDoc}`, "success");
  };

  const runAiReview = async (scope = selectedDoc) => {
    if (!selected) return;

    setAiReview({
      scope,
      status: "Generando dictamen",
      score: selected.averageScore,
      findings: ["Consultando scoring documental y validacion regulatoria del expediente."]
    });

    try {
      if (selected.order?.demo || String(selected.id).startsWith("demo-")) {
        throw new Error("demo");
      }

      const { data } = await scoringAPI.getExecutiveReport(selected.id);
      setAiReview({
        scope,
        status: data.decisionRecommendation === "approve" ? "Aprobable" : data.decisionRecommendation === "conditional" ? "Viable con condiciones" : "Requiere revision",
        score: data.globalScore,
        findings: [
          data.executiveConclusion,
          ...(data.criticalRisks || []).slice(0, 2),
          ...(data.recommendedConditions || []).slice(0, 1)
        ].filter(Boolean)
      });
    } catch {
      setAiReview({
        scope,
        status: "Revision preliminar lista",
        score: selected.averageScore,
        findings: [
          "Analisis derivado del expediente disponible en NEXUS.",
          selected.risk === "Alto" ? "Riesgo elevado: requiere aclaraciones antes de comite." : "Expediente apto para revision ejecutiva inicial.",
          "Siguiente paso sugerido: validar soporte documental y generar memo de credito."
        ]
      });
    }

    addNotification(`Agentes IA revisaron ${scope} para ${selected.id}`, "success");
  };

  const createInfoRequest = async () => {
    if (!selected || !requestForm.title.trim()) {
      addNotification("Agrega el titulo del requerimiento", "error");
      return;
    }

    const optimistic = {
      id: `local-${Date.now()}`,
      title: requestForm.title.trim(),
      description: requestForm.description.trim(),
      priority: requestForm.priority,
      status: "open",
      created_at: new Date().toISOString()
    };

    if (user?.demo || String(selected.id).startsWith("demo-")) {
      setInfoRequests((current) => [optimistic, ...current]);
      setRequestForm({ title: "", description: "", priority: "medium", documentType: "otro" });
      addNotification("Requerimiento demo creado para el solicitante", "success");
      return;
    }

    setSavingRequest(true);
    try {
      const { data } = await informationRequestsAPI.create({
        orderId: selected.id,
        ...requestForm
      });
      setInfoRequests((current) => [data, ...current]);
      setRequestForm({ title: "", description: "", priority: "medium", documentType: "otro" });
      addNotification("Requerimiento enviado al solicitante", "success");
    } catch (err) {
      addNotification(err.response?.data?.error || "No se pudo crear el requerimiento", "error");
    } finally {
      setSavingRequest(false);
    }
  };

  const openRequestEvidence = async (request) => {
    if (!request.evidence_document_id) return;

    if (user?.demo || String(request.id).startsWith("local-")) {
      addNotification("Vista de evidencia simulada en demo", "success");
      return;
    }

    setOpeningEvidenceId(request.id);
    try {
      const { data } = await informationRequestsAPI.evidenceUrl(request.id);
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      addNotification(err.response?.data?.error || "No se pudo abrir la evidencia", "error");
    } finally {
      setOpeningEvidenceId(null);
    }
  };

  const downloadCommitteeMemo = () => {
    if (!committeeMemo) return;
    const blob = new Blob([committeeMemo], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `memo-comite-${selected.id}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    addNotification("Memo de comite generado", "success");
  };

  const requestAuthorizedContact = async () => {
    const contactGate = gateStatus.find((item) => item.key === "contact");
    if (contactGate?.complete) {
      addNotification("El contacto ya fue autorizado para este expediente.", "success");
      return;
    }

    if (!contactGate?.requestable) {
      addNotification("Contacto bloqueado: completa NDA, usuario validado y revision interna.", "error");
      return;
    }

    const note = `[${new Date().toLocaleString("es-MX")}] Solicitud de contacto autorizado registrada para seguimiento NEXUS.`;

    if (!user?.demo && selected && !String(selected.id).startsWith("demo-")) {
      try {
        const { data } = await otorganteAPI.requestContact(selected.id, {
          status: "requested",
          reason: "Solicitud de contacto posterior a revision institucional Fase 7.",
          notes: interestNotes
        });
        setSelected((current) => current ? { ...current, contactRequest: data } : current);
        setOpportunities((current) => current.map((item) => item.id === selected.id ? { ...item, contactRequest: data } : item));
        addNotification("Solicitud de contacto autorizado registrada y auditada", "success");
        return;
      } catch (err) {
        addNotification(err.response?.data?.error || "No se pudo persistir el contacto; queda en notas locales.", "error");
      }
    }

    setInterestNotes((current) => {
      return current ? `${current}\n${note}` : note;
    });
    addNotification("Solicitud de contacto autorizado registrada localmente", "success");
  };

  return (
    <div>
      <div style={{ marginBottom: "2rem", borderBottom: `1px solid ${COLORS.border}`, paddingBottom: "1.5rem" }}>
        <p style={{ color: COLORS.gold, fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 800, marginBottom: "0.5rem" }}>
          {copy("Otorgantes / Capital partners")}
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.navy, fontSize: "2.2rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          {copy("Oportunidades verificadas y data rooms")}
        </h1>
        <p style={{ color: COLORS.textMuted, maxWidth: "820px", fontWeight: 300, fontSize: "0.95rem" }}>
          {copy("Revisa expedientes preparados por NEXUS, con score financiero, cumplimiento, documentos clave y estado de negociacion.")}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.8fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1.1rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.45rem" }}>
            {copy("Modelo de colaboracion Fase 7")}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.65rem" }}>
            {["Alta validada", "Pipeline filtrado", "Revision segura", "Interes / contacto"].map((label, index) => (
              <div key={copy(label)} style={{ padding: "0.75rem", borderRadius: "7px", background: index === 1 ? "rgba(201,168,76,0.12)" : COLORS.bg }}>
                <p style={{ color: COLORS.gold, fontWeight: 900, fontSize: "0.72rem", marginBottom: "0.25rem" }}>0{index + 1}</p>
                <p style={{ color: COLORS.navy, fontWeight: 900, fontSize: "0.82rem" }}>{copy(label)}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: COLORS.navy, color: "white", borderRadius: "8px", padding: "1.1rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.45rem" }}>
            {copy("Apertura controlada")}
          </p>
          <p style={{ fontSize: "0.86rem", lineHeight: 1.5, opacity: 0.92 }}>
            {copy("Acceso para otorgantes piloto con NDA, usuarios autorizados, bitacora y evidencia organizada antes de contacto formal.")}
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          ["Oportunidades activas", analytics.total],
          ["Data rooms abiertos", analytics.dataRooms],
          ["Reportes listos", analytics.offers],
          ["Ticket promedio", analytics.averageTicket ? `$${Math.round(analytics.averageTicket / 1000)}k` : "$0"],
        ].map(([label, value]) => (
          <div key={copy(label)} style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", padding: "1.25rem", borderRadius: "8px", border: `1px solid ${COLORS.border}`, boxShadow: COLORS.shadowSm }}>
            <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>{copy(label)}</p>
            <p style={{ color: COLORS.navy, fontSize: "2rem", fontWeight: 800, lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem", boxShadow: COLORS.shadowSm }}>
        <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.35rem" }}>
          {copy("Cierre local Fase 7")}
        </p>
        <p style={{ color: COLORS.navy, fontWeight: 900, fontSize: "0.95rem", marginBottom: "0.8rem" }}>
          {copy("Checklist operativo para declarar otorgantes como MVP revisable.")}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.65rem" }}>
          {phase7Checklist.map(([label, complete, detail]) => (
            <div key={copy(label)} style={{ padding: "0.75rem", borderRadius: "7px", background: complete ? "rgba(46,125,50,0.07)" : COLORS.bg, border: `1px solid ${complete ? "rgba(46,125,50,0.24)" : COLORS.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", alignItems: "center", marginBottom: "0.25rem" }}>
                <p style={{ color: COLORS.navy, fontWeight: 900, fontSize: "0.8rem" }}>{copy(label)}</p>
                <span style={{ color: complete ? COLORS.green : COLORS.amber, fontWeight: 900, fontSize: "0.68rem", textTransform: "uppercase" }}>
                  {complete ? copy("Listo") : copy("Pendiente")}
                </span>
              </div>
              <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", lineHeight: 1.35 }}>{copy(detail)}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem", boxShadow: COLORS.shadowSm }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "0.85rem" }}>
          <div>
            <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.25rem" }}>
              {copy("Perfil de apetito institucional")}
            </p>
            <p style={{ color: COLORS.navy, fontWeight: 900, fontSize: "0.95rem" }}>
              {copy("Filtra oportunidades por sector, region, monto, estructura, preparacion, riesgo y score minimo.")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAppetite(appetiteDefaults)}
            style={{ padding: "0.55rem 0.8rem", border: `1px solid ${COLORS.border}`, borderRadius: "6px", background: COLORS.bg, color: COLORS.navy, fontWeight: 900, cursor: "pointer" }}
          >
            {copy("Limpiar filtros")}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
          <label style={{ display: "grid", gap: "0.3rem" }}>
            <span style={{ color: COLORS.textMuted, fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase" }}>{copy("Sector")}</span>
            <select
              value={appetite.sector}
              onChange={(event) => setAppetite((current) => ({ ...current, sector: event.target.value }))}
              style={{ padding: "0.6rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, color: COLORS.navy, fontWeight: 800 }}
            >
              {sectorOptions.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
            </select>
          </label>

          <label style={{ display: "grid", gap: "0.3rem" }}>
            <span style={{ color: COLORS.textMuted, fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase" }}>{copy("Region")}</span>
            <select
              value={appetite.region}
              onChange={(event) => setAppetite((current) => ({ ...current, region: event.target.value }))}
              style={{ padding: "0.6rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, color: COLORS.navy, fontWeight: 800 }}
            >
              {regionOptions.map((region) => <option key={region} value={region}>{region}</option>)}
            </select>
          </label>

          <label style={{ display: "grid", gap: "0.3rem" }}>
            <span style={{ color: COLORS.textMuted, fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase" }}>{copy("Riesgo")}</span>
            <select
              value={appetite.risk}
              onChange={(event) => setAppetite((current) => ({ ...current, risk: event.target.value }))}
              style={{ padding: "0.6rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, color: COLORS.navy, fontWeight: 800 }}
            >
              {["Todos", "Bajo", "Medio", "Alto"].map((risk) => <option key={risk} value={risk}>{risk}</option>)}
            </select>
          </label>

          <label style={{ display: "grid", gap: "0.3rem" }}>
            <span style={{ color: COLORS.textMuted, fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase" }}>{copy("Score minimo")}</span>
            <input
              type="number"
              min="0"
              max="100"
              value={appetite.minScore}
              onChange={(event) => setAppetite((current) => ({ ...current, minScore: event.target.value }))}
              style={{ padding: "0.6rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, color: COLORS.navy, fontWeight: 800 }}
            />
          </label>

          <label style={{ display: "grid", gap: "0.3rem" }}>
            <span style={{ color: COLORS.textMuted, fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase" }}>{copy("Monto minimo")}</span>
            <input
              type="number"
              min="0"
              value={appetite.minAmount}
              onChange={(event) => setAppetite((current) => ({ ...current, minAmount: event.target.value }))}
              placeholder="Ej. 50000"
              style={{ padding: "0.6rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, color: COLORS.navy, fontWeight: 800 }}
            />
          </label>

          <label style={{ display: "grid", gap: "0.3rem" }}>
            <span style={{ color: COLORS.textMuted, fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase" }}>{copy("Monto maximo")}</span>
            <input
              type="number"
              min="0"
              value={appetite.maxAmount}
              onChange={(event) => setAppetite((current) => ({ ...current, maxAmount: event.target.value }))}
              placeholder="Ej. 250000"
              style={{ padding: "0.6rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, color: COLORS.navy, fontWeight: 800 }}
            />
          </label>

          <label style={{ display: "grid", gap: "0.3rem" }}>
            <span style={{ color: COLORS.textMuted, fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase" }}>{copy("Estructura")}</span>
            <select
              value={appetite.structure}
              onChange={(event) => setAppetite((current) => ({ ...current, structure: event.target.value }))}
              style={{ padding: "0.6rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, color: COLORS.navy, fontWeight: 800 }}
            >
              {structureOptions.map((structure) => <option key={structure} value={structure}>{structure}</option>)}
            </select>
          </label>

          <label style={{ display: "grid", gap: "0.3rem" }}>
            <span style={{ color: COLORS.textMuted, fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase" }}>{copy("Preparacion")}</span>
            <select
              value={appetite.readiness}
              onChange={(event) => setAppetite((current) => ({ ...current, readiness: event.target.value }))}
              style={{ padding: "0.6rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, color: COLORS.navy, fontWeight: 800 }}
            >
              {readinessOptions.map((readiness) => <option key={readiness} value={readiness}>{readiness}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(320px, 0.8fr)", gap: "1.5rem", alignItems: "start" }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", gap: "1rem", flexWrap: "wrap" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", color: COLORS.navy, fontWeight: 500 }}>
              {copy("Proyectos de interes")}
            </h2>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {["Todos", "Nuevo", "Data room abierto", "En revision", "Reporte listo", "Observado"].map((status) => (
                <button
                  key={copy(status)}
                  onClick={() => setFilter(status)}
                  style={{
                    padding: "0.4rem 0.9rem",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    background: filter === status ? COLORS.navy : "transparent",
                    color: filter === status ? COLORS.white : COLORS.textMuted,
                    border: `1px solid ${filter === status ? COLORS.navy : COLORS.border}`,
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  {copy(status)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", borderRadius: "8px", border: `1px solid ${COLORS.border}`, overflow: "hidden", boxShadow: COLORS.shadowSm }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: COLORS.bgSubtle, borderBottom: `1px solid ${COLORS.border}` }}>
                <tr>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.75rem", color: COLORS.textMuted, textTransform: "uppercase" }}>{copy("Proyecto")}</th>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.75rem", color: COLORS.textMuted, textTransform: "uppercase" }}>{copy("Ticket")}</th>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.75rem", color: COLORS.textMuted, textTransform: "uppercase" }}>{copy("Scores")}</th>
                  <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.75rem", color: COLORS.textMuted, textTransform: "uppercase" }}>{copy("Estado")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ padding: "1.25rem", color: COLORS.textMuted }}>{copy("Cargando expedientes...")}</td>
                  </tr>
                 ) : error ? (
                  <tr>
                    <td colSpan="4" style={{ padding: "1.25rem", color: "#C62828" }}>{error}</td>
                  </tr>
                 ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: "1.25rem", color: COLORS.textMuted }}>{copy("No hay expedientes para este filtro.")}</td>
                  </tr>
                ) : filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => selectOpportunity(item)}
                    style={{
                      borderBottom: `1px solid ${COLORS.border}`,
                      cursor: "pointer",
                      background: selected?.id === item.id ? "rgba(201,168,76,0.08)" : "transparent",
                    }}
                  >
                    <td style={{ padding: "1.1rem" }}>
                      <div style={{ color: COLORS.navy, fontWeight: 800 }}>{copy(item.name)}</div>
                      <div style={{ color: COLORS.textMuted, fontSize: "0.82rem" }}>{copy(item.sector)} / {item.country}</div>
                      <div style={{ color: COLORS.textMuted, fontSize: "0.72rem", marginTop: "0.2rem" }}>{copy(item.structure)} / {copy(item.readinessLevel)}</div>
                    </td>
                    <td style={{ padding: "1.1rem", fontWeight: 700 }}>{item.amountLabel}</td>
                    <td style={{ padding: "1.1rem" }}>
                      <div style={{ fontSize: "0.82rem", color: COLORS.textMuted }}>{copy("Fin")} {item.financialScore} / {copy("Comp")} {item.complianceScore}</div>
                      <div style={{ color: riskColor[item.risk], fontWeight: 800 }}>{copy(item.risk)}</div>
                    </td>
                    <td style={{ padding: "1.1rem" }}>{copy(item.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", borderRadius: "10px", border: `1px solid ${COLORS.border}`, boxShadow: COLORS.shadowSm, overflow: "hidden", position: "sticky", top: "96px" }}>
          <div style={{ background: COLORS.bg, padding: "1.25rem", borderBottom: `1px solid ${COLORS.border}` }}>
            <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.35rem" }}>{copy("Data room")}</p>
            <h3 style={{ color: COLORS.navy, fontSize: "1.25rem" }}>{selected?.name || "Sin expediente seleccionado"}</h3>
            <p style={{ color: COLORS.textMuted, fontSize: "0.9rem" }}>{selected?.id || "N/D"} / {selected?.applicant || "N/D"}</p>
          </div>
          {selected ? (
          <div style={{ padding: "1.25rem", display: "grid", gap: "1rem" }}>
            <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1rem", background: "linear-gradient(135deg, rgba(15,31,46,0.04), rgba(201,168,76,0.12))" }}>
              <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.65rem" }}>
                {copy("Reporte ejecutivo para otorgante")}
              </p>
              <div style={{ display: "grid", gap: "0.55rem" }}>
                {executiveBrief.map(([label, value]) => (
                  <div key={copy(label)} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "0.65rem", alignItems: "start" }}>
                    <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>{copy(label)}</p>
                    <p style={{ color: COLORS.navy, fontSize: "0.82rem", lineHeight: 1.4, fontWeight: label === "Conclusion" ? 900 : 600 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1rem", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.8rem" }}>
                <div>
                  <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>
                    {copy("Mesa institucional")}
                  </p>
                  <p style={{ color: COLORS.navy, fontWeight: 900, fontSize: "0.95rem", lineHeight: 1.35 }}>
                    {copy("Lectura rapida para decidir si se revisa, se condiciona o se pausa.")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => runAiReview("Mesa institucional")}
                  style={{ padding: "0.55rem 0.7rem", border: "none", borderRadius: "6px", background: COLORS.gold, color: COLORS.navy, fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  {copy("Recalcular")}
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.55rem" }}>
                {decisionBoard.map((item) => (
                  <div key={copy(item.label)} style={{ padding: "0.75rem", borderRadius: "7px", background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                    <p style={{ color: COLORS.textMuted, fontSize: "0.66rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "0.2rem" }}>
                      {copy(item.label)}
                    </p>
                    <p style={{ color: item.tone, fontSize: "1rem", fontWeight: 900, marginBottom: "0.25rem" }}>
                      {item.value}
                    </p>
                    <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", lineHeight: 1.35 }}>
                      {copy(item.detail)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1rem", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "flex-start", marginBottom: "0.9rem" }}>
                <div>
                  <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.25rem" }}>
                    {copy("Flujo de oportunidad")}
                  </p>
                  <p style={{ color: COLORS.navy, fontWeight: 900, lineHeight: 1.35 }}>
                    {copy("De triage a term sheet con trazabilidad institucional.")}
                  </p>
                </div>
                <span style={{ color: riskColor[selected.risk], fontWeight: 900, fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                  {copy("Riesgo")} {copy(selected.risk)}
                </span>
              </div>

              <div style={{ display: "grid", gap: "0.55rem" }}>
                {workflowSteps.map((step, index) => (
                  <div key={step.key} style={{
                    display: "grid",
                    gridTemplateColumns: "26px 1fr",
                    gap: "0.6rem",
                    alignItems: "flex-start",
                    padding: "0.65rem",
                    borderRadius: "8px",
                    border: `1px solid ${step.active ? COLORS.gold : COLORS.border}`,
                    background: step.complete ? "rgba(46,125,50,0.06)" : step.active ? "rgba(201,168,76,0.12)" : COLORS.bg,
                  }}>
                    <div style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: step.complete ? COLORS.green : step.active ? COLORS.gold : COLORS.textMuted,
                      color: step.active ? COLORS.navy : "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.72rem",
                      fontWeight: 900,
                    }}>
                      {index + 1}
                    </div>
                    <div>
                      <p style={{ color: COLORS.navy, fontSize: "0.82rem", fontWeight: 900, lineHeight: 1.3 }}>
                        {copy(step.label)}
                      </p>
                      <p style={{ color: COLORS.textMuted, fontSize: "0.74rem", lineHeight: 1.35 }}>
                        {copy(step.detail)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem", marginTop: "0.9rem" }}>
                <button
                  onClick={() => saveInterest("under_review")}
                  disabled={savingInterest}
                  style={{ padding: "0.7rem", border: `1px solid ${COLORS.border}`, borderRadius: "6px", background: "white", color: COLORS.navy, fontWeight: 900, cursor: savingInterest ? "not-allowed" : "pointer" }}
                >
                  {copy("Pasar a comite")}
                </button>
                <button
                  onClick={() => saveInterest("declined")}
                  disabled={savingInterest}
                  style={{ padding: "0.7rem", border: `1px solid ${COLORS.border}`, borderRadius: "6px", background: "white", color: "#C62828", fontWeight: 900, cursor: savingInterest ? "not-allowed" : "pointer" }}
                >
                  {copy("Declinar")}
                </button>
              </div>
            </div>

            {[
              ["Uso de fondos", selected.use],
              ["Garantia / soporte", selected.guarantee],
              ["Estructura", selected.structure],
              ["Nivel de preparacion", selected.readinessLevel],
              ["Etapa", selected.stage],
              ["Ticket", selected.amountLabel],
            ].map(([label, value]) => (
              <div key={copy(label)}>
                <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", textTransform: "uppercase", marginBottom: "0.25rem" }}>{copy(label)}</p>
                <p style={{ color: COLORS.navy, fontWeight: 700, lineHeight: 1.5 }}>{copy(value)}</p>
              </div>
            ))}

            <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1rem", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>
              <p style={{ color: COLORS.navy, fontWeight: 900, marginBottom: "0.65rem" }}>{copy("Ficha de cumplimiento")}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.55rem", marginBottom: "0.75rem" }}>
                {[
                  ["Score", `${selected.averageScore}/100`],
                  ["Compliance", `${selected.complianceScore}/100`],
                  ["Financiero", `${selected.financialScore}/100`],
                ].map(([label, value]) => (
                  <div key={copy(label)} style={{ padding: "0.6rem", borderRadius: "6px", background: COLORS.bg }}>
                    <p style={{ color: COLORS.textMuted, fontSize: "0.66rem", fontWeight: 900, textTransform: "uppercase" }}>{copy(label)}</p>
                    <p style={{ color: COLORS.navy, fontSize: "1rem", fontWeight: 900 }}>{value}</p>
                  </div>
                ))}
              </div>
              <p style={{ color: COLORS.textMuted, fontSize: "0.76rem", lineHeight: 1.45 }}>
                {copy("NEXUS no autoriza credito. Presenta evidencia, score, alertas y contexto para que el otorgante aplique su politica interna.")}
              </p>
            </div>

            <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1rem", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "flex-start", marginBottom: "0.8rem" }}>
                <div>
                  <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>
                    {copy("Paquete de comite")}
                  </p>
                  <p style={{ color: COLORS.navy, fontWeight: 900, fontSize: "0.95rem", lineHeight: 1.35 }}>
                    {copy("Checklist previo a memo, decision interna o propuesta indicativa.")}
                  </p>
                </div>
                <span style={{ color: COLORS.gold, fontWeight: 900, fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                  {copy("NEXUS")}
                </span>
              </div>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {committeePack.map((item) => (
                  <div key={copy(item.title)} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.75rem", padding: "0.65rem", borderRadius: "7px", background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                    <div>
                      <p style={{ color: COLORS.navy, fontWeight: 900, fontSize: "0.8rem", marginBottom: "0.2rem" }}>{copy(item.title)}</p>
                      <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", lineHeight: 1.35 }}>{copy(item.detail)}</p>
                    </div>
                    <span style={{ color: item.status === "Pendiente" || item.status === "Incompleta" || item.status === "Subsanar" || item.status === "Abiertos" ? COLORS.amber : COLORS.green, fontWeight: 900, fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                      {copy(item.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1rem", background: "rgba(15,31,46,0.03)" }}>
              <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>
                {copy("Term sheet readiness")}
              </p>
              <p style={{ color: COLORS.navy, fontWeight: 900, fontSize: "0.95rem", lineHeight: 1.35, marginBottom: "0.75rem" }}>
                {copy("Condiciones minimas antes de preparar oferta indicativa.")}
              </p>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {termSheetReadiness.map((item) => (
                  <div key={copy(item.label)} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.75rem", padding: "0.65rem", borderRadius: "7px", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}` }}>
                    <div>
                      <p style={{ color: COLORS.navy, fontWeight: 900, fontSize: "0.8rem", marginBottom: "0.2rem" }}>{copy(item.label)}</p>
                      <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", lineHeight: 1.35 }}>{copy(item.detail)}</p>
                    </div>
                    <span style={{ color: ["Cubierta", "Aceptable", "Fuerte", "Cerrada"].includes(item.status) ? COLORS.green : item.status === "Alta" || item.status === "Debil" ? "#C62828" : COLORS.amber, fontWeight: 900, fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                      {copy(item.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1rem", background: "rgba(42,82,122,0.06)" }}>
              <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>
                {copy("Preparacion internacional")}
              </p>
              <p style={{ color: COLORS.navy, fontWeight: 900, fontSize: "0.92rem", lineHeight: 1.35, marginBottom: "0.7rem" }}>
                {copy("Vista local para validar mercado, moneda y foco regulatorio antes de escalar fuera de Mexico.")}
              </p>
              <div style={{ display: "grid", gap: "0.45rem" }}>
                {internationalReadiness.map(([label, value]) => (
                  <div key={copy(label)} style={{ display: "grid", gridTemplateColumns: "105px 1fr", gap: "0.6rem", alignItems: "start" }}>
                    <p style={{ color: COLORS.textMuted, fontSize: "0.68rem", fontWeight: 900, textTransform: "uppercase" }}>{copy(label)}</p>
                    <p style={{ color: COLORS.navy, fontSize: "0.78rem", fontWeight: 800, lineHeight: 1.35 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: COLORS.bg, borderRadius: "8px", padding: "1rem" }}>
              <p style={{ color: COLORS.navy, fontWeight: 800, marginBottom: "0.75rem" }}>{copy("Documentos disponibles")}</p>
              {selected.documents.map((doc) => (
                <button
                  key={doc}
                  onClick={() => {
                    setSelectedDoc(doc);
                    setAiReview(null);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.65rem 0.75rem",
                    marginBottom: "0.45rem",
                    borderRadius: "6px",
                    border: `1px solid ${selectedDoc === doc ? COLORS.gold : COLORS.border}`,
                    background: selectedDoc === doc ? "rgba(201,168,76,0.12)" : COLORS.white,
                    color: COLORS.navy,
                    cursor: "pointer",
                    fontWeight: 700,
                    textAlign: "left",
                  }}
                >
                  <span>{doc}</span>
                  <span style={{ color: COLORS.textMuted, fontSize: "0.72rem", textTransform: "uppercase" }}>{copy("Seguro")}</span>
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <button onClick={viewDocument} style={{ padding: "0.75rem", border: `1px solid ${COLORS.navy}`, borderRadius: "6px", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", color: COLORS.navy, fontWeight: 800 }}>
                {copy("Ver documento")}
              </button>
              <button onClick={() => runAiReview(selectedDoc)} style={{ padding: "0.75rem", border: "none", borderRadius: "6px", background: COLORS.navy, color: COLORS.white, fontWeight: 800 }}>
                {copy("Revisar con IA")}
              </button>
            </div>

            <button onClick={() => runAiReview("Data room completo")} style={{ padding: "0.85rem", border: `1px solid ${COLORS.border}`, borderRadius: "6px", background: "rgba(42,82,122,0.08)", color: COLORS.navy, fontWeight: 800 }}>
              {copy("Ejecutar revision IA del data room")}
            </button>

            <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1rem", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>
              <p style={{ color: COLORS.navy, fontWeight: 900, marginBottom: "0.65rem" }}>{copy("Data room institucional")}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.45rem" }}>
                {dataRoomFolders.map((folder, index) => (
                  <div key={folder} style={{ padding: "0.5rem", borderRadius: "6px", background: index < 5 ? "rgba(46,125,50,0.06)" : COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                    <p style={{ color: COLORS.navy, fontSize: "0.72rem", fontWeight: 900, lineHeight: 1.25 }}>{folder}</p>
                  </div>
                ))}
              </div>
              <p style={{ color: COLORS.textMuted, fontSize: "0.74rem", lineHeight: 1.45, marginTop: "0.65rem" }}>
                {copy("Estructura basada en Fase 7: carpetas estandar, permisos por rol, acceso temporal y bitacora de consulta.")}
              </p>
            </div>

            <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1rem", background: COLORS.bg }}>
              <p style={{ color: COLORS.navy, fontWeight: 900, marginBottom: "0.65rem" }}>{copy("Pila de confianza NEXUS")}</p>
              <div style={{ display: "grid", gap: "0.55rem" }}>
                {trustStack.map(([label, detail]) => (
                  <div key={copy(label)} style={{ paddingLeft: "0.65rem", borderLeft: `3px solid ${COLORS.gold}` }}>
                    <p style={{ color: COLORS.navy, fontSize: "0.8rem", fontWeight: 900 }}>{copy(label)}</p>
                    <p style={{ color: COLORS.textMuted, fontSize: "0.73rem", lineHeight: 1.35 }}>{copy(detail)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1rem", display: "grid", gap: "0.75rem" }}>
              <div>
                <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.35rem" }}>
                  {copy("Solicitar informacion al solicitante")}
                </p>
                <input
                  value={requestForm.title}
                  onChange={(event) => setRequestForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder={copy("Ej. Estado financiero auditado 2025")}
                  style={{ width: "100%", padding: "0.65rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, marginBottom: "0.5rem" }}
                />
                <textarea
                  value={requestForm.description}
                  onChange={(event) => setRequestForm((prev) => ({ ...prev, description: event.target.value }))}
                  rows={3}
                  placeholder={copy("Detalle de la aclaracion o documento requerido...")}
                  style={{ width: "100%", padding: "0.65rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, resize: "vertical", marginBottom: "0.5rem" }}
                />
                <select
                  value={requestForm.priority}
                  onChange={(event) => setRequestForm((prev) => ({ ...prev, priority: event.target.value }))}
                  style={{ width: "100%", padding: "0.65rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, marginBottom: "0.5rem" }}
                >
                  <option value="medium">{copy("Prioridad media")}</option>
                  <option value="high">{copy("Prioridad alta")}</option>
                  <option value="low">{copy("Prioridad baja")}</option>
                </select>
                <select
                  value={requestForm.documentType}
                  onChange={(event) => setRequestForm((prev) => ({ ...prev, documentType: event.target.value }))}
                  style={{ width: "100%", padding: "0.65rem", borderRadius: "6px", border: `1px solid ${COLORS.border}` }}
                >
                  {Object.entries(DOCUMENT_TYPES).map(([value, label]) => (
                    <option key={value} value={value}>{copy(label)}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={createInfoRequest}
                disabled={savingRequest}
                style={{ padding: "0.75rem", border: "none", borderRadius: "6px", background: COLORS.navy, color: "white", fontWeight: 900, cursor: savingRequest ? "not-allowed" : "pointer" }}
              >
                {savingRequest ? copy("Enviando...") : copy("Enviar requerimiento")}
              </button>
              {infoRequests.length > 0 && (
                <div style={{ display: "grid", gap: "0.45rem" }}>
                  {infoRequests.slice(0, 3).map((request) => (
                    <div key={request.id} style={{ padding: "0.65rem", borderRadius: "6px", background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                      <p style={{ color: COLORS.navy, fontWeight: 900, fontSize: "0.82rem" }}>{copy(request.title)}</p>
                      <p style={{ color: COLORS.textMuted, fontSize: "0.74rem" }}>
                        {request.priority || "medium"} / {request.status || "open"}
                      </p>
                      {request.document_type && (
                        <p style={{ color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, marginTop: "0.25rem" }}>
                          Tipo requerido: {DOCUMENT_TYPES[request.document_type] || request.document_type}
                        </p>
                      )}
                      {request.response && (
                        <p style={{ color: COLORS.textMuted, fontSize: "0.74rem", lineHeight: 1.4, marginTop: "0.35rem" }}>
                          Respuesta: {request.response}
                        </p>
                      )}
                      {request.evidence_document_id && (
                        <div style={{ marginTop: "0.45rem", display: "grid", gap: "0.35rem" }}>
                          <p style={{ color: COLORS.green, fontSize: "0.72rem", fontWeight: 900 }}>
                            Evidencia vinculada: {request.evidence?.filename || "Documento del expediente"}
                          </p>
                          <button
                            type="button"
                            onClick={() => openRequestEvidence(request)}
                            disabled={openingEvidenceId === request.id}
                            style={{
                              padding: "0.5rem",
                              border: "none",
                              borderRadius: "6px",
                              background: COLORS.navy,
                              color: "white",
                              fontSize: "0.72rem",
                              fontWeight: 900,
                              cursor: openingEvidenceId === request.id ? "not-allowed" : "pointer",
                            }}
                          >
                            {openingEvidenceId === request.id ? "Abriendo..." : "Abrir evidencia"}
                          </button>
                        </div>
                      )}
                      {request.events?.length > 0 && (
                        <div style={{ marginTop: "0.5rem", padding: "0.5rem", borderRadius: "6px", background: "white", border: `1px solid ${COLORS.border}` }}>
                          <p style={{ color: COLORS.navy, fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "0.3rem" }}>
                            {copy("Ultimos movimientos")}
                          </p>
                          {request.events.slice(0, 2).map((event) => (
                            <p key={event.id} style={{ color: COLORS.textMuted, fontSize: "0.7rem", lineHeight: 1.35 }}>
                              <strong style={{ color: COLORS.navy }}>{formatRequestEventAction(event.action)}</strong>
                              {event.status ? ` / ${copy(event.status)}` : ""} - {formatRequestEventDate(event.created_at)}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {aiReview && (
              <div style={{ borderRadius: "8px", border: `1px solid ${COLORS.border}`, padding: "1rem", background: "linear-gradient(135deg, rgba(15,31,46,0.04), rgba(201,168,76,0.10))" }}>
                <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 800, marginBottom: "0.35rem" }}>
                  Resultado IA / {aiReview.scope}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", marginBottom: "0.75rem" }}>
                  <strong style={{ color: COLORS.navy }}>{copy(aiReview.status)}</strong>
                  <span style={{ color: COLORS.green, fontWeight: 900 }}>{aiReview.score}/100</span>
                </div>
                {aiReview.findings.map((finding) => (
                  <p key={finding} style={{ color: COLORS.textMuted, fontSize: "0.86rem", lineHeight: 1.55, marginBottom: "0.35rem" }}>
                    - {finding}
                  </p>
                ))}
              </div>
            )}

            <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1rem", display: "grid", gap: "0.75rem" }}>
              <div>
                <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.35rem" }}>
                  {copy("Interés institucional")}
                </p>
                <select
                  value={interestStatus}
                  onChange={(event) => setInterestStatus(event.target.value)}
                  style={{ width: "100%", padding: "0.65rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, color: COLORS.navy, fontWeight: 700 }}
                >
                  <option value="interested">{copy("Me interesa")}</option>
                  <option value="under_review">{copy("En revisión interna")}</option>
                  <option value="term_sheet">{copy("Term sheet")}</option>
                  <option value="declined">{copy("Declinado")}</option>
                  <option value="closed">{copy("Cerrado")}</option>
                </select>
              </div>
              <textarea
                value={interestNotes}
                onChange={(event) => setInterestNotes(event.target.value)}
                rows={3}
                placeholder={copy("Notas internas del otorgante...")}
                style={{ width: "100%", padding: "0.65rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, resize: "vertical" }}
              />
              {selected.interest && (
                <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45 }}>
                  {copy("Último estado:")} <strong>{copy(selected.interest.status)}</strong>
                </p>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <button
                  onClick={markInterest}
                  disabled={savingInterest}
                  style={{ padding: "0.75rem", border: "none", borderRadius: "6px", background: COLORS.gold, color: COLORS.navy, fontWeight: 800, cursor: savingInterest ? "not-allowed" : "pointer" }}
                >
                  {savingInterest ? copy("Guardando...") : copy("Me interesa")}
                </button>
                <button
                  onClick={() => saveInterest(interestStatus === "under_review" ? "term_sheet" : "under_review")}
                  disabled={savingInterest}
                  style={{ padding: "0.75rem", border: `1px solid ${COLORS.border}`, borderRadius: "6px", background: "transparent", color: COLORS.navy, fontWeight: 800, cursor: savingInterest ? "not-allowed" : "pointer" }}
                >
                  {interestStatus === "under_review" ? copy("Term sheet") : copy("A comite")}
                </button>
              </div>
            </div>

            <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1rem", background: COLORS.bg }}>
              <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "0.35rem" }}>
                {copy("Gates de acceso Fase 7")}
              </p>
              <div style={{ display: "grid", gap: "0.5rem", marginBottom: "0.75rem" }}>
                {gateStatus.map((gate) => (
                  <div key={gate.key} style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: "0.55rem", alignItems: "flex-start", padding: "0.55rem", borderRadius: "6px", background: gate.complete ? "rgba(46,125,50,0.07)" : "white", border: `1px solid ${gate.complete ? "rgba(46,125,50,0.22)" : COLORS.border}` }}>
                    <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: gate.complete ? COLORS.green : COLORS.textMuted, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", fontWeight: 900 }}>
                      {gate.complete ? "OK" : "!"}
                    </span>
                    <div>
                      <p style={{ color: COLORS.navy, fontSize: "0.78rem", fontWeight: 900 }}>{copy(gate.label)}</p>
                      <p style={{ color: COLORS.textMuted, fontSize: "0.7rem", lineHeight: 1.35 }}>{copy(gate.detail)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={requestAuthorizedContact}
                style={{ width: "100%", padding: "0.72rem", border: "none", borderRadius: "6px", background: gateStatus.find((item) => item.key === "contact")?.requestable || gateStatus.find((item) => item.key === "contact")?.complete ? COLORS.gold : COLORS.border, color: COLORS.navy, fontWeight: 900, cursor: "pointer" }}
              >
                {gateStatus.find((item) => item.key === "contact")?.complete ? "Contacto autorizado" : "Solicitar contacto autorizado"}
              </button>
              {selected.contactRequest && (
                <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", lineHeight: 1.4, marginTop: "0.5rem" }}>
                  {copy("Solicitud registrada:")} <strong>{selected.contactRequest.status}</strong>
                </p>
              )}
            </div>

            <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1rem", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>
              <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "0.35rem" }}>
                {copy("Memo de comite")}
              </p>
              <p style={{ color: COLORS.navy, fontWeight: 900, marginBottom: "0.45rem" }}>
                {copy("Paquete interno para decision del otorgante")}
              </p>
              <p style={{ color: COLORS.textMuted, fontSize: "0.76rem", lineHeight: 1.45, marginBottom: "0.75rem" }}>
                {copy("Resume tesis, score, riesgos, documentos clave, requerimientos abiertos y recomendacion NEXUS.")}
              </p>
              <button
                type="button"
                onClick={downloadCommitteeMemo}
                style={{ width: "100%", padding: "0.75rem", border: "none", borderRadius: "6px", background: COLORS.navy, color: "white", fontWeight: 900, cursor: "pointer" }}
              >
                {copy("Descargar memo MD")}
              </button>
            </div>
          </div>
          ) : (
            <div style={{ padding: "1.25rem", color: COLORS.textMuted }}>{copy("Selecciona un expediente para revisar el data room.")}</div>
          )}
        </aside>
      </div>
    </div>
  );
}
