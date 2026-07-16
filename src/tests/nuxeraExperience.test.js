import { describe, expect, it, vi } from "vitest";
import { getAllowedExperiences, isNuxeraExperienceEnabled } from "../experience/experienceFlags";
import { EXPERIENCE_STORAGE_KEY, EXPERIENCE_VALUES, readExperience, writeExperience } from "../experience/experienceStorage";
import { getFinanceAdapterConfig } from "../nuxera/adapters/FinanceWorkspaceAdapter";
import { getAdminOperationsConsole } from "../nuxera/admin/operationsConsole";
import { getApplicantDataRoomChecklist, getApplicantGuidedMission, getApplicantMissionReadiness } from "../nuxera/applicant/guidedMission";
import { mergeApplicantChecklistWithWorkspaceState, normalizeNuxeraApplicantChecklistState } from "../nuxera/applicant/workspaceStateAdapter";
import { getFinanceJourney, getFinanceJourneyEvidenceLinks } from "../nuxera/finance/financeJourney";
import { getGrantorCaseQueue, getGrantorCaseWorkbench, getGrantorDecisionMemo, getGrantorQueueSummary } from "../nuxera/grantor/caseQueue";
import { MARKET_PROVIDER_STATES, canUseRealtimeMarketData, getMarketProviderStatus, getMarketWatchlist, getMonitoringPolicies, getProviderDegradationPlan } from "../nuxera/markets/marketDataProvider";
import { getEvidenceByFinding, getResearchMission, getResearchMissionTypes } from "../nuxera/intelligence/researchMissions";
import { getNuxeraEngine, getNuxeraEngineNavigationItems, getNuxeraEngines } from "../nuxera/engines/engineRegistry";
import { getEvidenceLedgerByEngine, getNuxeraEvidenceLedger } from "../nuxera/evidence/evidenceLedger";
import { navigationByRole } from "../nuxera/navigation/navigationByRole";
import { resolveNuxeraRole } from "../nuxera/navigation/roleResolver";
import { NUXERA_SECTION_TYPES, resolveNuxeraSection } from "../nuxera/sections/sectionRegistry";
import { getStrategyActionPlan, getStrategyDecisionPackage, getStrategyWorkspace } from "../nuxera/strategy/strategyWorkspace";

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
      expect.arrayContaining([expect.stringContaining("Grantor queue")])
    );
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
      expect.arrayContaining([expect.stringContaining("no aprueba credito")])
    );
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

  it("gives grantors queue-oriented actions", () => {
    const journey = getFinanceJourney("grantor");

    expect(journey.headline).toContain("casos");
    expect(journey.goals).toContain("Preparar comite");
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
