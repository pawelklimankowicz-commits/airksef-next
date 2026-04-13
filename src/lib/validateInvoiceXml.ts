/** Walidacja strukturalna XML FA (3) — rozszerzona heurystyka zgodna ze schematem KSeF. */

import { CURRENCIES } from "../data/currencies";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

function getTagText(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`);
  const m = xml.match(re);
  return m ? m[1] : null;
}

function hasBlock(xml: string, tag: string): boolean {
  return xml.includes(`<${tag}`) && xml.includes(`</${tag}>`);
}

function parseAmount(val: string | null): number | null {
  if (val === null) return null;
  const n = parseFloat(val);
  return Number.isNaN(n) ? null : n;
}

/** Sprawdza sumę kontrolną NIP (algorytm MF). */
function isValidNipChecksum(nip: string): boolean {
  if (!/^\d{10}$/.test(nip)) return false;
  const w = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const sum = w.reduce((acc, weight, i) => acc + weight * Number(nip[i]), 0);
  return sum % 11 === Number(nip[9]);
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateInvoiceXml(xml: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // --- Deklaracja XML ---
  if (!xml.trim().startsWith("<?xml")) {
    errors.push('Brak deklaracji XML (<?xml version="1.0" ...?>)');
  }

  // --- Namespace ---
  if (!xml.includes('xmlns="http://crd.gov.pl/wzor/2023/06/29/12648/"')) {
    errors.push('Brak lub błędny namespace xmlns="http://crd.gov.pl/wzor/2023/06/29/12648/"');
  }

  // --- Wymagane bloki ---
  if (!hasBlock(xml, "Naglowek")) errors.push("Brak wymaganego elementu: Naglowek");
  if (!hasBlock(xml, "Podmiot1")) errors.push("Brak wymaganego elementu: Podmiot1");
  if (!hasBlock(xml, "Podmiot2")) errors.push("Brak wymaganego elementu: Podmiot2");
  if (!hasBlock(xml, "Fa")) errors.push("Brak wymaganego elementu: Fa");

  // --- Nagłówek ---
  const kod = getTagText(xml, "KodFormularza");
  if (kod !== "FA") errors.push(`KodFormularza powinien być "FA", jest: "${kod}"`);
  if (!xml.includes('kodSystemowy="FA (3)"')) {
    errors.push('Brak atrybutu kodSystemowy="FA (3)"');
  }
  if (!xml.includes('wersjaSchemy="1-0E"')) {
    warnings.push('Atrybut wersjaSchemy powinien być "1-0E" — sprawdź zgodność ze schematem KSeF');
  }

  const wariant = getTagText(xml, "WariantFormularza");
  if (wariant !== "3") {
    errors.push(`WariantFormularza powinien być "3", jest: "${wariant}"`);
  }

  const dataWytworzenia = getTagText(xml, "DataWytworzeniaFa");
  if (!dataWytworzenia) {
    errors.push("Brak wymaganego pola DataWytworzeniaFa");
  } else if (!ISO_DATETIME.test(dataWytworzenia)) {
    errors.push(`DataWytworzeniaFa powinna być w formacie YYYY-MM-DDTHH:MM:SS, jest: "${dataWytworzenia}"`);
  }

  // --- Podmiot1 (nabywca — zagraniczny klient) ---
  const nip1Match = xml.match(/<Podmiot1>[\s\S]*?<NIP>([^<]*)<\/NIP>/);
  if (nip1Match) {
    const k = nip1Match[1];
    if (k === "N/A" || k.trim() === "") {
      warnings.push(
        `NIP/VAT nabywcy (Podmiot1) to "${k}" — ten format może nie zostać zaakceptowany przez KSeF. Sprawdź dane klienta.`
      );
    } else {
      const looksEu = /^[A-Z]{2}[\dA-Z+*.]{2,20}$/i.test(k);
      const looksPl = /^\d{10}$/.test(k);
      if (!looksEu && !looksPl) {
        warnings.push(`NIP/VAT nabywcy (Podmiot1) — niestandardowy format: "${k}". Sprawdź poprawność.`);
      }
    }
  } else {
    errors.push("Brak NIP w sekcji Podmiot1");
  }

  const nazwa1Match = xml.match(/<Podmiot1>[\s\S]*?<Nazwa>([^<]*)<\/Nazwa>/);
  if (!nazwa1Match || !nazwa1Match[1].trim()) {
    errors.push("Brak lub pusta Nazwa nabywcy (Podmiot1)");
  }

  // --- Podmiot2 (sprzedawca — polska firma / freelancer) ---
  const nip2Match = xml.match(/<Podmiot2>[\s\S]*?<NIP>([^<]*)<\/NIP>/);
  if (nip2Match) {
    const nip = nip2Match[1];
    if (!/^\d{10}$/.test(nip)) {
      errors.push(`NIP sprzedawcy (Podmiot2) powinien mieć 10 cyfr, jest: "${nip}"`);
    } else if (!isValidNipChecksum(nip)) {
      errors.push(`NIP sprzedawcy (Podmiot2) ma błędną sumę kontrolną: "${nip}"`);
    }
  } else {
    errors.push("Brak NIP w sekcji Podmiot2");
  }

  const nazwa2Match = xml.match(/<Podmiot2>[\s\S]*?<Nazwa>([^<]*)<\/Nazwa>/);
  if (!nazwa2Match || !nazwa2Match[1].trim()) {
    errors.push("Brak lub pusta Nazwa sprzedawcy (Podmiot2)");
  }

  // --- Sekcja Fa — daty ---
  const p1 = getTagText(xml, "P_1");
  if (!p1) {
    errors.push("Brak wymaganego pola P_1 (data wystawienia)");
  } else if (!ISO_DATE.test(p1)) {
    errors.push(`Data wystawienia (P_1) powinna być w formacie YYYY-MM-DD, jest: "${p1}"`);
  }

  const p6 = getTagText(xml, "P_6");
  if (!p6) {
    errors.push("Brak wymaganego pola P_6 (data sprzedaży)");
  } else if (!ISO_DATE.test(p6)) {
    errors.push(`Data sprzedaży (P_6) powinna być w formacie YYYY-MM-DD, jest: "${p6}"`);
  }

  if (p1 && p6 && ISO_DATE.test(p1) && ISO_DATE.test(p6) && p6 > p1) {
    warnings.push(`Data sprzedaży (P_6: ${p6}) jest późniejsza niż data wystawienia (P_1: ${p1}) — sprawdź czy to zamierzone.`);
  }

  // --- Numer faktury ---
  const p2 = getTagText(xml, "P_2");
  if (!p2 || !p2.trim()) {
    errors.push("Brak lub pusty numer faktury (P_2)");
  }

  // --- Kwoty ---
  const p15 = getTagText(xml, "P_15");
  if (!p15) {
    errors.push("Brak wymaganego pola P_15 (kwota brutto)");
  } else {
    const gross = parseAmount(p15);
    if (gross === null || gross < 0) {
      errors.push(`Kwota brutto (P_15) powinna być liczbą nieujemną, jest: "${p15}"`);
    }
  }

  // Sprawdź obecność co najmniej jednego pola netto
  const netTags = ["P_13_1", "P_13_2", "P_13_3", "P_13_6_1", "P_13_7", "P_13_11"];
  if (!netTags.some((t) => getTagText(xml, t) !== null)) {
    errors.push("Brak pola kwoty netto (P_13_1/P_13_2/P_13_3/P_13_6_1/P_13_7/P_13_11)");
  }

  // Walidacja wartości pól kwotowych
  const amountTags = [
    "P_13_1", "P_13_2", "P_13_3", "P_13_6_1", "P_13_7", "P_13_11",
    "P_14_1", "P_14_2", "P_14_3",
  ];
  for (const tag of amountTags) {
    const val = getTagText(xml, tag);
    if (val !== null) {
      const n = parseAmount(val);
      if (n === null || n < 0) {
        errors.push(`Pole ${tag} powinno zawierać liczbę nieujemną, jest: "${val}"`);
      }
    }
  }

  // Spójność: netto + VAT ≈ brutto (tolerancja 0.02 PLN na zaokrąglenia)
  const gross = parseAmount(p15);
  const netFields: Array<[string, string]> = [
    ["P_13_1", "P_14_1"], ["P_13_2", "P_14_2"], ["P_13_3", "P_14_3"],
  ];
  for (const [netTag, vatTag] of netFields) {
    const net = parseAmount(getTagText(xml, netTag));
    const vat = parseAmount(getTagText(xml, vatTag));
    if (net !== null && vat !== null && gross !== null) {
      const diff = Math.abs(net + vat - gross);
      if (diff > 0.02) {
        warnings.push(
          `Kwoty mogą nie bilansować się: ${netTag}(${net}) + ${vatTag}(${vat}) = ${(net + vat).toFixed(2)}, ale P_15(brutto) = ${gross}. Sprawdź zaokrąglenia.`
        );
      }
    }
  }

  // --- Waluta ---
  const wal = getTagText(xml, "KodWaluty");
  if (!wal) {
    errors.push("Brak kodu waluty (KodWaluty)");
  } else if (!(CURRENCIES as readonly string[]).includes(wal)) {
    errors.push(`Nieznany kod waluty: "${wal}"`);
  }

  // Kurs waluty wymagany dla walut obcych
  if (wal && wal !== "PLN") {
    const kurs = getTagText(xml, "KursWalutyZ");
    if (!kurs) {
      warnings.push(`Waluta ${wal} wymaga podania kursu średniego NBP (KursWalutyZ) — brak pola w XML.`);
    } else {
      const k = parseAmount(kurs);
      if (k === null || k <= 0) {
        errors.push(`Kurs waluty (KursWalutyZ) powinien być liczbą dodatnią, jest: "${kurs}"`);
      }
    }
  }

  // --- Faktura korygująca ---
  const rodzajFaktury = getTagText(xml, "RodzajFaktury");
  if (rodzajFaktury === "KOR") {
    if (!hasBlock(xml, "DaneFaKorygowanej")) {
      errors.push("Faktura korygująca (KOR) wymaga sekcji DaneFaKorygowanej");
    } else {
      const dataWystKor = xml.match(/<DataWystFaKorygowanej>([^<]*)<\/DataWystFaKorygowanej>/);
      if (!dataWystKor || !ISO_DATE.test(dataWystKor[1])) {
        errors.push("DataWystFaKorygowanej musi być w formacie YYYY-MM-DD");
      }
      const nrKor = xml.match(/<NrFaKorygowanej>([^<]*)<\/NrFaKorygowanej>/);
      if (!nrKor || !nrKor[1].trim()) {
        errors.push("Brak NrFaKorygowanej w DaneFaKorygowanej");
      }
    }
  }

  // --- Adnotacje ---
  if (!hasBlock(xml, "Adnotacje")) {
    errors.push("Brak wymaganej sekcji Adnotacje");
  } else {
    const adnotacje = ["P_16", "P_17", "P_18", "P_18A", "P_19", "P_22", "P_23", "P_PMarzy"];
    for (const k of adnotacje) {
      if (!hasBlock(xml, k)) {
        errors.push(`Brak wymaganej adnotacji: ${k}`);
      } else {
        const v = getTagText(xml, k);
        if (v !== "1" && v !== "2") {
          warnings.push(`Adnotacja ${k} powinna mieć wartość "1" lub "2", jest: "${v}"`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
