import { describe, expect, it, vi } from "vitest";
import { getAllowedExperiences, isNuxeraExperienceEnabled } from "../experience/experienceFlags";
import { EXPERIENCE_STORAGE_KEY, EXPERIENCE_VALUES, readExperience, writeExperience } from "../experience/experienceStorage";
import { getFinanceAdapterConfig } from "../nuxera/adapters/FinanceWorkspaceAdapter";
import { getAdminWorkspaceConfig } from "../nuxera/adapters/AdminWorkspaceAdapter";
import { mergeAdminControlsWithConsole, normalizeNuxeraAdminControlsResponse } from "../nuxera/admin/adminControlsAdapter";
import { mergeGrantorCasesWithConsole, normalizeNuxeraAdminGrantorCasesResponse, normalizeNuxeraCaseAssignmentHistoryResponse, normalizeNuxeraCaseAssignmentPreviewResponse } from "../nuxera/admin/grantorCasesAdapter";
import { mergeBackendReadinessWithConsole, normalizeNuxeraBackendReadinessResponse, normalizeNuxeraControlledApprovalPackageResponse, normalizeNuxeraControlledChangeRequestResponse, normalizeNuxeraControlledContinuationPackResponse, normalizeNuxeraControlledEvidenceReviewResponse, normalizeNuxeraControlledEvidenceScaffoldResponse, normalizeNuxeraControlledReleaseDossierResponse, normalizeNuxeraControlledRunbookResponse, normalizeNuxeraControlledVerificationPlanResponse, normalizeNuxeraControlledWriteGateResponse } from "../nuxera/admin/backendReadinessAdapter";
import { getAdminOperationsConsole } from "../nuxera/admin/operationsConsole";
import { buildAdminOperationalModules, normalizeAdminOperationalSnapshot } from "../nuxera/admin/operationalSnapshotAdapter";
import { getApplicantDocumentCenter } from "../nuxera/applicant/documentCenter";
import { getApplicantDataRoomChecklist, getApplicantGuidedMission, getApplicantMissionReadiness, getApplicantOnboardingWizard } from "../nuxera/applicant/guidedMission";
import { getApplicantCompanyProjectWorkspace, normalizeApplicantProjectProfile } from "../nuxera/applicant/projectWorkspace";
import { buildEmptyProjectBuilderAnswers, getMissingRequiredProjectBuilderFields, getProjectBuilderQuestions, getRubricFallbackLabel } from "../nuxera/applicant/projectBuilder";
import { buildApplicantChecklistPatchPayload, mergeApplicantChecklistWithWorkspaceState, normalizeNuxeraApplicantChecklistState } from "../nuxera/applicant/workspaceStateAdapter";
import { buildFinanceJourneyFromExpedient, getFinanceJourney, getFinanceJourneyEvidenceLinks } from "../nuxera/finance/financeJourney";
import { readSelectedExpedienteId, subscribeSelectedExpediente, writeSelectedExpedienteId } from "../hooks/useSelectedExpediente";
import { buildGrantorCaseQueueFromPipeline, filterGrantorInboxCases, getGrantorCaseManagementBoard, getGrantorCaseQueue, getGrantorCaseWorkbench, getGrantorDecisionMemo, getGrantorDeskHandoffPreview, getGrantorDocumentSummary, getGrantorInboxFilters, getGrantorQueueSummary, resolveSelectedGrantorCase } from "../nuxera/grantor/caseQueue";
import { MARKET_PROVIDER_STATES, buildMarketWatchlistForExpedient, canUseRealtimeMarketData, getMarketProviderStatus, getMarketWatchlist, getMonitoringPolicies, getProviderDegradationPlan } from "../nuxera/markets/marketDataProvider";
import { buildResearchMissionForExpedient, getEvidenceByFinding, getResearchMission, getResearchMissionTypes } from "../nuxera/intelligence/researchMissions";
import { getNuxeraEngine, getNuxeraEngineNavigationItems, getNuxeraEngines } from "../nuxera/engines/engineRegistry";
import { buildRemoteOnlyEvidenceLedger, mergeNuxeraEvidenceLedger, normalizeNuxeraEvidenceResponse } from "../nuxera/evidence/evidenceBackendAdapter";
import { getEvidenceLedgerByEngine, getNuxeraEvidenceLedger } from "../nuxera/evidence/evidenceLedger";
import { navigationByRole } from "../nuxera/navigation/navigationByRole";
import { resolveNuxeraRole } from "../nuxera/navigation/roleResolver";
import { NUXERA_SECTION_TYPES, resolveNuxeraSection } from "../nuxera/sections/sectionRegistry";
import { buildStrategyDecisionPackageForWorkspace, buildStrategyWorkspaceForExpedient, getStrategyActionPlan, getStrategyDecisionPackage, getStrategyWorkspace } from "../nuxera/strategy/strategyWorkspace";
import { buildCaseOrchestration, buildContextAccessEnvelope } from "../nuxera/orchestration/caseOrchestration";
import { normalizeNuxeraCaseTimelineResponse } from "../nuxera/orchestration/caseTimelineAdapter";
import { NUXERA_COMMUNICATION_EVENT_IDS, buildNuxeraAssignmentNotificationIntents, buildNuxeraConversationEnvelope, buildNuxeraNotificationEvent, getNuxeraNotificationCatalog } from "../nuxera/communications/notificationOperatingModel";
import { mergeNotificationCatalogWithOutboxReadiness, normalizeNuxeraNotificationApprovalPlanResponse, normalizeNuxeraNotificationApprovalReadinessResponse, normalizeNuxeraNotificationApprovalResultResponse, normalizeNuxeraNotificationDeliveryBatchResponse, normalizeNuxeraNotificationOutboxListResponse, normalizeNuxeraNotificationOutboxReadinessResponse, normalizeNuxeraNotificationTemplateCatalogResponse } from "../nuxera/communications/notificationBackendAdapter";
import { mergeCommunicationModelWithConversationAgent, normalizeNuxeraConversationAgentReadinessResponse, normalizeNuxeraConversationTurnResponse } from "../nuxera/communications/conversationAgentBackendAdapter";

describe("NUXERA admin operational snapshot", () => {
  it("maps each admin navigation lane to a specialized protected workspace", () => {
    expect(getAdminWorkspaceConfig("operations").modules.map(([id]) => id)).toEqual(["users", "human-review", "metrics", "sources", "rubrics"]);
    expect(getAdminWorkspaceConfig("security").modules[0][0]).toBe("traceability");
    expect(getAdminWorkspaceConfig("ai").modules[0][0]).toBe("ai-ops");
    expect(getAdminWorkspaceConfig("system").modules[0][0]).toBe("predeploy");
  });

  it("normalizes protected admin sources without inventing fallback records", () => {
    const snapshot = normalizeAdminOperationalSnapshot({
      users: { users: [{ id: "user-1", profile_type: "administrador" }], total: 12 },
      audit: { logs: [{ id: "audit-1", action: "nuxera_state_created" }], total: 31 },
      reviews: { items: [{ id: "review-1", status: "pending" }], total: 4 },
      metrics: { totalOrders: 9, avgGlobalScore: 74 },
      failedSources: ["metrics"],
    });

    expect(snapshot.status).toBe("partial");
    expect(snapshot.summary).toMatchObject({ users: 12, auditEvents: 31, humanReviews: 4, failedSources: 1 });
    expect(snapshot.users[0].id).toBe("user-1");
    expect(snapshot.auditLogs[0].action).toBe("nuxera_state_created");
    expect(snapshot.modules.users.byRole).toEqual([{ role: "administrador", total: 1 }]);
    expect(snapshot.modules.metrics.available).toBe(2);
  });

  it("returns explicit empty collections when every protected source is unavailable", () => {
    const snapshot = normalizeAdminOperationalSnapshot({ failedSources: ["users", "audit", "reviews", "metrics"] });

    expect(snapshot.users).toEqual([]);
    expect(snapshot.auditLogs).toEqual([]);
    expect(snapshot.humanReviews).toEqual([]);
    expect(snapshot.summary.failedSources).toBe(4);
  });

  it("builds review priorities and audit groupings from protected records", () => {
    const modules = buildAdminOperationalModules({
      auditLogs: [
        { id: "a-1", action: "document_reviewed" },
        { id: "a-2", action: "document_reviewed" },
      ],
      humanReviews: [
        { documentId: "d-1", projectName: "Solar Norte", filename: "modelo.xlsx", reviewScore: 42 },
        { documentId: "d-2", caseNumber: "NU-02", documentType: "READY_LEGAL", reviewScore: 82 },
      ],
    });

    expect(modules.reviews.highPriority).toBe(1);
    expect(modules.reviews.items[0]).toMatchObject({ id: "d-1", projectName: "Solar Norte", priority: "alta" });
    expect(modules.audit.byAction).toEqual([{ action: "document_reviewed", total: 2 }]);
  });
});

describe("NUXERA experience controls", () => {
  it("keeps NUXERA hidden unless the feature flag is enabled", () => {
    vi.stubEnv("VITE_NUXERA_EXPERIENCE_ENABLED", "false");

    expect(isNuxeraExperienceEnabled()).toBe(false);
    expect(getAllowedExperiences()).toEqual([
      EXPERIENCE_VALUES.CLASSIC,
      EXPERIENCE_VALUES.CURRENT,
    ]);

    vi.stubEnv("VITE_NUXERA_EXPERIENCE_ENABLED", "true");

    expect(isNuxeraExperienceEnabled()).toBe(true);
    expect(getAllowedExperiences()).toContain(EXPERIENCE_VALUES.NUXERA);
  });

  it("stores the selected experience in the legacy-compatible key", () => {
    writeExperience(EXPERIENCE_VALUES.NUXERA);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      EXPERIENCE_STORAGE_KEY,
      EXPERIENCE_VALUES.NUXERA
    );
    expect(readExperience()).toBe(EXPERIENCE_VALUES.NUXERA);
  });

  it("falls back to the current view when storage contains an unsupported value", () => {
    localStorage.setItem(EXPERIENCE_STORAGE_KEY, "unsupported");

    expect(readExperience()).toBe(EXPERIENCE_VALUES.CURRENT);
  });

  it("rejects unsupported experience values before writing storage", () => {
    expect(() => writeExperience("future-view")).toThrow("Unsupported experience");
  });
});

describe("NUXERA role navigation", () => {
  it("maps demo modes to their NUXERA workspace roles", () => {
    expect(resolveNuxeraRole(null, "solicitante")).toBe("applicant");
    expect(resolveNuxeraRole(null, "otorgante")).toBe("grantor");
    expect(resolveNuxeraRole(null, "nsd_admin")).toBe("admin");
  });

  it("maps persisted user roles without changing legacy role names", () => {
    expect(resolveNuxeraRole({ role: "inversionista" })).toBe("grantor");
    expect(resolveNuxeraRole({ user_metadata: { profile_type: "administrador" } })).toBe("admin");
    expect(resolveNuxeraRole({ role: "solicitante" })).toBe("applicant");
  });

  it("defines role-specific navigation while preserving the dashboard entry point", () => {
    expect(navigationByRole.applicant[0].path).toBe("/dashboard");
    expect(navigationByRole.grantor[0].path).toBe("/dashboard");
    expect(navigationByRole.admin[0].path).toBe("/dashboard");
    expect(navigationByRole.applicant.map((item) => item.id)).toContain("finance");
    expect(navigationByRole.grantor.find((item) => item.id === "queue")?.label).toBe("Gestion de expedientes");
    expect(navigationByRole.admin.map((item) => item.id)).toContain("security");
  });
});


