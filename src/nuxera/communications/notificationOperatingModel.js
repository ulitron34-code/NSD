import { pickLang } from "../../data/requisitosMinimos";

export const NUXERA_COMMUNICATION_EVENT_IDS = Object.freeze({
  APPLICANT_MISSING_EVIDENCE: "applicant-missing-evidence",
  APPLICANT_EVIDENCE_REJECTED: "applicant-evidence-rejected",
  APPLICANT_MESSAGE_RECEIVED: "applicant-message-received",
  GRANTOR_FILE_SHARED: "grantor-file-shared",
  GRANTOR_INFORMATION_RESPONSE: "grantor-information-response",
  GRANTOR_DECISION_READY: "grantor-decision-ready",
  ADMIN_DELIVERY_FAILURE: "admin-delivery-failure",
});

const EVENT_DEFINITIONS = [
  {
    id: NUXERA_COMMUNICATION_EVENT_IDS.APPLICANT_MISSING_EVIDENCE,
    audience: "applicant",
    trigger: { es: "Faltante documental o requerimiento abierto", en: "Missing document or open information request" },
    subject: { es: "Tu expediente requiere evidencia adicional", en: "Your file needs additional evidence" },
    action: { es: "Abrir mi expediente y responder el requerimiento", en: "Open my file and answer the request" },
    priority: "high",
    channels: ["in-app", "email"],
    agentMode: "draft-only",
  },
  {
    id: NUXERA_COMMUNICATION_EVENT_IDS.APPLICANT_EVIDENCE_REJECTED,
    audience: "applicant",
    trigger: { es: "Revision humana rechaza o pide correccion de evidencia", en: "Human review rejects or requests evidence correction" },
    subject: { es: "Hay observaciones sobre tu evidencia", en: "There are observations on your evidence" },
    action: { es: "Revisar comentarios y subir correccion", en: "Review comments and upload a correction" },
    priority: "high",
    channels: ["in-app", "email"],
    agentMode: "summarize-feedback",
  },
  {
    id: NUXERA_COMMUNICATION_EVENT_IDS.APPLICANT_MESSAGE_RECEIVED,
    audience: "applicant",
    trigger: { es: "Mensaje nuevo del otorgante o de operaciones", en: "New message from grantor or operations" },
    subject: { es: "Nuevo mensaje en tu expediente", en: "New message in your file" },
    action: { es: "Abrir conversacion del expediente", en: "Open the file conversation" },
    priority: "normal",
    channels: ["in-app", "email"],
    agentMode: "no-agent",
  },
  {
    id: NUXERA_COMMUNICATION_EVENT_IDS.GRANTOR_FILE_SHARED,
    audience: "grantor",
    trigger: { es: "Data room compartido o aceptado por otorgante", en: "Data room shared with or accepted by grantor" },
    subject: { es: "Nuevo expediente autorizado para revisar", en: "New authorized file to review" },
    action: { es: "Abrir Gestion de expedientes", en: "Open case management" },
    priority: "normal",
    channels: ["in-app", "email"],
    agentMode: "triage-summary",
  },
  {
    id: NUXERA_COMMUNICATION_EVENT_IDS.GRANTOR_INFORMATION_RESPONSE,
    audience: "grantor",
    trigger: { es: "Solicitante responde requerimiento o carga evidencia solicitada", en: "Applicant responds to a request or uploads requested evidence" },
    subject: { es: "Respuesta recibida para revision", en: "Response received for review" },
    action: { es: "Abrir Mesa de decision del expediente", en: "Open the file decision desk" },
    priority: "high",
    channels: ["in-app", "email"],
    agentMode: "summarize-delta",
  },
  {
    id: NUXERA_COMMUNICATION_EVENT_IDS.GRANTOR_DECISION_READY,
    audience: "grantor",
    trigger: { es: "Score, documentos y faltantes alcanzan umbral de mesa", en: "Score, documents and gaps reach desk threshold" },
    subject: { es: "Expediente listo para analisis de mesa", en: "File ready for desk analysis" },
    action: { es: "Abrir memo no vinculante", en: "Open non-binding memo" },
    priority: "high",
    channels: ["in-app", "email"],
    agentMode: "draft-non-binding-memo",
  },
  {
    id: NUXERA_COMMUNICATION_EVENT_IDS.GRANTOR_CASE_ASSIGNED,
    audience: "grantor",
    trigger: { es: "Administrador asigna o reasigna un expediente con SLA", en: "Administrator assigns or reassigns a file with SLA" },
    subject: { es: "Tienes un expediente asignado en NUXERA", en: "You have an assigned NUXERA file" },
    action: { es: "Abrir Gestion de expedientes y revisar SLA", en: "Open case management and review SLA" },
    priority: "high",
    channels: ["in-app", "email"],
    agentMode: "triage-summary",
  },
  {
    id: NUXERA_COMMUNICATION_EVENT_IDS.GRANTOR_SLA_DUE_SOON,
    audience: "grantor",
    trigger: { es: "SLA de expediente asignado vence en menos de 24 horas", en: "Assigned file SLA is due within 24 hours" },
    subject: { es: "SLA por vencer en expediente NUXERA", en: "NUXERA file SLA due soon" },
    action: { es: "Atender faltantes o escalar antes del vencimiento", en: "Handle gaps or escalate before due time" },
    priority: "high",
    channels: ["in-app", "email"],
    agentMode: "summarize-delta",
  },
  {
    id: NUXERA_COMMUNICATION_EVENT_IDS.ADMIN_CASE_SLA_OVERDUE,
    audience: "admin",
    trigger: { es: "SLA de expediente asignado ya vencio", en: "Assigned file SLA is overdue" },
    subject: { es: "SLA vencido requiere seguimiento", en: "Overdue SLA requires follow-up" },
    action: { es: "Revisar historial de asignaciones y reasignar si aplica", en: "Review assignment history and reassign if needed" },
    priority: "critical",
    channels: ["in-app"],
    agentMode: "no-agent",
  },  {
    id: NUXERA_COMMUNICATION_EVENT_IDS.ADMIN_DELIVERY_FAILURE,
    audience: "admin",
    trigger: { es: "Email, WhatsApp o in-app falla despues de reintento", en: "Email, WhatsApp or in-app fails after retry" },
    subject: { es: "Fallo de entrega de notificacion", en: "Notification delivery failure" },
    action: { es: "Revisar outbox y bitacora", en: "Review outbox and audit trail" },
    priority: "critical",
    channels: ["in-app"],
    agentMode: "no-agent",
  },
];

