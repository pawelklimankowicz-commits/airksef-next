import { afterEach, describe, expect, it, vi } from "vitest";

describe("clerk-config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("isClerkConfigured false gdy brak klucza", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
    const { isClerkConfigured } = await import("./clerk-config");
    expect(isClerkConfigured()).toBe(false);
  });

  it("isClerkConfigured true dla poprawnego pk_test_", async () => {
    const pk =
      "pk_test_" + "a".repeat(32);
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", pk);
    const { isClerkConfigured, getClerkPublishableKeyNormalized } = await import("./clerk-config");
    expect(isClerkConfigured()).toBe(true);
    expect(getClerkPublishableKeyNormalized()).toBe(pk);
  });

  it("normalizuje cudzysłowy i trim", async () => {
    const pk =
      "pk_test_" + "b".repeat(32);
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", `  "${pk}"  `);
    const { isClerkConfigured, getClerkPublishableKeyNormalized } = await import("./clerk-config");
    expect(getClerkPublishableKeyNormalized()).toBe(pk);
    expect(isClerkConfigured()).toBe(true);
  });

  it("odrzuca zbyt krótki lub zły format", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_short");
    const { isClerkConfigured } = await import("./clerk-config");
    expect(isClerkConfigured()).toBe(false);
  });
});
