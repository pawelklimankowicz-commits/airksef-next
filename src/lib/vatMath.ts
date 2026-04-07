import type { VatRate } from "../types/invoice";

/** Rozkład kwoty brutto na netto + VAT wg stawki. */
export function splitGross(gross: number, rate: VatRate): { net: number; vat: number } {
  if (rate === "ZW" || rate === "NP" || rate === "0%") {
    return { net: round2(gross), vat: 0 };
  }
  const r = rate === "23%" ? 0.23 : rate === "8%" ? 0.08 : rate === "5%" ? 0.05 : 0;
  const net = gross / (1 + r);
  const vat = gross - net;
  return { net: round2(net), vat: round2(vat) };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