const CHANNEL_POLICIES = [
  {
    id: "in-app",
    label: { es: "In-app", en: "In-app" },
    purpose: { es: "Fuente primaria de estado y no leida.", en: "Primary state and unread source." },
    guardrail: { es: "Debe persistir estado y permitir lectura por rol.", en: "Must persist state and allow role-scoped reads." },
  },
  {
    id: "email",
    label: { es: "Email", en: "Email" },
    purpose: { es: "Aviso externo con liga al expediente; sin adjuntos ni datos sensibles completos.", en: "External notice with file link; no attachments or full sensitive data." },
    guardrail: { es: "No debe incluir documentos, scores completos ni decisiones vinculantes.", en: "Must not include documents, full scores or binding decisions." },
  },
  {
    id: "whatsapp",
    label: { es: "WhatsApp", en: "WhatsApp" },
    purpose: { es: "Recordatorio breve para vencimientos o acciones urgentes.", en: "Brief reminder for expirations or urgent actions." },
    guardrail: { es: "Solo opt-in y mensajes mínimos; sin evidencia sensible.", en: "Opt-in only and minimal messages; no sensitive evidence." },
  },
];

function localizeDefinition(definition, language) {
  return {
    ...definition,
    trigger: pickLang(definition.trigger, language),
    subject: pickLang(definition.subject, language),
    action: pickLang(definition.action, language),
  };
}

