# Wdrożenie produkcyjne AIRKSEF

Ten dokument to **checklista przed uruchomieniem dla klientów**. Nie zastępuje audytu prawnego ani księgowego.

## 1. Hosting i domena

- [ ] Projekt wdrożony (np. **Vercel**) z połączeniem do repozytorium Git.
- [ ] **Domena** podpięta pod produkcję (DNS + HTTPS).
- [ ] Wszystkie zmienne środowiskowe ustawione dla środowiska **Production** (nie tylko Preview).

## 2. Zmienne środowiskowe (Production)

Skopiuj nazwy z `.env.example` i uzupełnij wartościami **produkcyjnymi**:

| Zmienna | Uwagi |
|---------|--------|
| `DATABASE_URL` | PostgreSQL w chmurze (SSL). Po pierwszym deployu: `npx prisma migrate deploy` lub `db push` zgodnie z praktyką zespołu. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | **pk_live_...** z Clerk (nie testowy). |
| `CLERK_SECRET_KEY` | **sk_live_...** |
| `NEXT_PUBLIC_APP_URL` | Pełny publiczny URL, np. `https://twoja-domena.pl` (bez końcowego `/`). **Redeploy** po zmianie `NEXT_PUBLIC_*`. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Zwykle `/sign-in` i `/sign-up`. |
| `STRIPE_SECRET_KEY` | **sk_live_...** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | **pk_live_...** |
| `STRIPE_PRO_PRICE_ID` / `STRIPE_BUSINESS_PRICE_ID` | **Price ID z trybu Live** w Stripe (nie te z testu). |
| `STRIPE_WEBHOOK_SECRET` | Z webhooka na **produkcyjny** URL: `https://twoja-domena.pl/api/webhooks/stripe` |
| `KSEF_ENCRYPTION_KEY` | **Ten sam** 64-znakowy hex co ustalisz na produkcji — bez utraty klucza nie odczytasz zapisanych tokenów. Wygeneruj: `openssl rand -hex 32` |

Opcjonalnie: `KSEF_SUBMIT_URL`, `KSEF_ACCESS_TOKEN` — jeśli masz własny endpoint pod wysyłkę do KSeF.

## 3. Clerk (dashboard)

- [ ] **Domains**: dodany produkcyjny URL (https).
- [ ] **Paths**: zgodne ze ścieżkami `/sign-in`, `/sign-up` (jeśli używasz zmiennych `NEXT_PUBLIC_CLERK_*`).

## 4. Stripe (Live)

- [ ] Produkty i ceny utworzone w **Live mode**; ID skopiowane do env.
- [ ] Webhook: zdarzenia `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
- [ ] Test płatności testowej w trybie Live (małą kwotą) lub weryfikacja w panelu Stripe po pierwszej transakcji.

## 5. Testy na prawdziwym URL

Po wdrożeniu uruchom **smoke test** przeciwko produkcji (nie uruchamia lokalnego serwera):

```bash
cd airksef-next
npx playwright install chromium   # raz na maszynie
PLAYWRIGHT_BASE_URL=https://twoja-domena.pl npm run test:e2e:remote
```

**Ręcznie** (obowiązkowo przed „go live”):

- [ ] Rejestracja / logowanie (Clerk) na produkcji.
- [ ] `/generator` — przejście kreatora i pobranie XML (lub walidacja).
- [ ] `/billing` — test Checkout (w Stripe możesz najpierw użyć trybu testowego na staging URL).
- [ ] Webhook aktualizuje plan użytkownika (sprawdź w `/dashboard` lub bazie).

## 6. Treści prawne i komunikacja

- [ ] Regulamin i polityka prywatności w aplikacji — dostosuj dane administratora (e-mail kontaktowy), jeśli w treści jest placeholder.
- [ ] W razie potrzeby **konsultacja prawna** dokumentów i opisu usługi.

## 7. Obietnice produktowe

Aplikacja **generuje pliki XML FA (3)** i wspiera proces pod KSeF. **Pełna automatyczna wysyłka do API Ministerstwa Finansów** wymaga własnej integracji (endpoint, certyfikaty) — nie obiecuj klientom więcej niż wynika z `README` i strony `/ksef`.
