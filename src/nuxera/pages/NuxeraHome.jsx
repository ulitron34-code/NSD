import React from "react";
import { isNuxeraExperienceEnabled } from "../../experience/experienceFlags";
import { useMyOrders } from "../../hooks/useMyOrders";
import { NavLink } from "react-router-dom";
import { mergeAdminControlsWithConsole, useAdminControls } from "../admin/adminControlsAdapter";
import { mergeBackendReadinessWithConsole, useBackendReadiness, useControlledEvidenceScaffold, useControlledVerificationPlan } from "../admin/backendReadinessAdapter";
import { getAdminOperationsConsole } from "../admin/operationsConsole";
import { getApplicantDocumentCenter } from "../applicant/documentCenter";
import { getApplicantDataRoomChecklist, getApplicantGuidedMission, getApplicantMissionReadiness, getApplicantOnboardingWizard } from "../applicant/guidedMission";
import { getApplicantCompanyProjectWorkspace } from "../applicant/projectWorkspace";
import { mergeApplicantChecklistWithWorkspaceState, useApplicantWorkspaceState } from "../applicant/workspaceStateAdapter";
import { useOwnerEvidenceLedger } from "../evidence/evidenceBackendAdapter";
import { getNuxeraEvidenceLedger } from "../evidence/evidenceLedger";
import { getGrantorCaseQueue, getGrantorCaseWorkbench, getGrantorDecisionMemo, getGrantorDocumentSummary, getGrantorQueueSummary } from "../grantor/caseQueue";

const roleCopy = {
  applicant: {
    eyebrow: "Solicitante",
    title: "Continua tu expediente con claridad",
    body: "NUXERA priorizara la siguiente accion, documentos faltantes y progreso real sin exponer complejidad tecnica antes de tiempo.",
    cards: ["Continuar expediente", "Mejorar mi proyecto", "Investigar mi empresa", "Dar seguimiento"],
  },
  grantor: {
    eyebrow: "Otorgante",
    title: "Mesa de decision orientada a evidencia",
    body: "La nueva experiencia concentrara cola, riesgo, documentos, hallazgos y decision en una entrada operativa.",
    cards: ["Casos prioritarios", "Pendientes de informacion", "Listos para dictamen", "Alertas de riesgo"],
  },
  admin: {
    eyebrow: "Administrador",
    title: "Consola NUXERA separada por responsabilidades",
    body: "Operaciones, configuracion, seguridad, IA, integraciones y salud del sistema se separaran sin perder capacidades heredadas.",
    cards: ["Operacion", "Configuracion", "Seguridad", "IA y agentes"],
  },
};