export function getNuxeraNotificationCatalog(language = "es") {
  const events = EVENT_DEFINITIONS.map((event) => localizeDefinition(event, language));
  const byAudience = events.reduce((acc, event) => {
    acc[event.audience] = (acc[event.audience] || 0) + 1;
    return acc;
  }, {});

  return {
    status: "design-ready-no-delivery-enabled",
    events,
    channels: CHANNEL_POLICIES.map((channel) => ({
      ...channel,
      label: pickLang(channel.label, language),
      purpose: pickLang(channel.purpose, language),
      guardrail: pickLang(channel.guardrail, language),
    })),
    summary: {
      totalEvents: events.length,
      applicant: byAudience.applicant || 0,
      grantor: byAudience.grantor || 0,
      admin: byAudience.admin || 0,
      automatedDeliveryEnabled: false,
      humanReviewRequired: true,
    },
    guardrails: [
      { es: "El agente puede redactar o resumir, pero no enviar ni comprometer decisiones automaticamente.", en: "The agent may draft or summarize, but cannot send or commit decisions automatically." },
      { es: "Todo envio real debe pasar por outbox, estado de entrega y audit_logs.", en: "Every real delivery must go through outbox, delivery state and audit_logs." },
      { es: "Los correos deben contener enlaces al expediente, no evidencia sensible ni adjuntos.", en: "Emails must contain file links, not sensitive evidence or attachments." },
    ].map((guardrail) => pickLang(guardrail, language)),
  };
}

export function buildNuxeraNotificationEvent(eventId, context = {}, language = "es") {
  const definition = EVENT_DEFINITIONS.find((event) => event.id === eventId);
  if (!definition) {
    return {
      allowed: false,
      status: "unknown-event",
      eventId,
      reason: pickLang({ es: "Evento de notificacion no registrado.", en: "Notification event is not registered." }, language),
    };
  }

  const event = localizeDefinition(definition, language);
  const recipientRole = context.recipientRole || event.audience;
  const hasRecipient = Boolean(context.recipientUserId || context.recipientEmail);
  const hasExpedient = Boolean(context.orderId || context.expedientId);
  const audienceAligned = recipientRole === event.audience || event.audience === "admin";
  const allowed = hasRecipient && audienceAligned && (event.audience === "admin" || hasExpedient);

  return {
    allowed,
    status: allowed ? "queued-preview" : "blocked-missing-context",
    eventId: event.id,
    audience: event.audience,
    recipientRole,
    priority: event.priority,
    channels: event.channels,
    subject: event.subject,
    bodyPreview: [
      event.trigger,
      event.action,
      context.orderLabel || context.orderId || context.expedientId || "",
    ].filter(Boolean).join(" / "),
    agentMode: event.agentMode,
    delivery: {
      enabled: false,
      requiresOutbox: true,
      requiresAuditLog: true,
      dedupeKey: `${event.id}:${context.orderId || context.expedientId || "no-expedient"}:${context.recipientUserId || context.recipientEmail || "no-recipient"}`,
    },
    blockers: [
      !hasRecipient ? pickLang({ es: "Falta destinatario.", en: "Recipient is missing." }, language) : null,
      !audienceAligned ? pickLang({ es: "El rol destinatario no coincide con la audiencia del evento.", en: "Recipient role does not match event audience." }, language) : null,
      event.audience !== "admin" && !hasExpedient ? pickLang({ es: "Falta expediente autorizado.", en: "Authorized file is missing." }, language) : null,
    ].filter(Boolean),
  };
}