describe("NUXERA engine registry", () => {
  it("defines the four approved engines in migration order", () => {
    expect(getNuxeraEngines().map((engine) => engine.id)).toEqual([
      "finance",
      "intelligence",
      "markets",
      "strategy",
    ]);
  });

  it("is the source for shared navigation items", () => {
    expect(getNuxeraEngineNavigationItems()).toEqual([
      { id: "finance", label: "Finance", path: "/dashboard/nuxera/finance" },
      { id: "intelligence", label: "Intelligence", path: "/dashboard/nuxera/intelligence" },
      { id: "markets", label: "Markets", path: "/dashboard/nuxera/markets" },
      { id: "strategy", label: "Strategy", path: "/dashboard/nuxera/strategy" },
    ]);
  });

  it("provides adapter metadata used by section resolution", () => {
    expect(getNuxeraEngine("strategy")).toMatchObject({
      title: "Soporte de decision",
      adapter: "strategy-workspace",
      status: "foundation-mounted",
    });
  });
});
describe("NUXERA section registry", () => {
  it("mounts Finance as a role-aware legacy adapter section", () => {
    expect(resolveNuxeraSection("finance")).toMatchObject({
      id: "finance",
      type: NUXERA_SECTION_TYPES.LEGACY_ADAPTER,
      adapter: "finance-workspace",
    });
  });

  it("mounts Markets as a provenance-first workspace section", () => {
    expect(resolveNuxeraSection("markets")).toMatchObject({
      id: "markets",
      type: NUXERA_SECTION_TYPES.LEGACY_ADAPTER,
      adapter: "markets-workspace",
    });
  });

  it("mounts Strategy as a decision-support workspace section", () => {
    expect(resolveNuxeraSection("strategy")).toMatchObject({
      id: "strategy",
      type: NUXERA_SECTION_TYPES.LEGACY_ADAPTER,
      adapter: "strategy-workspace",
    });
  });

  it("mounts Intelligence as the document intelligence adapter section", () => {
    expect(resolveNuxeraSection("intelligence")).toMatchObject({
      id: "intelligence",
      type: NUXERA_SECTION_TYPES.LEGACY_ADAPTER,
      adapter: "document-intelligence",
    });
  });

  it("keeps future sections as placeholders until their adapters are approved", () => {
    expect(resolveNuxeraSection("automation")).toMatchObject({
      id: "automation",
      type: NUXERA_SECTION_TYPES.PLACEHOLDER,
    });
    expect(resolveNuxeraSection("home")).toBeNull();
  });
});



describe("NUXERA admin operations console", () => {
  it("builds local admin lanes and release gates", () => {
    const consoleState = getAdminOperationsConsole();

    expect(consoleState.status).toBe("release-gated");
    expect(consoleState.lanes.map((lane) => lane.id)).toEqual(
      expect.arrayContaining(["operations", "security", "ai-agents", "system"])
    );
    expect(consoleState.releaseGates.map((gate) => gate.id)).toEqual(
      expect.arrayContaining(["feature-flag", "legacy-safe", "backend-contracts", "human-review"])
    );
  });

  it("keeps admin operations local and human-review gated", () => {
    const consoleState = getAdminOperationsConsole();

    expect(consoleState.summary.blockedGates).toBeGreaterThan(0);
    expect(consoleState.summary.requiresHumanReview).toBe(true);
    expect(consoleState.policies).toEqual(
      expect.arrayContaining([
        expect.stringContaining("no cambia permisos"),
        expect.stringContaining("contrato backend"),
      ])
    );
    expect(consoleState.auditEvents).toEqual(
      expect.arrayContaining([expect.stringContaining("Gestion de expedientes")])
    );
  });

  it("replaces the demo grantor document readiness with the real admin-wide pipeline when available", () => {
    const base = getAdminOperationsConsole();
    const demoReadiness = base.grantorDocumentReadiness;

    const withoutRemote = mergeGrantorCasesWithConsole(base, normalizeNuxeraAdminGrantorCasesResponse(null));
    expect(withoutRemote.grantorDocumentReadiness).toBe(demoReadiness);
    expect(withoutRemote.policies.join(" ")).toContain("fallback local/demo");

    const remoteState = normalizeNuxeraAdminGrantorCasesResponse({
      pipeline: [{
        share: { id: "share-1", status: "accepted" },
        order: {
          id: "order-admin-1",
          project_name: "Planta industrial",
          service_type: "combo-complete",
          status: "in_progress",
          requested_amount: 15000000,
          metadata: { companyName: "Empresa Admin", sector: "Manufactura", country: "MX" },
        },
        documentsCount: 5,
        latestReview: null,
        scoring: { finalScore: 70, regulatoryValidation: { status: "clear" } },
        interest: null,
        contactRequest: null,
        informationRequests: [],
      }],
      guardrails: ["Admin-wide pipeline view reuses the same real fields."],
    });
    const withRemote = mergeGrantorCasesWithConsole(base, remoteState);

    expect(withRemote.grantorDocumentReadiness).not.toBe(demoReadiness);
    expect(withRemote.grantorDocumentReadiness).toHaveLength(1);
    expect(withRemote.grantorDocumentReadiness[0]).toMatchObject({ caseId: "order-admin-1", applicant: "Empresa Admin" });
    expect(withRemote.summary).toMatchObject({ grantorCasesSource: "remote-authorized-pipeline", grantorCasesTotal: 1 });
    expect(withRemote.policies.join(" ")).toContain("pipeline real");
  });

  it("normalizes case assignment history with SLA summary", () => {
    const history = normalizeNuxeraCaseAssignmentHistoryResponse({
      source: "nuxera_case_assignments",
      tableAvailable: true,
      summary: { total: 2, open: 1, overdue: 1, dueSoon: 0, onTrack: 1 },
      assignments: [
        { id: "assignment-1", orderId: "order-admin-1", slaStatus: "overdue", status: "open" },
        { id: "assignment-2", orderId: "order-admin-2", slaStatus: "on-track", status: "reassigned" },
      ],
      guardrails: ["Assignment history is read-only in this endpoint."],
    });

    expect(history.status).toBe("case-assignment-history-ready");
    expect(history.tableAvailable).toBe(true);
    expect(history.summary).toMatchObject({ total: 2, overdue: 1, onTrack: 1 });
    expect(history.assignments[0]).toMatchObject({ orderId: "order-admin-1", slaStatus: "overdue" });
    expect(history.guardrails.join(" ")).toContain("read-only");
  });
  it("normalizes controlled case assignment previews without claiming persistence", () => {
    const preview = normalizeNuxeraCaseAssignmentPreviewResponse({
      writeEnabled: false,
      guardrails: ["Endpoint remains no-write until explicitly enabled."],
      assignment: {
        status: "case-assignment-preview",
        persisted: false,
        guardrails: ["Preview only; no assignment row was inserted."],
        assignment: {
          orderId: "order-admin-1",
          assignedReviewerRole: "grantor_analyst",
          slaTier: "needs-information-48h",
          source: "preview-no-write",
        },
      },
    });

    expect(preview.source).toBe("remote-preview");
    expect(preview.persisted).toBe(false);
    expect(preview.writeEnabled).toBe(false);
    expect(preview.assignment).toMatchObject({ orderId: "order-admin-1", source: "preview-no-write" });
    expect(preview.guardrails.join(" ")).toContain("no-write");
  });
  it("tracks rollout readiness, incident controls and compliance evidence", () => {
    const consoleState = getAdminOperationsConsole();

    expect(consoleState.summary.readiness).toBeGreaterThan(0);
    expect(consoleState.summary.highSeverityIncidents).toBe(1);
    expect(consoleState.rolloutReadiness.map((item) => item.id)).toEqual(
      expect.arrayContaining(["applicant-surface", "grantor-surface", "admin-surface"])
    );
    expect(consoleState.incidentControls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "data-contracts", status: "blocked-by-design" }),
      ])
    );
    expect(consoleState.complianceEvidence.map((item) => item.id)).toEqual(
      expect.arrayContaining(["identity", "feature-flag", "decision-safety", "market-data"])
    );
  });
});
it("maps read-only evidence coverage into admin console", () => {
  const consoleState = getAdminOperationsConsole();

  expect(consoleState.summary.evidenceSignals).toBeGreaterThan(10);
  expect(consoleState.evidenceCoverage.map((item) => item.engine)).toEqual(
    expect.arrayContaining(["Finance", "Intelligence", "Strategy"])
  );
  expect(consoleState.evidenceCoverage.every((item) => item.visibility === "internal-review")).toBe(true);
  expect(consoleState.evidenceCoverage.every((item) => item.policy.includes("no grants"))).toBe(true);
  expect(consoleState.evidenceLedger.policies.join(" ")).toContain("no otorga acceso nuevo");
});

it("maps grantor document readiness into admin console without permission changes", () => {
  const consoleState = getAdminOperationsConsole();

  expect(consoleState.summary.grantorDocumentCases).toBeGreaterThan(0);
  expect(consoleState.summary.grantorDocumentPending).toBeGreaterThanOrEqual(0);
  expect(consoleState.grantorDocumentReadiness.map((item) => item.status)).toEqual(
    expect.arrayContaining([expect.stringContaining("authorized-summary")])
  );
  expect(consoleState.grantorDocumentReadiness.every((item) => item.policy.includes("no concede acceso nuevo"))).toBe(true);
  expect(consoleState.policies.join(" ")).toContain("no otorga acceso");
});

it("builds a local admin audit package without exports or backend writes", () => {
  const consoleState = getAdminOperationsConsole();

  expect(consoleState.auditPackage).toMatchObject({
    id: "nuxera-admin-audit-package-local",
    generatedFor: "internal-review",
  });
  expect(consoleState.auditPackage.scope).toEqual(
    expect.arrayContaining(["release-gates", "evidence-ledger", "grantor-documents", "incident-controls"])
  );
  expect(consoleState.summary.auditPackageSignals).toBe(consoleState.auditPackage.signals.length);
  expect(consoleState.summary.auditPackageActions).toBeGreaterThan(0);
  expect(consoleState.auditPackage.signals.map((signal) => signal.id)).toEqual(
    expect.arrayContaining(["blocked-gates", "evidence-signals", "grantor-document-pending"])
  );
  expect(consoleState.auditPackage.guardrails.join(" ")).toContain("no exporta archivos");
  expect(consoleState.auditPackage.guardrails.join(" ")).toContain("No cambia permisos");
});
it("builds local admin health signals without changing runtime controls", () => {
  const consoleState = getAdminOperationsConsole();

  expect(consoleState.summary.adminHealthSignals).toBe(consoleState.adminHealthSignals.length);
  expect(consoleState.summary.adminHealthWatch).toBeGreaterThan(0);
  expect(consoleState.adminHealthSignals.map((signal) => signal.id)).toEqual(
    expect.arrayContaining([
      "rollout-governance",
      "runtime-tooling",
      "evidence-observability",
      "document-visibility",
      "decision-safety",
      "ai-automation",
      "audit-readiness",
    ])
  );
  expect(consoleState.adminHealthSignals.every((signal) => signal.nextAction)).toBe(true);
  expect(consoleState.adminHealthSignals.find((signal) => signal.id === "document-visibility").nextAction).toContain("sin abrir archivos");
});

it("builds a local admin action queue from health signals and audit actions", () => {
  const consoleState = getAdminOperationsConsole();

  expect(consoleState.summary.adminActionQueue).toBe(consoleState.adminActionQueue.length);
  expect(consoleState.summary.adminCriticalActions).toBeGreaterThan(0);
  expect(consoleState.adminActionQueue.map((item) => item.source)).toEqual(
    expect.arrayContaining(["admin-health-signal", "admin-audit-package"])
  );
  expect(consoleState.adminActionQueue.every((item) => item.status === "local-open")).toBe(true);
  expect(consoleState.adminActionQueue.every((item) => item.guardrail.includes("no ejecuta") || item.guardrail.includes("revision humana"))).toBe(true);
});

it("normalizes backend admin controls as read-only non-activating controls", () => {
  const state = normalizeNuxeraAdminControlsResponse({
    workspaceRole: "admin",
    controls: {
      persisted: true,
      controls: [
        {
          id: "control-1",
          controlType: "incident",
          scope: "global",
          status: "open",
          severity: "high",
          payload: {
            label: "Browser blocker",
            signal: "spawn EPERM",
            response: "Mantener validacion por build/unit tests.",
          },
          guardrails: ["No activa automatizaciones."],
        },
      ],
      guardrails: ["Read-only admin controls."],
    },
  });

  expect(state).toMatchObject({
    source: "remote-persisted",
    status: "read-only-remote",
    persisted: true,
  });
  expect(state.summary).toMatchObject({ total: 1, highSeverity: 1 });
  expect(state.controls[0]).toMatchObject({
    typeLabel: "Incidente",
    remoteAdminControl: true,
    detail: "spawn EPERM",
  });
});

