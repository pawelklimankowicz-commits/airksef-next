"use server";

import { auth } from "@clerk/nextjs/server";

import { submitInvoiceWithToken } from "@/lib/ksef-api";
import { getDecryptedKsefToken } from "@/actions/ksef-settings";

export type KsefSubmitResult =
  | { ok: true; mode: "mock" | "live" | "ksef-api"; reference?: string; message: string }
  | { ok: false; error: string };

/**
 * Wysyłka XML FA(3) do KSeF.
 *
 * Priorytety:
 *   1. Jeśli użytkownik ma zapisany token KSeF → prawdziwe API MF (ksef-api mode)
 *   2. Jeśli ustawiono KSEF_SUBMIT_URL → własny proxy endpoint (live mode)
 *   3. Fallback: symulacja (mock mode) — plik nie trafia nigdzie
 */
export async function submitXmlToKsefAction(xml: string): Promise<KsefSubmitResult> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "Zaloguj się, aby wysłać fakturę do KSeF." };
  }

  const trimmed = xml.trim();
  if (!trimmed.startsWith("<?xml") && !trimmed.includes("<Faktura")) {
    return { ok: false, error: "Plik nie wygląda jak XML FA(3). Sprawdź zawartość." };
  }

  // --- Priorytet 1: zapisany token użytkownika → bezpośrednie API KSeF ---
  const tokenResult = await getDecryptedKsefToken();
  if (tokenResult.ok) {
    const { token, nip, env } = tokenResult;
    const result = await submitInvoiceWithToken({ nip, token, xmlContent: trimmed, env });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    return {
      ok: true,
      mode: "ksef-api",
      reference: result.ksefReferenceNumber,
      message: `Faktura wysłana do KSeF (${env === "prod" ? "produkcja" : "test"}). Numer KSeF: ${result.ksefReferenceNumber}`,
    };
  }

  // --- Priorytet 2: własny endpoint proxy (zmienna środowiskowa) ---
  const submitUrl = process.env.KSEF_SUBMIT_URL?.trim();
  const envToken = process.env.KSEF_ACCESS_TOKEN?.trim();

  if (submitUrl) {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/xml" };
      if (envToken) headers.Authorization = `Bearer ${envToken}`;

      const res = await fetch(submitUrl, { method: "POST", headers, body: trimmed });
      const text = await res.text();

      if (!res.ok) {
        return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 800)}` };
      }

      return {
        ok: true,
        mode: "live",
        reference: text.slice(0, 200),
        message: "Odpowiedź z KSEF_SUBMIT_URL zapisana. Sprawdź status w systemie docelowym.",
      };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Błąd połączenia z KSEF_SUBMIT_URL",
      };
    }
  }

  // --- Priorytet 3: symulacja ---
  const ref = `MOCK-KSEF-${Date.now()}`;
  return {
    ok: true,
    mode: "mock",
    reference: ref,
    message:
      "Tryb symulacji — faktura NIE została wysłana do MF. Aby wysyłać naprawdę, skonfiguruj token KSeF w ustawieniach poniżej.",
  };
}
