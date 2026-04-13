import Link from "next/link";

import { KsefClient } from "./ksef-client";

const isLiveMode = !!process.env.KSEF_SUBMIT_URL?.trim();

export default function KsefPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Wysyłka do KSeF</h1>

      {/* Wyraźny banner o trybie działania */}
      {isLiveMode ? (
        <div className="mt-4 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-foreground">
          <strong>Tryb Live</strong> — wysyłka trafia do skonfigurowanego endpointu{" "}
          <code className="rounded bg-muted px-1 text-xs">KSEF_SUBMIT_URL</code>. Upewnij się, że
          endpoint jest zgodny z aktualną dokumentacją API Ministerstwa Finansów i posiadasz ważne
          certyfikaty.
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
          <strong>Tryb symulacji (MOCK)</strong> — żaden plik XML <strong>nie jest wysyłany</strong>{" "}
          do Ministerstwa Finansów ani systemu KSeF. Kliknięcie &quot;Wyślij&quot; symuluje odpowiedź
          systemu i zwraca testowy numer referencyjny.
          <br />
          <span className="mt-1 block text-xs text-yellow-600 dark:text-yellow-500">
            Aby włączyć rzeczywistą wysyłkę: ustaw zmienną{" "}
            <code className="rounded bg-yellow-100 px-1 dark:bg-yellow-900/40">KSEF_SUBMIT_URL</code>{" "}
            wskazującą na Twój własny endpoint integracyjny zgodny z API MF (wymaga certyfikatów i
            pełnej integracji z KSeF). Sam AIRKSEF nie łączy się bezpośrednio z infrastrukturą MF.
          </span>
        </div>
      )}

      <p className="mt-4 text-sm text-muted-foreground">
        Wygeneruj XML w{" "}
        <Link href="/generator" className="text-primary underline">
          generatorze
        </Link>
        , skopiuj treść i wklej poniżej.
      </p>

      <div className="mt-6">
        <KsefClient />
      </div>

      <div className="mt-8 rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground space-y-1">
        <p>
          <strong className="text-foreground">Pełna integracja z KSeF</strong> wymaga: własnego
          endpointu REST zgodnego z API MF, certyfikatu kwalifikowanego lub podpisu zaufanego oraz
          obsługi tokenów sesji KSeF. Dokumentacja:{" "}
          <a
            href="https://www.podatki.gov.pl/ksef/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            podatki.gov.pl/ksef
          </a>
          .
        </p>
        <p>
          Opcjonalnie:{" "}
          <code className="rounded bg-muted px-1">KSEF_ENCRYPTION_KEY</code> — klucz AES-256 do
          szyfrowania tokenów przechowywanych w bazie.
        </p>
      </div>

      <p className="mt-6">
        <Link href="/generator" className="text-primary hover:underline">
          ← Generator XML
        </Link>
      </p>
    </div>
  );
}