it("merges backend admin controls into the local operations console without changing policies", () => {
  const localConsole = getAdminOperationsConsole();
  const remoteState = normalizeNuxeraAdminControlsResponse({
    controls: {
      persisted: true,
      controls: [
        {
          id: "gate-1",
          controlType: "release_gate",
          scope: "global",
          status: "blocked_until_review",
          severity: "medium",
          payload: { label: "SQL review", requirement: "Verificar RLS antes de writes." },
        },
      ],
    },
  });
  const merged = mergeAdminControlsWithConsole(localConsole, remoteState);

  expect(merged.backendControls.persisted).toBe(true);
  expect(merged.summary.backendControls).toBe(1);
  expect(merged.releaseGates).toBe(localConsole.releaseGates);
  expect(merged.policies.join(" ")).toContain("read-only");
});
describe("NUXERA applicant guided mission", () => {
  it("builds a financing readiness mission with engine-linked steps", () => {
    const mission = getApplicantGuidedMission("applicant");

    expect(mission.title).toContain("financiamiento");
    expect(mission.steps.map((step) => step.engine)).toEqual(
      expect.arrayContaining(["Finance", "Intelligence", "Strategy"])
    );
    expect(mission.evidenceLinks.map((link) => link.path)).toEqual(
      expect.arrayContaining([
        "/dashboard/nuxera/finance",
        "/dashboard/nuxera/intelligence",
        "/dashboard/nuxera/strategy",
      ])
    );
  });

  it("keeps applicant mission guarded by human review and no-guarantee language", () => {
    const mission = getApplicantGuidedMission();
    const readiness = getApplicantMissionReadiness();

    expect(readiness.status).toBe("evidence-in-progress");
    expect(readiness.requiresHumanReview).toBe(true);
    expect(readiness.openStepIds).toContain("complete-evidence");
    expect(mission.guardrails).toEqual(
      expect.arrayContaining([
        expect.stringContaining("no aprueba credito"),
        expect.stringContaining("no como recomendacion"),
      ])
    );
  });

  it("builds a local applicant onboarding wizard from checklist evidence", () => {
    const wizard = getApplicantOnboardingWizard("es");

    expect(wizard.status).toBe("local-preparation-only");
    expect(wizard.summary.totalStages).toBe(3);
    expect(wizard.stages.map((stage) => stage.id)).toEqual(
      expect.arrayContaining(["company-profile", "project-case", "risk-impact"])
    );
    expect(wizard.nextStage.missingEvidence).toBeGreaterThan(0);
    expect(wizard.guardrails.join(" ")).toContain("no persiste");
    expect(wizard.guardrails.join(" ")).toContain("No aprueba credito");
  });
  it("normalizes applicant company and project metadata without persistence", () => {
    const profile = normalizeApplicantProjectProfile({
      id: "order-1",
      projectName: "Planta Solar Norte",
      metadata: {
        companyName: "Energia Norte S.A.",
        requestedAmount: "USD 2.5M",
        sector: "Energia distribuida",
        country: "MX",
        useOfFunds: "CAPEX y capital de trabajo",
      },
    });

    expect(profile).toMatchObject({
      companyName: "Energia Norte S.A.",
      projectName: "Planta Solar Norte",
      requestedAmount: "USD 2.5M",
      sector: "Energia distribuida",
    });
  });

  it("builds a local company/project workspace with evidence guardrails", () => {
    const workspace = getApplicantCompanyProjectWorkspace(null, "es");

    expect(workspace.source).toBe("local-fallback");
    expect(workspace.sections.map((section) => section.id)).toEqual(
      expect.arrayContaining(["company-profile", "project-case", "funding-plan", "risk-impact"])
    );
    expect(workspace.summary.missingEvidence).toBeGreaterThan(0);
    expect(workspace.nextAction).toContain("Completar");
    expect(workspace.guardrails.join(" ")).toContain("no persiste");
    expect(workspace.guardrails.join(" ")).toContain("No cambia permisos");
  });
  it("builds a contextual read-only applicant document center", () => {
    const center = getApplicantDocumentCenter(null, "es");

    expect(center.status).toBe("read-only-local");
    expect(center.folders.map((folder) => folder.id)).toEqual(
      expect.arrayContaining(["identity-kyb", "project-file", "financial-file", "impact-risk"])
    );
    expect(center.summary.documents).toBeGreaterThan(10);
    expect(center.activeFolder.status).toBe("needs-document-work");
    expect(center.nextAction).toContain("Revisar");
    expect(center.guardrails.join(" ")).toContain("no sube");
    expect(center.guardrails.join(" ")).toContain("No cambia permisos");
  });
  it("builds a local data-room checklist from minimum requirements", () => {
    const checklist = getApplicantDataRoomChecklist("es");

    expect(checklist.summary.total).toBe(13);
    expect(checklist.summary.status).toBe("critical-gaps");
    expect(checklist.summary.criticalMissing).toBeGreaterThan(0);
    expect(checklist.categories.map((category) => category.id)).toEqual(
      expect.arrayContaining(["documentacion", "viabilidad", "financiero", "impacto"])
    );
    expect(checklist.nextEvidence[0]).toMatchObject({
      id: expect.any(String),
      status: "missing",
    });
  });

  it("groups applicant requirements into data-room folders without persistence", () => {
    const checklist = getApplicantDataRoomChecklist();

    expect(checklist.folders.length).toBeGreaterThan(0);
    expect(checklist.folders.map((folder) => folder.id)).toEqual(
      expect.arrayContaining(["identity-kyb", "finance-transparency", "impact-risk"])
    );
    expect(checklist.guardrail).toContain("Checklist local");
  });

  it("normalizes read-only NUXERA applicant checklist state", () => {
    const state = normalizeNuxeraApplicantChecklistState({
      orderId: "order-1",
      states: {
        checklist: {
          orderId: "order-1",
          surface: "checklist",
          status: "in_progress",
          version: 3,
          persisted: true,
          payload: { completedItemIds: ["modelo_financiero"] },
          guardrails: ["Persistencia limitada a applicant checklist."],
        },
      },
    });

    expect(state).toMatchObject({
      source: "remote-persisted",
      persisted: true,
      status: "in_progress",
      version: 3,
      completedItemIds: ["modelo_financiero"],
    });
  });

  it("builds a guarded applicant checklist patch payload", () => {
    const payload = buildApplicantChecklistPatchPayload({
      payload: { completedItemIds: ["modelo_financiero"], note: "keep" },
      completedItemIds: ["modelo_financiero"],
    }, "plan_negocios");

    expect(payload).toEqual({
      status: "in_progress",
      payload: {
        completedItemIds: ["modelo_financiero", "plan_negocios"],
        lastCompletedItemId: "plan_negocios",
        source: "nuxera-applicant-checklist-ui",
      },
    });
  });
  it("merges persisted checklist completion without creating frontend writes", () => {
    const localChecklist = getApplicantDataRoomChecklist();
    const merged = mergeApplicantChecklistWithWorkspaceState(localChecklist, {
      source: "remote-persisted",
      persisted: true,
      status: "in_progress",
      version: 2,
      completedItemIds: ["modelo_financiero"],
    });
    const modeloFinanciero = merged.categories
      .flatMap((category) => category.items)
      .find((item) => item.id === "modelo_financiero");

    expect(modeloFinanciero).toMatchObject({
      status: "ready",
      persistedByNuxera: true,
    });
    expect(merged.workspaceState).toMatchObject({ persisted: true, version: 2 });
    expect(merged.summary.ready).toBe(localChecklist.summary.ready + 1);
    expect(merged.summary.missing).toBe(localChecklist.summary.missing - 1);
  });
});

describe("NUXERA evidence ledger", () => {
  it("builds a read-only evidence ledger across Finance, Intelligence and Strategy", () => {
    const ledger = getNuxeraEvidenceLedger("applicant");

    expect(ledger.status).toBe("read-only-local");
    expect(ledger.summary.total).toBeGreaterThan(10);
    expect(ledger.items.map((item) => item.engine)).toEqual(
      expect.arrayContaining(["Finance", "Intelligence", "Strategy"])
    );
    expect(ledger.policies).toEqual(
      expect.arrayContaining([
        expect.stringContaining("no crea evidence_links"),
        expect.stringContaining("no otorga acceso nuevo"),
      ])
    );
  });

  it("keeps evidence visibility role-scoped without changing permissions", () => {
    const applicantLedger = getNuxeraEvidenceLedger("applicant");
    const grantorLedger = getNuxeraEvidenceLedger("grantor");
    const grouped = getEvidenceLedgerByEngine("grantor");

    expect(applicantLedger.summary.visibilityModes).toEqual(["owner"]);
    expect(grantorLedger.summary.visibilityModes).toEqual(["authorized-summary-only"]);
    expect(Object.keys(grouped)).toEqual(expect.arrayContaining(["Finance", "Intelligence", "Strategy"]));
    expect(grouped.Intelligence[0]).toMatchObject({ sourceType: expect.any(String), guardrail: expect.any(String) });
  });

  it("provides grantor-safe evidence rows for workbench and memo", () => {
    const ledger = getNuxeraEvidenceLedger("grantor");
    const visibleRows = ledger.items.slice(0, 6);

    expect(visibleRows).toHaveLength(6);
    expect(visibleRows.every((item) => item.visibility === "authorized-summary-only")).toBe(true);
    expect(visibleRows.every((item) => item.guardrail.includes("No") || item.guardrail.includes("no"))).toBe(true);
    expect(ledger.policies.join(" ")).toContain("no otorga acceso nuevo");
  });

  it("normalizes owner-scoped backend evidence links without granting document access", () => {
    const state = normalizeNuxeraEvidenceResponse({
      orderId: "order-1",
      workspaceRole: "applicant",
      evidence: {
        orderId: "order-1",
        persisted: true,
        links: [
          {
            id: "evidence-1",
            engine: "finance",
            label: "Modelo financiero revisado",
            visibility: "owner",
            documentId: "doc-1",
            provenance: {
              source: "nuxera_evidence_links",
              sourceType: "document-link",
              path: "/dashboard/nuxera/finance",
            },
          },
        ],
        guardrails: ["No document access is granted."],
      },
    });

    expect(state).toMatchObject({
      source: "remote-persisted",
      status: "read-only-remote",
      persisted: true,
      orderId: "order-1",
    });
    expect(state.items[0]).toMatchObject({
      engine: "Finance",
      visibility: "owner",
      remoteEvidenceLink: true,
      guardrail: expect.stringContaining("no concede acceso documental"),
    });
  });

  it("merges persisted backend evidence ahead of the local ledger fallback", () => {
    const localLedger = getNuxeraEvidenceLedger("applicant");
    const remoteState = normalizeNuxeraEvidenceResponse({
      evidence: {
        persisted: true,
        links: [
          {
            id: "evidence-remote-1",
            engine: "intelligence",
            label: "Resumen documental persistido",
            visibility: "owner",
            provenance: { source: "nuxera_evidence_links" },
          },
        ],
      },
    });
    const merged = mergeNuxeraEvidenceLedger(localLedger, remoteState);

    expect(merged.status).toBe("read-only-remote-merged");
    expect(merged.items[0]).toMatchObject({
      id: "evidence-remote-1",
      engine: "Intelligence",
    });
    expect(merged.backendEvidence.persisted).toBe(true);
    expect(merged.policies.join(" ")).toContain("no otorgan acceso documental");
  });

  it("never mixes demo evidence into an authorized real grantor ledger", () => {
    const localLedger = getNuxeraEvidenceLedger("grantor");
    const remoteState = normalizeNuxeraEvidenceResponse({
      orderId: "real-order-1",
      workspaceRole: "grantor",
      evidence: {
        orderId: "real-order-1",
        persisted: true,
        links: [{
          id: "real-evidence-1",
          engine: "finance",
          label: "Evidencia autorizada real",
          visibility: "authorized_grantor",
        }],
      },
    });
    const ledger = buildRemoteOnlyEvidenceLedger(localLedger, remoteState);

    expect(ledger.items).toHaveLength(1);
    expect(ledger.items[0].id).toBe("real-evidence-1");
    expect(ledger.items.some((item) => item.id.startsWith("document-"))).toBe(false);
    expect(ledger.policies.join(" ")).toContain("nunca mezcla evidencia demo");
  });

  it("shows zero grantor evidence when the authorized remote ledger fails", () => {
    const localLedger = getNuxeraEvidenceLedger("grantor");
    const ledger = buildRemoteOnlyEvidenceLedger(localLedger, {
      source: "remote-error-empty",
      status: "read-only-remote-error",
      persisted: false,
      items: [],
      error: "nuxera-grantor-evidence-unavailable",
    });

    expect(ledger.items).toEqual([]);
    expect(ledger.summary.total).toBe(0);
    expect(ledger.backendEvidence.error).toBe("nuxera-grantor-evidence-unavailable");
  });
});

