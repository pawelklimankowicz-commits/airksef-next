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
| `/invoices` | Zapisane faktury (wymaga konta) |
| `/billing` | Stripe Checkout / portal klienta |
| `/dashboard` | Podsumowanie planu |

## Deploy (np. Vercel)

1. Podłącz repozytorium, ustaw zmienne środowiskowe z `.env.example`.
2. `DATABASE_URL` musi wskazywać na Postgres w internecie.
3. Zaktualizuj `NEXT_PUBLIC_APP_URL` na URL produkcyjny.
4. Po deployu zaktualizuj URL webhooka w Stripe.

Narzędzie nie wysyła samo plików do API KSeF — przygotowuje XML zgodnie z wprowadzonymi danymi; użytkownik odpowiada za zgodność z przepisami i aktualnym schematem.
