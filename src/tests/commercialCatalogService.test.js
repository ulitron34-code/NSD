import { afterEach, describe, expect, it, vi } from "vitest";
import { formatOfferPrice, getEntitlement } from "../services/commercialCatalogService";
import { isCommercialCatalogEnabled } from "../experience/experienceFlags";

function offer(overrides = {}) {
  return {
    code: "applicant_essential",
    entitlements: [
      { key: "analysis_units", limitValue: 10, unit: "ua", resetPeriod: "none" },
      { key: "package_validity_days", limitValue: 45, unit: "days", resetPeriod: "none" },
    ],
    price: {
      currency: "USD",
      amountCents: 49500,
      isCustomPricing: false,
      billingInterval: null,
      metadata: {},
    },
    ...overrides,
  };
}

describe("commercialCatalogService (frontend)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is fail-closed by default", () => {
    vi.stubEnv("VITE_COMMERCIAL_CATALOG_ENABLED", undefined);
    expect(isCommercialCatalogEnabled()).toBe(false);
  });

  it("enables only on the literal string \"true\"", () => {
    vi.stubEnv("VITE_COMMERCIAL_CATALOG_ENABLED", "true");
    expect(isCommercialCatalogEnabled()).toBe(true);
    vi.stubEnv("VITE_COMMERCIAL_CATALOG_ENABLED", "1");
    expect(isCommercialCatalogEnabled()).toBe(false);
  });

  it("formats a fixed-price offer as currency from amountCents, not a raw number", () => {
    const { amount } = formatOfferPrice(offer());
    expect(amount).toContain("495");
    expect(amount).not.toContain("49500");
  });

  it("formats a custom/starting-at price with a plus sign", () => {
    const customOffer = offer({
      price: { currency: "USD", amountCents: 550000, isCustomPricing: true, billingInterval: "month", metadata: { starting_at: true } },
    });
    const { amount, interval } = formatOfferPrice(customOffer);
    expect(amount).toContain("5,500");
    expect(amount.endsWith("+")).toBe(true);
    expect(interval).toBe("month");
  });

  it("returns null when there is no resolved price", () => {
    expect(formatOfferPrice(offer({ price: null }))).toBeNull();
  });

  it("reads a specific entitlement by key", () => {
    expect(getEntitlement(offer(), "analysis_units")).toEqual({ key: "analysis_units", limitValue: 10, unit: "ua", resetPeriod: "none" });
    expect(getEntitlement(offer(), "internal_users")).toBeNull();
  });
});