describe("NUXERA Finance real expedient journey", () => {
  it("derives grantor finance status from the authorized pipeline entry", () => {
    const journey = buildFinanceJourneyFromExpedient({
      order: { id: "order-1", project_name: "Parque Solar", risk_level: "Medio" },
      scoring: { finalScore: 78 },
      documentsCount: 6,
    }, "grantor");

    expect(journey).toMatchObject({
      source: "real-expedient",
      expedientId: "order-1",
      projectName: "Parque Solar",
      progress: 78,
    });
    expect(journey.effort).toContain("6 documentos");
  });

  it("uses the persisted readiness grade when detailed scoring is unavailable", () => {
    const journey = buildFinanceJourneyFromExpedient({ id: "order-2", readiness_grade: "B" }, "applicant");

    expect(journey.progress).toBe(75);
    expect(journey.alerts).toContain("El score financiero detallado aun no esta disponible.");
  });

  it("notifies all workspaces when the selected expedient changes", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSelectedExpediente(listener);

    writeSelectedExpedienteId("order-shared");

    expect(readSelectedExpedienteId()).toBe("order-shared");
    expect(listener).toHaveBeenCalledWith("order-shared");
    unsubscribe();
  });
});

describe("NUXERA cross-engine expedient context", () => {
  const context = {
    role: "grantor",
    source: "authorized-grantor-entry",
    isDemo: false,
    order: {
      id: "order-godzilla",
      project_name: "Infraestructura Delta",
      risk_level: "Alto",
      metadata: { companyName: "Delta SA", sector: "Infraestructura", country: "MX" },
    },
    expedient: { scoring: { finalScore: 54 } },
  };

  it("binds Intelligence subject and report to the selected real expedient", () => {
    const mission = buildResearchMissionForExpedient(context);

    expect(mission.subject).toMatchObject({ value: "Delta SA", status: "contexto real autorizado" });
    expect(mission.report.expedientId).toBe("order-godzilla");
    expect(mission.findings[0].claim).toContain("Alto");
  });

  it("adds an expedient-specific market risk event without claiming realtime data", () => {
    const watchlist = buildMarketWatchlistForExpedient(context);

    expect(watchlist.expedientId).toBe("order-godzilla");
    expect(watchlist.events[0]).toMatchObject({ id: "selected-expedient-risk", severity: "caution" });
    expect(watchlist.status.realtimeAvailable).toBe(false);
  });

  it("pauses a high-risk Strategy case and preserves human review", () => {
    const workspace = buildStrategyWorkspaceForExpedient(context);
    const decisionPackage = buildStrategyDecisionPackageForWorkspace(workspace);

    expect(workspace.recommendation.summary).toContain("Pausar avance");
    expect(workspace.recommendation.auditState).toContain("order-godzilla");
    expect(decisionPackage.status).toBe("human-review-required");
  });

  it("keeps demo engines on isolated local models", () => {
    const demoContext = { ...context, isDemo: true };

    expect(buildResearchMissionForExpedient(demoContext).subject.status).toBe("pendiente de seleccion real");
    expect(buildMarketWatchlistForExpedient(demoContext).expedientId).toBeUndefined();
    expect(buildStrategyWorkspaceForExpedient(demoContext).expedientId).toBeUndefined();
  });
});

describe("NUXERA secure multi-agent orchestration", () => {
  const authorizedContext = {
    role: "grantor",
    source: "authorized-grantor-entry",
    selectedId: "order-agent",
    isDemo: false,
    order: { id: "order-agent", project_name: "Puerto Verde", risk_level: "Medio" },
    expedient: { documentsCount: 4, scoring: { finalScore: 77 } },
  };

  it("creates all planned agents with traceability and mandatory human review", () => {
    const orchestration = buildCaseOrchestration(authorizedContext);

    expect(orchestration.status).toBe("ready-for-controlled-human-trigger");
    expect(orchestration.agents).toHaveLength(11);
    expect(orchestration.summary.humanReview).toBe(11);
    expect(orchestration.agents.every((agent) => agent.traceId.startsWith("order-agent:"))).toBe(true);
    expect(orchestration.agents.every((agent) => agent.model === "not-selected" && agent.estimatedCostUsd === 0)).toBe(true);
  });

  it("gates dependent agents when documents and scoring are missing", () => {
    const orchestration = buildCaseOrchestration({
      ...authorizedContext,
      expedient: { documentsCount: 0, scoring: {} },
    });

    expect(orchestration.status).toBe("evidence-gated");
    expect(orchestration.summary.waitingEvidence).toBeGreaterThan(0);
    expect(orchestration.evidencePackage.items.filter((item) => item.status === "missing").map((item) => item.id)).toEqual(
      expect.arrayContaining(["documents", "score"])
    );
  });

  it("blocks a grantor context that was not produced by the authorized pipeline", () => {
    const access = buildContextAccessEnvelope({ ...authorizedContext, source: "applicant-order" });
    const orchestration = buildCaseOrchestration({ ...authorizedContext, source: "applicant-order" });

    expect(access.allowed).toBe(false);
    expect(orchestration.agents).toEqual([]);
  });

  it("blocks mismatched selections and demo identities", () => {
    expect(buildContextAccessEnvelope({ ...authorizedContext, selectedId: "another-order" }).allowed).toBe(false);
    expect(buildContextAccessEnvelope({ ...authorizedContext, isDemo: true }).allowed).toBe(false);
  });
});
describe("NUXERA case timeline adapter", () => {
  it("normalizes a remote case timeline without inventing sensitive content", () => {
    const timeline = normalizeNuxeraCaseTimelineResponse({
      orderId: "order-1",
      workspaceRole: "grantor",
      timeline: {
        status: "timeline-ready",
        orderId: "order-1",
        workspaceRole: "grantor",
        summary: { total: 2, blockers: 1, evidence: 1, failedNotifications: 1, availableSources: 4, unavailableSources: 1, byType: { evidence: 1, notification: 1 }, typeFilters: [{ id: "evidence", label: "Evidencia", count: 1, active: true }], phases: [{ id: "evidence", label: "Evidencia", count: 1, blockers: 0, status: "active" }], health: { status: "notification-risk", label: "Riesgo de notificacion", signals: [{ id: "notifications", label: "Notificaciones", value: "1/0", status: "failed" }] } },
        sources: [{ id: "evidence-links", status: "available", count: 1 }],
        events: [
          { id: "ev-1", type: "evidence", source: "nuxera_evidence_links", title: "Evidencia", description: "Referencia autorizada", severity: "info", sensitiveContentExcluded: true },
          { id: "ev-2", type: "notification", source: "nuxera_notification_outbox", title: "Aviso", description: "Queued", severity: "warning" },
        ],
        guardrails: ["Timeline read-only."],
      },
      guardrails: ["No content payloads."],
    });

    expect(timeline).toMatchObject({
      source: "remote",
      status: "timeline-ready",
      orderId: "order-1",
      workspaceRole: "grantor",
      summary: { total: 2, blockers: 1, evidence: 1, notifications: 1, failedNotifications: 1, availableSources: 4, unavailableSources: 1 },
    });
    expect(timeline.summary.health).toMatchObject({ status: "notification-risk" });
    expect(timeline.summary.typeFilters[0]).toMatchObject({ id: "evidence", count: 1 });
    expect(timeline.summary.phases[0]).toMatchObject({ id: "evidence", count: 1 });
    expect(timeline.events).toHaveLength(2);
    expect(timeline.events.every((event) => event.sensitiveContentExcluded)).toBe(true);
    expect(timeline.guardrails.join(" ")).toContain("No content payloads");

    const missing = normalizeNuxeraCaseTimelineResponse(null);
    expect(missing.events).toEqual([]);
    expect(missing.error).toBe("nuxera-case-timeline-missing");
  });
});

