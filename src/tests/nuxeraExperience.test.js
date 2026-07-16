import { describe, expect, it, vi } from "vitest";
import { getAllowedExperiences, isNuxeraExperienceEnabled } from "../experience/experienceFlags";
import { EXPERIENCE_STORAGE_KEY, EXPERIENCE_VALUES, readExperience, writeExperience } from "../experience/experienceStorage";
import { getFinanceAdapterConfig } from "../nuxera/adapters/FinanceWorkspaceAdapter";
import { getFinanceJourney, getFinanceJourneyEvidenceLinks } from "../nuxera/finance/financeJourney";
import { MARKET_PROVIDER_STATES, canUseRealtimeMarketData, getMarketProviderStatus, getMarketWatchlist, getMonitoringPolicies, getProviderDegradationPlan } from "../nuxera/markets/marketDataProvider";
import { getEvidenceByFinding, getResearchMission, getResearchMissionTypes } from "../nuxera/intelligence/researchMissions";
import { getNuxeraEngine, getNuxeraEngineNavigationItems, getNuxeraEngines } from "../nuxera/engines/engineRegistry";
import { navigationByRole } from "../nuxera/navigation/navigationByRole";
import { resolveNuxeraRole } from "../nuxera/navigation/roleResolver";
import { NUXERA_SECTION_TYPES, resolveNuxeraSection } from "../nuxera/sections/sectionRegistry";
import { getStrategyActionPlan, getStrategyWorkspace } from "../nuxera/strategy/strategyWorkspace";

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
