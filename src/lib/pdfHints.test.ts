import { describe, expect, it } from "vitest";

import { extractInvoiceHintsFromText, findNipInText } from "./pdfHints";

describe("findNipInText", () => {
  it("znajduje NIP z myślnikami", () => {
    expect(findNipInText("Nabywca NIP: 525-123-45-67")).toBe("5251234567");
  });

  it("znajduje ciąg 10 cyfr", () => {
    expect(findNipInText("ID 1234567890 koniec")).toBe("1234567890");
  });

  it("zwraca undefined gdy brak NIP", () => {
    expect(findNipInText("brak numeru")).toBeUndefined();
  });
});

describe("extractInvoiceHintsFromText", () => {
  it("wyciąga podstawowe pola z faktury tekstowej", () => {
    const text = `
      Invoice FV/2026/001
      NIP: 1234567890
      Total gross 1845.00 EUR
      Date 2026-04-01
    `;
    const h = extractInvoiceHintsFromText(text);
    expect(h.buyerNip).toBe("1234567890");
    expect(h.currency).toBe("EUR");
    expect(h.issueDate).toBe("2026-04-01");
  });
});