describe("NUXERA backend readiness adapter", () => {
  it("normalizes backend readiness responses for admin review", () => {
    const readiness = normalizeNuxeraBackendReadinessResponse({
      readiness: {
        status: "blocked-by-backend-readiness",
        ready: false,
        summary: { total: 3, available: 2, unavailable: 1, readiness: 67 },
        signals: [
          { id: "workspace-states", table: "nuxera_workspace_states", label: "Workspace states", status: "available", ready: true },
          { id: "evidence-links", table: "nuxera_evidence_links", label: "Evidence links", status: "unavailable", ready: false },
        ],
        guardrails: ["Read-only backend readiness; no aplica SQL."],
      },
    });

    expect(readiness.status).toBe("blocked-by-backend-readiness");
    expect(readiness.summary.readiness).toBe(67);
    expect(readiness.signals[1]).toMatchObject({ table: "nuxera_evidence_links", ready: false });
    expect(readiness.guardrails.join(" ")).toContain("no aplica SQL");
  });

  it("normalizes remote controlled verification plans for admin review", () => {
    const remotePlan = normalizeNuxeraControlledVerificationPlanResponse({
      verificationPlan: {
        id: "nuxera-controlled-rls-endpoint-evidence",
        status: "template-required-before-controlled-run",
        evidenceTemplate: { path: "docs/nuxera-migration/docs/migration/NUXERA_CONTROLLED_RLS_ENDPOINT_EVIDENCE_TEMPLATE.md" },
        requiredIdentities: [
          { id: "applicant-owner" },
          { id: "different-applicant" },
          { id: "authorized-grantor" },
          { id: "admin-internal" },
        ],
        endpointChecks: [
          { id: "get-state-owner", path: "/api/nuxera/orders/:orderId/state" },
          { id: "patch-checklist-owner", path: "/api/nuxera/orders/:orderId/state/checklist" },
          { id: "get-evidence-owner", path: "/api/nuxera/orders/:orderId/evidence" },
          { id: "get-admin-controls", path: "/api/nuxera/admin/controls" },
          { id: "get-admin-readiness", path: "/api/nuxera/admin/readiness" },
        ],
        deniedChecks: [{ id: "state-foreign-denied" }],
        noGoCriteria: ["No row existence leaks."],
        rollbackChecks: ["Prior known-good commit recorded."],
        summary: { identities: 4, endpoints: 5, deniedChecks: 1, noGoCriteria: 1, rollbackChecks: 1 },
        guardrails: ["Read-only verification plan."],
      },
      guardrails: ["Route does not execute endpoints."],
    });
    const merged = mergeBackendReadinessWithConsole(getAdminOperationsConsole(), null, remotePlan);

    expect(remotePlan.source).toBe("remote-read-only");
    expect(remotePlan.endpointChecks).toHaveLength(5);
    expect(remotePlan.summary.identities).toBe(4);
    expect(remotePlan.evidenceTemplate.path).toContain("NUXERA_CONTROLLED_RLS_ENDPOINT_EVIDENCE_TEMPLATE.md");
    expect(remotePlan.guardrails.join(" ")).toContain("does not execute endpoints");
    expect(merged.controlledVerificationPackage.source).toBe("remote-read-only");
    expect(merged.summary.controlledVerificationEndpoints).toBe(5);
    expect(merged.adminActionQueue.map((item) => item.id)).toEqual(
      expect.arrayContaining(["controlled-verification-template", "controlled-verification-state-foreign-denied"])
    );
  });

  it("normalizes remote controlled evidence scaffolds for admin review", () => {
    const scaffold = normalizeNuxeraControlledEvidenceScaffoldResponse({
      evidenceScaffold: {
        id: "nuxera-controlled-evidence-scaffold",
        status: "scaffold-ready-for-controlled-run",
        sourcePlanId: "nuxera-controlled-rls-endpoint-evidence",
        metadata: { environment: "non-production-supabase", repoCommit: "abc1234" },
        summary: { identities: 4, endpointRows: 8, noGoCriteria: 8, rollbackChecks: 5, sqlDrafts: 3 },
        markdown: "# NUXERA Controlled RLS and Endpoint Evidence - Scaffold\n\n## Required endpoint evidence",
        guardrails: ["Scaffold only; no endpoint execution."],
      },
      guardrails: ["Route does not execute endpoint checks."],
    });

    expect(scaffold.source).toBe("remote-read-only");
    expect(scaffold.summary.endpointRows).toBe(8);
    expect(scaffold.metadata.repoCommit).toBe("abc1234");
    expect(scaffold.markdown).toContain("Required endpoint evidence");
    expect(scaffold.guardrails.join(" ")).toContain("does not execute endpoint checks");
  });

  it("normalizes remote controlled runbooks for admin review", () => {
    const runbook = normalizeNuxeraControlledRunbookResponse({
      runbook: {
        id: "nuxera-controlled-runbook",
        status: "ready-for-controlled-supabase-run",
        readyForRun: true,
        sourceScaffoldId: "nuxera-controlled-evidence-scaffold",
        sourcePlanId: "nuxera-controlled-rls-endpoint-evidence",
        missingMetadata: [],
        summary: { identities: 4, endpointRows: 8, noGoCriteria: 8, rollbackChecks: 5, sqlDrafts: 3, missingMetadata: 0 },
        commands: [{ id: "generate-scaffold-markdown", command: "npm run scaffold:nuxera-evidence" }],
        acceptanceGates: ["All four RLS identities have observed pass/fail evidence."],
        nextDecision: "Run controlled non-production Supabase verification.",
        guardrails: ["Runbook is read-only."],
      },
      guardrails: ["Route does not execute endpoint checks."],
    });

    expect(runbook.source).toBe("remote-read-only");
    expect(runbook.readyForRun).toBe(true);
    expect(runbook.summary.missingMetadata).toBe(0);
    expect(runbook.commands[0].id).toBe("generate-scaffold-markdown");
    expect(runbook.guardrails.join(" ")).toContain("does not execute endpoint checks");
  });

  it("normalizes remote controlled evidence reviews for admin review", () => {
    const review = normalizeNuxeraControlledEvidenceReviewResponse({
      evidenceReview: {
        id: "nuxera-controlled-evidence-review",
        status: "ready-for-human-approval-review",
        readyForHumanReview: true,
        sourcePlanId: "nuxera-controlled-rls-endpoint-evidence",
        summary: { requiredSections: 7, missingSections: 0, todoMarkers: 0, missingDecisions: 0, noGoIndicators: 0 },
        missingSections: [],
        missingDecisions: [],
        blockers: [],
        nextDecision: "Route completed evidence to human approval review.",
        guardrails: ["Review is read-only."],
      },
      guardrails: ["Ready-for-human-review is not production approval."],
    });

    expect(review.source).toBe("remote-read-only");
    expect(review.readyForHumanReview).toBe(true);
    expect(review.summary.missingSections).toBe(0);
    expect(review.blockers).toEqual([]);
    expect(review.guardrails.join(" ")).toContain("not production approval");
  });

  it("normalizes remote controlled approval packages for release review", () => {
    const approvalPackage = normalizeNuxeraControlledApprovalPackageResponse({
      approvalPackage: {
        id: "nuxera-controlled-approval-package",
        status: "ready-for-human-release-decision",
        readyForReleaseDecision: true,
        sourceReviewId: "nuxera-controlled-evidence-review",
        sourcePlanId: "nuxera-controlled-rls-endpoint-evidence",
        approvalMetadata: { approver: "Compliance lead", decision: "approve" },
        missingApprovalMetadata: [],
        summary: { evidenceReady: true, evidenceBlockers: 0, approvalMetadataMissing: 0, decisionAccepted: true, blockers: 0 },
        blockers: [],
        releaseChecklist: ["Human approver reviewed completed controlled evidence."],
        nextDecision: "Route to human release decision; do not enable writes automatically.",
        guardrails: ["Approval package is read-only."],
      },
      guardrails: ["Ready-for-human-release-decision is not automatic production approval."],
    });

    expect(approvalPackage.source).toBe("remote-read-only");
    expect(approvalPackage.readyForReleaseDecision).toBe(true);
    expect(approvalPackage.summary.approvalMetadataMissing).toBe(0);
    expect(approvalPackage.blockers).toEqual([]);
    expect(approvalPackage.guardrails.join(" ")).toContain("not automatic production approval");
  });

  it("normalizes remote controlled write gates for change review", () => {
    const writeGate = normalizeNuxeraControlledWriteGateResponse({
      writeGate: {
        id: "nuxera-controlled-write-gate",
        status: "ready-for-controlled-write-change",
        readyForControlledWriteChange: true,
        requestedScope: "applicant-checklist-controlled-write",
        requestedEnvironment: "controlled-non-production",
        changeTicket: "CHG-NUXERA-001",
        sourceApprovalPackageId: "nuxera-controlled-approval-package",
        summary: { backendReady: true, backendReadiness: 100, approvalReady: true, blockers: 0, releaseChecklist: 6 },
        blockers: [],
        releaseChecklist: ["Write enablement requires a separate deploy/change-control action."],
        nextDecision: "Prepare a separate controlled change request; do not enable writes automatically.",
        guardrails: ["Write gate is read-only."],
      },
      guardrails: ["Ready-for-controlled-write-change requires separate deploy/change-control."],
    });

    expect(writeGate.source).toBe("remote-read-only");
    expect(writeGate.readyForControlledWriteChange).toBe(true);
    expect(writeGate.summary.blockers).toBe(0);
    expect(writeGate.blockers).toEqual([]);
    expect(writeGate.guardrails.join(" ")).toContain("separate deploy/change-control");
  });

  it("normalizes remote controlled change request packages for separate review", () => {
    const changeRequest = normalizeNuxeraControlledChangeRequestResponse({
      changeRequest: {
        id: "nuxera-controlled-change-request",
        status: "ready-for-separate-change-review",
        readyForChangeReview: true,
        sourceWriteGateId: "nuxera-controlled-write-gate",
        changeMetadata: {
          changeTicket: "CHG-NUXERA-001",
          requestedScope: "applicant-checklist-controlled-write",
          requestedEnvironment: "controlled-non-production",
          deploymentWindow: "2026-07-20T03:00Z/2026-07-20T04:00Z",
          rollbackOwner: "Platform lead",
          releaseReviewer: "Compliance reviewer",
        },
        missingChangeMetadata: [],
        summary: { writeGateReady: true, changeMetadataMissing: 0, blockers: 0, reviewChecklist: 7, rollbackSteps: 5 },
        blockers: [],
        reviewChecklist: ["Change ticket references completed evidence review."],
        rollbackPlan: ["Disable NUXERA experience flag if UI behavior degrades."],
        nextDecision: "Submit this package to separate change-control review; do not enable writes from this endpoint.",
        guardrails: ["Change request package is read-only."],
        markdown: "# NUXERA Controlled Change Request Package",
      },
      guardrails: ["Ready-for-separate-change-review is not deployment approval."],
    });

    expect(changeRequest.source).toBe("remote-read-only");
    expect(changeRequest.readyForChangeReview).toBe(true);
    expect(changeRequest.changeMetadata.rollbackOwner).toBe("Platform lead");
    expect(changeRequest.summary.rollbackSteps).toBe(5);
    expect(changeRequest.blockers).toEqual([]);
    expect(changeRequest.guardrails.join(" ")).toContain("not deployment approval");
  });
  it("normalizes remote controlled release dossiers for final readiness review", () => {
    const releaseDossier = normalizeNuxeraControlledReleaseDossierResponse({
      releaseDossier: {
        id: "nuxera-controlled-release-dossier",
        status: "ready-for-release-readiness-review",
        readyForReleaseReview: true,
        sourceChangeRequestId: "nuxera-controlled-change-request",
        dossierMetadata: {
          dossierOwner: "Compliance PMO",
          dossierDate: "2026-07-17",
          finalReviewer: "Release board",
          changeTicket: "CHG-NUXERA-001",
          requestedEnvironment: "controlled-non-production",
        },
        missingDossierMetadata: [],
        summary: { changeRequestReady: true, dossierMetadataMissing: 0, blockers: 0, evidenceChain: 6, finalReviewChecklist: 8 },
        evidenceChain: [{ id: "write-gate", label: "Write gate", status: "ready" }],
        blockers: [],
        finalReviewChecklist: ["Final reviewer understands this dossier is not deployment approval."],
        nextDecision: "Route dossier to final release-readiness review; deployment remains a separate change-control action.",
        guardrails: ["Release dossier is read-only."],
        markdown: "# NUXERA Controlled Release Readiness Dossier",
      },
      guardrails: ["Ready-for-release-readiness-review is not deployment approval."],
    });

    expect(releaseDossier.source).toBe("remote-read-only");
    expect(releaseDossier.readyForReleaseReview).toBe(true);
    expect(releaseDossier.dossierMetadata.finalReviewer).toBe("Release board");
    expect(releaseDossier.summary.finalReviewChecklist).toBe(8);
    expect(releaseDossier.evidenceChain[0]).toMatchObject({ id: "write-gate" });
    expect(releaseDossier.guardrails.join(" ")).toContain("not deployment approval");
  });
  it("normalizes remote controlled continuation packs for night handoff", () => {
    const continuationPack = normalizeNuxeraControlledContinuationPackResponse({
      continuationPack: {
        id: "nuxera-controlled-continuation-pack",
        status: "ready-for-night-continuation",
        progress: { percent: 84, label: "84% complete" },
        resumeContext: { branch: "nuxera-controlled-migration", resumeFromCommit: "42c4ba7" },
        recentCommits: [{ hash: "42c4ba7", title: "Add NUXERA controlled release dossier" }],
        completedChain: [{ id: "release-dossier", label: "Release readiness dossier", status: "implemented-read-only" }],
        validationSnapshot: ["Backend full suite passed: 49 files / 456 tests."],
        nextResumeSteps: ["Start from latest clean commit and confirm git status is empty."],
        guardrails: ["Continuation pack is read-only."],
        markdown: "# NUXERA Controlled Migration Continuation Pack",
      },
      guardrails: ["Night continuation must resume from the latest clean commit."],
    });

    expect(continuationPack.source).toBe("remote-read-only");
    expect(continuationPack.progress.percent).toBe(84);
    expect(continuationPack.resumeContext.resumeFromCommit).toBe("42c4ba7");
    expect(continuationPack.recentCommits[0].hash).toBe("42c4ba7");
    expect(continuationPack.guardrails.join(" ")).toContain("latest clean commit");
  });
  it("turns unavailable backend readiness signals into admin health actions", () => {
    const consoleState = getAdminOperationsConsole();
    const readiness = normalizeNuxeraBackendReadinessResponse({
      readiness: {
        ready: false,
        summary: { total: 3, available: 1, unavailable: 2, readiness: 33 },
        signals: [
          { id: "workspace-states", table: "nuxera_workspace_states", label: "Workspace states", owner: "backend-persistence", ready: false, requiredFor: ["applicant-checklist-write"] },
          { id: "admin-controls", table: "nuxera_admin_controls", label: "Admin controls", owner: "admin-console", ready: false, requiredFor: ["admin-readiness-read"] },
        ],
      },
    });
    const merged = mergeBackendReadinessWithConsole(consoleState, readiness);

    expect(merged.summary.backendReadinessUnavailable).toBe(2);
    expect(merged.adminHealthSignals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "backend-readiness-preflight", severity: "high" }),
      ])
    );
    expect(merged.adminActionQueue.map((item) => item.id)).toEqual(
      expect.arrayContaining(["backend-readiness-workspace-states", "backend-readiness-admin-controls"])
    );
    expect(merged.adminActionQueue[0]).toMatchObject({ priority: "critical-path" });
    expect(merged.backendReadinessHandoff).toMatchObject({
      id: "nuxera-backend-readiness-handoff",
      status: "blocked-by-backend-readiness",
      summary: { readiness: 33 },
    });
    expect(merged.backendReadinessHandoff.unavailableTables.map((item) => item.table)).toEqual(
      expect.arrayContaining(["nuxera_workspace_states", "nuxera_admin_controls"])
    );
    expect(merged.backendReadinessHandoff.nextActions.length).toBe(2);
    expect(merged.auditPackage.scope).toContain("backend-readiness");
    expect(merged.auditPackage.signals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "backend-readiness", value: "33%" }),
      ])
    );
    expect(merged.auditPackage.nextActions).toEqual(
      expect.arrayContaining([expect.stringContaining("Verificar backend readiness:")])
    );
    expect(merged.summary.auditPackageSignals).toBe(merged.auditPackage.signals.length);
    expect(merged.rlsVerificationMatrix).toMatchObject({
      id: "nuxera-rls-verification-matrix",
      status: "blocked-by-backend-readiness",
    });
    expect(merged.rlsVerificationMatrix.scenarios.map((scenario) => scenario.id)).toEqual([
      "applicant-owner",
      "different-applicant",
      "grantor-authorized",
      "admin-internal",
    ]);
    expect(merged.rlsVerificationMatrix.scenarios.find((scenario) => scenario.id === "applicant-owner").blockedBy).toEqual(
      expect.arrayContaining(["nuxera_workspace_states"])
    );
    expect(merged.summary.rlsVerificationScenarios).toBe(4);
    expect(merged.summary.rlsVerificationBlocked).toBeGreaterThan(0);
    expect(merged.auditPackage.scope).toContain("rls-verification-matrix");
    expect(merged.auditPackage.signals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "rls-verification-matrix", value: "4/4" }),
      ])
    );
    expect(merged.auditPackage.nextActions).toEqual(
      expect.arrayContaining([expect.stringContaining("Verificar RLS controlado:")])
    );
    expect(merged.controlledVerificationPackage).toMatchObject({
      id: "nuxera-controlled-rls-endpoint-evidence",
      status: "blocked-by-backend-readiness",
    });
    expect(merged.controlledVerificationPackage.endpointChecks.map((endpoint) => endpoint.path)).toEqual(
      expect.arrayContaining([
        "/api/nuxera/orders/:orderId/state",
        "/api/nuxera/orders/:orderId/state/checklist",
        "/api/nuxera/orders/:orderId/evidence",
        "/api/nuxera/admin/controls",
        "/api/nuxera/admin/readiness",
      ])
    );
    expect(merged.controlledVerificationPackage.evidenceTemplate.path).toContain("NUXERA_CONTROLLED_RLS_ENDPOINT_EVIDENCE_TEMPLATE.md");
    expect(merged.summary.controlledVerificationEndpoints).toBe(5);
    expect(merged.summary.controlledVerificationDeniedChecks).toBeGreaterThan(0);
    expect(merged.auditPackage.scope).toContain("controlled-rls-endpoint-evidence");
    expect(merged.auditPackage.signals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "controlled-verification-package", value: "5/4" }),
      ])
    );
    expect(merged.auditPackage.nextActions).toEqual(
      expect.arrayContaining([expect.stringContaining("Completar evidencia RLS/endpoints:")])
    );
    expect(merged.adminHealthSignals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "controlled-verification-evidence", severity: "high" }),
      ])
    );
    expect(merged.adminActionQueue.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        "controlled-verification-template",
        "controlled-verification-state-foreign-denied",
        "controlled-verification-rollback",
      ])
    );
    expect(merged.adminActionQueue.map((item) => item.source)).toEqual(
      expect.arrayContaining(["controlled-verification-package"])
    );
  });

  it("keeps backend readiness handoff safe when signals arrive without requiredFor (local fallback shape)", () => {
    const consoleState = getAdminOperationsConsole();
    const readiness = normalizeNuxeraBackendReadinessResponse({
      readiness: {
        ready: false,
        summary: { total: 1, available: 0, unavailable: 1, readiness: 0 },
        signals: [
          { id: "workspace-states", table: "nuxera_workspace_states", label: "Workspace states", status: "unverified", ready: false },
        ],
      },
    });
    const merged = mergeBackendReadinessWithConsole(consoleState, readiness);

    expect(merged.backendReadinessHandoff.unavailableTables[0].requiredFor).toEqual([]);
    expect(() => merged.backendReadinessHandoff.unavailableTables[0].requiredFor.join(", ")).not.toThrow();
  });
  it("merges backend readiness into the admin console without enabling writes", () => {
    const consoleState = getAdminOperationsConsole();
    const readiness = normalizeNuxeraBackendReadinessResponse({
      ready: true,
      summary: { total: 3, available: 3, unavailable: 0, readiness: 100 },
      signals: [
        { id: "workspace-states", table: "nuxera_workspace_states", ready: true },
      ],
    });
    const merged = mergeBackendReadinessWithConsole(consoleState, readiness);

    expect(merged.summary.backendReadiness).toBe(100);
    expect(merged.backendReadiness.ready).toBe(true);
    expect(merged.policies.join(" ")).toContain("RLS aun requiere verificacion controlada");
  });
});
  it("uses real assignment SLA and reviewer when pipeline entries include nuxera_case_assignments", () => {
    const queue = buildGrantorCaseQueueFromPipeline([
      {
        share: { id: "share-1", status: "accepted" },
        order: {
          id: "order-1",
          service_type: "combo-complete",
          status: "in_progress",
          amount: 500000,
          created_at: "2026-07-01T00:00:00.000Z",
          metadata: { companyName: "Empresa Demo" },
        },
        documentsCount: 4,
        informationRequests: [{ id: "req-1", status: "open", title: "Estados financieros" }],
        scoring: { finalScore: 72, regulatoryValidation: { status: "clear" } },
        assignment: {
          assignedReviewerId: "reviewer-123456",
          assignedReviewerRole: "analista",
          slaTier: "needs-information-48h",
          slaDueAt: "2026-07-25T18:00:00.000Z",
          status: "open",
          reason: "Validar estados financieros",
          source: "nuxera_case_assignments",
        },
      },
    ]);

    expect(queue.cases[0].triage).toMatchObject({
      owner: expect.stringContaining("reviewer"),
      reason: "Validar estados financieros",
      source: "nuxera_case_assignments",
      status: "open",
    });
    expect(queue.cases[0].triage.sla).toContain("needs-information-48h");
  });
