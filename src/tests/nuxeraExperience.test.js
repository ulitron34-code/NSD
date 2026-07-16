import { describe, expect, it, vi } from "vitest";
import { getAllowedExperiences, isNuxeraExperienceEnabled } from "../experience/experienceFlags";
import { EXPERIENCE_STORAGE_KEY, EXPERIENCE_VALUES, readExperience, writeExperience } from "../experience/experienceStorage";
import { getFinanceAdapterConfig } from "../nuxera/adapters/FinanceWorkspaceAdapter";
import { getMarketProviderStatus, getMarketWatchlist, getMonitoringPolicies } from "../nuxera/markets/marketDataProvider";
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