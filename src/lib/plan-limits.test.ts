import { describe, expect, it } from "vitest";

import {
  getMaxInvoicesForPlan,
  hasExceededInvoiceLimit,
  PLAN_LIMITS,
} from "./plan-limits";

describe("PLAN_LIMITS", () => {
  it("FREE jest limitowany, BUSINESS nie", () => {
    expect(PLAN_LIMITS.FREE).toBe(1);
    expect(PLAN_LIMITS.PRO).toBe(50);
    expect(PLAN_LIMITS.BUSINESS).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("getMaxInvoicesForPlan", () => {
  it("zwraca limit dla planu", () => {
    expect(getMaxInvoicesForPlan("FREE")).toBe(1);
    expect(getMaxInvoicesForPlan("PRO")).toBe(50);
  });
});

describe("hasExceededInvoiceLimit", () => {
  it("FREE: 1 użycie blokuje dalsze", () => {
    expect(hasExceededInvoiceLimit("FREE", 0)).toBe(false);
    expect(hasExceededInvoiceLimit("FREE", 1)).toBe(true);
  });

  it("PRO: do 49 OK, od 50 blok", () => {
    expect(hasExceededInvoiceLimit("PRO", 49)).toBe(false);
    expect(hasExceededInvoiceLimit("PRO", 50)).toBe(true);
  });

  it("BUSINESS: nigdy nie przekroczone", () => {
    expect(hasExceededInvoiceLimit("BUSINESS", 999999)).toBe(false);
  });
});
