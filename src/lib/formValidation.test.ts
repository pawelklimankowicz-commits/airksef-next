import { describe, expect, it } from "vitest";

import {
  isValidNip10,
  normalizeNipDigits,
  validateStep1,
  validateStep2,
} from "./formValidation";

describe("normalizeNipDigits", () => {
  it("usuwa znaki nienumeryczne i obcina do 10 cyfr", () => {
    expect(normalizeNipDigits("526-025-09-94")).toBe("5260250994");
    expect(normalizeNipDigits("52602509941234")).toBe("5260250994");
  });
});

describe("isValidNip10", () => {
  it("akceptuje dokładnie 10 cyfr", () => {
    expect(isValidNip10("5260250994")).toBe(true);
    expect(isValidNip10("123")).toBe(false);
    expect(isValidNip10("12345678901")).toBe(false);
  });
});

describe("validateStep1", () => {
  it("wymaga kwoty > 0 i numeru faktury", () => {
    const e1 = validateStep1({ gross: 0, invoiceNumber: "A", isCorrection: false, origNr: "" });
    expect(e1.some((m) => m.includes("Kwota brutto"))).toBe(true);
    const e2 = validateStep1({ gross: 10, invoiceNumber: "   ", isCorrection: false, origNr: "" });
    expect(e2.some((m) => m.includes("numer faktury"))).toBe(true);
  });

  it("dla korekty wymaga numeru oryginału", () => {
    expect(
      validateStep1({ gross: 10, invoiceNumber: "FV/1", isCorrection: true, origNr: "" }).some((m) =>
        m.includes("korygowanej")
      )
    ).toBe(true);
    expect(
      validateStep1({ gross: 10, invoiceNumber: "FV/1", isCorrection: true, origNr: "OLD" })
    ).toHaveLength(0);
  });
});

describe("validateStep2", () => {
  const ok = {
    buyerNip: "5260250994",
    buyerName: "Jan Kowalski",
    buyerAddress: "ul. A 1",
    buyerCity: "Miasto",
    buyerZip: "00-001",
  };

  it("przechodzi dla poprawnych danych", () => {
    expect(validateStep2(ok)).toHaveLength(0);
  });

  it("zgłasza błędy przy brakach", () => {
    expect(
      validateStep2({ ...ok, buyerNip: "123" }).some((m) => m.includes("10 cyfr"))
    ).toBe(true);
    expect(validateStep2({ ...ok, buyerName: "" }).some((m) => m.includes("nazwę"))).toBe(true);
    expect(validateStep2({ ...ok, buyerAddress: "" }).some((m) => m.includes("ulicę"))).toBe(true);
    expect(validateStep2({ ...ok, buyerCity: "" }).some((m) => m.includes("miasto"))).toBe(true);
    expect(validateStep2({ ...ok, buyerZip: "" }).some((m) => m.includes("kod pocztowy"))).toBe(
      true
    );
  });
});