export function buildNuxeraAssignmentNotificationIntents(assignments = [], context = {}) {
  const adminRecipientUserId = context.adminRecipientUserId || "admin-operations";

  return (Array.isArray(assignments) ? assignments : []).flatMap((assignment) => {
    const orderId = assignment.orderId;
    const orderLabel = context.caseLabels?.get?.(orderId)?.label || assignment.caseLabel || orderId;
    const reviewerRecipient = assignment.assignedReviewerId
      ? { recipientUserId: assignment.assignedReviewerId, recipientRole: "grantor" }
      : null;
    const baseMetadata = {
      assignmentId: assignment.id,
      slaTier: assignment.slaTier,
      slaStatus: assignment.slaStatus,
      source: "nuxera_case_assignments",
    };
    const intents = [];

    if (assignment.status === "open" && reviewerRecipient) {
      intents.push({
        eventId: NUXERA_COMMUNICATION_EVENT_IDS.GRANTOR_CASE_ASSIGNED,
        orderId,
        ...reviewerRecipient,
        subject: "Expediente NUXERA asignado",
        bodyPreview: `${orderLabel || orderId} / ${assignment.slaTier || "SLA"} / ${assignment.reason || "Seguimiento requerido"}`,
        channels: ["in_app", "email"],
        priority: "high",
        metadata: baseMetadata,
      });
    }

    if (assignment.slaStatus === "due-soon" && reviewerRecipient) {
      intents.push({
        eventId: NUXERA_COMMUNICATION_EVENT_IDS.GRANTOR_SLA_DUE_SOON,
        orderId,
        ...reviewerRecipient,
        subject: "SLA NUXERA por vencer",
        bodyPreview: `${orderLabel || orderId} vence ${assignment.slaDueAt || "pronto"}`,
        channels: ["in_app", "email"],
        priority: "high",
        metadata: baseMetadata,
      });
    }

    if (assignment.slaStatus === "overdue") {
      intents.push({
        eventId: NUXERA_COMMUNICATION_EVENT_IDS.ADMIN_CASE_SLA_OVERDUE,
        orderId,
        recipientUserId: adminRecipientUserId,
        recipientRole: "admin",
        subject: "SLA NUXERA vencido",
        bodyPreview: `${orderLabel || orderId} / ${assignment.assignedReviewerRole || "sin responsable"}`,
        channels: ["in_app"],
        priority: "critical",
        metadata: baseMetadata,
      });
    }

    return intents;
  });
}
export function buildNuxeraConversationEnvelope(context = {}, language = "es") {
  const role = context.role || "applicant";
  const selectedId = context.selectedId || context.orderId || null;
  const hasSelectedExpedient = Boolean(selectedId);
  const hasAuthorizedContext = Boolean(context.allowed || (!context.isDemo && hasSelectedExpedient && context.source));
  const canUseAgent = hasAuthorizedContext && role !== "admin";
  const channel = role === "grantor" ? "decision-desk" : role === "applicant" ? "my-file" : "operations-console";

  return {
    allowed: canUseAgent,
    status: canUseAgent ? "agent-readable-context-ready" : "blocked-no-authorized-context",
    role,
    channel,
    selectedId,
    assistantScope: role === "grantor"
      ? pickLang({ es: "Responder sobre evidencia autorizada y preparar preguntas para mesa.", en: "Answer on authorized evidence and prepare desk questions." }, language)
      : role === "applicant"
        ? pickLang({ es: "Guiar faltantes, requerimientos y preparacion del expediente.", en: "Guide gaps, requests and file preparation." }, language)
        : pickLang({ es: "Monitorear agentes, plantillas y entregas; sin lectura de expedientes.", en: "Monitor agents, templates and deliveries; no file reading." }, language),
    sources: canUseAgent
      ? ["service_orders", "documents", "document_extractions", "document_reviews", "information_requests", "messages", "nuxera_evidence_links"]
      : [],
    blockedSources: canUseAgent ? [] : ["documents", "document_extractions", "messages"],
    guardrails: [
      pickLang({ es: "El agente responde solo con fuentes autorizadas por rol y expediente seleccionado.", en: "The agent only answers from role-authorized sources for the selected file." }, language),
      pickLang({ es: "Si falta evidencia o permiso, debe decirlo y pedir accion humana.", en: "If evidence or permission is missing, it must say so and request human action." }, language),
      pickLang({ es: "No envia mensajes, correos, term sheets ni decisiones vinculantes.", en: "It does not send messages, emails, term sheets or binding decisions." }, language),
    ],
  };
}
