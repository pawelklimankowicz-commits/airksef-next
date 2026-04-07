# AIRKSEF — produkcja (Next.js)

Generator plików XML **FA (3)** dla faktur z platform zagranicznych, z kontem użytkownika, limitami planów i płatnościami **Stripe**.

## Wymagania

- Node.js 20+
- Konto [Clerk](https://clerk.com), [Stripe](https://stripe.com), baza **PostgreSQL** (np. Neon, Supabase, Railway)

## Konfiguracja

1. Skopiuj `.env.example` → `.env.local` i uzupełnij zmienne.
2. W Clerk ustaw adresy aplikacji (np. `http://localhost:3000` i produkcyjny URL).
3. **Stripe — produkty i ceny (automatycznie):** w `.env.local` ustaw tylko `STRIPE_SECRET_KEY` z [API keys](https://dashboard.stripe.com/apikeys) (tryb Test na start). Potem w katalogu projektu:
   ```bash
   npm run stripe:bootstrap
   ```
   Skrypt utworzy w Stripe produkty **AIRKSEF Pro** i **AIRKSEF Business** (subskrypcja miesięczna, PLN) i wypisze wartości `STRIPE_PRO_PRICE_ID` oraz `STRIPE_BUSINESS_PRICE_ID` — wklej je do `.env.local`. Kwoty domyślne: 49 i 99 PLN; opcjonalnie: `STRIPE_BOOTSTRAP_PRO_PLN=39` itd. przed uruchomieniem.
4. **Webhook:** w Stripe → Webhooks dodaj endpoint `https://twoja-domena/api/webhooks/stripe` i zdarzenia: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Wklej **Signing secret** do `STRIPE_WEBHOOK_SECRET`. Lokalnie: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` i użyj wypisanego `whsec_...`.

## Baza danych

```bash
npm install
npx prisma db push
```

Na produkcji preferuj `prisma migrate deploy` po dodaniu migracji.

## Development

```bash
npm run dev
```

Otwórz [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build && npm start
```

## Limity planów

Zdefiniowane w `src/lib/plan-limits.ts` (Free: 1, Pro: 50, Business: bez limitu — miesięcznie). Przekroczenie przy zapisie faktury przekierowuje na `/billing`.

## Struktura

| Ścieżka | Opis |
|---------|------|
| `/` | Landing |
| `/generator` | Kreator XML — **pełny plik FA powstaje na serwerze**; gość dostaje tylko wynik walidacji (bez treści XML w odpowiedzi); podgląd i pobranie po zalogowaniu (`generateInvoiceXmlAction`) |
| `/faktury` | Zapisane faktury (wymaga konta) |
| `/billing` | Stripe Checkout / portal klienta |
| `/dashboard` | Podsumowanie planu |

## Deploy (np. Vercel)

**Pełna checklista produkcyjna:** zobacz **[PRODUCTION.md](./PRODUCTION.md)** (Clerk/Stripe Live, webhook, testy na URL, RODO).

Skrót:

1. Podłącz repozytorium, ustaw zmienne środowiskowe z `.env.example` (dla produkcji — klucze **live**).
2. `DATABASE_URL` musi wskazywać na Postgres w internecie.
3. Zaktualizuj `NEXT_PUBLIC_APP_URL` na URL produkcyjny i wykonaj **redeploy** po zmianach `NEXT_PUBLIC_*`.
4. Po deployu ustaw URL webhooka Stripe na `https://twoja-domena/api/webhooks/stripe`.
5. Opcjonalnie: `NEXT_PUBLIC_CONTACT_EMAIL` — adres w regulaminie i polityce prywatności.

**Testy smoke na wdrożonym URL** (bez lokalnego serwera):

```bash
PLAYWRIGHT_BASE_URL=https://twoja-domena.pl npm run test:e2e:remote
```

Narzędzie **przygotowuje pliki XML** (FA) zgodnie z wprowadzonymi danymi; **automatyczna wysyłka do API Ministerstwa Finansów** wymaga własnej integracji (endpoint, certyfikaty) — patrz `/ksef`. Użytkownik odpowiada za zgodność z przepisami i aktualnym schematem.
