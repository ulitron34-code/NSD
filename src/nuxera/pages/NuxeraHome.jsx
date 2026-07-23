import React, { useMemo, useState } from "react";
import { isNuxeraExperienceEnabled } from "../../experience/experienceFlags";
import { useMyOrders } from "../../hooks/useMyOrders";
import { useMyGrantorPipeline } from "../../hooks/useMyGrantorPipeline";
import { NavLink } from "react-router-dom";
import { useNuxeraLanguage } from "../hooks/useNuxeraLanguage";
import { mergeAdminControlsWithConsole, useAdminControls } from "../admin/adminControlsAdapter";
import { mergeAiProviderPolicyWithConsole, useAiProviderPolicy } from "../admin/aiProviderPolicyAdapter";
import { mergeBackendReadinessWithConsole, useBackendReadiness, useControlledApprovalPackage, useControlledChangeRequest, useControlledContinuationPack, useControlledEvidenceReview, useControlledEvidenceScaffold, useControlledReleaseDossier, useControlledRunbook, useControlledVerificationPlan, useControlledWriteGate } from "../admin/backendReadinessAdapter";
import { getAdminOperationsConsole } from "../admin/operationsConsole";
import { useAdminOperationalSnapshot } from "../admin/operationalSnapshotAdapter";
import { mergeGrantorCasesWithConsole, previewNuxeraCaseAssignment, useAdminGrantorCases, useCaseAssignmentHistory } from "../admin/grantorCasesAdapter";
import { getApplicantDocumentCenter } from "../applicant/documentCenter";
import { getApplicantDataRoomChecklist, getApplicantGuidedMission, getApplicantMissionReadiness, getApplicantOnboardingWizard } from "../applicant/guidedMission";
import { getApplicantCompanyProjectWorkspace } from "../applicant/projectWorkspace";
import { mergeApplicantChecklistWithWorkspaceState, useApplicantWorkspaceState } from "../applicant/workspaceStateAdapter";
import { useAuthorizedGrantorEvidenceLedger, useOwnerEvidenceLedger } from "../evidence/evidenceBackendAdapter";
import { buildGrantorCaseQueueFromPipeline, filterGrantorInboxCases, getGrantorCaseQueue, getGrantorCaseWorkbench, getGrantorDecisionMemo, getGrantorDocumentSummary, getGrantorInboxFilters, getGrantorQueueSummary, resolveSelectedGrantorCase } from "../grantor/caseQueue";
import { buildNuxeraAssignmentNotificationIntents, getNuxeraNotificationCatalog } from "../communications/notificationOperatingModel";
import { mergeNotificationCatalogWithOutboxReadiness, useNotificationDryRun, useNotificationOutboxList, useNotificationOutboxReadiness } from "../communications/notificationBackendAdapter";
import { mergeCommunicationModelWithConversationAgent, useConversationAgentReadiness, useConversationPreview } from "../communications/conversationAgentBackendAdapter";
import ConversationChat from "../communications/ConversationChat";

const roleCopy = {
  applicant: {
    eyebrow: { es: "Solicitante", en: "Applicant" },
    title: { es: "Continua tu expediente con claridad", en: "Continue your file with clarity" },
    body: { es: "NUXERA priorizara la siguiente accion, documentos faltantes y progreso real sin exponer complejidad tecnica antes de tiempo.", en: "NUXERA will prioritize the next action, missing documents and real progress without exposing technical complexity too early." },
    cards: [
      { es: "Continuar expediente", en: "Continue file" },
      { es: "Mejorar mi proyecto", en: "Improve my project" },
      { es: "Investigar mi empresa", en: "Research my company" },
      { es: "Dar seguimiento", en: "Follow up" },
    ],
  },
  grantor: {
    eyebrow: { es: "Otorgante", en: "Grantor" },
    title: { es: "Mesa de decision orientada a evidencia", en: "Evidence-driven decision desk" },
    body: { es: "La nueva experiencia separa la bandeja de expedientes del analisis de decision: primero prioriza evidencia y riesgo; despues prepara revision humana.", en: "The new experience separates the file inbox from decision analysis: first it prioritizes evidence and risk; then it prepares human review." },
    cards: [
      { es: "Casos prioritarios", en: "Priority cases" },
      { es: "Pendientes de informacion", en: "Pending information" },
      { es: "Listos para dictamen", en: "Ready for decision" },
      { es: "Alertas de riesgo", en: "Risk alerts" },
    ],
  },
  admin: {
    eyebrow: { es: "Administrador", en: "Administrator" },
    title: { es: "Consola NUXERA separada por responsabilidades", en: "NUXERA console separated by responsibility" },
    body: { es: "Operaciones, configuracion, seguridad, IA, integraciones y salud del sistema se separaran sin perder capacidades heredadas.", en: "Operations, configuration, security, AI, integrations and system health are separated without losing legacy capabilities." },
    cards: [
      { es: "Operacion", en: "Operations" },
      { es: "Configuracion", en: "Configuration" },
      { es: "Seguridad", en: "Security" },
      { es: "IA y agentes", en: "AI & agents" },
    ],
  },
};