describe("NUXERA notification and conversation operating model", () => {
  it("separates applicant, grantor and admin notification events without enabling delivery", () => {
    const catalog = getNuxeraNotificationCatalog();

    expect(catalog.status).toBe("design-ready-no-delivery-enabled");
    expect(catalog.summary).toMatchObject({
      applicant: 3,
      grantor: 5,
      admin: 2,
      automatedDeliveryEnabled: false,
      humanReviewRequired: true,
    });
    expect(catalog.channels.map((channel) => channel.id)).toEqual(["in-app", "email", "whatsapp"]);
    expect(catalog.guardrails.join(" ")).toContain("outbox");
  });

  it("builds assignment-driven notification intents for dry-run only", () => {
    const intents = buildNuxeraAssignmentNotificationIntents([
      {
        id: "assignment-1",
        orderId: "order-1",
        assignedReviewerId: "reviewer-1",
        assignedReviewerRole: "grantor_analyst",
        slaTier: "needs-information-48h",
        slaStatus: "due-soon",
        slaDueAt: "2026-07-24T18:00:00.000Z",
        status: "open",
        reason: "Validar evidencia faltante",
      },
      {
        id: "assignment-2",
        orderId: "order-2",
        assignedReviewerRole: "risk_committee",
        slaTier: "risk-escalation-24h",
        slaStatus: "overdue",
        status: "open",
      },
    ]);

    expect(intents.map((intent) => intent.eventId)).toEqual([
      NUXERA_COMMUNICATION_EVENT_IDS.GRANTOR_CASE_ASSIGNED,
      NUXERA_COMMUNICATION_EVENT_IDS.GRANTOR_SLA_DUE_SOON,
      NUXERA_COMMUNICATION_EVENT_IDS.ADMIN_CASE_SLA_OVERDUE,
    ]);
    expect(intents[0]).toMatchObject({ recipientUserId: "reviewer-1", recipientRole: "grantor", channels: ["in_app", "email"] });
    expect(intents[2]).toMatchObject({ recipientUserId: "admin-operations", recipientRole: "admin", priority: "critical" });
  });
  it("builds a queued-preview notification only when recipient and file context are aligned", () => {
    const event = buildNuxeraNotificationEvent(NUXERA_COMMUNICATION_EVENT_IDS.GRANTOR_INFORMATION_RESPONSE, {
      orderId: "order-123",
      orderLabel: "Expansion industrial",
      recipientEmail: "otorgante@example.com",
      recipientRole: "grantor",
    });

    expect(event.allowed).toBe(true);
    expect(event.status).toBe("queued-preview");
    expect(event.channels).toEqual(["in-app", "email"]);
    expect(event.delivery).toMatchObject({
      enabled: false,
      requiresOutbox: true,
      requiresAuditLog: true,
    });

    const blocked = buildNuxeraNotificationEvent(NUXERA_COMMUNICATION_EVENT_IDS.GRANTOR_INFORMATION_RESPONSE, {
      orderId: "order-123",
      recipientEmail: "solicitante@example.com",
      recipientRole: "applicant",
    });
    expect(blocked.allowed).toBe(false);
    expect(blocked.blockers.join(" ")).toContain("rol destinatario");
  });

  it("merges remote outbox readiness into the communications model without enabling delivery", () => {
    const outbox = normalizeNuxeraNotificationOutboxReadinessResponse({
      notificationOutbox: {
        status: "outbox-contract-ready-delivery-disabled",
        table: "nuxera_notification_outbox",
        deliveryEnabled: false,
        emailDeliveryEnabled: false,
        supportedEvents: ["grantor-information-response"],
        supportedChannels: ["in_app", "email", "whatsapp"],
        statuses: ["preview", "queued", "sent", "failed", "suppressed"],
        requiredBackendSteps: ["Aplicar SQL", "Verificar RLS"],
        guardrails: ["Readiness solamente; no envia mensajes."],
      },
      guardrails: ["Endpoint read-only."],
    });
    const merged = mergeNotificationCatalogWithOutboxReadiness(getNuxeraNotificationCatalog(), outbox);

    expect(outbox.source).toBe("remote-delivery-disabled");
    expect(outbox.emailDeliveryEnabled).toBe(false);
    expect(merged.summary).toMatchObject({
      automatedDeliveryEnabled: false,
      outboxReady: true,
      supportedChannels: 3,
      deliveryStatuses: 5,
    });
    expect(merged.outbox.requiredBackendSteps).toHaveLength(2);
    expect(merged.guardrails.join(" ")).toContain("Delivery permanece apagado");
  });

  it("normalizes a remote outbox list response without inventing rows", () => {
    const withEntries = normalizeNuxeraNotificationOutboxListResponse({
      outbox: {
        status: "outbox-list-ready",
        entries: [{ id: "outbox-1", eventId: "grantor-file-shared", status: "queued" }],
        guardrails: ["Listado administrativo de outbox; no envia mensajes ni cambia estado."],
      },
    });
    expect(withEntries.source).toBe("remote");
    expect(withEntries.entries).toHaveLength(1);
    expect(withEntries.guardrails.join(" ")).toContain("no envia mensajes");

    const missing = normalizeNuxeraNotificationOutboxListResponse(null);
    expect(missing.entries).toEqual([]);
    expect(missing.error).toBe("nuxera-notification-outbox-list-missing");
  });

  it("normalizes notification templates and approval plans as gated admin actions", () => {
    const templates = normalizeNuxeraNotificationTemplateCatalogResponse({
      templateCatalog: {
        status: "notification-templates-ready-no-delivery",
        templates: [{ eventId: "grantor-case-assigned", templateId: "grantor-case-assigned-v1" }],
        guardrails: ["Templates read-only."],
      },
    });
    const plan = normalizeNuxeraNotificationApprovalPlanResponse({
      approvalPlan: {
        status: "notification-approval-required",
        summary: { generated: 2, actionable: 1, duplicates: 1, rejected: 0 },
        approvalItems: [{ id: "approval-1", template: { templateId: "grantor-case-assigned-v1" } }],
        guardrails: ["Approval plan read-only."],
      },
    });
    const readiness = normalizeNuxeraNotificationApprovalReadinessResponse({
      approvalPersistence: {
        status: "notification-approval-persistence-draft-ready",
        table: "nuxera_notification_approvals",
        writeEnabled: false,
        approvalHistoryPersisted: false,
        summary: { tables: 1, policies: 3, writePolicies: 0, destructiveOperations: 0 },
        requiredColumns: ["order_id", "template_id", "dedupe_key"],
      },
    });
    const result = normalizeNuxeraNotificationApprovalResultResponse({
      approvalResult: {
        status: "notification-approval-preview-only",
        deliveryEnabled: false,
        summary: { approved: 1, persisted: 0, previews: 1, suppressed: 0, duplicatesSkipped: 1 },
        results: [{ status: "preview" }],
      },
    });

    expect(templates.source).toBe("remote-template-catalog");
    expect(templates.templates[0].templateId).toBe("grantor-case-assigned-v1");
    expect(plan.summary).toMatchObject({ actionable: 1, duplicates: 1 });
    expect(plan.approvalItems[0].template.templateId).toBe("grantor-case-assigned-v1");
    expect(readiness).toMatchObject({ source: "remote-approval-readiness", table: "nuxera_notification_approvals", writeEnabled: false, summary: { policies: 3, writePolicies: 0 } });
    expect(result).toMatchObject({ status: "notification-approval-preview-only", deliveryEnabled: false, summary: { previews: 1 } });
  });

  it("normalizes manual notification delivery batch responses as gated admin actions", () => {
    const batch = normalizeNuxeraNotificationDeliveryBatchResponse({
      batch: {
        status: "email-delivery-disabled-dry-run",
        processed: 0,
        sent: 0,
        failed: 0,
        suppressed: 0,
        deliveryEnabled: true,
        emailDeliveryEnabled: false,
        results: [],
        guardrails: ["Email adapter disabled; no outbox row was read or updated."],
      },
      guardrails: ["No cron or automatic delivery is triggered by this endpoint."],
    });

    expect(batch).toMatchObject({
      source: "remote",
      status: "email-delivery-disabled-dry-run",
      deliveryEnabled: true,
      emailDeliveryEnabled: false,
      processed: 0,
      sent: 0,
    });
    expect(batch.guardrails.join(" ")).toContain("No cron");

    const missing = normalizeNuxeraNotificationDeliveryBatchResponse(null);
    expect(missing.error).toBe("nuxera-notification-delivery-batch-missing");
  });

  it("normalizes a real conversation turn response without inventing an answer", () => {
    const ready = normalizeNuxeraConversationTurnResponse({
      turn: {
        status: "conversation-turn-ready",
        answer: "Falta el estado financiero mas reciente.",
        provider: "anthropic",
        persistence: { chatTurnPersisted: false, auditLogWritten: true },
      },
      guardrails: ["Chat turns are never persisted."],
    });
    expect(ready.source).toBe("remote-turn");
    expect(ready.answer).toContain("estado financiero");
    expect(ready.guardrails.join(" ")).toContain("never persisted");

    const missing = normalizeNuxeraConversationTurnResponse(null);
    expect(missing.answer).toBeNull();
    expect(missing.error).toBe("nuxera-conversation-turn-missing");
  });

  it("merges remote conversation agent readiness into the communications model without enabling chat", () => {
    const agent = normalizeNuxeraConversationAgentReadinessResponse({
      conversationAgent: {
        status: "agent-contract-ready-no-chat-delivery",
        runtimeEnabled: false,
        assistantScope: "Role-scoped selected file context only.",
        roles: [
          {
            role: "grantor",
            channel: "grantor-decision-desk-assistant",
            requiredPermission: "data_room:authorized:read",
            allowedSources: ["messages", "nuxera_evidence_links"],
            capabilities: ["summarize-authorized-evidence"],
            blockedActions: ["issue-term-sheet", "send-email"],
            status: "requires-selected-authorized-file",
          },
        ],
        summary: { roles: 1, allowedSources: 2, blockedActions: 2, runtimeEnabled: false, humanReviewRequired: true },
        requiredBackendSteps: ["Crear endpoint conversacional", "Aprobar auditoria"],
        guardrails: ["Readiness only; no chat runtime."],
      },
      guardrails: ["Endpoint read-only."],
    });
    const merged = mergeCommunicationModelWithConversationAgent(getNuxeraNotificationCatalog(), agent);

    expect(agent.source).toBe("remote-runtime-disabled");
    expect(merged.summary).toMatchObject({
      conversationRuntimeEnabled: false,
      conversationRoles: 1,
      conversationSources: 2,
      blockedAgentActions: 2,
    });
    expect(merged.conversationAgent.roles[0]).toMatchObject({
      role: "grantor",
      requiredPermission: "data_room:authorized:read",
    });
    expect(merged.guardrails.join(" ")).toContain("Chat runtime permanece apagado");
  });

  it("scopes conversation agents to authorized selected files and blocks demo/no-context reads", () => {
    const grantorEnvelope = buildNuxeraConversationEnvelope({
      role: "grantor",
      selectedId: "order-456",
      source: "authorized-grantor-entry",
      isDemo: false,
    });

    expect(grantorEnvelope.allowed).toBe(true);
    expect(grantorEnvelope.channel).toBe("decision-desk");
    expect(grantorEnvelope.sources).toEqual(
      expect.arrayContaining(["documents", "document_extractions", "messages", "nuxera_evidence_links"])
    );
    expect(grantorEnvelope.guardrails.join(" ")).toContain("No envia mensajes");

    const blocked = buildNuxeraConversationEnvelope({ role: "applicant", selectedId: "demo-order", isDemo: true });
    expect(blocked.allowed).toBe(false);
    expect(blocked.blockedSources).toEqual(["documents", "document_extractions", "messages"]);
  });
});
describe("NUXERA Finance adapter", () => {
  it("selects role-specific legacy modules for Finance", () => {
    expect(getFinanceAdapterConfig("applicant").title).toBe("Preparacion financiera");
    expect(getFinanceAdapterConfig("grantor").title).toBe("Pipeline financiero");
    expect(getFinanceAdapterConfig("admin").title).toBe("Operacion financiera");
  });

  it("falls back to applicant Finance when role is unknown", () => {
    expect(getFinanceAdapterConfig("unknown").title).toBe("Preparacion financiera");
  });
});


