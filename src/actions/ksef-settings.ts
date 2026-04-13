"use server";

import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { ensureAppUser } from "@/lib/ensure-user";
import { encrypt, decrypt } from "@/lib/ksef-encryption";

export interface SellerSettings {
  sellerNip: string;
  sellerName: string;
  sellerAddress: string;
  sellerCity: string;
  sellerZip: string;
  ksefToken: string;        // plain text — tylko przy odczycie; "" jeśli nie ustawiony
  ksefEnvironment: "test" | "prod";
  hasToken: boolean;        // czy token jest zapisany (bez ujawniania wartości)
}

// Typ wiersza zwracanego przez raw query
type KsefUserRow = {
  seller_nip: string | null;
  seller_name: string | null;
  seller_address: string | null;
  seller_city: string | null;
  seller_zip: string | null;
  ksef_token_encrypted: string | null;
  ksef_environment: string | null;
};

/** Pobiera ustawienia sprzedawcy i KSeF dla zalogowanego użytkownika. */
export async function getSellerSettingsAction(): Promise<
  { ok: true; settings: Omit<SellerSettings, "ksefToken"> & { ksefTokenMasked: string } } |
  { ok: false; error: string }
> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Wymagane logowanie." };

  const u = await ensureAppUser();
  if (!u) return { ok: false, error: "Nie znaleziono konta." };

  const rows = await prisma.$queryRaw<KsefUserRow[]>(
    Prisma.sql`
      SELECT
        "sellerNip"          AS seller_nip,
        "sellerName"         AS seller_name,
        "sellerAddress"      AS seller_address,
        "sellerCity"         AS seller_city,
        "sellerZip"          AS seller_zip,
        "ksefTokenEncrypted" AS ksef_token_encrypted,
        "ksefEnvironment"    AS ksef_environment
      FROM "User"
      WHERE id = ${u.id}
      LIMIT 1
    `
  );

  const row = rows[0];
  const hasToken = !!row?.ksef_token_encrypted;
  const ksefTokenMasked = hasToken ? "••••••••••••••••" : "";

  return {
    ok: true,
    settings: {
      sellerNip: row?.seller_nip ?? "",
      sellerName: row?.seller_name ?? "",
      sellerAddress: row?.seller_address ?? "",
      sellerCity: row?.seller_city ?? "",
      sellerZip: row?.seller_zip ?? "",
      ksefTokenMasked,
      hasToken,
      ksefEnvironment: (row?.ksef_environment === "prod" ? "prod" : "test"),
    },
  };
}

/** Zapisuje dane sprzedawcy i/lub token KSeF. Token jest szyfrowany przed zapisem. */
export async function saveSellerSettingsAction(data: {
  sellerNip: string;
  sellerName: string;
  sellerAddress: string;
  sellerCity: string;
  sellerZip: string;
  ksefToken?: string;      // jeśli puste — token pozostaje bez zmian
  clearToken?: boolean;    // jeśli true — usuwa token
  ksefEnvironment: "test" | "prod";
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Wymagane logowanie." };

  const u = await ensureAppUser();
  if (!u) return { ok: false, error: "Nie znaleziono konta." };

  // Walidacja NIP (10 cyfr)
  if (data.sellerNip && !/^\d{10}$/.test(data.sellerNip)) {
    return { ok: false, error: "NIP musi mieć dokładnie 10 cyfr." };
  }

  // Szyfrowanie tokenu jeśli podany
  let newToken: string | null | undefined = undefined; // undefined = nie zmieniaj
  if (data.clearToken) {
    newToken = null;
  } else if (data.ksefToken?.trim()) {
    try {
      newToken = encrypt(data.ksefToken.trim());
    } catch {
      // KSEF_ENCRYPTION_KEY nie jest ustawiony — zapisz token bez szyfrowania (tylko dev)
      newToken = `plain:${data.ksefToken.trim()}`;
    }
  }

  const sellerNipVal = data.sellerNip.trim() || null;
  const sellerNameVal = data.sellerName.trim() || null;
  const sellerAddressVal = data.sellerAddress.trim() || null;
  const sellerCityVal = data.sellerCity.trim() || null;
  const sellerZipVal = data.sellerZip.trim() || null;
  const envVal = data.ksefEnvironment;

  if (newToken !== undefined) {
    // Aktualizacja z tokenem
    await prisma.$executeRaw`
      UPDATE "User"
      SET
        "sellerNip"          = ${sellerNipVal},
        "sellerName"         = ${sellerNameVal},
        "sellerAddress"      = ${sellerAddressVal},
        "sellerCity"         = ${sellerCityVal},
        "sellerZip"          = ${sellerZipVal},
        "ksefTokenEncrypted" = ${newToken},
        "ksefEnvironment"    = ${envVal}
      WHERE id = ${u.id}
    `;
  } else {
    // Aktualizacja bez zmiany tokenu
    await prisma.$executeRaw`
      UPDATE "User"
      SET
        "sellerNip"       = ${sellerNipVal},
        "sellerName"      = ${sellerNameVal},
        "sellerAddress"   = ${sellerAddressVal},
        "sellerCity"      = ${sellerCityVal},
        "sellerZip"       = ${sellerZipVal},
        "ksefEnvironment" = ${envVal}
      WHERE id = ${u.id}
    `;
  }

  return { ok: true };
}

/** Odszyfrowuje i zwraca token KSeF (tylko dla Server Actions wysyłki). */
export async function getDecryptedKsefToken(): Promise<
  { ok: true; token: string; nip: string; env: "test" | "prod" } |
  { ok: false; error: string }
> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Wymagane logowanie." };

  const u = await ensureAppUser();
  if (!u) return { ok: false, error: "Nie znaleziono konta." };

  const rows = await prisma.$queryRaw<KsefUserRow[]>(
    Prisma.sql`
      SELECT
        "sellerNip"          AS seller_nip,
        "ksefTokenEncrypted" AS ksef_token_encrypted,
        "ksefEnvironment"    AS ksef_environment
      FROM "User"
      WHERE id = ${u.id}
      LIMIT 1
    `
  );

  const row = rows[0];

  if (!row?.ksef_token_encrypted) {
    return { ok: false, error: "Token KSeF nie jest zapisany. Skonfiguruj go w ustawieniach (/ksef)." };
  }
  if (!row.seller_nip) {
    return { ok: false, error: "Nie podano NIP sprzedawcy. Uzupełnij dane w ustawieniach (/ksef)." };
  }

  let token: string;
  if (row.ksef_token_encrypted.startsWith("plain:")) {
    token = row.ksef_token_encrypted.slice(6);
  } else {
    try {
      token = decrypt(row.ksef_token_encrypted);
    } catch {
      return { ok: false, error: "Nie udało się odszyfrować tokenu. Sprawdź KSEF_ENCRYPTION_KEY." };
    }
  }

  return {
    ok: true,
    token,
    nip: row.seller_nip,
    env: row.ksef_environment === "prod" ? "prod" : "test",
  };
}