function ApplicantMissionHome({ sectionLabel, variant = "home" }) {
  const { L, language } = useNuxeraLanguage();
  const mission = getApplicantGuidedMission("applicant", language);
  const readiness = getApplicantMissionReadiness("applicant", language);
  const onboardingWizard = getApplicantOnboardingWizard(language);
  const { orders, selectedOrder, orderId, selectOrder, isDemo, loading: ordersLoading } = useMyOrders();
  const projectWorkspace = getApplicantCompanyProjectWorkspace(selectedOrder, language);
  const documentCenter = getApplicantDocumentCenter(selectedOrder, language);
  const displayedProgress = !isDemo && orderId ? projectWorkspace.summary.readiness : readiness.progress;
  const workspaceState = useApplicantWorkspaceState(orderId, {
    enabled: isNuxeraExperienceEnabled() && !isDemo && Boolean(orderId),
  });
  const checklist = mergeApplicantChecklistWithWorkspaceState(
    getApplicantDataRoomChecklist(language),
    workspaceState
  );
  const evidenceLedger = useOwnerEvidenceLedger(orderId, {
    enabled: isNuxeraExperienceEnabled() && !isDemo && Boolean(orderId),
    role: "applicant",
    language,
  });
  const stateDetail = ordersLoading
    ? L("Buscando expediente real para lectura NUXERA.", "Looking up a real file for NUXERA to read.")
    : !orderId || isDemo
      ? L("Fallback local; sin expediente real conectado.", "Local fallback; no real file connected.")
      : workspaceState.persisted
        ? L(`Version ${workspaceState.version} leida desde NUXERA state.`, `Version ${workspaceState.version} read from NUXERA state.`)
        : L("Endpoint NUXERA disponible; usando checklist local como fallback.", "NUXERA endpoint available; using the local checklist as a fallback.");

  return (
    <section className="nuxera-home" aria-labelledby="nuxera-home-title">
      <p className="nuxera-eyebrow">NUXERA Financial Intelligence / {L("Solicitante", "Applicant")}</p>
      <div className="nuxera-hero-row">
        <div>
          <h1 id="nuxera-home-title">{mission.title}</h1>
          <p>{mission.summary}</p>
          {!isDemo && selectedOrder && <small>{L("Expediente real", "Real file")}: {selectedOrder.project_name || selectedOrder.projectName || selectedOrder.id}</small>}
        </div>
        <div className="nuxera-status-panel">
          <span>{readiness.status}</span>
          <strong>{displayedProgress}% {L("listo", "ready")}</strong>
          <small>{sectionLabel}</small>
        </div>
      </div>

      {!isDemo && orders.length > 1 && (
        <section aria-label={L("Selector de expediente del solicitante", "Applicant file selector")}>
          <h2>{L("Seleccionar expediente", "Select file")}</h2>
          {orders.map((order) => (
            <button key={order.id} type="button" onClick={() => selectOrder(order.id)} aria-pressed={order.id === orderId}>
              {order.project_name || order.projectName || order.case_number || order.id}
            </button>
          ))}
        </section>
      )}

      {variant === "home" && (
        <section className="nuxera-mission-next" aria-label={L("Siguiente accion del solicitante", "Applicant's next action")}>
          <div>
            <span>{L("Resultado esperado", "Expected outcome")}</span>
            <strong>{mission.outcome}</strong>
          </div>
          <p>{readiness.nextAction}</p>
        </section>
      )}

      {variant === "followup" && (
        <section className="nuxera-mission-next" aria-label={L("Resumen de avance del solicitante", "Applicant progress summary")}>
          <div>
            <span>{L("Lo que ya completaste", "What you've completed so far")}</span>
            <strong>{documentCenter.summary.ready}/{documentCenter.summary.documents} {L("documentos listos", "documents ready")}</strong>
          </div>
          <p>{checklist.summary.status}</p>
        </section>
      )}

      {variant === "home" && (
        <>
          <section className="nuxera-onboarding-wizard" aria-label={L("Onboarding guiado del solicitante", "Guided applicant onboarding")}>
            <header>
              <div>
                <span>{onboardingWizard.status}</span>
                <h2>{L("Onboarding del expediente", "File onboarding")}</h2>
              </div>
              <strong>{onboardingWizard.summary.progress}% {L("evidencia lista", "evidence ready")}</strong>
            </header>
            <div>
              {onboardingWizard.stages.map((stage) => (
                <article key={stage.id}>
                  <span>{L("Paso", "Step")} {stage.order} / {stage.status}</span>
                  <strong>{stage.label}</strong>
                  <p>{stage.objective}</p>
                  <small>{stage.readyEvidence}/{stage.evidence.length} {L("evidencias listas; siguiente", "evidence ready; next")}: {stage.nextEvidence}</small>
                  <NavLink to={stage.sectionPath}>{stage.owner}</NavLink>
                </article>
              ))}
            </div>
            <footer>{onboardingWizard.guardrails[0]} {L("Siguiente etapa", "Next stage")}: {onboardingWizard.nextStage.label}.</footer>
          </section>
          <div className="nuxera-mission-grid">
            {mission.steps.map((step) => (
              <article className="nuxera-mission-step" key={step.id}>
                <span>{step.status}</span>
                <strong>{step.label}</strong>
                <p>{step.prompt}</p>
                <small>{step.owner}</small>
                <NavLink to={step.evidencePath}>{step.engine}</NavLink>
              </article>
            ))}
          </div>

          <section className="nuxera-project-workspace" aria-label={L("Datos de empresa y proyecto del solicitante", "Applicant company and project data")}>
            <header>
              <div>
                <span>{projectWorkspace.source}</span>
                <h2>{L("Empresa y proyecto", "Company & project")}</h2>
                <p>{projectWorkspace.profile.companyName} / {projectWorkspace.profile.projectName}</p>
              </div>
              <strong>{projectWorkspace.summary.readiness}% readiness</strong>
            </header>
            <div className="nuxera-project-profile">
              <article><span>{L("Monto", "Amount")}</span><strong>{projectWorkspace.profile.requestedAmount}</strong></article>
              <article><span>{L("Sector", "Sector")}</span><strong>{projectWorkspace.profile.sector}</strong></article>
              <article><span>{L("Pais", "Country")}</span><strong>{projectWorkspace.profile.country}</strong></article>
              <article><span>{L("Etapa", "Stage")}</span><strong>{projectWorkspace.profile.stage}</strong></article>
            </div>
            <div className="nuxera-project-sections">
              {projectWorkspace.sections.map((section) => (
                <article key={section.id}>
                  <span>{section.status}</span>
                  <strong>{section.label}</strong>
                  <p>{section.readyEvidence}/{section.evidence.length} {L("evidencias listas; siguiente", "evidence ready; next")}: {section.nextEvidence}</p>
                  <small>{section.owner}</small>
                  <NavLink to={section.path}>{L("Abrir modulo", "Open module")}</NavLink>
                </article>
              ))}
            </div>
            <footer>{projectWorkspace.nextAction} {projectWorkspace.guardrails[0]}</footer>
          </section>
        </>
      )}

      {variant === "followup" && (
        <>
          <section className="nuxera-document-center" aria-label={L("Centro documental contextual del solicitante", "Applicant contextual document center")}>
            <header>
              <div>
                <span>{documentCenter.status}</span>
                <h2>{L("Documentos procesados", "Processed documents")}</h2>
                <p>{documentCenter.profile.companyName} / {documentCenter.profile.projectName}</p>
              </div>
              <strong>{documentCenter.summary.ready}/{documentCenter.summary.documents} {L("listos", "ready")}</strong>
            </header>
            <div className="nuxera-document-folders">
              {documentCenter.folders.map((folder) => (
                <article key={folder.id}>
                  <span>{folder.status}</span>
                  <strong>{folder.label}</strong>
                  <p>{folder.summary.ready}/{folder.summary.total} {L("listos", "ready")}; {folder.summary.missing + folder.summary.needsAttention} {L("pendientes", "pending")}</p>
                  <small>{folder.scope}</small>
                  <NavLink to={folder.path}>{L("Abrir contexto", "Open context")}</NavLink>
                </article>
              ))}
            </div>
            <div className="nuxera-document-rows">
              {documentCenter.activeFolder.rows.slice(0, 5).map((document) => (
                <article key={document.id}>
                  <span>{document.status} / {document.source}</span>
                  <strong>{document.label}</strong>
                  <p>{document.detail}</p>
                  <small>{document.owner} / {document.version} / {document.risk}</small>
                </article>
              ))}
            </div>
            <footer>{documentCenter.nextAction} {documentCenter.guardrails[0]}</footer>
          </section>
          <section className="nuxera-applicant-checklist" aria-label={L("Checklist documental del solicitante", "Applicant document checklist")}>
            <header>
              <div>
                <span>{L("Data room readiness", "Data room readiness")}</span>
                <h2>{L("Avance del checklist", "Checklist progress")}</h2>
                <p className="nuxera-state-caption">{workspaceState.label}: {stateDetail}</p>
              </div>
              <strong>{workspaceState.loading ? "loading" : checklist.summary.status}</strong>
            </header>
            <div className="nuxera-checklist-summary">
              <article><span>{L("Listos", "Ready")}</span><strong>{checklist.summary.ready}</strong></article>
              <article><span>{L("En revision", "In review")}</span><strong>{checklist.summary.inReview}</strong></article>
              <article><span>{L("Faltantes", "Missing")}</span><strong>{checklist.summary.missing}</strong></article>
              <article><span>{L("Criticos", "Critical")}</span><strong>{checklist.summary.criticalMissing}</strong></article>
            </div>
            <div className="nuxera-data-room-folders">
              {checklist.folders.map((folder) => (
                <article key={folder.id}>
                  <span>{folder.status}</span>
                  <strong>{folder.label}</strong>
                  <p>{folder.visibility}</p>
                  <small>{folder.items.filter((item) => item.status === "ready").length}/{folder.items.length} {L("documentos listos", "documents ready")}</small>
                </article>
              ))}
            </div>
            <small>{checklist.guardrail} {workspaceState.persisted ? L(`Estado persistido: ${workspaceState.status}.`, `Persisted state: ${workspaceState.status}.`) : L("Sin writes desde UI.", "No writes from the UI.")}</small>
          </section>
        </>
      )}

      <div className="nuxera-mission-panels">
        {variant === "home" && (
          <section>
            <h2>{L("Evidencia conectada", "Connected evidence")}</h2>
            {mission.evidenceLinks.map((link) => (
              <NavLink className="nuxera-evidence-link" key={link.id} to={link.path}>
                <span>{link.engine}</span>
                <strong>{link.label}</strong>
                <p>{link.signal}</p>
              </NavLink>
            ))}
          </section>
        )}
        <section className="nuxera-evidence-ledger">
          <h2>{variant === "followup" ? L("Historial de evidencia", "Evidence history") : L("Ledger read-only", "Read-only ledger")}</h2>
          <p>{evidenceLedger.summary.total} {L("evidencias normalizadas", "normalized evidence items")} / {evidenceLedger.status}</p>
          {evidenceLedger.backendEvidence?.loading && <small>{L("Cargando evidence_links NUXERA...", "Loading NUXERA evidence_links...")}</small>}
          {evidenceLedger.backendEvidence?.source?.startsWith("remote") && (
            <small>{evidenceLedger.backendEvidence.label}</small>
          )}
          {evidenceLedger.items.slice(0, variant === "followup" ? 8 : 4).map((item) => (
            <article key={item.id}>
              <span>{item.engine} / {item.status}</span>
              <strong>{item.label}</strong>
              <p>{item.provenance}</p>
            </article>
          ))}
          <small>{evidenceLedger.policies[1]}</small>
        </section>
        <section>
          <h2>Guardrails</h2>
          {mission.guardrails.map((guardrail) => <p key={guardrail}>{guardrail}</p>)}
        </section>
        <ConversationChat role="applicant" orderId={isDemo ? null : orderId} isDemo={isDemo} language={language} />
      </div>
    </section>
  );
}