describe("NUXERA grantor case queue", () => {
  it("keeps the selected authorized case consistent across the grantor workspace", () => {
    const queue = { cases: [{ id: "order-1" }, { id: "order-2" }] };

    expect(resolveSelectedGrantorCase(queue, "order-2").id).toBe("order-2");
    expect(resolveSelectedGrantorCase(queue, "missing").id).toBe("order-1");
    expect(resolveSelectedGrantorCase({ cases: [] }, "missing")).toBeNull();
  });

  it("maps authorized backend pipeline entries into the real NUXERA queue", () => {
    const queue = buildGrantorCaseQueueFromPipeline([{
      share: { id: "share-1", status: "accepted" },
      order: {
        id: "order-real-1",
        project_name: "Expansion industrial",
        service_type: "combo-complete",
        status: "in_progress",
        requested_amount: 12000000,
        metadata: { companyName: "Empresa Real", sector: "Manufactura", country: "MX" },
      },
      documentsCount: 7,
      latestReview: { status: "reviewed" },
      scoring: { finalScore: 79, regulatoryValidation: { status: "clear" } },
      interest: { status: "under_review" },
      contactRequest: null,
    }]);

    expect(queue.source).toBe("authorized-pipeline");
    expect(queue.cases).toHaveLength(1);
    expect(queue.cases[0]).toMatchObject({
      id: "order-real-1",
      applicant: "Empresa Real",
      documentsCount: 7,
      invitationStatus: "accepted",
      averageScore: 79,
    });
    expect(getGrantorCaseWorkbench("order-real-1", queue).case.id).toBe("order-real-1");
    expect(getGrantorDocumentSummary("order-real-1", queue).caseId).toBe("order-real-1");
    expect(getGrantorDecisionMemo("order-real-1", queue).case.id).toBe("order-real-1");
  });

  it("uses real backend information requests instead of order metadata for missing-evidence signals", () => {
    const queue = buildGrantorCaseQueueFromPipeline([{
      share: { id: "share-2", status: "accepted" },
      order: {
        id: "order-real-2",
        project_name: "Planta solar",
        service_type: "business-plan",
        status: "pending",
        requested_amount: 8000000,
        metadata: { companyName: "Luz Real", sector: "Energia", country: "MX", infoRequests: [{ id: "stale-demo-request", status: "open", title: "No deberia aparecer" }] },
      },
      documentsCount: 3,
      latestReview: null,
      scoring: { finalScore: 60, regulatoryValidation: { status: "pending" } },
      interest: null,
      contactRequest: null,
      informationRequests: [
        { id: "req-real-1", title: "Estados financieros actualizados", status: "open", priority: "high", dueDate: "2026-07-25", documentType: "financial" }
      ],
    }]);

    const caseItem = queue.cases.find((item) => item.id === "order-real-2");
    expect(caseItem.infoRequests).toEqual([
      { id: "req-real-1", title: "Estados financieros actualizados", status: "open", priority: "high", dueDate: "2026-07-25", documentType: "financial" }
    ]);
    expect(caseItem.priority).toBe("needs-information");
  });

  it("builds a local case queue with analytics and priorities", () => {
    const queue = getGrantorCaseQueue();
    const summary = getGrantorQueueSummary();

    expect(queue.cases.length).toBeGreaterThan(0);
    expect(summary.total).toBe(queue.cases.length);
    expect(summary.requiresHumanReview).toBe(true);
    expect(queue.cases.map((item) => item.priority)).toEqual(
      expect.arrayContaining(["committee-ready", "needs-information"])
    );
  });

  it("builds an operational case management board separate from the decision desk", () => {
    const queue = buildGrantorCaseQueueFromPipeline([{
      share: { id: "share-board-1", status: "accepted" },
      order: {
        id: "order-board-1",
        project_name: "Expansion productiva",
        service_type: "combo-complete",
        status: "in_progress",
        requested_amount: 12000000,
        metadata: { companyName: "Empresa Board", sector: "Manufactura", country: "MX" },
      },
      documentsCount: 5,
      latestReview: null,
      scoring: { finalScore: 72, regulatoryValidation: { status: "clear" } },
      interest: null,
      contactRequest: null,
      informationRequests: [{ id: "req-board-1", title: "Balance auditado", status: "open", priority: "high" }],
      assignment: {
        id: "assignment-board-1",
        assignedReviewerId: "reviewer-board-1",
        assignedReviewerRole: "grantor_analyst",
        slaTier: "needs-information-48h",
        slaDueAt: "2000-07-24T18:00:00.000Z",
        status: "open",
        reason: "Cerrar faltante documental",
        source: "nuxera_case_assignments",
      },
    }]);
    const board = getGrantorCaseManagementBoard(queue);

    expect(queue.queueMode.label).toBe("Gestion de expedientes");
    expect(queue.decisionDeskMode.label).toBe("Mesa de decision");
    expect(board.status).toBe("sla-escalation-required");
    expect(board.summary).toMatchObject({ total: 1, overdue: 1, openRequests: 1 });
    expect(board.items[0]).toMatchObject({ slaStatus: "overdue", readyForDesk: false, source: "nuxera_case_assignments" });
    expect(board.guardrails.join(" ")).toContain("no contiene memo");
  });
  it("prepares a controlled desk handoff preview from operational case management", () => {
    const blockedQueue = buildGrantorCaseQueueFromPipeline([{
      share: { id: "share-handoff-1", status: "accepted" },
      order: {
        id: "order-handoff-blocked",
        project_name: "Expansion bloqueada",
        service_type: "combo-complete",
        status: "in_progress",
        requested_amount: 9000000,
        metadata: { companyName: "Empresa Bloqueada", sector: "Manufactura", country: "MX" },
      },
      documentsCount: 4,
      latestReview: null,
      scoring: { finalScore: 70, regulatoryValidation: { status: "clear" } },
      interest: null,
      contactRequest: null,
      informationRequests: [{ id: "req-handoff-1", title: "Estado financiero auditado", status: "open", priority: "high" }],
      assignment: {
        id: "assignment-handoff-1",
        assignedReviewerId: "reviewer-handoff-1",
        assignedReviewerRole: "grantor_analyst",
        slaTier: "needs-information-48h",
        slaDueAt: "2000-07-24T18:00:00.000Z",
        status: "open",
        reason: "Cerrar faltante documental",
        source: "nuxera_case_assignments",
      },
    }]);
    const blockedHandoff = getGrantorDeskHandoffPreview("order-handoff-blocked", blockedQueue);

    expect(blockedHandoff.status).toBe("not-ready-for-desk");
    expect(blockedHandoff.blockers.map((item) => item.id)).toEqual(
      expect.arrayContaining(["assignment-sla", "open-requests", "decision-readiness"])
    );
    expect(blockedHandoff.guardrails.join(" ")).toContain("no persiste");

    const readyQueue = buildGrantorCaseQueueFromPipeline([{
      share: { id: "share-handoff-2", status: "accepted" },
      order: {
        id: "order-handoff-ready",
        project_name: "Expansion lista",
        service_type: "combo-complete",
        status: "in_progress",
        requested_amount: 14000000,
        metadata: {
          companyName: "Empresa Lista",
          sector: "SaaS B2B",
          country: "MX",
          documents: ["KYC/KYB", "Estados financieros", "Modelo financiero", "Contratos"],
        },
      },
      documentsCount: 4,
      latestReview: { status: "reviewed" },
      scoring: { finalScore: 88, regulatoryValidation: { status: "clear" } },
      interest: { status: "under_review" },
      contactRequest: null,
      informationRequests: [],
      assignment: {
        id: "assignment-handoff-2",
        assignedReviewerId: "reviewer-handoff-2",
        assignedReviewerRole: "grantor_senior",
        slaTier: "committee-ready-24h",
        slaDueAt: "2099-07-24T18:00:00.000Z",
        status: "open",
        reason: "Preparar revision humana",
        source: "nuxera_case_assignments",
      },
    }]);
    const readyHandoff = getGrantorDeskHandoffPreview("order-handoff-ready", readyQueue);

    expect(readyHandoff.status).toBe("ready-for-desk-preview");
    expect(readyHandoff.blockers).toHaveLength(0);
    expect(readyHandoff.handoffPackage).toMatchObject({ decisionDeskPath: "/dashboard", mode: "local-read-only-preview" });
    expect(readyHandoff.criteria.find((item) => item.id === "human-review").status).toBe("required");
  });
  it("builds actionable inbox filters instead of a duplicated decision desk", () => {
    const queue = getGrantorCaseQueue();
    const filters = getGrantorInboxFilters(queue);

    expect(filters.map((filter) => filter.id)).toEqual(["all", "committee-ready", "needs-information", "high-risk", "watch"]);
    expect(filters.find((filter) => filter.id === "all").count).toBe(queue.cases.length);
    expect(filters.find((filter) => filter.id === "needs-information").count).toBe(
      queue.cases.filter((item) => item.priority === "needs-information").length
    );
    expect(filterGrantorInboxCases(queue.cases, "high-risk").every((item) => item.riskLevel === "high")).toBe(true);
    expect(filterGrantorInboxCases(queue.cases, "committee-ready").every((item) => item.priority === "committee-ready")).toBe(true);
  });

  it("connects each grantor case to evidence engines without automatic approval", () => {
    const queue = getGrantorCaseQueue();
    const firstCase = queue.cases[0];

    expect(firstCase.decisionSignals).toEqual(
      expect.arrayContaining([expect.stringContaining("Readiness"), expect.stringContaining("Riesgo")])
    );
    expect(firstCase.evidenceLinks.map((link) => link.engine)).toEqual(
      expect.arrayContaining(["Finance", "Intelligence", "Strategy"])
    );
    expect(queue.policies).toEqual(
      expect.arrayContaining([expect.stringContaining("Gestion de expedientes")])
    );
    expect(queue.policies.join(" ")).not.toContain("cola");
  });

  it("opens a local case workbench with questions, conditions and audit trail", () => {
    const queue = getGrantorCaseQueue();
    const workbench = getGrantorCaseWorkbench(queue.cases[0].id);

    expect(workbench.case.id).toBe(queue.cases[0].id);
    expect(workbench.questions.length).toBeGreaterThan(0);
    expect(workbench.requiredEvidence.length).toBeGreaterThan(0);
    expect(workbench.conditions).toEqual(
      expect.arrayContaining([expect.stringContaining("no vinculantes")])
    );
    expect(workbench.auditTrail).toEqual(
      expect.arrayContaining([
        expect.stringContaining("No emite term sheet"),
        expect.stringContaining("permisos existentes"),
      ])
    );
  });

  it("builds a grantor-safe document summary without changing data-room permissions", () => {
    const queue = getGrantorCaseQueue();
    const summary = getGrantorDocumentSummary(queue.cases[0].id);

    expect(summary.status).toContain("authorized-summary");
    expect(summary.summary.total).toBeGreaterThan(0);
    expect(summary.folders.map((folder) => folder.id)).toEqual(
      expect.arrayContaining(["identity-kyb", "project-file", "risk-requests"])
    );
    expect(summary.guardrails.join(" ")).toContain("no abre archivos");
    expect(summary.guardrails.join(" ")).toContain("no concede acceso nuevo");
    expect(summary.guardrails.join(" ")).toContain("No permite descarga");
  });
  it("builds a non-binding local decision memo for grantor review", () => {
    const queue = getGrantorCaseQueue();
    const memo = getGrantorDecisionMemo(queue.cases[0].id);

    expect(memo.id).toContain(queue.cases[0].id);
    expect(memo.title).toContain("Memo local no vinculante");
    expect(memo.evidenceSnapshot.documents.length).toBeGreaterThan(0);
    expect(memo.proposedConditions).toEqual(
      expect.arrayContaining([expect.stringContaining("no vinculantes")])
    );
    expect(memo.guardrails).toEqual(
      expect.arrayContaining([
        expect.stringContaining("no es term sheet"),
        expect.stringContaining("No cambia permisos"),
        expect.stringContaining("No persiste estado"),
      ])
    );
  });
});
describe("NUXERA Markets foundation", () => {
  it("exposes data provenance, delay and no-advice disclaimer", () => {
    const status = getMarketProviderStatus();

    expect(status.mode).toBe("delayed-demo");
    expect(status.delayLabel).toContain("no tiempo real");
    expect(status.provenance).toContain("Dataset local");
    expect(status.disclaimer).toContain("No constituye recomendacion");
  });

  it("builds a role-aware watchlist with monitored events", () => {
    const watchlist = getMarketWatchlist("grantor");

    expect(watchlist.scope).toContain("riesgo");
    expect(watchlist.rows.length).toBeGreaterThan(0);
    expect(watchlist.events.length).toBeGreaterThan(0);
  });

  it("defines monitoring policies for graceful provider degradation", () => {
    expect(getMonitoringPolicies()).toEqual(
      expect.arrayContaining([
        expect.stringContaining("procedencia"),
        expect.stringContaining("proveedor falla"),
      ])
    );
  });

  it("blocks realtime market data unless a licensed provider is explicitly active", () => {
    const status = getMarketProviderStatus(MARKET_PROVIDER_STATES.UNLICENSED);

    expect(status.mode).toBe("license-required");
    expect(status.delayLabel).toContain("no tiempo real");
    expect(canUseRealtimeMarketData(status)).toBe(false);
  });

  it("returns a visible degradation plan when the provider fails", () => {
    const plan = getProviderDegradationPlan(MARKET_PROVIDER_STATES.DEGRADED);

    expect(plan.health).toBe("degraded");
    expect(plan.realtimeAvailable).toBe(false);
    expect(plan.actions).toEqual(
      expect.arrayContaining([
        expect.stringContaining("degradacion visible"),
        expect.stringContaining("snapshot local"),
      ])
    );
  });

  it("keeps local watchlist context available in degraded mode", () => {
    const watchlist = getMarketWatchlist("admin", MARKET_PROVIDER_STATES.DEGRADED);

    expect(watchlist.status.degradation).toBe(true);
    expect(watchlist.degradationPlan.fallbackStrategy).toContain("revision humana");
    expect(watchlist.rows.length).toBeGreaterThan(0);
    expect(watchlist.events.length).toBeGreaterThan(0);
  });
});

