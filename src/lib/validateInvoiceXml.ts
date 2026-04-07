/** Walidacja strukturalna XML FA (heurystyka jak w pierwotnej aplikacji). */

import { CURRENCIES } from "../data/currencies";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function getTagText(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`);
  const m = xml.match(re);
  return m ? m[1] : null;
}

function hasBlock(xml: string, tag: string): boolean {
  return xml.includes(`<${tag}`) && xml.includes(`</${tag}>`);
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateInvoiceXml(xml: string): ValidationResult {
  const errors: string[] = [];

  if (!hasBlock(xml, "Naglowek")) errors.push("Brak wymaganego elementu: Naglowek");
  if (!hasBlock(xml, "Podmiot1")) errors.push("Brak wymaganego elementu: Podmiot1");
  if (!hasBlock(xml, "Podmiot2")) errors.push("Brak wymaganego elementu: Podmiot2");
  if (!hasBlock(xml, "Fa")) errors.push("Brak wymaganego elementu: Fa");

  const kod = getTagText(xml, "KodFormularza");
  if (kod !== "FA") errors.push(`KodFormularza powinien być "FA", jest: "${kod}"`);
  if (!xml.includes('kodSystemowy="FA (3)"')) {
    errors.push('Brak atrybutu kodSystemowy="FA (3)"');
  }

  const nip1 = xml.match(/<Podmiot1>[\s\S]*?<NIP>([^<]*)<\/NIP>/);
  if (nip1) {
    const k = nip1[1];
    if (!/^\d{10}$/.test(k)) errors.push(`NIP nabywcy (Podmiot1) powinien mieć 10 cyfr, jest: "${k}"`);
  }

  const nip2 = xml.match(/<Podmiot2>[\s\S]*?<NIP>([^<]*)<\/NIP>/);
  if (nip2) {
    const k = nip2[1];
    const looksEu = /^[A-Z]{2}[\dA-Z+*.]{2,20}$/i.test(k);
    const looksPl = /^\d{10}$/.test(k);
    if (k.length > 0 && k !== "N/A" && !looksEu && !looksPl && k.length < 8) {
      errors.push(`NIP/VAT dostawcy (Podmiot2) — sprawdź format: "${k}"`);
    }
  }

  const p1 = getTagText(xml, "P_1");
  if (!p1) errors.push("Brak wymaganego pola P_1 (data wystawienia)");
  else if (!ISO_DATE.test(p1)) errors.push(`Data wystawienia (P_1) powinna być w formacie YYYY-MM-DD, jest: "${p1}"`);

  const p6 = getTagText(xml, "P_6");
  if (!p6) errors.push("Brak wymaganego pola P_6 (data sprzedaży)");
  else if (!ISO_DATE.test(p6)) errors.push(`Data sprzedaży (P_6) powinna być w formacie YYYY-MM-DD, jest: "${p6}"`);

  if (!getTagText(xml, "P_2")) errors.push("Brak wymaganego pola P_2 (numer faktury)");

  const p15 = getTagText(xml, "P_15");
  if (!p15) errors.push("Brak wymaganego pola P_15 (kwota brutto)");
  else {
    const v = parseFloat(p15);
    if (Number.isNaN(v) || v < 0) errors.push(`Kwota brutto (P_15) powinna być liczbą nieujemną, jest: "${p15}"`);
  }

  const netTags = ["P_13_1", "P_13_2", "P_13_3", "P_13_6_1", "P_13_7", "P_13_11"];
  if (!netTags.some((t) => hasBlock(xml, t) || getTagText(xml, t) !== null)) {
    errors.push("Brak pola kwoty netto (P_13_1/P_13_2/P_13_3/P_13_6_1/P_13_7/P_13_11)");
  }

  const amountTags = [
    "P_13_1", "P_13_2", "P_13_3", "P_13_6_1", "P_13_7", "P_13_11",
    "P_14_1", "P_14_2", "P_14_3",
  ];
  for (const tag of amountTags) {
    const val = getTagText(xml, tag);
    if (val !== null) {
      const j = parseFloat(val);
      if (Number.isNaN(j) || j < 0) errors.push(`Pole ${tag} powinno zawierać liczbę nieujemną, jest: "${val}"`);
    }
  }

  const wal = getTagText(xml, "KodWaluty");
  if (!wal) errors.push("Brak kodu waluty (KodWaluty)");
  else if (!(CURRENCIES as readonly string[]).includes(wal)) errors.push(`Nieznany kod waluty: "${wal}"`);

  if (!hasBlock(xml, "Adnotacje")) errors.push("Brak sekcji Adnotacje");
  const ad = ["P_16", "P_17", "P_18", "P_18A", "P_19", "P_22", "P_23", "P_PMarzy"];
  for (const k of ad) {
    if (!hasBlock(xml, k)) errors.push(`Brak wymaganej adnotacji: ${k}`);
  }

  return { valid: errors.length === 0, errors };
}