function GrantorQueueHome({ sectionLabel, variant = "decision" }) {
  const { L, language } = useNuxeraLanguage();
  const [inboxFilter, setInboxFilter] = useState("all");
  const { pipeline, authorizedOrder, orderId, selectOrder, isDemo, loading } = useMyGrantorPipeline();
  const queue = isDemo ? getGrantorCaseQueue(language) : buildGrantorCaseQueueFromPipeline(pipeline, language);
  const summary = getGrantorQueueSummary(queue);
  const isInboxView = variant === "inbox";
  const selectedCase = resolveSelectedGrantorCase(queue, orderId);
  const workbench = selectedCase ? getGrantorCaseWorkbench(selectedCase.id, queue, language) : null;
  const memo = selectedCase ? getGrantorDecisionMemo(selectedCase.id, queue, language) : null;
  const grantorDocumentSummary = selectedCase ? getGrantorDocumentSummary(selectedCase.id, queue, language) : null;
  const grantorEvidenceLedger = useAuthorizedGrantorEvidenceLedger(orderId, {
    enabled: isNuxeraExperienceEnabled() && !isDemo && !isInboxView && Boolean(orderId),
    role: "grantor",
    language,
  });
  const inboxFilters = getGrantorInboxFilters(queue, language);
  const filteredCases = filterGrantorInboxCases(queue.cases, inboxFilter);

  const heroTitle = isInboxView
    ? queue.queueMode.label
    : queue.decisionDeskMode.label;
  const heroBody = isInboxView
    ? queue.queueMode.purpose
    : queue.decisionDeskMode.purpose;

  return (
    <section className="nuxera-home" aria-labelledby="nuxera-home-title">
      <p className="nuxera-eyebrow">NUXERA Financial Intelligence / {L("Otorgante", "Grantor")}</p>
      <div className="nuxera-hero-row">
        <div>
          <h1 id="nuxera-home-title">{heroTitle}</h1>
          <p>{heroBody}</p>
        </div>
        <div className="nuxera-status-panel">
          <span>{summary.status}</span>
          <strong>{summary.total} {L("casos", "cases")}</strong>
          <small>{sectionLabel}</small>
        </div>
      </div>

      <div className="nuxera-grantor-summary">
        <article><span>{L("Comite", "Committee")}</span><strong>{summary.committeeReady}</strong></article>
        <article><span>{L("Faltantes", "Missing")}</span><strong>{summary.needsInformation}</strong></article>
        <article><span>{L("Riesgo alto", "High risk")}</span><strong>{summary.observed}</strong></article>
        <article><span>{L("Revision humana", "Human review")}</span><strong>{summary.requiresHumanReview ? L("Si", "Yes") : L("No", "No")}</strong></article>
      </div>

      {isInboxView ? (
        <section className="nuxera-grantor-inbox" aria-label={L("Triage de expedientes otorgante", "Grantor file triage")}>
          <header className="nuxera-grantor-inbox-toolbar">
            <div>
              <span>{isDemo ? L("Modelo local de preparacion", "Local preparation model") : L("Pipeline autorizado", "Authorized pipeline")}</span>
              <h2>{L("Priorizacion accionable", "Actionable prioritization")}</h2>
            </div>
            <div role="tablist" aria-label={L("Filtros de bandeja", "Inbox filters")}>
              {inboxFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  role="tab"
                  aria-selected={inboxFilter === filter.id}
                  onClick={() => setInboxFilter(filter.id)}
                  title={filter.description}
                >
                  <span>{filter.label}</span>
                  <strong>{filter.count}</strong>
                </button>
              ))}
            </div>
          </header>
          {loading && <p>{L("Cargando pipeline autorizado...", "Loading authorized pipeline...")}</p>}
          {!loading && !isDemo && queue.cases.length === 0 && <p>{L("No hay expedientes autorizados disponibles.", "No authorized files are available.")}</p>}
          {!loading && queue.cases.length > 0 && filteredCases.length === 0 && <p>{L("No hay expedientes en este filtro.", "There are no files in this filter.")}</p>}
          <div className="nuxera-grantor-queue">
            {filteredCases.map((item) => (
              <article key={item.id} className={item.id === selectedCase?.id ? "is-selected" : undefined}>
                <header>
                  <div>
                    <span>{item.priority}</span>
                    <strong>{item.name}</strong>
                  </div>
                  <em>{item.risk}</em>
                </header>
                <p>{item.applicant} / {item.sector} / {item.amountLabel}</p>
                <div>
                  {item.decisionSignals.map((signal) => <small key={signal}>{signal}</small>)}
                </div>
                <p>{item.nextAction}</p>
                <footer>
                  {!isDemo && <button type="button" onClick={() => selectOrder(item.id)} aria-pressed={item.id === selectedCase?.id}>{item.id === selectedCase?.id ? L("Seleccionado", "Selected") : L("Priorizar", "Prioritize")}</button>}
                  <NavLink to="/dashboard">{L("Abrir mesa", "Open desk")}</NavLink>
                  {item.evidenceLinks.map((link) => (
                    <NavLink key={link.engine} to={link.path}>{link.engine}</NavLink>
                  ))}
                </footer>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <>
          <section className="nuxera-grantor-decision-focus" aria-label={L("Expediente activo para mesa de decision", "Active file for decision desk")}>
            <header>
              <div>
                <span>{selectedCase ? selectedCase.priority : L("Sin expediente", "No file")}</span>
                <h2>{selectedCase ? selectedCase.name : L("Selecciona un expediente desde la bandeja", "Select a file from the inbox")}</h2>
              </div>
              <NavLink to="/dashboard/nuxera/queue">{L("Cambiar expediente", "Change file")}</NavLink>
            </header>
            {selectedCase && <div className="nuxera-decision-focus-grid">
              <article><span>{L("Solicitante", "Applicant")}</span><strong>{selectedCase.applicant}</strong></article>
              <article><span>{L("Ticket", "Ticket")}</span><strong>{selectedCase.amountLabel}</strong></article>
              <article><span>{L("Readiness", "Readiness")}</span><strong>{selectedCase.readinessLevel}</strong></article>
              <article><span>{L("Riesgo", "Risk")}</span><strong>{selectedCase.risk}</strong></article>
            </div>}
          </section>

          {workbench && <section className="nuxera-grantor-workbench" aria-label={L("Workbench del caso prioritario", "Priority case workbench")}>
            <header>
              <div>
                <span>{workbench.status}</span>
                <h2>{workbench.case.name}</h2>
              </div>
              <strong>{workbench.case.readinessLevel}</strong>
            </header>
            <div className="nuxera-workbench-grid">
              <section>
                <h3>{L("Preguntas de revision", "Review questions")}</h3>
                {workbench.questions.map((question) => (
                  <article key={question.id}>
                    <span>{question.owner}</span>
                    <strong>{question.label}</strong>
                    <p>{question.prompt}</p>
                  </article>
                ))}
              </section>
              <section>
                <h3>{L("Evidencia requerida", "Required evidence")}</h3>
                {workbench.requiredEvidence.map((item) => (
                  <article key={item.id}>
                    <span>{item.status}</span>
                    <p>{item.label}</p>
                  </article>
                ))}
              </section>
              <section>
                <h3>{L("Condiciones no vinculantes", "Non-binding conditions")}</h3>
                {workbench.conditions.map((condition) => (
                  <article key={condition}>
                    <span>{L("Condicion", "Condition")}</span>
                    <p>{condition}</p>
                  </article>
                ))}
              </section>
            </div>
            <div className="nuxera-workbench-audit">
              {workbench.auditTrail.map((entry) => <p key={entry}>{entry}</p>)}
            </div>
          </section>}

          {grantorDocumentSummary && <section className="nuxera-grantor-document-summary" aria-label={L("Resumen documental autorizado para otorgante", "Authorized document summary for the grantor")}>
            <header>
              <div>
                <span>{grantorDocumentSummary.status}</span>
                <h2>{L("Resumen documental autorizado", "Authorized document summary")}</h2>
              </div>
              <strong>{grantorDocumentSummary.summary.visible}/{grantorDocumentSummary.summary.total} {L("visibles", "visible")}</strong>
            </header>
            <div>
              {grantorDocumentSummary.folders.map((folder) => (
                <article key={folder.id}>
                  <span>{folder.status}</span>
                  <strong>{folder.label}</strong>
                  <p>{folder.evidence.length || 0} {L("senales documentales resumidas.", "document signals summarized.")}</p>
                </article>
              ))}
            </div>
            <footer>{grantorDocumentSummary.nextAction} {grantorDocumentSummary.guardrails[0]}</footer>
          </section>}
          <section className="nuxera-grantor-evidence-ledger" aria-label={L("Ledger read-only de evidencia otorgante", "Read-only grantor evidence ledger")}>
            <header>
              <div>
                <span>{grantorEvidenceLedger.status}</span>
                <h2>{isDemo ? L("Evidencia demo resumida", "Summarized demo evidence") : L("Evidencia real del expediente autorizado", "Real evidence for the authorized file")}</h2>
              </div>
              <strong>{grantorEvidenceLedger.summary.total} {L("senales", "signals")}</strong>
            </header>
            {orderId && <small>{L("Expediente", "File")}: {authorizedOrder?.name || authorizedOrder?.project_name || orderId} ({orderId})</small>}
            {!orderId && !isDemo && <small>{L("No hay un expediente real autorizado seleccionado.", "No authorized real file is selected.")}</small>}
            {grantorEvidenceLedger.backendEvidence?.loading && <small>{L("Cargando evidence_links NUXERA autorizados...", "Loading authorized NUXERA evidence_links...")}</small>}
            {grantorEvidenceLedger.backendEvidence?.source?.startsWith("remote") && (
              <small>{grantorEvidenceLedger.backendEvidence.label}</small>
            )}
            <div>
              {grantorEvidenceLedger.items.slice(0, 6).map((item) => (
                <article key={item.id}>
                  <span>{item.engine} / {item.visibility}</span>
                  <strong>{item.label}</strong>
                  <p>{item.detail}</p>
                  <small>{item.guardrail}</small>
                </article>
              ))}
            </div>
            <footer>{grantorEvidenceLedger.policies[0]}</footer>
          </section>
          {memo && <section className="nuxera-grantor-memo" aria-label={L("Memo local no vinculante del otorgante", "Local, non-binding grantor memo")}>
            <header>
              <div>
                <span>{memo.status}</span>
                <h2>{memo.title}</h2>
              </div>
              <strong>{memo.evidenceSnapshot.visible}/{memo.evidenceSnapshot.documents.length} {L("evidencias", "evidence items")}</strong>
            </header>
            <div className="nuxera-memo-grid">
              <section>
                <h3>{L("Tesis preliminar", "Preliminary thesis")}</h3>
                {memo.thesis.map((item) => <p key={item}>{item}</p>)}
              </section>
              <section>
                <h3>{L("Riesgos y recomendacion", "Risks & recommendation")}</h3>
                <strong>{memo.recommendation}</strong>
                {memo.riskNotes.map((note) => <p key={note}>{note}</p>)}
              </section>
              <section>
                <h3>{L("Siguientes acciones", "Next actions")}</h3>
                {memo.nextActions.map((item) => (
                  <article key={item.id}>
                    <span>{item.owner}</span>
                    <p>{item.action}</p>
                  </article>
                ))}
              </section>
            </div>
            <div className="nuxera-memo-guardrails">
              {memo.guardrails.map((guardrail) => <p key={guardrail}>{guardrail}</p>)}
            </div>
          </section>}
        </>
      )}

      <section className="nuxera-grantor-policies" aria-label={L("Politicas de revision otorgante", "Grantor review policies")}>
        <h2>{isInboxView ? L("Politicas de bandeja", "Inbox policies") : L("Politicas de mesa", "Desk policies")}</h2>
        {queue.policies.map((policy) => <p key={policy}>{policy}</p>)}
      </section>
      <ConversationChat role="grantor" orderId={isDemo ? null : orderId} isDemo={isDemo} language={language} />
    </section>
  );
}

const CASE_ASSIGNMENT_SLA_OPTIONS = [
  { value: "needs-information-24h", label: "Info faltante 24h" },
  { value: "needs-information-48h", label: "Info faltante 48h" },
  { value: "decision-review-72h", label: "Revision dictamen 72h" },
  { value: "risk-escalation-24h", label: "Escalamiento riesgo 24h" },
];

const CASE_ASSIGNMENT_REVIEWER_ROLES = [
  { value: "grantor_analyst", label: "Analista otorgante" },
  { value: "grantor_senior", label: "Otorgante senior" },
  { value: "compliance_reviewer", label: "Compliance" },
  { value: "risk_committee", label: "Comite de riesgo" },
];

function getDefaultAssignmentDueAt() {
  const dueAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  dueAt.setMinutes(dueAt.getMinutes() - dueAt.getTimezoneOffset());
  return dueAt.toISOString().slice(0, 16);
}

const CASE_ASSIGNMENT_SLA_STATUS_LABELS = {
  overdue: { es: "Vencido", en: "Overdue" },
  "due-soon": { es: "Por vencer", en: "Due soon" },
  "on-track": { es: "En tiempo", en: "On track" },
  closed: { es: "Cerrado", en: "Closed" },
  "sla-unset": { es: "Sin SLA", en: "No SLA" },
  "sla-invalid": { es: "SLA invalido", en: "Invalid SLA" },
};

function getAssignmentSlaStatusLabel(status, L) {
  const copy = CASE_ASSIGNMENT_SLA_STATUS_LABELS[status] || { es: status || "Sin estado", en: status || "No status" };
  return L(copy.es, copy.en);
}
function toAssignmentDueAtIso(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
}
function AdminOperationsHome({ sectionLabel }) {
  const { L, language } = useNuxeraLanguage();
  const operationalSnapshot = useAdminOperationalSnapshot({ enabled: isNuxeraExperienceEnabled(), language });
  const adminControls = useAdminControls({ enabled: isNuxeraExperienceEnabled(), language });
  const backendReadiness = useBackendReadiness({ enabled: isNuxeraExperienceEnabled(), language });
  const controlledVerificationPlan = useControlledVerificationPlan({ enabled: isNuxeraExperienceEnabled(), language });
  const controlledContinuationPack = useControlledContinuationPack({ enabled: isNuxeraExperienceEnabled(), language });
  const controlledEvidenceScaffold = useControlledEvidenceScaffold({ enabled: isNuxeraExperienceEnabled(), language });
  const controlledRunbook = useControlledRunbook({ enabled: isNuxeraExperienceEnabled(), language });
  const controlledEvidenceReview = useControlledEvidenceReview({ enabled: isNuxeraExperienceEnabled(), language });
  const controlledApprovalPackage = useControlledApprovalPackage({ enabled: isNuxeraExperienceEnabled(), language });
  const controlledWriteGate = useControlledWriteGate({ enabled: isNuxeraExperienceEnabled(), language });
  const controlledChangeRequest = useControlledChangeRequest({ enabled: isNuxeraExperienceEnabled(), language });
  const controlledReleaseDossier = useControlledReleaseDossier({ enabled: isNuxeraExperienceEnabled(), language });
  const baseNotificationDryRunIntents = useMemo(() => ([
    { eventId: "applicant-missing-evidence", orderId: "demo-order-1", recipientUserId: "demo-applicant", recipientRole: "applicant", subject: "Evidencia faltante", channels: ["email", "in_app"] },
    { eventId: "grantor-information-response", orderId: "demo-order-1", recipientEmail: "grantor@example.com", recipientRole: "grantor", subject: "Respuesta recibida", channels: ["email"] }
  ]), []);
  const conversationPreviewPayload = useMemo(() => ({
    role: "grantor",
    orderId: "demo-order-1",
    authorized: true,
    message: "Resume riesgos y evidencia faltante para la mesa de decision."
  }), []);
  const notificationOutboxReadiness = useNotificationOutboxReadiness({ enabled: isNuxeraExperienceEnabled(), language });
  const conversationAgentReadiness = useConversationAgentReadiness({ enabled: isNuxeraExperienceEnabled(), language });
  const conversationPreview = useConversationPreview({ enabled: isNuxeraExperienceEnabled(), payload: conversationPreviewPayload });
  const caseAssignmentHistory = useCaseAssignmentHistory({ enabled: isNuxeraExperienceEnabled(), limit: 20 });
  const caseAssignmentNotificationIntents = useMemo(
    () => buildNuxeraAssignmentNotificationIntents(caseAssignmentHistory.assignments, { adminRecipientUserId: "admin-operations" }),
    [caseAssignmentHistory.assignments]
  );
  const notificationDryRunIntents = useMemo(
    () => [...baseNotificationDryRunIntents, ...caseAssignmentNotificationIntents].slice(0, 8),
    [baseNotificationDryRunIntents, caseAssignmentNotificationIntents]
  );
  const notificationDryRun = useNotificationDryRun({ enabled: isNuxeraExperienceEnabled(), intents: notificationDryRunIntents, language });
  const notificationOutboxList = useNotificationOutboxList({ enabled: isNuxeraExperienceEnabled(), limit: 10 });
  const aiProviderPolicy = useAiProviderPolicy({ enabled: isNuxeraExperienceEnabled(), language });
  const adminGrantorCases = useAdminGrantorCases({ enabled: isNuxeraExperienceEnabled(), language });

  const [caseAssignmentForm, setCaseAssignmentForm] = useState({
    caseId: "",
    assignedReviewerRole: "grantor_analyst",
    slaTier: "needs-information-48h",
    slaDueAt: getDefaultAssignmentDueAt(),
    reason: "Reasignacion operativa para seguimiento de evidencia y SLA.",
  });
  const [caseAssignmentPreview, setCaseAssignmentPreview] = useState(null);
  const [caseAssignmentSubmitting, setCaseAssignmentSubmitting] = useState(false);
  const [caseAssignmentError, setCaseAssignmentError] = useState(null);
  const communicationModel = mergeCommunicationModelWithConversationAgent(
    mergeNotificationCatalogWithOutboxReadiness(getNuxeraNotificationCatalog(language), notificationOutboxReadiness, language),
    conversationAgentReadiness,
    language
  );
  const consoleState = mergeAiProviderPolicyWithConsole(
    mergeBackendReadinessWithConsole(
      mergeAdminControlsWithConsole(
        mergeGrantorCasesWithConsole(getAdminOperationsConsole(language), adminGrantorCases, language),
        adminControls,
        language
      ),
      backendReadiness,
      controlledVerificationPlan,
      language
    ),
    aiProviderPolicy,
    language
  );

  const assignmentCaseLabels = new Map(consoleState.grantorDocumentReadiness.map((item) => [item.caseId, item]));
  const assignmentHistoryRows = caseAssignmentHistory.assignments.slice(0, 6).map((assignment) => ({
    ...assignment,
    caseLabel: assignmentCaseLabels.get(assignment.orderId)?.label || assignment.orderId,
    applicant: assignmentCaseLabels.get(assignment.orderId)?.applicant || L("Sin solicitante visible", "No visible applicant"),
  }));
  const assignmentCandidates = consoleState.grantorDocumentReadiness.slice(0, 12);
  const selectedAssignmentCaseId = caseAssignmentForm.caseId || assignmentCandidates[0]?.caseId || "";
  const selectedAssignmentCase = assignmentCandidates.find((item) => item.caseId === selectedAssignmentCaseId) || assignmentCandidates[0] || null;
  const caseAssignmentCanSubmit = Boolean(selectedAssignmentCaseId) && !caseAssignmentSubmitting;
  const updateCaseAssignmentForm = (field, value) => {
    setCaseAssignmentForm((current) => ({ ...current, [field]: value }));
  };
  const handleCaseAssignmentPreview = async (event) => {
    event.preventDefault();
    if (!selectedAssignmentCaseId) {
      setCaseAssignmentError("nuxera-case-assignment-no-case");
      return;
    }

    setCaseAssignmentSubmitting(true);
    setCaseAssignmentError(null);
    const preview = await previewNuxeraCaseAssignment({
      orderId: selectedAssignmentCaseId,
      assignedReviewerRole: caseAssignmentForm.assignedReviewerRole,
      slaTier: caseAssignmentForm.slaTier,
      slaDueAt: toAssignmentDueAtIso(caseAssignmentForm.slaDueAt),
      reason: caseAssignmentForm.reason,
    });
    setCaseAssignmentPreview(preview);
    setCaseAssignmentError(preview.error || null);
    setCaseAssignmentSubmitting(false);
  };
  const productionGoNoGo = {
    status: controlledReleaseDossier.readyForReleaseReview && controlledChangeRequest.readyForChangeReview && controlledWriteGate.readyForControlledWriteChange ? "ready-for-final-human-review" : "no-go-controlled-preview",
    checks: [
      { id: "backend", label: "Backend/RLS", ready: backendReadiness.ready, detail: backendReadiness.status },
      { id: "evidence", label: "Evidencia controlada", ready: controlledEvidenceReview.readyForHumanReview, detail: controlledEvidenceReview.status },
      { id: "approval", label: "Aprobacion humana", ready: controlledApprovalPackage.readyForReleaseDecision, detail: controlledApprovalPackage.status },
      { id: "write-gate", label: "Write gate", ready: controlledWriteGate.readyForControlledWriteChange, detail: controlledWriteGate.status },
      { id: "change", label: "Change request", ready: controlledChangeRequest.readyForChangeReview, detail: controlledChangeRequest.status },
      { id: "release", label: "Release dossier", ready: controlledReleaseDossier.readyForReleaseReview, detail: controlledReleaseDossier.status },
      { id: "ai", label: "IA sensible", ready: aiProviderPolicy.sensitiveRuntimeReady, detail: aiProviderPolicy.status },
      { id: "outbox", label: "Delivery automatico", ready: !notificationOutboxReadiness.deliveryEnabled, detail: notificationOutboxReadiness.deliveryEnabled ? "delivery-enabled-review-required" : "delivery-disabled-safe" },
      { id: "chat", label: "Chat runtime", ready: !conversationAgentReadiness.runtimeEnabled, detail: conversationAgentReadiness.runtimeEnabled ? "runtime-enabled-review-required" : "runtime-disabled-safe" }
    ]
  };
  productionGoNoGo.summary = {
    ready: productionGoNoGo.checks.filter((check) => check.ready).length,
    total: productionGoNoGo.checks.length,
    blockers: productionGoNoGo.checks.filter((check) => !check.ready).length
  };
  return (
    <section className="nuxera-home" aria-labelledby="nuxera-home-title">
      <p className="nuxera-eyebrow">NUXERA Financial Intelligence / {L("Administrador", "Administrator")}</p>
      <div className="nuxera-hero-row">
        <div>
          <h1 id="nuxera-home-title">{L("Consola operativa NUXERA", "NUXERA operations console")}</h1>
          <p>{L("Monitorea salud, gates, auditoria y politicas de la migracion sin cambiar permisos ni activar persistencia.", "Monitors health, gates, audit trail and migration policies without changing permissions or enabling persistence.")}</p>
        </div>
        <div className="nuxera-status-panel">
          <span>{consoleState.status}</span>
          <strong>{consoleState.summary.blockedGates} gates</strong>
          <small>{sectionLabel}</small>
        </div>
      </div>

      <div className="nuxera-admin-summary">
        <article><span>Lanes</span><strong>{consoleState.summary.lanes}</strong></article>
        <article><span>Watch</span><strong>{consoleState.summary.watch}</strong></article>
        <article><span>{L("Bloqueos", "Blockers")}</span><strong>{consoleState.summary.blockedGates}</strong></article>
        <article><span>Readiness</span><strong>{consoleState.summary.readiness}%</strong></article>
      </div>

      <section className="nuxera-admin-operational-snapshot" aria-label={L("Snapshot operativo real NUXERA", "Real NUXERA operational snapshot")}>
        <header>
          <span>{operationalSnapshot.status}</span>
          <h2>{L("Operacion autenticada en tiempo real", "Real-time authenticated operations")}</h2>
        </header>
        {operationalSnapshot.loading && <p>{L("Cargando fuentes administrativas protegidas...", "Loading protected administrative sources...")}</p>}
        <div className="nuxera-admin-summary">
          <article><span>{L("Usuarios", "Users")}</span><strong>{operationalSnapshot.summary.users}</strong></article>
          <article><span>{L("Eventos auditables", "Auditable events")}</span><strong>{operationalSnapshot.summary.auditEvents}</strong></article>
          <article><span>{L("Revision humana", "Human review")}</span><strong>{operationalSnapshot.summary.humanReviews}</strong></article>
          <article><span>{L("Fuentes fallidas", "Failed sources")}</span><strong>{operationalSnapshot.summary.failedSources}</strong></article>
        </div>
        {operationalSnapshot.failedSources.length > 0 && (
          <p>{L("No disponibles", "Unavailable")}: {operationalSnapshot.failedSources.join(", ")}. {L("No se muestran datos demo como reemplazo.", "Demo data is not shown as a replacement.")}</p>
        )}
        <div>
          {operationalSnapshot.auditLogs.slice(0, 5).map((event) => (
            <article key={event.id}>
              <span>{event.action || "audit"}</span>
              <strong>{event.entity_type || event.entityType || L("evento", "event")}</strong>
              <p>{event.created_at || event.createdAt || L("sin fecha", "no date")}</p>
            </article>
          ))}
        </div>
        <footer>{L("Lectura protegida por rol administrador; esta superficie no cambia usuarios, permisos ni datos.", "Read access is protected by the administrator role; this surface does not change users, permissions or data.")}</footer>
      </section>
      <section className="nuxera-admin-operational-modules" aria-label={L("Modulos administrativos reales NUXERA", "Real NUXERA administrative modules")}>
        <article>
          <span>{L("Usuarios y permisos", "Users & permissions")}</span>
          <h2>{L("Distribucion por rol", "Distribution by role")}</h2>
          {operationalSnapshot.modules.users.byRole.length === 0 && <p>{L("Sin usuarios disponibles.", "No users available.")}</p>}
          {operationalSnapshot.modules.users.byRole.map((item) => (
            <p key={item.role}><strong>{item.total}</strong> {item.role}</p>
          ))}
        </article>
        <article>
          <span>{L("Revision humana", "Human review")}</span>
          <h2>{operationalSnapshot.modules.reviews.highPriority} {L("prioridades altas", "high priorities")}</h2>
          {operationalSnapshot.modules.reviews.items.slice(0, 5).map((review) => (
            <p key={review.id}><strong>{review.projectName}</strong> / {review.documentName} / {review.priority}</p>
          ))}
          {operationalSnapshot.modules.reviews.items.length === 0 && <p>{L("Sin revisiones pendientes disponibles.", "No pending reviews available.")}</p>}
        </article>
        <article>
          <span>{L("Metricas de readiness", "Readiness metrics")}</span>
          <h2>{operationalSnapshot.modules.metrics.available} {L("indicadores disponibles", "indicators available")}</h2>
          {operationalSnapshot.modules.metrics.cards.filter((metric) => metric.available).slice(0, 6).map((metric) => (
            <p key={metric.key}><strong>{metric.value}</strong> {metric.label}</p>
          ))}
          {operationalSnapshot.modules.metrics.note && <small>{operationalSnapshot.modules.metrics.note}</small>}
        </article>
        <article>
          <span>{L("Auditoria global", "Global audit")}</span>
          <h2>{L("Acciones recientes", "Recent actions")}</h2>
          {operationalSnapshot.modules.audit.byAction.slice(0, 6).map((item) => (
            <p key={item.action}><strong>{item.total}</strong> {item.action}</p>
          ))}
          {operationalSnapshot.modules.audit.byAction.length === 0 && <p>{L("Sin eventos auditables disponibles.", "No auditable events available.")}</p>}
        </article>
      </section>
      <div className="nuxera-admin-lanes">
        {consoleState.lanes.map((lane) => (
          <article key={lane.id}>
            <span>{lane.status}</span>
            <strong>{lane.label}</strong>
            <p>{lane.signal}</p>
            <small>{lane.owner}</small>
            <em>{lane.action}</em>
          </article>
        ))}
      </div>

      <section className="nuxera-admin-gates" aria-label={L("Release gates NUXERA", "NUXERA release gates")}>
        <header>
          <span>{L("Release gates", "Release gates")}</span>
          <h2>{L("Condiciones antes de persistencia o rollout", "Conditions before persistence or rollout")}</h2>
        </header>
        <div>
          {consoleState.releaseGates.map((gate) => (
            <article key={gate.id}>
              <span>{gate.state}</span>
              <strong>{gate.label}</strong>
              <p>{gate.requirement}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="nuxera-admin-readiness" aria-label={L("Readiness operativo NUXERA", "NUXERA operational readiness")}>
        <header>
          <span>{L("Readiness operativo", "Operational readiness")}</span>
          <h2>{L("Superficies listas para revision controlada", "Surfaces ready for controlled review")}</h2>
        </header>
        <div>
          {consoleState.rolloutReadiness.map((item) => (
            <article key={item.id}>
              <header>
                <span>{item.status}</span>
                <strong>{item.readiness}%</strong>
              </header>
              <h3>{item.label}</h3>
              <p>{item.evidence}</p>
              <small>{item.gap}</small>
            </article>
          ))}
        </div>
      </section>
      <section className="nuxera-admin-controlled-verification" aria-label={L("Paquete de continuidad NUXERA", "NUXERA continuation package")}>
        <header>
          <span>{controlledContinuationPack.status}</span>
          <h2>{L("Continuation pack", "Continuation pack")}</h2>
        </header>
        <p>
          {L("Avance", "Progress")} {controlledContinuationPack.progress.percent}%; {L("retomar desde", "resume from")} {controlledContinuationPack.resumeContext.resumeFromCommit}; {controlledContinuationPack.nextResumeSteps.length} {L("pasos", "steps")}.
        </p>
        {controlledContinuationPack.loading && <small>{L("Cargando continuation pack NUXERA...", "Loading NUXERA continuation pack...")}</small>}
        <div>
          {controlledContinuationPack.recentCommits.slice(0, 3).map((commit) => (
            <article key={commit.hash}>
              <span>{controlledContinuationPack.resumeContext.branch}</span>
              <strong>{commit.hash}</strong>
              <p>{commit.title}</p>
            </article>
          ))}
        </div>
        <footer>
          <small>{controlledContinuationPack.nextResumeSteps[0]}</small>
          <small>{controlledContinuationPack.guardrails[0]}</small>
        </footer>
      </section>      <section className="nuxera-admin-backend-readiness" aria-label={L("Readiness backend NUXERA", "NUXERA backend readiness")}>
        <header>
          <span>{consoleState.backendReadiness.status}</span>
          <h2>{L("Readiness backend", "Backend readiness")}</h2>
        </header>
        <p>{consoleState.backendReadiness.label}: {consoleState.summary.backendReadiness}% {L("visible", "visible")}; {consoleState.summary.backendReadinessUnavailable} {L("pendientes", "pending")}.</p>
        {consoleState.backendReadiness.loading && <small>{L("Cargando readiness NUXERA...", "Loading NUXERA readiness...")}</small>}
        <div>
          {consoleState.backendReadiness.signals.map((signal) => (
            <article key={signal.id}>
              <span>{signal.status}</span>
              <strong>{signal.label}</strong>
              <p>{signal.table}</p>
              <small>{signal.guardrail}</small>
            </article>
          ))}
        </div>
      </section>
      <section className="nuxera-admin-backend-handoff" aria-label={L("Handoff readiness backend NUXERA", "NUXERA backend readiness handoff")}>
        <header>
          <span>{consoleState.backendReadinessHandoff.status}</span>
          <h2>{L("Handoff backend readiness", "Backend readiness handoff")}</h2>
        </header>
        <p>{consoleState.backendReadinessHandoff.unavailableTables.length} {L("tablas pendientes", "pending tables")}; {consoleState.summary.backendReadinessActions} {L("acciones sugeridas", "suggested actions")}.</p>
        <div>
          {consoleState.backendReadinessHandoff.unavailableTables.map((item) => (
            <article key={item.table}>
              <span>{item.status}</span>
              <strong>{item.table}</strong>
              <p>{item.requiredFor.join(", ") || "NUXERA backend"}</p>
              <small>{item.owner}</small>
            </article>
          ))}
        </div>
        <footer>{consoleState.backendReadinessHandoff.guardrails[0]}</footer>
      </section>
      <section className="nuxera-admin-rls-matrix" aria-label={L("Matriz RLS NUXERA", "NUXERA RLS matrix")}>
        <header>
          <span>{consoleState.rlsVerificationMatrix.status}</span>
          <h2>{L("Matriz RLS controlada", "Controlled RLS matrix")}</h2>
        </header>
        <p>{consoleState.summary.rlsVerificationScenarios} {L("escenarios", "scenarios")}; {consoleState.summary.rlsVerificationBlocked} {L("bloqueados por readiness", "blocked by readiness")}.</p>
        <div>
          {consoleState.rlsVerificationMatrix.scenarios.map((scenario) => (
            <article key={scenario.id}>
              <span>{scenario.blockedBy.length ? "blocked" : "ready"}</span>
              <strong>{scenario.identity}</strong>
              <p>{L("Debe negar", "Must deny")}: {scenario.mustDeny.join(", ")}</p>
              <small>{scenario.blockedBy.length ? `${L("Pendiente", "Pending")}: ${scenario.blockedBy.join(", ")}` : scenario.mustRead.join(", ")}</small>
            </article>
          ))}
        </div>
        <footer>{consoleState.rlsVerificationMatrix.guardrails[0]}</footer>
      </section>
      <section className="nuxera-admin-controlled-verification" aria-label={L("Paquete de evidencia RLS y endpoints NUXERA", "NUXERA RLS & endpoint evidence package")}>
        <header>
          <span>{consoleState.controlledVerificationPackage.status}</span>
          <h2>{L("Paquete RLS/endpoints", "RLS/endpoint package")}</h2>
        </header>
        <p>
          {consoleState.summary.controlledVerificationEndpoints} endpoints; {consoleState.summary.controlledVerificationDeniedChecks} {L("denegaciones", "denials")}; {consoleState.summary.controlledVerificationNoGo} no-go.
        </p>
        <div>
          {consoleState.controlledVerificationPackage.endpointChecks.map((endpoint) => (
            <article key={endpoint.id}>
              <span>{endpoint.method} / {endpoint.actor}</span>
              <strong>{endpoint.path}</strong>
              <p>{endpoint.expected}</p>
            </article>
          ))}
        </div>
        <footer>
          <small>{consoleState.controlledVerificationPackage.evidenceTemplate.path}</small>
          <small>{consoleState.controlledVerificationPackage.guardrails[0]}</small>
        </footer>
      </section>
      <section className="nuxera-admin-controlled-verification" aria-label={L("Scaffold de evidencia RLS y endpoints NUXERA", "NUXERA RLS & endpoint evidence scaffold")}>
        <header>
          <span>{controlledEvidenceScaffold.status}</span>
          <h2>{L("Scaffold de evidencia", "Evidence scaffold")}</h2>
        </header>
        <p>
          {controlledEvidenceScaffold.summary.endpointRows} {L("filas de endpoint", "endpoint rows")}; {controlledEvidenceScaffold.summary.identities} {L("identidades", "identities")}; {controlledEvidenceScaffold.summary.rollbackChecks} {L("checks rollback", "rollback checks")}.
        </p>
        {controlledEvidenceScaffold.loading && <small>{L("Cargando scaffold NUXERA...", "Loading NUXERA scaffold...")}</small>}
        <div>
          <article>
            <span>{controlledEvidenceScaffold.source}</span>
            <strong>{controlledEvidenceScaffold.sourcePlanId}</strong>
            <p>{controlledEvidenceScaffold.metadata.environment}</p>
            <small>{controlledEvidenceScaffold.metadata.repoCommit}</small>
          </article>
        </div>
        <footer>
          <small>{controlledEvidenceScaffold.evidenceTemplate.path}</small>
          <small>{controlledEvidenceScaffold.guardrails[0]}</small>
        </footer>
      </section>
      <section className="nuxera-admin-controlled-verification" aria-label={L("Runbook de verificacion controlada NUXERA", "NUXERA controlled verification runbook")}>
        <header>
          <span>{controlledRunbook.status}</span>
          <h2>{L("Runbook controlado", "Controlled runbook")}</h2>
        </header>
        <p>
          {controlledRunbook.summary.missingMetadata} {L("metadatos faltantes", "missing metadata")}; {controlledRunbook.commands.length} {L("comandos", "commands")}; {controlledRunbook.acceptanceGates.length} gates.
        </p>
        {controlledRunbook.loading && <small>{L("Cargando runbook NUXERA...", "Loading NUXERA runbook...")}</small>}
        <div>
          {controlledRunbook.commands.map((command) => (
            <article key={command.id}>
              <span>{controlledRunbook.readyForRun ? "ready" : "blocked"}</span>
              <strong>{command.id}</strong>
              <p>{command.command}</p>
            </article>
          ))}
        </div>
        <footer>
          <small>{controlledRunbook.nextDecision}</small>
          <small>{controlledRunbook.guardrails[0]}</small>
        </footer>
      </section>
      <section className="nuxera-admin-controlled-verification" aria-label={L("Review de evidencia controlada NUXERA", "NUXERA controlled evidence review")}>
        <header>
          <span>{controlledEvidenceReview.status}</span>
          <h2>{L("Review de evidencia", "Evidence review")}</h2>
        </header>
        <p>
          {controlledEvidenceReview.summary.missingSections} {L("secciones faltantes", "missing sections")}; {controlledEvidenceReview.summary.todoMarkers} TODO; {controlledEvidenceReview.summary.noGoIndicators} no-go.
        </p>
        {controlledEvidenceReview.loading && <small>{L("Revisando evidencia NUXERA...", "Reviewing NUXERA evidence...")}</small>}
        <div>
          {controlledEvidenceReview.blockers.slice(0, 3).map((blocker) => (
            <article key={blocker}>
              <span>{controlledEvidenceReview.readyForHumanReview ? "ready" : "blocked"}</span>
              <strong>{controlledEvidenceReview.source}</strong>
              <p>{blocker}</p>
            </article>
          ))}
        </div>
        <footer>
          <small>{controlledEvidenceReview.nextDecision}</small>
          <small>{controlledEvidenceReview.guardrails[0]}</small>
        </footer>
      </section>
      <section className="nuxera-admin-controlled-verification" aria-label={L("Paquete de aprobacion controlada NUXERA", "NUXERA controlled approval package")}>
        <header>
          <span>{controlledApprovalPackage.status}</span>
          <h2>{L("Approval package", "Approval package")}</h2>
        </header>
        <p>
          {controlledApprovalPackage.summary.approvalMetadataMissing} {L("metadatos faltantes", "missing metadata")}; {controlledApprovalPackage.summary.blockers} {L("bloqueos", "blockers")}; {L("decision", "decision")} {controlledApprovalPackage.summary.decisionAccepted ? L("lista", "ready") : L("pendiente", "pending")}.
        </p>
        {controlledApprovalPackage.loading && <small>{L("Construyendo approval package NUXERA...", "Building NUXERA approval package...")}</small>}
        <div>
          {controlledApprovalPackage.blockers.slice(0, 3).map((blocker) => (
            <article key={blocker}>
              <span>{controlledApprovalPackage.readyForReleaseDecision ? "ready" : "blocked"}</span>
              <strong>{controlledApprovalPackage.source}</strong>
              <p>{blocker}</p>
            </article>
          ))}
        </div>
        <footer>
          <small>{controlledApprovalPackage.nextDecision}</small>
          <small>{controlledApprovalPackage.guardrails[0]}</small>
        </footer>
      </section>
      <section className="nuxera-admin-controlled-verification" aria-label={L("Gate de write controlado NUXERA", "NUXERA controlled write gate")}>
        <header>
          <span>{controlledWriteGate.status}</span>
          <h2>{L("Write gate", "Write gate")}</h2>
        </header>
        <p>
          {controlledWriteGate.summary.blockers} {L("bloqueos", "blockers")}; backend {controlledWriteGate.summary.backendReadiness}%; approval {controlledWriteGate.summary.approvalReady ? "ready" : "blocked"}.
        </p>
        {controlledWriteGate.loading && <small>{L("Evaluando write gate NUXERA...", "Evaluating NUXERA write gate...")}</small>}
        <div>
          {controlledWriteGate.blockers.slice(0, 3).map((blocker) => (
            <article key={blocker}>
              <span>{controlledWriteGate.readyForControlledWriteChange ? "ready" : "blocked"}</span>
              <strong>{controlledWriteGate.requestedScope}</strong>
              <p>{blocker}</p>
            </article>
          ))}
        </div>
        <footer>
          <small>{controlledWriteGate.nextDecision}</small>
          <small>{controlledWriteGate.guardrails[0]}</small>
        </footer>
      </section>
      <section className="nuxera-admin-controlled-verification" aria-label={L("Change request controlado NUXERA", "NUXERA controlled change request")}>
        <header>
          <span>{controlledChangeRequest.status}</span>
          <h2>{L("Change request", "Change request")}</h2>
        </header>
        <p>
          {controlledChangeRequest.summary.blockers} {L("bloqueos", "blockers")}; metadata {controlledChangeRequest.summary.changeMetadataMissing}; rollback {controlledChangeRequest.summary.rollbackSteps} {L("pasos", "steps")}.
        </p>
        {controlledChangeRequest.loading && <small>{L("Construyendo change request NUXERA...", "Building NUXERA change request...")}</small>}
        <div>
          {controlledChangeRequest.blockers.slice(0, 3).map((blocker) => (
            <article key={blocker}>
              <span>{controlledChangeRequest.readyForChangeReview ? "ready" : "blocked"}</span>
              <strong>{controlledChangeRequest.changeMetadata.changeTicket}</strong>
              <p>{blocker}</p>
            </article>
          ))}
        </div>
        <footer>
          <small>{controlledChangeRequest.nextDecision}</small>
          <small>{controlledChangeRequest.guardrails[0]}</small>
        </footer>
      </section>
      <section className="nuxera-admin-controlled-verification" aria-label={L("Dossier de release controlado NUXERA", "NUXERA controlled release dossier")}>
        <header>
          <span>{controlledReleaseDossier.status}</span>
          <h2>{L("Release dossier", "Release dossier")}</h2>
        </header>
        <p>
          {controlledReleaseDossier.summary.blockers} {L("bloqueos", "blockers")}; {L("cadena", "chain")} {controlledReleaseDossier.summary.evidenceChain}; checklist {controlledReleaseDossier.summary.finalReviewChecklist}.
        </p>
        {controlledReleaseDossier.loading && <small>{L("Construyendo release dossier NUXERA...", "Building NUXERA release dossier...")}</small>}
        <div>
          {controlledReleaseDossier.evidenceChain.slice(0, 3).map((item) => (
            <article key={item.id}>
              <span>{controlledReleaseDossier.readyForReleaseReview ? "ready" : "blocked"}</span>
              <strong>{item.label}</strong>
              <p>{item.status}</p>
            </article>
          ))}
        </div>
        <footer>
          <small>{controlledReleaseDossier.nextDecision}</small>
          <small>{controlledReleaseDossier.guardrails[0]}</small>
        </footer>
      </section>      <section className="nuxera-admin-backend-controls" aria-label={L("Controles admin NUXERA backend read-only", "Read-only NUXERA backend admin controls")}>
        <header>
          <span>{consoleState.backendControls.status}</span>
          <h2>{L("Controles backend read-only", "Read-only backend controls")}</h2>
        </header>
        <p>{consoleState.backendControls.label}: {consoleState.summary.backendControls} {L("controles visibles", "visible controls")}.</p>
        {consoleState.backendControls.loading && <small>{L("Cargando controles NUXERA...", "Loading NUXERA controls...")}</small>}
        <div>
          {consoleState.backendControls.controls.slice(0, 4).map((control) => (
            <article key={control.id}>
              <span>{control.typeLabel} / {control.scope}</span>
              <strong>{control.label}</strong>
              <p>{control.detail}</p>
              <small>{control.guardrails[0]}</small>
            </article>
          ))}
        </div>
      </section>
      <section className="nuxera-admin-evidence-coverage" aria-label={L("Cobertura de evidencia NUXERA", "NUXERA evidence coverage")}>
        <header>
          <span>Evidence coverage</span>
          <h2>{L("Ledger read-only para auditoria interna", "Read-only ledger for internal audit")}</h2>
        </header>
        <div>
          {consoleState.evidenceCoverage.map((item) => (
            <article key={item.engine}>
              <span>{item.visibility}</span>
              <strong>{item.engine}</strong>
              <p>{item.ready}/{item.total} {L("listas", "ready")}; {item.watch} {L("en watch", "on watch")}.</p>
              <small>{item.policy}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="nuxera-admin-document-readiness" aria-label={L("Readiness documental grantor NUXERA", "NUXERA grantor document readiness")}>
        <header>
          <span>{L("Grantor documents", "Grantor documents")}</span>
          <h2>{L("Readiness documental otorgante", "Grantor document readiness")}</h2>
        </header>
        <p>
          {consoleState.summary.grantorDocumentCases} {L("casos visibles", "visible cases")}; {consoleState.summary.grantorDocumentPending} {L("senales documentales pendientes", "pending document signals")}.
        </p>
        <div>
          {consoleState.grantorDocumentReadiness.map((item) => (
            <article key={item.caseId}>
              <span>{item.status}</span>
              <strong>{item.label}</strong>
              <p>{item.applicant}: {item.visible}/{item.total} {L("visibles", "visible")}; {item.pending} {L("pendientes", "pending")}.</p>
              <small>{item.nextAction}</small>
              <em>{item.policy}</em>
            </article>
          ))}
        </div>
      </section>

      <section className="nuxera-admin-ai-policy" aria-label={L("Politica de proveedores IA NUXERA", "NUXERA AI provider policy")}>
        <header>
          <span>{consoleState.aiProviderPolicy.status}</span>
          <h2>{L("Política de proveedores IA", "AI provider policy")}</h2>
        </header>
        <p>
          {consoleState.summary.aiPrimaryProvidersConfigured} {L("primarios configurados", "primary configured")}; {consoleState.summary.aiRestrictedProvidersConfigured} {L("secundarios restringidos", "restricted secondary")}; {consoleState.summary.aiScenarioPathsAvailable} {L("rutas operables", "available paths")}; {consoleState.aiProviderPolicy.summary.estimatedPilotUsd || 0} USD {L("piloto estimado", "estimated pilot")}.
        </p>
        {consoleState.aiProviderPolicy.loading && <small>{L("Cargando política IA...", "Loading AI policy...")}</small>}
        <div className="nuxera-admin-summary">
          <article>
            <span>{L("Datos sensibles", "Sensitive data")}</span>
            <strong>{consoleState.aiProviderPolicy.sensitiveRuntimeReady ? L("Listo", "Ready") : L("Bloqueado", "Blocked")}</strong>
            <p>{L("Solo Anthropic/OpenAI pueden revisar documentos sensibles.", "Only Anthropic/OpenAI may review sensitive documents.")}</p>
          </article>
          <article>
            <span>{L("Kimi/DeepSeek", "Kimi/DeepSeek")}</span>
            <strong>{consoleState.aiProviderPolicy.restrictedRuntimeReady ? L("Disponible", "Available") : L("Restringido", "Restricted")}</strong>
            <p>{L("Solo tareas de bajo riesgo con datos anonimizados.", "Only low-risk tasks with anonymized data.")}</p>
          </article>
          <article>
            <span>{L("Secretos", "Secrets")}</span>
            <strong>{L("No expuestos", "Not exposed")}</strong>
            <p>{L("La consola muestra presencia de llaves, nunca valores.", "Console shows key presence, never values.")}</p>
          </article>
        </div>
        <div>
          {consoleState.aiProviderPolicy.providers.map((provider) => (
            <article key={provider.name}>
              <span>{provider.tier} / {provider.configured ? L("configurado", "configured") : L("sin llave", "no key")}</span>
              <strong>{provider.name}</strong>
              <p>{provider.model}</p>
              <small>{provider.riskProfile} / {provider.cost?.posture}</small>
              <em>{provider.allowed ? L("Permitido para el escenario sensible actual", "Allowed for current sensitive scenario") : provider.blockedReason}</em>
              <small>{provider.cost?.estimatedPilotUsd ?? 0} USD {L("piloto estimado", "estimated pilot")}</small>
            </article>
          ))}
        </div>
        <div>
          {consoleState.aiProviderPolicy.scenarios.map((scenario) => (
            <article key={scenario.id}>
              <span>{scenario.status}</span>
              <strong>{scenario.label}</strong>
              <p>{scenario.dataRisk} / {scenario.anonymized ? L("anonimizado", "anonymized") : L("no anonimizado", "not anonymized")}</p>
              <small>{scenario.allowedProviders.length ? scenario.allowedProviders.join(", ") : L("Sin ruta configurada", "No configured path")}</small>
            </article>
          ))}
        </div>
        <footer>
          {consoleState.aiProviderPolicy.guardrails.map((guardrail) => <small key={guardrail}>{guardrail}</small>)}
        </footer>
      </section>
      <section className="nuxera-admin-communications" aria-label={L("Operacion de comunicaciones NUXERA", "NUXERA communications operations")}>
        <header>
          <span>{communicationModel.status}</span>
          <h2>{L("Comunicaciones y agente conversacional", "Communications and conversational agent")}</h2>
        </header>
        <p>
          {communicationModel.summary.totalEvents} {L("eventos definidos", "defined events")}; {communicationModel.summary.applicant} {L("para solicitante", "for applicants")}; {communicationModel.summary.grantor} {L("para otorgante", "for grantors")}; {communicationModel.summary.admin} admin.
        </p>
        <div className="nuxera-admin-summary">
          {communicationModel.channels.map((channel) => (
            <article key={channel.id}>
              <span>{channel.label}</span>
              <strong>{channel.id}</strong>
              <p>{channel.purpose}</p>
              <small>{channel.guardrail}</small>
            </article>
          ))}
          <article>
            <span>{L("Outbox", "Outbox")}</span>
            <strong>{communicationModel.outbox.table}</strong>
            <p>{communicationModel.outbox.label || communicationModel.outbox.status}</p>
            <small>{communicationModel.outbox.loading ? L("Cargando readiness outbox...", "Loading outbox readiness...") : communicationModel.outbox.source}</small>
          </article>
          <article>
            <span>{L("Delivery", "Delivery")}</span>
            <strong>{communicationModel.summary.automatedDeliveryEnabled ? L("Activo", "Enabled") : L("No activo", "Disabled")}</strong>
            <p>{L("El agente redacta o resume; el envio real requiere outbox, auditoria y reglas anti-duplicado.", "The agent drafts or summarizes; real delivery requires outbox, audit and dedupe rules.")}</p>
          </article>
          <article>
            <span>{L("Chat runtime", "Chat runtime")}</span>
            <strong>{communicationModel.summary.conversationRuntimeEnabled ? L("Activo", "Enabled") : L("Apagado", "Disabled")}</strong>
            <p>{communicationModel.conversationAgent.label || communicationModel.conversationAgent.status}</p>
            <small>{communicationModel.conversationAgent.loading ? L("Cargando readiness agente...", "Loading agent readiness...") : communicationModel.conversationAgent.source}</small>
          </article>
          <article>
            <span>{L("Chat preview", "Chat preview")}</span>
            <strong>{conversationPreview.status}</strong>
            <p>{conversationPreview.draft.answer}</p>
            <small>{conversationPreview.loading ? L("Preparando preview conversacional...", "Preparing conversation preview...") : conversationPreview.source}</small>
          </article>
          <article>
            <span>{L("Dry-run outbox", "Dry-run outbox")}</span>
            <strong>{notificationDryRun.summary.accepted}/{notificationDryRun.summary.accepted + notificationDryRun.summary.rejected}</strong>
            <p>{L("Previsualiza notificaciones y duplicados sin insertar filas ni enviar mensajes.", "Previews notifications and duplicates without inserting rows or sending messages.")}</p>
            <small>{notificationDryRun.loading ? L("Ejecutando dry-run...", "Running dry-run...") : notificationDryRun.status}</small>
          </article>
        </div>
        <div>
          {communicationModel.conversationAgent.roles.map((agentRole) => (
            <article key={agentRole.role}>
              <span>{agentRole.status}</span>
              <strong>{agentRole.role} / {agentRole.channel}</strong>
              <p>{agentRole.allowedSources.slice(0, 4).join(", ")}</p>
              <small>{agentRole.requiredPermission} / {agentRole.capabilities.slice(0, 2).join(", ")}</small>
              <em>{agentRole.blockedActions.slice(0, 3).join(", ")}</em>
            </article>
          ))}
        </div>
        <div>
          {communicationModel.events.map((event) => (
            <article key={event.id}>
              <span>{event.audience} / {event.priority}</span>
              <strong>{event.subject}</strong>
              <p>{event.trigger}</p>
              <small>{event.channels.join(", ")} / {event.agentMode}</small>
              <em>{event.action}</em>
            </article>
          ))}
        </div>
        <div>
          <article>
            <span>{L("Outbox persistido", "Persisted outbox")}</span>
            <strong>{notificationOutboxList.entries.length}</strong>
            <p>{L("Filas reales en nuxera_notification_outbox; requiere delivery habilitado para persistir.", "Real rows in nuxera_notification_outbox; requires delivery enabled to persist.")}</p>
            <small>{notificationOutboxList.loading ? L("Cargando outbox...", "Loading outbox...") : notificationOutboxList.source}</small>
          </article>
          {notificationOutboxList.entries.slice(0, 5).map((entry) => (
            <article key={entry.id}>
              <span>{entry.audience} / {entry.status}</span>
              <strong>{entry.subject}</strong>
              <p>{entry.channels.join(", ")}</p>
              <small>{entry.createdAt}</small>
            </article>
          ))}
        </div>
        {(communicationModel.outbox.requiredBackendSteps.length > 0 || communicationModel.conversationAgent.requiredBackendSteps.length > 0) && (
          <div>
            {[...communicationModel.outbox.requiredBackendSteps.slice(0, 2), ...communicationModel.conversationAgent.requiredBackendSteps.slice(0, 2)].map((step) => (
              <article key={step}>
                <span>{L("Siguiente paso", "Next step")}</span>
                <strong>{communicationModel.outbox.deliveryEnabled ? L("Monitorear", "Monitor") : L("Preparar", "Prepare")}</strong>
                <p>{step}</p>
              </article>
            ))}
          </div>
        )}
        <footer>
          {communicationModel.guardrails.map((guardrail) => <small key={guardrail}>{guardrail}</small>)}
        </footer>
      </section>

      <section className="nuxera-admin-audit-package" aria-label={L("Paquete de auditoria admin NUXERA", "NUXERA admin audit package")}>
        <header>
          <span>{consoleState.auditPackage.status}</span>
          <h2>{L("Paquete local de auditoria", "Local audit package")}</h2>
        </header>
        <p>{consoleState.summary.auditPackageSignals} {L("senales consolidadas", "consolidated signals")}; {consoleState.summary.auditPackageActions} {L("acciones abiertas para revision humana", "open actions for human review")}.</p>
        <div>
          {consoleState.auditPackage.signals.map((signal) => (
            <article key={signal.id}>
              <span>{signal.status}</span>
              <strong>{signal.value}</strong>
              <p>{signal.label}</p>
            </article>
          ))}
        </div>
        <footer>
          {consoleState.auditPackage.guardrails.map((guardrail) => <small key={guardrail}>{guardrail}</small>)}
        </footer>
      </section>
      <section className="nuxera-admin-health-signals" aria-label={L("Senales de salud admin NUXERA", "NUXERA admin health signals")}>
        <header>
          <span>{L("Health signals", "Health signals")}</span>
          <h2>{L("Observabilidad operativa local", "Local operational observability")}</h2>
        </header>
        <p>{consoleState.summary.adminHealthSignals} {L("dominios monitoreados", "monitored domains")}; {consoleState.summary.adminHealthWatch} {L("requieren seguimiento", "require follow-up")}.</p>
        <div>
          {consoleState.adminHealthSignals.map((signal) => (
            <article key={signal.id}>
              <span>{signal.status} / {signal.severity}</span>
              <strong>{signal.label}</strong>
              <p>{signal.signal}</p>
              <small>{signal.nextAction}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="nuxera-admin-go-no-go" aria-label={L("Go no-go productivo NUXERA", "NUXERA production go/no-go")}>
        <header>
          <span>{productionGoNoGo.status}</span>
          <h2>{L("Go/no-go productivo", "Production go/no-go")}</h2>
        </header>
        <p>{productionGoNoGo.summary.ready}/{productionGoNoGo.summary.total} {L("checks listos", "checks ready")}; {productionGoNoGo.summary.blockers} {L("bloqueos", "blockers")}.</p>
        <div>
          {productionGoNoGo.checks.map((check) => (
            <article key={check.id}>
              <span>{check.ready ? L("ready", "ready") : L("blocked", "blocked")}</span>
              <strong>{check.label}</strong>
              <p>{check.detail}</p>
            </article>
          ))}
        </div>
        <footer>
          <small>{L("Esta consola no habilita producción: solo consolida señales para revisión humana y cambio separado.", "This console does not enable production: it only consolidates signals for human review and a separate change.")}</small>
        </footer>
      </section>
      <section className="nuxera-admin-case-assignment" aria-label={L("Previsualizacion de asignacion de expedientes NUXERA", "NUXERA case assignment preview")}>
        <header>
          <span>{caseAssignmentPreview?.status || L("Preview controlado", "Controlled preview")}</span>
          <h2>{L("Asignacion operativa de expedientes", "Operational case assignment")}</h2>
        </header>
        <p>{L("Selecciona un expediente real del pipeline autorizado y prepara la reasignacion con SLA, responsable y motivo. Por defecto solo previsualiza; persistir requiere flag backend separado.", "Select a real case from the authorized pipeline and prepare reassignment with SLA, owner and reason. By default this only previews; persistence requires a separate backend flag.")}</p>
        <form onSubmit={handleCaseAssignmentPreview}>
          <label>
            <span>{L("Expediente", "Case")}</span>
            <select value={selectedAssignmentCaseId} onChange={(event) => updateCaseAssignmentForm("caseId", event.target.value)} disabled={!assignmentCandidates.length}>
              {assignmentCandidates.map((item) => (
                <option key={item.caseId} value={item.caseId}>{item.label} / {item.status}</option>
              ))}
            </select>
          </label>
          <label>
            <span>SLA</span>
            <select value={caseAssignmentForm.slaTier} onChange={(event) => updateCaseAssignmentForm("slaTier", event.target.value)}>
              {CASE_ASSIGNMENT_SLA_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>
            <span>{L("Responsable", "Owner")}</span>
            <select value={caseAssignmentForm.assignedReviewerRole} onChange={(event) => updateCaseAssignmentForm("assignedReviewerRole", event.target.value)}>
              {CASE_ASSIGNMENT_REVIEWER_ROLES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>
            <span>{L("Vence", "Due")}</span>
            <input type="datetime-local" value={caseAssignmentForm.slaDueAt} onChange={(event) => updateCaseAssignmentForm("slaDueAt", event.target.value)} />
          </label>
          <label className="nuxera-admin-case-assignment-reason">
            <span>{L("Motivo", "Reason")}</span>
            <textarea value={caseAssignmentForm.reason} onChange={(event) => updateCaseAssignmentForm("reason", event.target.value)} rows={3} />
          </label>
          <button type="submit" disabled={!caseAssignmentCanSubmit}>{caseAssignmentSubmitting ? L("Generando...", "Generating...") : L("Previsualizar asignacion", "Preview assignment")}</button>
        </form>
        <div>
          <article>
            <span>{selectedAssignmentCase?.status || L("Sin expediente", "No case")}</span>
            <strong>{selectedAssignmentCase?.label || L("Pipeline no disponible", "Pipeline unavailable")}</strong>
            <p>{selectedAssignmentCase ? `${selectedAssignmentCase.pending}/${selectedAssignmentCase.total} pendientes - ${selectedAssignmentCase.nextAction}` : L("Carga el pipeline real de otorgantes para habilitar este control.", "Load the real grantor pipeline to enable this control.")}</p>
          </article>
          <article>
            <span>{caseAssignmentPreview?.persisted ? L("Persistido", "Persisted") : L("Sin escritura", "No write")}</span>
            <strong>{caseAssignmentPreview?.assignment?.assignedReviewerRole || caseAssignmentForm.assignedReviewerRole}</strong>
            <p>{caseAssignmentPreview?.assignment?.source || caseAssignmentPreview?.source || L("Aun no se ha solicitado preview.", "Preview has not been requested yet.")}</p>
          </article>
          <article>
            <span>{caseAssignmentPreview?.writeEnabled ? L("Flag activo", "Flag enabled") : L("Flag apagado", "Flag disabled")}</span>
            <strong>{caseAssignmentPreview?.assignment?.slaTier || caseAssignmentForm.slaTier}</strong>
            <p>{caseAssignmentError || caseAssignmentPreview?.guardrails?.[0] || L("NUXERA_CASE_ASSIGNMENT_WRITE_ENABLED controla la persistencia.", "NUXERA_CASE_ASSIGNMENT_WRITE_ENABLED controls persistence.")}</p>
          </article>
        </div>
        <div className="nuxera-admin-case-assignment-history">
          <article>
            <span>{caseAssignmentHistory.status}</span>
            <strong>{caseAssignmentHistory.summary.open}/{caseAssignmentHistory.summary.total} {L("abiertas", "open")}</strong>
            <p>{caseAssignmentHistory.loading ? L("Cargando historial...", "Loading history...") : caseAssignmentHistory.guardrails[0]}</p>
          </article>
          <article>
            <span>{L("SLA", "SLA")}</span>
            <strong>{caseAssignmentHistory.summary.overdue} {L("vencidas", "overdue")}</strong>
            <p>{caseAssignmentHistory.summary.dueSoon} {L("por vencer", "due soon")}; {caseAssignmentHistory.summary.onTrack} {L("en tiempo", "on track")}.</p>
          </article>
          <article>
            <span>{caseAssignmentHistory.tableAvailable ? L("Tabla activa", "Table active") : L("Tabla no disponible", "Table unavailable")}</span>
            <strong>{caseAssignmentHistory.summary.reassigned} {L("reasignadas", "reassigned")}</strong>
            <p>{caseAssignmentHistory.error || L("Lectura admin, sin escritura ni envio automatico.", "Admin read, no write or automatic send.")}</p>
          </article>
        </div>
        {assignmentHistoryRows.length > 0 && (
          <div className="nuxera-admin-case-assignment-ledger">
            {assignmentHistoryRows.map((assignment) => (
              <article key={assignment.id}>
                <span>{getAssignmentSlaStatusLabel(assignment.slaStatus, L)} / {assignment.status}</span>
                <strong>{assignment.caseLabel}</strong>
                <p>{assignment.assignedReviewerRole || L("Sin responsable", "No owner")} / {assignment.slaTier || L("Sin SLA", "No SLA")}</p>
                <small>{assignment.reason || assignment.applicant}</small>
              </article>
            ))}
          </div>
        )}
        {caseAssignmentPreview?.guardrails?.length > 1 && (
          <footer>{caseAssignmentPreview.guardrails.slice(1, 4).map((guardrail) => <small key={guardrail}>{guardrail}</small>)}</footer>
        )}
      </section>
      <section className="nuxera-admin-action-queue" aria-label={L("Bandeja de acciones admin NUXERA", "NUXERA admin action queue")}>
        <header>
          <span>{L("Action queue", "Action queue")}</span>
          <h2>{L("Seguimiento humano antes de persistencia", "Human follow-up before persistence")}</h2>
        </header>
        <p>{consoleState.summary.adminActionQueue} {L("acciones abiertas", "open actions")}; {consoleState.summary.adminCriticalActions} {L("en ruta critica", "on the critical path")}.</p>
        <div>
          {consoleState.adminActionQueue.slice(0, 6).map((item) => (
            <article key={item.id}>
              <span>{item.priority} / {item.status}</span>
              <strong>{item.domain}</strong>
              <p>{item.action}</p>
              <small>{item.owner} / {item.source}</small>
              <em>{item.guardrail}</em>
            </article>
          ))}
        </div>
      </section>
      <div className="nuxera-admin-control-grid">
        <section aria-label={L("Controles de incidentes NUXERA", "NUXERA incident controls")}>
          <h2>{L("Controles de incidentes", "Incident controls")}</h2>
          {consoleState.incidentControls.map((control) => (
            <article key={control.id}>
              <span>{control.severity} / {control.status}</span>
              <strong>{control.signal}</strong>
              <p>{control.response}</p>
            </article>
          ))}
        </section>
        <section aria-label={L("Evidencia compliance NUXERA", "NUXERA compliance evidence")}>
          <h2>{L("Evidencia compliance", "Compliance evidence")}</h2>
          {consoleState.complianceEvidence.map((item) => (
            <article key={item.id}>
              <span>{item.status}</span>
              <strong>{item.label}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </section>
      </div>
      <div className="nuxera-admin-panels">
        <section>
          <h2>{L("Audit trail local", "Local audit trail")}</h2>
          {consoleState.auditEvents.map((event) => <p key={event}>{event}</p>)}
        </section>
        <section>
          <h2>{L("Politicas admin", "Admin policies")}</h2>
          {consoleState.policies.map((policy) => <p key={policy}>{policy}</p>)}
        </section>
      </div>
      <ConversationChat role="admin" language={language} />
    </section>
  );
}
export default function NuxeraHome({ role = "applicant", section = "home" }) {
  const { L } = useNuxeraLanguage();
  const copy = roleCopy[role] || roleCopy.applicant;
  const sectionLabel = section === "home" ? "Workspace" : section;

  if (role === "applicant") {
    return <ApplicantMissionHome sectionLabel={sectionLabel} variant={section === "followup" ? "followup" : "home"} />;
  }

  if (role === "grantor") {
    return <GrantorQueueHome sectionLabel={section === "queue" ? L("Bandeja", "Inbox") : L("Mesa", "Desk")} variant={section === "queue" ? "inbox" : "decision"} />;
  }

  if (role === "admin") {
    return <AdminOperationsHome sectionLabel={sectionLabel} />;
  }

  return (
    <section className="nuxera-home" aria-labelledby="nuxera-home-title">
      <p className="nuxera-eyebrow">NUXERA Financial Intelligence / {L(copy.eyebrow.es, copy.eyebrow.en)}</p>
      <div className="nuxera-hero-row">
        <div>
          <h1 id="nuxera-home-title">{L(copy.title.es, copy.title.en)}</h1>
          <p>{L(copy.body.es, copy.body.en)}</p>
        </div>
        <div className="nuxera-status-panel">
          <span>{L("Vista paralela", "Parallel view")}</span>
          <strong>{sectionLabel}</strong>
          <small>{L("Legacy intacto", "Legacy intact")}</small>
        </div>
      </div>

      <div className="nuxera-card-grid">
        {copy.cards.map((card) => (
          <article className="nuxera-card" key={card.es}>
            <span>{L(card.es, card.en)}</span>
            <p>{L("Placeholder controlado. La logica existente se conectara en tareas posteriores.", "Controlled placeholder. Existing logic will be connected in later tasks.")}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