describe("NUXERA Strategy foundation", () => {
  it("exposes assumptions, scenarios and uncertainty", () => {
    const workspace = getStrategyWorkspace("grantor");

    expect(workspace.focus).toContain("riesgo");
    expect(workspace.assumptions.length).toBeGreaterThan(0);
    expect(workspace.scenarios.length).toBeGreaterThan(0);
    expect(workspace.recommendation.uncertainty).toContain("revision humana");
  });

  it("links Strategy evidence back to Finance, Intelligence and Markets", () => {
    const engines = getStrategyWorkspace().evidenceLinks.map((link) => link.engine);

    expect(engines).toEqual(expect.arrayContaining(["Finance", "Intelligence", "Markets"]));
  });

  it("defines an auditable human-review action plan", () => {
    expect(getStrategyActionPlan()).toEqual(
      expect.arrayContaining([
        expect.stringContaining("decision humana"),
        expect.stringContaining("Markets"),
      ])
    );
  });

  it("adds decision flow gates with evidence and rollback conditions", () => {
    const workspace = getStrategyWorkspace("admin");

    expect(workspace.decisionFlowStages.length).toBeGreaterThan(0);
    expect(workspace.decisionFlowStages[0]).toMatchObject({
      owner: expect.any(String),
      gate: expect.any(String),
      evidenceIds: expect.any(Array),
      rollback: expect.stringContaining("Volver"),
    });
    expect(workspace.decisionReadinessCriteria.map((criterion) => criterion.id)).toContain("human-review");
  });

  it("builds a local decision package without automatic approval", () => {
    const decisionPackage = getStrategyDecisionPackage("grantor");

    expect(decisionPackage.status).toBe("human-review-required");
    expect(decisionPackage.requiredEvidenceIds).toEqual(
      expect.arrayContaining(["finance-readiness", "intelligence-docs", "markets-watchlist"])
    );
    expect(decisionPackage.rollbackConditions.length).toBeGreaterThan(0);
    expect(decisionPackage.auditTrail).toEqual(
      expect.arrayContaining([expect.stringContaining("No ejecuta aprobaciones automaticas")])
    );
  });
});

describe("NUXERA Finance journey", () => {
  it("gives applicants a plain next action and progress", () => {
    const journey = getFinanceJourney("applicant");

    expect(journey.headline).toContain("solicitud");
    expect(journey.nextAction).toContain("faltantes");
    expect(journey.progress).toBeGreaterThan(0);
    expect(journey.goals).toContain("Conseguir financiamiento");
  });

  it("gives grantors inbox-oriented actions", () => {
    const journey = getFinanceJourney("grantor");

    expect(journey.headline).toContain("casos");
    expect(journey.goals).toContain("Ver bandeja prioritaria");
    expect(journey.goals).toContain("Preparar comite");
    expect(journey.effort).toBe("Revision por bandeja y prioridad");
  });

  it("falls back to applicant journey for unknown roles", () => {
    expect(getFinanceJourney("unknown").headline).toBe(getFinanceJourney("applicant").headline);
  });

  it("connects Finance evidence to adjacent NUXERA engines", () => {
    expect(getFinanceJourneyEvidenceLinks().map((link) => link.path)).toEqual(
      expect.arrayContaining([
        "/dashboard/nuxera/finance",
        "/dashboard/nuxera/intelligence",
        "/dashboard/nuxera/strategy",
      ])
    );
  });
});

describe("NUXERA Intelligence research missions", () => {
  it("defines premium research mission types", () => {
    expect(getResearchMissionTypes().map((mission) => mission.id)).toEqual(
      expect.arrayContaining(["company-diligence", "person-screening", "sector-context"])
    );
  });

  it("builds a role-aware mission with plan, sources, findings and report metadata", () => {
    const mission = getResearchMission("grantor", "company-diligence");

    expect(mission.roleFocus).toContain("riesgos");
    expect(mission.plan.length).toBeGreaterThan(0);
    expect(mission.sources.length).toBeGreaterThan(0);
    expect(mission.findings[0]).toMatchObject({
      confidence: expect.any(String),
      evidenceIds: expect.any(Array),
    });
    expect(mission.report.auditNote).toContain("evidencia");
  });

  it("resolves evidence metadata for material findings", () => {
    const evidence = getEvidenceByFinding("document-gap");

    expect(evidence.length).toBeGreaterThan(0);
    expect(evidence[0]).toMatchObject({
      source: expect.any(String),
      provenance: expect.any(String),
      reliability: expect.any(String),
    });
  });
});

describe("NUXERA applicant project builder assistant", () => {
  it("lists guided questions with required fields marked", () => {
    const questions = getProjectBuilderQuestions("es");

    expect(questions.map((q) => q.id)).toEqual(
      expect.arrayContaining(["sector", "goal", "amount", "useOfFunds", "stage", "market", "advantage", "knownRisks"])
    );
    expect(questions.find((q) => q.id === "goal").required).toBe(true);
    expect(questions.find((q) => q.id === "sector").required).toBe(false);
  });

  it("builds an empty answers object matching every question id", () => {
    const answers = buildEmptyProjectBuilderAnswers();
    const questionIds = getProjectBuilderQuestions("es").map((q) => q.id);

    expect(Object.keys(answers).sort()).toEqual(questionIds.sort());
    expect(Object.values(answers).every((value) => value === "")).toBe(true);
  });

  it("flags missing required fields without flagging optional ones", () => {
    const missing = getMissingRequiredProjectBuilderFields({ goal: "Expansion" }, "es");

    expect(missing).toEqual(
      expect.arrayContaining(["Monto aproximado", "Uso de fondos", "Mercado / clientes"])
    );
    expect(missing).not.toEqual(expect.arrayContaining(["Sector"]));
  });

  it("returns no missing fields once all required answers are present", () => {
    const missing = getMissingRequiredProjectBuilderFields({
      goal: "Expansion",
      amount: "$1M",
      useOfFunds: "Inventario",
      market: "Retail",
    }, "es");

    expect(missing).toEqual([]);
  });

  it("marks the preferred entity type question as optional", () => {
    const questions = getProjectBuilderQuestions("es");
    expect(questions.find((q) => q.id === "entityHint").required).toBe(false);
  });

  it("provides a fallback label for each of the 5 draftable rubrics", () => {
    expect(getRubricFallbackLabel("plan_negocios", "es")).toBe("Plan de negocios");
    expect(getRubricFallbackLabel("modelo_financiero", "en")).toBe("Financial model");
    expect(getRubricFallbackLabel("unknown_rubric", "es")).toBe("unknown_rubric");
  });
});
