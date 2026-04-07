import { afterEach, describe, expect, it, vi } from "vitest";

import { Plan } from "@prisma/client";

describe("planFromStripePriceId", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("mapuje Price ID z env na PRO i BUSINESS", async () => {
    vi.stubEnv("STRIPE_PRO_PRICE_ID", "price_pro_abc");
    vi.stubEnv("STRIPE_BUSINESS_PRICE_ID", "price_bus_xyz");
    const { planFromStripePriceId } = await import("./stripe-plan");
    expect(planFromStripePriceId("price_pro_abc")).toBe(Plan.PRO);
    expect(planFromStripePriceId("price_bus_xyz")).toBe(Plan.BUSINESS);
  });

  it("nieznany lub pusty price → FREE", async () => {
    vi.stubEnv("STRIPE_PRO_PRICE_ID", "price_pro_only");
    vi.stubEnv("STRIPE_BUSINESS_PRICE_ID", "price_bus_only");
    const { planFromStripePriceId } = await import("./stripe-plan");
    expect(planFromStripePriceId(undefined)).toBe(Plan.FREE);
    expect(planFromStripePriceId("price_unknown")).toBe(Plan.FREE);
  });
});
