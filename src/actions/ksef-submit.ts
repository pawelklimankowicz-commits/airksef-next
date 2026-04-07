"use server";

import { auth } from "@clerk/nextjs/server";

export type KsefSubmitResult =
  | { ok: true; mode: "mock" | "live"; reference?: string; message: string }
  | { ok: false; error: string };

/**
 * Wysyłka XML FA do KSeF.
 * - Domyślnie: symulacja (bezpieczny test), gdy brak KSEF_SUBMIT_URL.
 * - Produkcja: ustaw pełny URL endpointu z dokumentacji MF (np. proxy w Twojej firmie) + KSEF_ACCESS_TOKEN jeśli wymagany.
 */
export async function submitXmlToKsefAction(xml: string): Promise<KsefSubmitResult> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "Zaloguj się, aby wysłać plik do KSeF." };
  }
  const trimmed = xml.trim();
  if (!trimmed.startsWith("<?xml") && !trimmed.includes("<FA")) {
    return { ok: false, error: "To nie wygląda na plik XML FA." };
  }

  const submitUrl = process.env.KSEF_SUBMIT_URL?.trim();
  const token = process.env.KSEF_ACCESS_TOKEN?.trim();

  if (!submitUrl) {
    const ref = `MOCK-KSEF-${Date.now()}`;
    return {
      ok: true,
      mode: "mock",
      reference: ref,
      message:
        "Symulacja wysyłki OK. Aby wysyłać naprawdę, w .env.local ustaw KSEF_SUBMIT_URL (endpoint zgodny z Twoją integracją API KSeF) oraz ewentualnie KSEF_ACCESS_TOKEN.",
    };
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/xml",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(submitUrl, {
      method: "POST",
      headers,
      body: trimmed,
    });
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
