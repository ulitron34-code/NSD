import { describe, expect, it, vi } from "vitest";
import { getAllowedExperiences, isNuxeraExperienceEnabled } from "../experience/experienceFlags";
import { EXPERIENCE_STORAGE_KEY, EXPERIENCE_VALUES, readExperience, writeExperience } from "../experience/experienceStorage";
import { getFinanceAdapterConfig } from "../nuxera/adapters/FinanceWorkspaceAdapter";
import { mergeAdminControlsWithConsole, normalizeNuxeraAdminControlsResponse } from "../nuxera/admin/adminControlsAdapter";
import { mergeBackendReadinessWithConsole, normalizeNuxeraBackendReadinessResponse } from "../nuxera/admin/backendReadinessAdapter";
import { getAdminOperationsConsole } from "../nuxera/admin/operationsConsole";
import { getApplicantDocumentCenter } from "../nuxera/applicant/documentCenter";
import { getApplicantDataRoomChecklist, getApplicantGuidedMission, getApplicantMissionReadiness, getApplicantOnboardingWizard } from "../nuxera/applicant/guidedMission";
import { getApplicantCompanyProjectWorkspace, normalizeApplicantProjectProfile } from "../nuxera/applicant/projectWorkspace";
import { buildApplicantChecklistPatchPayload, mergeApplicantChecklistWithWorkspaceState, normalizeNuxeraApplicantChecklistState } from "../nuxera/applicant/workspaceStateAdapter";
import { getFinanceJourney, getFinanceJourneyEvidenceLinks } from "../nuxera/finance/financeJourney";
import { getGrantorCaseQueue, getGrantorCaseWorkbench, getGrantorDecisionMemo, getGrantorDocumentSummary, getGrantorQueueSummary } from "../nuxera/grantor/caseQueue";
import { MARKET_PROVIDER_STATES, canUseRealtimeMarketData, getMarketProviderStatus, getMarketWatchlist, getMonitoringPolicies, getProviderDegradationPlan } from "../nuxera/markets/marketDataProvider";
import { getEvidenceByFinding, getResearchMission, getResearchMissionTypes } from "../nuxera/intelligence/researchMissions";
import { getNuxeraEngine, getNuxeraEngineNavigationItems, getNuxeraEngines } from "../nuxera/engines/engineRegistry";
import { mergeNuxeraEvidenceLedger, normalizeNuxeraEvidenceResponse } from "../nuxera/evidence/evidenceBackendAdapter";
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
