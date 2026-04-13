export const BUYER_PROFILE_KEY = "airksef_buyer_profile_v1";

export interface BuyerProfile {
  buyerNip: string;
  buyerName: string;
  buyerAddress: string;
  buyerCity: string;
  buyerZip: string;
}

export function normalizeNipDigits(input: string): string {
  return input.replace(/\D/g, "").slice(0, 10);
}

export function isValidNip10(nip: string): boolean {
  return /^\d{10}$/.test(nip);
}

export function validateStep1(params: {
  gross: number;
  invoiceNumber: string;
  isCorrection: boolean;
  origNr: string;
}): string[] {
  const e: string[] = [];
  if (!(params.gross > 0)) e.push("Kwota brutto musi być większa od zera.");
  if (!params.invoiceNumber.trim()) e.push("Podaj numer faktury.");
  if (params.isCorrection && !params.origNr.trim()) {
    e.push("Dla faktury korygującej podaj numer faktury korygowanej.");
  }
  return e;
}

export function validateStep2(params: BuyerProfile): string[] {
  const e: string[] = [];
  if (!isValidNip10(params.buyerNip)) e.push("Twój NIP (sprzedawca) musi mieć dokładnie 10 cyfr.");
  if (!params.buyerName.trim()) e.push("Podaj swoją nazwę firmy lub imię i nazwisko.");
  if (!params.buyerAddress.trim()) e.push("Podaj ulicę i numer (adres sprzedawcy).");
  if (!params.buyerCity.trim()) e.push("Podaj miasto (adres sprzedawcy).");
  if (!params.buyerZip.trim()) e.push("Podaj kod pocztowy (adres sprzedawcy).");
  return e;
}

export function loadBuyerProfile(): Partial<BuyerProfile> | null {
  try {
    const raw = localStorage.getItem(BUYER_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<BuyerProfile>;
  } catch {
    return null;
  }
}

export function saveBuyerProfile(p: BuyerProfile): void {
  localStorage.setItem(BUYER_PROFILE_KEY, JSON.stringify(p));
}
