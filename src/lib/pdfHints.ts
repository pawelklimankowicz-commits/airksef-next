/** Heurystyki z tekstu wyciągniętego z PDF (nie OCR skanu — tylko warstwa tekstowa). */

export type PdfFieldHints = {
  buyerNip?: string;
  grossStr?: string;
  currency?: string;
  issueDate?: string;
  saleDate?: string;
  invoiceNumber?: string;
};

function normalizeNip(s: string): string {
  return s.replace(/\D/g, "").slice(0, 10);
}

/** Szuka NIP PL (10 cyfr, często z myślnikami). */
export function findNipInText(text: string): string | undefined {
  const patterns = [
    /\b(\d{3}-\d{3}-\d{2}-\d{3})\b/g,
    /\b(\d{10})\b/g,
    /NIP[:\s]*([0-9\-]{10,13})/gi,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    const r = new RegExp(re.source, re.flags);
    while ((m = r.exec(text)) !== null) {
      const d = normalizeNip(m[1] ?? m[0]);
      if (d.length === 10) return d;
    }
  }
  return undefined;
}

function findAmount(text: string): string | undefined {
  const lines = text.split(/\r?\n/);
  const keywords = /(total|amount|brutto|kwota|do zapłaty|gross)/i;
  for (const line of lines) {
    if (keywords.test(line)) {
      const m = line.match(/(\d{1,3}(?:[ .]\d{3})*[.,]\d{2})/);
      if (m) return m[1].replace(/\s/g, "").replace(",", ".");
    }
  }
  const fallback = text.match(/(\d+[.,]\d{2})\s*(EUR|USD|PLN|€)/i);
  if (fallback) return fallback[1].replace(",", ".");
  return undefined;
}

function findCurrency(text: string): string | undefined {
  const m = text.match(/\b(EUR|USD|PLN|GBP)\b/i);
  return m ? m[1].toUpperCase() : undefined;
}

function findIsoDate(text: string): string | undefined {
  const m = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  return m ? m[1] : undefined;
}

function findPlDate(text: string): string | undefined {
  const m = text.match(/\b(\d{1,2})[./-](\d{1,2})[./-](20\d{2})\b/);
  if (!m) return undefined;
  const d = m[1].padStart(2, "0");
  const mo = m[2].padStart(2, "0");
  const y = m[3];
  return `${y}-${mo}-${d}`;
}

function findInvoiceNumber(text: string): string | undefined {
  const m = text.match(/(?:invoice|faktura|nr\.?|no\.?)[\s#:]*([A-Z0-9/_\-]{4,40})/i);
  return m ? m[1].trim() : undefined;
}

export function extractInvoiceHintsFromText(text: string): PdfFieldHints {
  const t = text.replace(/\u00a0/g, " ");
  const nip = findNipInText(t);
  const grossStr = findAmount(t);
  const currency = findCurrency(t);
  const issueDate = findIsoDate(t) ?? findPlDate(t);
  const saleDate = findIsoDate(t) ?? findPlDate(t);
  const invoiceNumber = findInvoiceNumber(t);
  return {
    buyerNip: nip,
    grossStr,
    currency: currency && ["EUR", "USD", "PLN", "GBP"].includes(currency) ? currency : undefined,
    issueDate,
    saleDate,
    invoiceNumber,
  };
}
