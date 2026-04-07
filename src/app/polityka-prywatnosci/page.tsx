import Link from "next/link";

import { publicContactEmail } from "@/lib/site-config";

export default function PrivacyPage() {
  const contact = publicContactEmail();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-foreground">Polityka prywatności</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ostatnia aktualizacja: 2026-04-07. Zmień datę w kodzie przy istotnej aktualizacji treści. Dokument opisuje zasady
        przetwarzania danych osobowych w związku z korzystaniem z serwisu AIRKSEF (dalej: „Usługa”).
      </p>

      <section className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <h2 className="text-base font-semibold text-foreground">1. Administrator danych</h2>
        <p>
          Administratorem danych osobowych użytkowników korzystających z Usługi jest podmiot prowadzący wdrożenie
          AIRKSEF (operator serwisu). W sprawach RODO możesz kontaktować się pod adresem wskazanym przez operatora
          {contact ? (
            <>
              :{" "}
              <a href={`mailto:${contact}`} className="font-medium text-primary underline underline-offset-2">
                {contact}
              </a>
            </>
          ) : (
            <> — publiczny adres e-mail zostanie podany w konfiguracji (<code className="rounded bg-muted px-1">NEXT_PUBLIC_CONTACT_EMAIL</code>).</>
          )}
        </p>

        <h2 className="mt-8 text-base font-semibold text-foreground">2. Dane przetwarzane i cele</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Konto i logowanie:</strong> dane identyfikacyjne i sesji przetwarzane są przez dostawcę
            uwierzytelniania <strong>Clerk</strong> (poza EOG mogą obowiązywać transfery na podstawie standardowych
            klauzul lub polityki Clerk).
          </li>
          <li>
            <strong>Treść faktur i pliki XML:</strong> przechowywane w bazie danych operatora w celu świadczenia Usługi
            (wyświetlanie, eksport, limity planów), przez czas korzystania z konta i zgodnie z backupem technicznym.
          </li>
          <li>
            <strong>Płatności:</strong> realizowane przez <strong>Stripe</strong>. Dane kart płatniczych nie są
            przechowywane na serwerze AIRKSEF — Stripe przetwarza je jako odrębny administrator płatności.
          </li>
          <li>
            <strong>Tokeny / dane wrażliwe KSeF (jeśli używasz):</strong> mogą być szyfrowane na serwerze; klucz
            szyfrowania przechowuje wyłącznie operator środowiska (zmienna <code className="rounded bg-muted px-1">KSEF_ENCRYPTION_KEY</code>).
          </li>
        </ul>

        <h2 className="mt-8 text-base font-semibold text-foreground">3. Podstawa prawna</h2>
        <p>
          Przetwarzanie jest niezbędne do wykonania umowy o świadczenie Usługi (art. 6 ust. 1 lit. b RODO) oraz — w
          zakresie obowiązków prawnych — art. 6 ust. 1 lit. c RODO. Marketing, jeśli kiedykolwiek wystąpi, będzie oparty
          na odrębnej zgodzie lub prawnie uzasadnionym interesie, zgodnie z obowiązującymi przepisami.
        </p>

        <h2 className="mt-8 text-base font-semibold text-foreground">4. Prawa osoby, której dane dotyczą</h2>
        <p>
          Przysługuje Ci m.in. prawo dostępu do danych, sprostowania, usunięcia lub ograniczenia przetwarzania, wniesienia
          sprzeciwu w uzasadnionych przypadkach oraz wniesienia skargi do Prezesa UODO. Część żądań realizujesz w
          ustawieniach konta (Clerk) lub kontaktując się z operatorem.
        </p>

        <h2 className="mt-8 text-base font-semibold text-foreground">5. Pliki cookies i analityka</h2>
        <p>
          Serwis może używać cookies niezbędnych do działania sesji i bezpieczeństwa. Szczegóły techniczne zależą od
          wdrożenia Clerk/Stripe/hostingu — sprawdź ustawienia przeglądarki i ewentualny baner zgód, jeśli zostanie
          dodany.
        </p>
      </section>

      <p className="mt-10">
        <Link href="/" className="text-primary hover:underline">
          ← Strona główna
        </Link>
      </p>
    </div>
  );
}
