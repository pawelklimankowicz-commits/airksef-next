import Link from "next/link";

import { KsefClient } from "./ksef-client";

export default function KsefPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Wysyłka do KSeF</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Wygeneruj XML w{" "}
        <Link href="/generator" className="text-primary underline">
          generatorze
        </Link>
        , skopiuj treść i wklej poniżej. Bez zmiennych{" "}
        <code className="rounded bg-muted px-1 text-xs">KSEF_SUBMIT_URL</code> w środowisku działa{" "}
        <strong>tryb symulacji</strong> (bezpieczny test). Produkcja wymaga endpointu zgodnego z integracją u Ciebie (API
        Ministerstwa Finansów / certyfikat — wg dokumentacji MF).
      </p>
      <div className="mt-8">
        <KsefClient />
      </div>
      <p className="mt-8 text-xs text-muted-foreground">
        Opcjonalnie: <code className="rounded bg-muted px-1">KSEF_ENCRYPTION_KEY</code> w{" "}
        <code className="rounded bg-muted px-1">.env.local</code> — do szyfrowania tokenów przechowywanych w bazie (rozszerzenie
        na kolejne iteracje).
      </p>
      <p className="mt-6">
        <Link href="/generator" className="text-primary hover:underline">
          ← Generator XML
        </Link>
      </p>
    </div>
  );
}
