import { describe, expect, it } from "vitest";

import type { InvoiceInput } from "@/types/invoice";

import { splitGross } from "./vatMath";
import { buildInvoiceXml, escapeXml } from "./xmlInvoice";
import { validateInvoiceXml } from "./validateInvoiceXml";

function baseInvoice(overrides: Partial<InvoiceInput> = {}): InvoiceInput {
  return {
    buyerNip: "5260250994",
    buyerName: "Test Sp. z o.o.",
    buyerAddress: "ul. Testowa 1",
    buyerCity: "Warszawa",
    buyerZip: "00-001",
    supplierName: "Uber B.V.",
    supplierVat: "NL852071839B01",
    supplierAddress: "Amsterdam",
    supplierCountryCode: "NL",
    currency: "EUR",
    issueDate: "2026-04-07",
    saleDate: "2026-04-07",
    invoiceNumber: "FV/1/2026",
    grossAmount: 123,
    netAmount: 100,
    vatAmount: 23,
    vatRate: "23%",
    ...overrides,
  };
}

describe("escapeXml", () => {
  it("escapuje znaki specjalne XML", () => {
    expect(escapeXml(`a & b < c > "d" 'e'`)).toBe(
      "a &amp; b &lt; c &gt; &quot;d&quot; &apos;e&apos;"
    );
  });
});

describe("buildInvoiceXml", () => {
  it("buduje poprawny szkielet FA(3) z VAT 23%", () => {
    const xml = buildInvoiceXml(baseInvoice());
    expect(xml).toContain('kodSystemowy="FA (3)"');
    expect(xml).toContain("<KodFormularza");
    expect(xml).toContain("<NIP>5260250994</NIP>");
    expect(xml).toContain("<NIP>NL852071839B01</NIP>");
    expect(xml).toContain("<P_13_1>100.00</P_13_1>");
    expect(xml).toContain("<P_14_1>23.00</P_14_1>");
    expect(xml).toContain("<P_15>123.00</P_15>");
    expect(xml).toContain("<KodWaluty>EUR</KodWaluty>");
  });

  it("dodaje KursWalutyZ dla waluty obcej i kursu", () => {
    const xml = buildInvoiceXml(
      baseInvoice({ currency: "USD", exchangeRate: 4.1234 })
    );
    expect(xml).toContain("<KursWalutyZ>4.1234</KursWalutyZ>");
  });

  it("nie dodaje kursu dla PLN", () => {
    const xml = buildInvoiceXml(
      baseInvoice({
        currency: "PLN",
        grossAmount: 100,
        netAmount: 81.3,
        vatAmount: 18.7,
        exchangeRate: 1,
      })
    );
    expect(xml).not.toContain("KursWalutyZ");
  });

  it("obsługuje stawki 8%, 5%, ZW, NP", () => {
    const rates = ["8%", "5%", "ZW", "NP"] as const;
    const gross = 100;
    for (const vatRate of rates) {
      const { net, vat } = splitGross(gross, vatRate);
      const xml = buildInvoiceXml(
        baseInvoice({
          vatRate,
          grossAmount: gross,
          netAmount: net,
          vatAmount: vat,
        })
      );
      expect(validateInvoiceXml(xml).valid).toBe(true);
    }
  });

  it("faktura korygująca zawiera KOR i DaneFaKorygowanej", () => {
    const xml = buildInvoiceXml(
      baseInvoice({
        isCorrection: true,
        originalInvoiceNumber: "FV/OLD/1",
        originalKsefNumber: "KSEF-123",
        correctionReason: "Pomyłka kwoty",
      })
    );
    expect(xml).toContain("<RodzajFaktury>KOR</RodzajFaktury>");
    expect(xml).toContain("<NrFaKorygowanej>FV/OLD/1</NrFaKorygowanej>");
    expect(xml).toContain("<NrKSeF>KSEF-123</NrKSeF>");
    expect(xml).toContain("<P_15Z>Pomyłka kwoty</P_15Z>");
  });
});

describe("buildInvoiceXml + validateInvoiceXml", () => {
  it("wygenerowany XML przechodzi walidację heurystyczną", () => {
    const xml = buildInvoiceXml(baseInvoice());
    const v = validateInvoiceXml(xml);
    expect(v.valid).toBe(true);
    expect(v.errors).toEqual([]);
  });

  it("wykrywa uszkodzony XML", () => {
    const v = validateInvoiceXml("<broken/>");
    expect(v.valid).toBe(false);
    expect(v.errors.length).toBeGreaterThan(0);
  });
});
