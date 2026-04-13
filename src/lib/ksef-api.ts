/**
 * Klient KSeF API Ministerstwa Finansów.
 *
 * Obsługuje dwa środowiska:
 *   - test: https://ksef-test.mf.gov.pl/api  (bezpieczne testy, nie generuje prawdziwych faktur)
 *   - prod: https://ksef.mf.gov.pl/api        (produkcja)
 *
 * Flow dla tokenu autoryzacyjnego:
 *   1. initTokenSession()  → sessionToken
 *   2. sendInvoice()       → ksefReferenceNumber
 *   3. terminateSession()
 */

import crypto from "node:crypto";

export type KsefEnvironment = "test" | "prod";

const BASE_URLS: Record<KsefEnvironment, string> = {
  test: "https://ksef-test.mf.gov.pl/api",
  prod: "https://ksef.mf.gov.pl/api",
};

// ---------- typy odpowiedzi API ----------

export interface KsefSessionResponse {
  timestamp: string;
  referenceNumber: string;
  sessionToken: {
    token: string;
    context: {
      contextName: string;
      contextIdentifier: { type: string; identifier: string };
      credentials: { identifier: { type: string; identifier: string }; token: string };
    };
  };
}

export interface KsefInvoiceSendResponse {
  timestamp: string;
  referenceNumber: string;
  elementReferenceNumber: string;
  processingCode: number;
  processingDescription: string;
  ksefReferenceNumber?: string;
  ksefReferenceTimestamp?: string;
}

export interface KsefApiError {
  Timestamp?: string;
  ServiceCtx?: string;
  ServiceCode?: string;
  ServiceName?: string;
  ErrorCode?: string;
  Exception?: string;
  exceptionDetailList?: Array<{ exceptionCode: number; exceptionDescription: string }>;
}

// ---------- inicjalizacja sesji ----------

/**
 * Inicjuje sesję KSeF przy użyciu tokenu autoryzacyjnego (wystawionego przez portal MF).
 * @param nip       NIP podatnika (10 cyfr)
 * @param token     token autoryzacyjny z portalu KSeF (plain text, przed Base64)
 * @param env       środowisko: "test" | "prod"
 */
export async function initKsefTokenSession(
  nip: string,
  token: string,
  env: KsefEnvironment = "test"
): Promise<{ ok: true; sessionToken: string } | { ok: false; error: string }> {
  const url = `${BASE_URLS[env]}/online/Session/InitToken`;

  // Token w żądaniu musi być zakodowany Base64
  const tokenBase64 = Buffer.from(token, "utf-8").toString("base64");

  const body = {
    context: {
      credentials: {
        identifier: { type: "onip", identifier: nip },
        token: tokenBase64,
      },
      contextIdentifier: { type: "onip", identifier: nip },
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=UTF-8" },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as KsefSessionResponse | KsefApiError;

    if (!res.ok) {
      const err = json as KsefApiError;
      const msg =
        err.exceptionDetailList?.[0]?.exceptionDescription ??
        err.Exception ??
        err.ErrorCode ??
        `HTTP ${res.status}`;
      return { ok: false, error: `KSeF InitSession błąd: ${msg}` };
    }

    const success = json as KsefSessionResponse;
    return { ok: true, sessionToken: success.sessionToken.token };
  } catch (e) {
    return {
      ok: false,
      error: `Błąd połączenia z KSeF (${env}): ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

// ---------- wysyłka faktury ----------

/**
 * Wysyła fakturę FA(3) do KSeF w aktywnej sesji.
 * @param sessionToken  token sesji z initKsefTokenSession()
 * @param xmlContent    treść pliku XML FA(3)
 * @param env           środowisko
 */
export async function sendInvoiceToKsef(
  sessionToken: string,
  xmlContent: string,
  env: KsefEnvironment = "test"
): Promise<{ ok: true; ksefReferenceNumber: string; elementReferenceNumber: string } | { ok: false; error: string }> {
  const url = `${BASE_URLS[env]}/online/Invoice/Send`;

  const xmlBytes = Buffer.from(xmlContent, "utf-8");
  const hashValue = crypto.createHash("sha256").update(xmlBytes).digest("base64");

  const body = {
    invoiceHash: {
      hashSHA: {
        algorithm: "SHA-256",
        encoding: "Base64",
        value: hashValue,
      },
      fileSize: xmlBytes.length,
    },
    invoicePayload: {
      type: "plain",
      invoiceBody: xmlBytes.toString("base64"),
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        SessionToken: sessionToken,
      },
      body: JSON.stringify(body),
    });

    const json = (await res.json()) as KsefInvoiceSendResponse | KsefApiError;

    if (!res.ok) {
      const err = json as KsefApiError;
      const msg =
        err.exceptionDetailList?.[0]?.exceptionDescription ??
        err.Exception ??
        err.ErrorCode ??
        `HTTP ${res.status}`;
      return { ok: false, error: `KSeF SendInvoice błąd: ${msg}` };
    }

    const success = json as KsefInvoiceSendResponse;
    return {
      ok: true,
      ksefReferenceNumber: success.ksefReferenceNumber ?? success.elementReferenceNumber ?? success.referenceNumber,
      elementReferenceNumber: success.elementReferenceNumber ?? success.referenceNumber,
    };
  } catch (e) {
    return {
      ok: false,
      error: `Błąd wysyłki do KSeF (${env}): ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

// ---------- zakończenie sesji ----------

export async function terminateKsefSession(
  sessionToken: string,
  env: KsefEnvironment = "test"
): Promise<void> {
  const url = `${BASE_URLS[env]}/online/Session/Terminate`;
  try {
    await fetch(url, {
      method: "DELETE",
      headers: { SessionToken: sessionToken },
    });
  } catch {
    // Ignorujemy błędy przy zamykaniu sesji — nie krytyczne
  }
}

// ---------- pełny flow: sesja + wyślij + zakończ ----------

/**
 * Skrócony helper: inicjuje sesję, wysyła fakturę, zamyka sesję.
 */
export async function submitInvoiceWithToken(params: {
  nip: string;
  token: string;
  xmlContent: string;
  env: KsefEnvironment;
}): Promise<{ ok: true; ksefReferenceNumber: string } | { ok: false; error: string }> {
  const { nip, token, xmlContent, env } = params;

  const initResult = await initKsefTokenSession(nip, token, env);
  if (!initResult.ok) return initResult;

  const sendResult = await sendInvoiceToKsef(initResult.sessionToken, xmlContent, env);
  await terminateKsefSession(initResult.sessionToken, env);

  if (!sendResult.ok) return sendResult;
  return { ok: true, ksefReferenceNumber: sendResult.ksefReferenceNumber };
}
