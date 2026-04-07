import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** 32 bajty jako hex (64 znaki), stały testowy klucz AES-256. */
const TEST_KEY_HEX = "0123456789abcdef".repeat(4);

describe("ksef-encryption", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.KSEF_ENCRYPTION_KEY = TEST_KEY_HEX;
  });

  afterEach(() => {
    delete process.env.KSEF_ENCRYPTION_KEY;
  });

  it("encrypt / decrypt roundtrip", async () => {
    const { encrypt, decrypt } = await import("./ksef-encryption");
    const plain = "token-ksef-test-ąć";
    const enc = encrypt(plain);
    expect(enc).toMatch(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);
    expect(decrypt(enc)).toBe(plain);
  });

  it("rzuca gdy brak KSEF_ENCRYPTION_KEY", async () => {
    delete process.env.KSEF_ENCRYPTION_KEY;
    vi.resetModules();
    const { encrypt } = await import("./ksef-encryption");
    expect(() => encrypt("x")).toThrow("KSEF_ENCRYPTION_KEY is not set");
  });

  it("rzuca przy złym formacie payloadu", async () => {
    const { decrypt } = await import("./ksef-encryption");
    expect(() => decrypt("nieprawidlowe")).toThrow("Invalid encrypted payload");
  });
});
