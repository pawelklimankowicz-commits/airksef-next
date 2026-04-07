import Link from "next/link";

import { publicContactEmail } from "@/lib/site-config";

export default function TermsPage() {
  const contact = publicContactEmail();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-foreground">Regulamin świadczenia usługi AIRKSEF</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ostatnia aktualizacja: 2026-04-07. Zmień datę w kodzie przy istotnej aktualizacji treści. Regulamin określa zasady
        korzystania z serwisu internetowego AIRKSEF (dalej: „Usługa”).
      </p>

      <section className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <h2 className="text-base font-semibold text-foreground">1. Postanowienia ogólne</h2>
        <p>
          Usługa polega na udostępnieniu narzędzia do przygotowania plików XML w strukturze zbliżonej do formularza FA (3)
          (JPK_FA) na podstawie danych wprowadzonych przez użytkownika oraz — w zakresie dostępnych funkcji — na
          wspieraniu organizacji tych danych (np. wybór platformy, pola faktury). Usługa ma charakter pomocniczy i
          techniczny.
        </p>

        <h2 className="mt-8 text-base font-semibold text-foreground">2. Zakres odpowiedzialności użytkownika</h2>
        <p>
          Użytkownik samodzielnie odpowiada za treść i prawdziwość danych wprowadzanych do systemu, za zgodność
          wystawianych dokumentów z obowiązującymi przepisami prawa podatkowego i za użycie aktualnego schematu oraz
          ścieżki przekazania plików do Krajowego Systemu e-Faktur (KSeF). AIRKSEF nie prowadzi za użytkownika jego
          obowiązków podatkowych ani księgowych.
        </p>
        <p>
          Usługa <strong>nie stanowi porady prawnej ani księgowej</strong>. Przed wysłaniem plików do urzędu lub
          przekazaniem ich księgowemu użytkownik powinien zweryfikować dokumenty we własnym zakresie lub z doradcą.
        </p>

        <h2 className="mt-8 text-base font-semibold text-foreground">3. Funkcje techniczne i ograniczenia</h2>
        <p>
          Odczyt danych z plików PDF opiera się na <strong>warstwie tekstowej</strong> dokumentu; skany bez OCR mogą nie
          zostać poprawnie rozpoznane. Funkcje związane z wysyłką do KSeF mogą działać w trybie demonstracyjnym lub
          wymagać konfiguracji własnego endpointu i uprawnień — szczegóły w dokumentacji aplikacji i na stronie{" "}
          <Link href="/ksef" className="text-primary underline underline-offset-2">
            /ksef
          </Link>
          .
        </p>
        <p>
          Limity liczby zapisów lub generacji w okresie rozliczeniowym wynikają z wybranego planu (Free / Pro / Business)
          zgodnie z informacją w aplikacji i konfiguracją operatora.
        </p>

        <h2 className="mt-8 text-base font-semibold text-foreground">4. Konto, logowanie i płatności</h2>
        <p>
          Logowanie i rejestracja realizowane są przez zewnętrznego dostawcę uwierzytelniania (Clerk). Płatności za plany
          płatne obsługuje Stripe. Warunki tych dostawców stosują się w zakresie, w jakim dotyczą przetwarzania danych
          płatności i konta — zgodnie z ich regulaminami.
        </p>

        <h2 className="mt-8 text-base font-semibold text-foreground">5. Dostępność i zmiany</h2>
        <p>
          Operator dąży do utrzymania ciągłości Usługi, nie gwarantuje jednak pracy bez przerw (np. prace techniczne,
          awarie zewnętrznych dostawców). Regulamin może zostać zmieniony; kontynuacja korzystania po opublikowaniu zmian
          oznacza ich akceptację, o ile przepisy nie stanowią inaczej.
        </p>

        <h2 className="mt-8 text-base font-semibold text-foreground">6. Kontakt</h2>
        <p>
          W sprawach dotyczących Usługi skontaktuj się z operatorem wdrożenia. Możesz ustawić publiczny adres w zmiennej{" "}
          <code className="rounded bg-muted px-1">NEXT_PUBLIC_CONTACT_EMAIL</code>.
        </p>
        {contact ? (
          <p className="text-sm text-muted-foreground">
            Kontakt:{" "}
            <a href={`mailto:${contact}`} className="font-medium text-primary underline underline-offset-2">
              {contact}
            </a>
          </p>
        ) : null}
      </section>

      <p className="mt-10">
        <Link href="/" className="text-primary hover:underline">
          ← Strona główna
        </Link>
      </p>
    </div>
  );
}