function ApplicantMissionHome({ sectionLabel }) {
  const mission = getApplicantGuidedMission("applicant");
  const readiness = getApplicantMissionReadiness("applicant");
  const onboardingWizard = getApplicantOnboardingWizard("es");
  const { orders, orderId, isDemo, loading: ordersLoading } = useMyOrders();
  const projectWorkspace = getApplicantCompanyProjectWorkspace(orders[0], "es");
  const documentCenter = getApplicantDocumentCenter(orders[0], "es");
  const workspaceState = useApplicantWorkspaceState(orderId, {
    enabled: isNuxeraExperienceEnabled() && !isDemo && Boolean(orderId),
  });
  const checklist = mergeApplicantChecklistWithWorkspaceState(
    getApplicantDataRoomChecklist("es"),
    workspaceState
  );
  const evidenceLedger = useOwnerEvidenceLedger(orderId, {
    enabled: isNuxeraExperienceEnabled() && !isDemo && Boolean(orderId),
    role: "applicant",
    language: "es",
  });
  const stateDetail = ordersLoading
    ? "Buscando expediente real para lectura NUXERA."
    : !orderId || isDemo
      ? "Fallback local; sin expediente real conectado."
      : workspaceState.persisted
        ? `Version ${workspaceState.version} leida desde NUXERA state.`
        : "Endpoint NUXERA disponible; usando checklist local como fallback.";

  return (
    <section className="nuxera-home" aria-labelledby="nuxera-home-title">
      <p className="nuxera-eyebrow">NUXERA Financial Intelligence / Solicitante</p>
      <div className="nuxera-hero-row">
        <div>
          <h1 id="nuxera-home-title">{mission.title}</h1>
          <p>{mission.summary}</p>
        </div>
        <div className="nuxera-status-panel">
          <span>{readiness.status}</span>
          <strong>{readiness.progress}% listo</strong>
          <small>{sectionLabel}</small>
        </div>
      </div>

      <section className="nuxera-mission-next" aria-label="Siguiente accion del solicitante">
        <div>
          <span>Resultado esperado</span>
          <strong>{mission.outcome}</strong>
        </div>
        <p>{readiness.nextAction}</p>
      </section>

      <section className="nuxera-onboarding-wizard" aria-label="Onboarding guiado del solicitante">
        <header>
          <div>
            <span>{onboardingWizard.status}</span>
            <h2>Onboarding del expediente</h2>
          </div>
          <strong>{onboardingWizard.summary.progress}% evidencia lista</strong>
        </header>
        <div>
          {onboardingWizard.stages.map((stage) => (
            <article key={stage.id}>
              <span>Paso {stage.order} / {stage.status}</span>
              <strong>{stage.label}</strong>
              <p>{stage.objective}</p>
              <small>{stage.readyEvidence}/{stage.evidence.length} evidencias listas; siguiente: {stage.nextEvidence}</small>
              <NavLink to={stage.sectionPath}>{stage.owner}</NavLink>
            </article>
          ))}
        </div>
        <footer>{onboardingWizard.guardrails[0]} Siguiente etapa: {onboardingWizard.nextStage.label}.</footer>
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

      <section className="nuxera-project-workspace" aria-label="Datos de empresa y proyecto del solicitante">
        <header>
          <div>
            <span>{projectWorkspace.source}</span>
            <h2>Empresa y proyecto</h2>
            <p>{projectWorkspace.profile.companyName} / {projectWorkspace.profile.projectName}</p>
          </div>
          <strong>{projectWorkspace.summary.readiness}% readiness</strong>
        </header>
        <div className="nuxera-project-profile">
          <article><span>Monto</span><strong>{projectWorkspace.profile.requestedAmount}</strong></article>
          <article><span>Sector</span><strong>{projectWorkspace.profile.sector}</strong></article>
          <article><span>Pais</span><strong>{projectWorkspace.profile.country}</strong></article>
          <article><span>Etapa</span><strong>{projectWorkspace.profile.stage}</strong></article>
        </div>
        <div className="nuxera-project-sections">
          {projectWorkspace.sections.map((section) => (
            <article key={section.id}>
              <span>{section.status}</span>
              <strong>{section.label}</strong>
              <p>{section.readyEvidence}/{section.evidence.length} evidencias listas; siguiente: {section.nextEvidence}</p>
              <small>{section.owner}</small>
              <NavLink to={section.path}>Abrir modulo</NavLink>
            </article>
          ))}
        </div>
        <footer>{projectWorkspace.nextAction} {projectWorkspace.guardrails[0]}</footer>
      </section>
      <section className="nuxera-document-center" aria-label="Centro documental contextual del solicitante">
        <header>
          <div>
            <span>{documentCenter.status}</span>
            <h2>Centro documental contextual</h2>
            <p>{documentCenter.profile.companyName} / {documentCenter.profile.projectName}</p>
          </div>
          <strong>{documentCenter.summary.ready}/{documentCenter.summary.documents} listos</strong>
        </header>
        <div className="nuxera-document-folders">
          {documentCenter.folders.map((folder) => (
            <article key={folder.id}>
              <span>{folder.status}</span>
              <strong>{folder.label}</strong>
              <p>{folder.summary.ready}/{folder.summary.total} listos; {folder.summary.missing + folder.summary.needsAttention} pendientes</p>
              <small>{folder.scope}</small>
              <NavLink to={folder.path}>Abrir contexto</NavLink>
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
      <section className="nuxera-applicant-checklist" aria-label="Checklist documental del solicitante">
        <header>
          <div>
            <span>Data room readiness</span>
            <h2>Checklist para preparar expediente</h2>
            <p className="nuxera-state-caption">{workspaceState.label}: {stateDetail}</p>
          </div>
          <strong>{workspaceState.loading ? "loading" : checklist.summary.status}</strong>
        </header>
        <div className="nuxera-checklist-summary">
          <article><span>Listos</span><strong>{checklist.summary.ready}</strong></article>
          <article><span>En revision</span><strong>{checklist.summary.inReview}</strong></article>
          <article><span>Faltantes</span><strong>{checklist.summary.missing}</strong></article>
          <article><span>Criticos</span><strong>{checklist.summary.criticalMissing}</strong></article>
        </div>
        <div className="nuxera-data-room-folders">
          {checklist.folders.map((folder) => (
            <article key={folder.id}>
              <span>{folder.status}</span>
              <strong>{folder.label}</strong>
              <p>{folder.visibility}</p>
              <small>{folder.items.filter((item) => item.status === "ready").length}/{folder.items.length} documentos listos</small>
            </article>
          ))}
        </div>
        <div className="nuxera-next-evidence">
          <strong>Siguiente evidencia</strong>
          {checklist.nextEvidence.map((item) => (
            <article key={item.id}>
              <p>{item.critical ? "Critico" : "Pendiente"}: {item.label}</p>
              <button
                type="button"
                disabled={!workspaceState.canWrite || workspaceState.saving}
                onClick={() => workspaceState.saveChecklistItem(item.id)}
              >
                {workspaceState.saving ? "Guardando..." : "Marcar listo"}
              </button>
            </article>
          ))}
          <small>
            {checklist.guardrail} {workspaceState.persisted ? `Estado persistido: ${workspaceState.status}.` : "Sin writes desde UI."}
            {workspaceState.saveError ? " Guardado no disponible; fallback local activo." : ""}
          </small>
        </div>
      </section>

      <div className="nuxera-mission-panels">
        <section>
          <h2>Evidencia conectada</h2>
          {mission.evidenceLinks.map((link) => (
            <NavLink className="nuxera-evidence-link" key={link.id} to={link.path}>
              <span>{link.engine}</span>
              <strong>{link.label}</strong>
              <p>{link.signal}</p>
            </NavLink>
          ))}
        </section>
        <section className="nuxera-evidence-ledger">
          <h2>Ledger read-only</h2>
          <p>{evidenceLedger.summary.total} evidencias normalizadas / {evidenceLedger.status}</p>
          {evidenceLedger.backendEvidence?.loading && <small>Cargando evidence_links NUXERA...</small>}
          {evidenceLedger.backendEvidence?.source?.startsWith("remote") && (
            <small>{evidenceLedger.backendEvidence.label}</small>
          )}
          {evidenceLedger.items.slice(0, 4).map((item) => (
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
      </div>
    </section>
  );
}

function GrantorQueueHome({ sectionLabel }) {
  const queue = getGrantorCaseQueue();
  const summary = getGrantorQueueSummary();
  const workbench = getGrantorCaseWorkbench(queue.cases[0]?.id);
  const memo = getGrantorDecisionMemo(workbench.case.id);
  const grantorDocumentSummary = getGrantorDocumentSummary(workbench.case.id);
  const grantorEvidenceLedger = getNuxeraEvidenceLedger("grantor", "es");

  return (
    <section className="nuxera-home" aria-labelledby="nuxera-home-title">
      <p className="nuxera-eyebrow">NUXERA Financial Intelligence / Otorgante</p>
      <div className="nuxera-hero-row">
        <div>
          <h1 id="nuxera-home-title">Cola de casos priorizada</h1>
          <p>Revisa oportunidades por evidencia, riesgo, readiness y siguiente accion sin ejecutar decisiones automaticas.</p>
        </div>
        <div className="nuxera-status-panel">
          <span>{summary.status}</span>
          <strong>{summary.total} casos</strong>
          <small>{sectionLabel}</small>
        </div>
      </div>

      <div className="nuxera-grantor-summary">
        <article><span>Comite</span><strong>{summary.committeeReady}</strong></article>
        <article><span>Faltantes</span><strong>{summary.needsInformation}</strong></article>
        <article><span>Riesgo alto</span><strong>{summary.observed}</strong></article>
        <article><span>Revision humana</span><strong>{summary.requiresHumanReview ? "Si" : "No"}</strong></article>
      </div>

      <div className="nuxera-grantor-queue">
        {queue.cases.map((item) => (
          <article key={item.id}>
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
              {item.evidenceLinks.map((link) => (
                <NavLink key={link.engine} to={link.path}>{link.engine}</NavLink>
              ))}
            </footer>
          </article>
        ))}
      </div>

      <section className="nuxera-grantor-workbench" aria-label="Workbench del caso prioritario">
        <header>
          <div>
            <span>{workbench.status}</span>
            <h2>{workbench.case.name}</h2>
          </div>
          <strong>{workbench.case.readinessLevel}</strong>
        </header>
        <div className="nuxera-workbench-grid">
          <section>
            <h3>Preguntas de revision</h3>
            {workbench.questions.map((question) => (
              <article key={question.id}>
                <span>{question.owner}</span>
                <strong>{question.label}</strong>
                <p>{question.prompt}</p>
              </article>
            ))}
          </section>
          <section>
            <h3>Evidencia requerida</h3>
            {workbench.requiredEvidence.map((item) => (
              <article key={item.id}>
                <span>{item.status}</span>
                <p>{item.label}</p>
              </article>
            ))}
          </section>
          <section>
            <h3>Condiciones no vinculantes</h3>
            {workbench.conditions.map((condition) => (
              <article key={condition}>
                <span>Condicion</span>
                <p>{condition}</p>
              </article>
            ))}
          </section>
        </div>
        <div className="nuxera-workbench-audit">
          {workbench.auditTrail.map((entry) => <p key={entry}>{entry}</p>)}
        </div>
      </section>

      <section className="nuxera-grantor-document-summary" aria-label="Resumen documental autorizado para otorgante">
        <header>
          <div>
            <span>{grantorDocumentSummary.status}</span>
            <h2>Resumen documental autorizado</h2>
          </div>
          <strong>{grantorDocumentSummary.summary.visible}/{grantorDocumentSummary.summary.total} visibles</strong>
        </header>
        <div>
          {grantorDocumentSummary.folders.map((folder) => (
            <article key={folder.id}>
              <span>{folder.status}</span>
              <strong>{folder.label}</strong>
              <p>{folder.evidence.length || 0} senales documentales resumidas.</p>
            </article>
          ))}
        </div>
        <footer>{grantorDocumentSummary.nextAction} {grantorDocumentSummary.guardrails[0]}</footer>
      </section>
      <section className="nuxera-grantor-evidence-ledger" aria-label="Ledger read-only de evidencia otorgante">
        <header>
          <div>
            <span>{grantorEvidenceLedger.status}</span>
            <h2>Evidencia visible resumida</h2>
          </div>
          <strong>{grantorEvidenceLedger.summary.total} senales</strong>
        </header>
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
        <footer>{grantorEvidenceLedger.policies[1]}</footer>
      </section>
            <section className="nuxera-grantor-memo" aria-label="Memo local no vinculante del otorgante">
        <header>
          <div>
            <span>{memo.status}</span>
            <h2>{memo.title}</h2>
          </div>
          <strong>{memo.evidenceSnapshot.visible}/{memo.evidenceSnapshot.documents.length} evidencias</strong>
        </header>
        <div className="nuxera-memo-grid">
          <section>
            <h3>Tesis preliminar</h3>
            {memo.thesis.map((item) => <p key={item}>{item}</p>)}
          </section>
          <section>
            <h3>Riesgos y recomendacion</h3>
            <strong>{memo.recommendation}</strong>
            {memo.riskNotes.map((note) => <p key={note}>{note}</p>)}
          </section>
          <section>
            <h3>Siguientes acciones</h3>
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
      </section>
<section className="nuxera-grantor-policies" aria-label="Politicas de revision otorgante">
        <h2>Politicas de cola</h2>
        {queue.policies.map((policy) => <p key={policy}>{policy}</p>)}
      </section>
    </section>
  );
}


function AdminOperationsHome({ sectionLabel }) {
  const adminControls = useAdminControls({ enabled: isNuxeraExperienceEnabled() });
  const backendReadiness = useBackendReadiness({ enabled: isNuxeraExperienceEnabled() });
  const controlledVerificationPlan = useControlledVerificationPlan({ enabled: isNuxeraExperienceEnabled() });
  const controlledEvidenceScaffold = useControlledEvidenceScaffold({ enabled: isNuxeraExperienceEnabled() });
  const consoleState = mergeBackendReadinessWithConsole(
    mergeAdminControlsWithConsole(getAdminOperationsConsole(), adminControls),
    backendReadiness,
    controlledVerificationPlan
  );

  return (
    <section className="nuxera-home" aria-labelledby="nuxera-home-title">
      <p className="nuxera-eyebrow">NUXERA Financial Intelligence / Administrador</p>
      <div className="nuxera-hero-row">
        <div>
          <h1 id="nuxera-home-title">Consola operativa NUXERA</h1>
          <p>Monitorea salud, gates, auditoria y politicas de la migracion sin cambiar permisos ni activar persistencia.</p>
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
        <article><span>Bloqueos</span><strong>{consoleState.summary.blockedGates}</strong></article>
        <article><span>Readiness</span><strong>{consoleState.summary.readiness}%</strong></article>
      </div>

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

      <section className="nuxera-admin-gates" aria-label="Release gates NUXERA">
        <header>
          <span>Release gates</span>
          <h2>Condiciones antes de persistencia o rollout</h2>
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

      <section className="nuxera-admin-readiness" aria-label="Readiness operativo NUXERA">
        <header>
          <span>Readiness operativo</span>
          <h2>Superficies listas para revision controlada</h2>
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
      <section className="nuxera-admin-backend-readiness" aria-label="Readiness backend NUXERA">
        <header>
          <span>{consoleState.backendReadiness.status}</span>
          <h2>Readiness backend</h2>
        </header>
        <p>{consoleState.backendReadiness.label}: {consoleState.summary.backendReadiness}% visible; {consoleState.summary.backendReadinessUnavailable} pendientes.</p>
        {consoleState.backendReadiness.loading && <small>Cargando readiness NUXERA...</small>}
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
      <section className="nuxera-admin-backend-handoff" aria-label="Handoff readiness backend NUXERA">
        <header>
          <span>{consoleState.backendReadinessHandoff.status}</span>
          <h2>Handoff backend readiness</h2>
        </header>
        <p>{consoleState.backendReadinessHandoff.unavailableTables.length} tablas pendientes; {consoleState.summary.backendReadinessActions} acciones sugeridas.</p>
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
      <section className="nuxera-admin-rls-matrix" aria-label="Matriz RLS NUXERA">
        <header>
          <span>{consoleState.rlsVerificationMatrix.status}</span>
          <h2>Matriz RLS controlada</h2>
        </header>
        <p>{consoleState.summary.rlsVerificationScenarios} escenarios; {consoleState.summary.rlsVerificationBlocked} bloqueados por readiness.</p>
        <div>
          {consoleState.rlsVerificationMatrix.scenarios.map((scenario) => (
            <article key={scenario.id}>
              <span>{scenario.blockedBy.length ? "blocked" : "ready"}</span>
              <strong>{scenario.identity}</strong>
              <p>Debe negar: {scenario.mustDeny.join(", ")}</p>
              <small>{scenario.blockedBy.length ? `Pendiente: ${scenario.blockedBy.join(", ")}` : scenario.mustRead.join(", ")}</small>
            </article>
          ))}
        </div>
        <footer>{consoleState.rlsVerificationMatrix.guardrails[0]}</footer>
      </section>
      <section className="nuxera-admin-controlled-verification" aria-label="Paquete de evidencia RLS y endpoints NUXERA">
        <header>
          <span>{consoleState.controlledVerificationPackage.status}</span>
          <h2>Paquete RLS/endpoints</h2>
        </header>
        <p>
          {consoleState.summary.controlledVerificationEndpoints} endpoints; {consoleState.summary.controlledVerificationDeniedChecks} denegaciones; {consoleState.summary.controlledVerificationNoGo} no-go.
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
      <section className="nuxera-admin-controlled-verification" aria-label="Scaffold de evidencia RLS y endpoints NUXERA">
        <header>
          <span>{controlledEvidenceScaffold.status}</span>
          <h2>Scaffold de evidencia</h2>
        </header>
        <p>
          {controlledEvidenceScaffold.summary.endpointRows} filas de endpoint; {controlledEvidenceScaffold.summary.identities} identidades; {controlledEvidenceScaffold.summary.rollbackChecks} checks rollback.
        </p>
        {controlledEvidenceScaffold.loading && <small>Cargando scaffold NUXERA...</small>}
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
      <section className="nuxera-admin-backend-controls" aria-label="Controles admin NUXERA backend read-only">
        <header>
          <span>{consoleState.backendControls.status}</span>
          <h2>Controles backend read-only</h2>
        </header>
        <p>{consoleState.backendControls.label}: {consoleState.summary.backendControls} controles visibles.</p>
        {consoleState.backendControls.loading && <small>Cargando controles NUXERA...</small>}
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
      <section className="nuxera-admin-evidence-coverage" aria-label="Cobertura de evidencia NUXERA">
        <header>
          <span>Evidence coverage</span>
          <h2>Ledger read-only para auditoria interna</h2>
        </header>
        <div>
          {consoleState.evidenceCoverage.map((item) => (
            <article key={item.engine}>
              <span>{item.visibility}</span>
              <strong>{item.engine}</strong>
              <p>{item.ready}/{item.total} listas; {item.watch} en watch.</p>
              <small>{item.policy}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="nuxera-admin-document-readiness" aria-label="Readiness documental grantor NUXERA">
        <header>
          <span>Grantor documents</span>
          <h2>Readiness documental otorgante</h2>
        </header>
        <p>
          {consoleState.summary.grantorDocumentCases} casos visibles; {consoleState.summary.grantorDocumentPending} senales documentales pendientes.
        </p>
        <div>
          {consoleState.grantorDocumentReadiness.map((item) => (
            <article key={item.caseId}>
              <span>{item.status}</span>
              <strong>{item.label}</strong>
              <p>{item.applicant}: {item.visible}/{item.total} visibles; {item.pending} pendientes.</p>
              <small>{item.nextAction}</small>
              <em>{item.policy}</em>
            </article>
          ))}
        </div>
      </section>

      <section className="nuxera-admin-audit-package" aria-label="Paquete de auditoria admin NUXERA">
        <header>
          <span>{consoleState.auditPackage.status}</span>
          <h2>Paquete local de auditoria</h2>
        </header>
        <p>{consoleState.summary.auditPackageSignals} senales consolidadas; {consoleState.summary.auditPackageActions} acciones abiertas para revision humana.</p>
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
      <section className="nuxera-admin-health-signals" aria-label="Senales de salud admin NUXERA">
        <header>
          <span>Health signals</span>
          <h2>Observabilidad operativa local</h2>
        </header>
        <p>{consoleState.summary.adminHealthSignals} dominios monitoreados; {consoleState.summary.adminHealthWatch} requieren seguimiento.</p>
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

      <section className="nuxera-admin-action-queue" aria-label="Cola de acciones admin NUXERA">
        <header>
          <span>Action queue</span>
          <h2>Seguimiento humano antes de persistencia</h2>
        </header>
        <p>{consoleState.summary.adminActionQueue} acciones abiertas; {consoleState.summary.adminCriticalActions} en ruta critica.</p>
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
        <section aria-label="Controles de incidentes NUXERA">
          <h2>Controles de incidentes</h2>
          {consoleState.incidentControls.map((control) => (
            <article key={control.id}>
              <span>{control.severity} / {control.status}</span>
              <strong>{control.signal}</strong>
              <p>{control.response}</p>
            </article>
          ))}
        </section>
        <section aria-label="Evidencia compliance NUXERA">
          <h2>Evidencia compliance</h2>
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
          <h2>Audit trail local</h2>
          {consoleState.auditEvents.map((event) => <p key={event}>{event}</p>)}
        </section>
        <section>
          <h2>Politicas admin</h2>
          {consoleState.policies.map((policy) => <p key={policy}>{policy}</p>)}
        </section>
      </div>
    </section>
  );
}
export default function NuxeraHome({ role = "applicant", section = "home" }) {
  const copy = roleCopy[role] || roleCopy.applicant;
  const sectionLabel = section === "home" ? "Workspace" : section;

  if (role === "applicant") {
    return <ApplicantMissionHome sectionLabel={sectionLabel} />;
  }

  if (role === "grantor") {
    return <GrantorQueueHome sectionLabel={sectionLabel} />;
  }

  if (role === "admin") {
    return <AdminOperationsHome sectionLabel={sectionLabel} />;
  }

  return (
    <section className="nuxera-home" aria-labelledby="nuxera-home-title">
      <p className="nuxera-eyebrow">NUXERA Financial Intelligence / {copy.eyebrow}</p>
      <div className="nuxera-hero-row">
        <div>
          <h1 id="nuxera-home-title">{copy.title}</h1>
          <p>{copy.body}</p>
        </div>
        <div className="nuxera-status-panel">
          <span>Vista paralela</span>
          <strong>{sectionLabel}</strong>
          <small>Legacy intacto</small>
        </div>
      </div>

      <div className="nuxera-card-grid">
        {copy.cards.map((card) => (
          <article className="nuxera-card" key={card}>
            <span>{card}</span>
            <p>Placeholder controlado. La logica existente se conectara en tareas posteriores.</p>
          </article>
        ))}
      </div>
    </section>
  );
}
