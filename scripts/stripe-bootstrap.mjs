#!/usr/bin/env node
/**
 * Tworzy w Stripe (tryb zgodny z kluczem test/live) produkty AIRKSEF Pro / Business
 * z subskrypcją miesięczną w PLN. Idempotentne: ponowne uruchomienie używa istniejących cen (lookup_key).
 *
 * Uruchom z katalogu projektu:
 *   npm run stripe:bootstrap
 *
 * Wymaga w .env.local: STRIPE_SECRET_KEY=sk_test_... lub sk_live_...
 * Opcjonalnie: STRIPE_BOOTSTRAP_PRO_PLN=49 STRIPE_BOOTSTRAP_BUSINESS_PLN=99
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import Stripe from "stripe";

function loadEnvLocal() {
  const p = resolve(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  const raw = readFileSync(p, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvLocal();

const envPath = resolve(process.cwd(), ".env.local");
console.log(`Katalog: ${process.cwd()}`);
console.log(
  existsSync(envPath)
    ? `Znaleziono .env.local — wczytuję zmienne.`
    : `UWAGA: brak pliku .env.local w tym katalogu — uruchom skrypt z folderu projektu (airksef-next).`
);
console.log("");

const sk = process.env.STRIPE_SECRET_KEY?.trim();
if (!sk) {
  console.error(
    "Brak STRIPE_SECRET_KEY. Dodaj do .env.local klucz z Stripe → Developers → API keys (Secret), potem:\n  npm run stripe:bootstrap\n"
  );
  process.exit(1);
}

const proPln = Number(process.env.STRIPE_BOOTSTRAP_PRO_PLN ?? "49") || 49;
const businessPln = Number(process.env.STRIPE_BOOTSTRAP_BUSINESS_PLN ?? "99") || 99;

function plnToUnitAmount(pln) {
  return Math.round(pln * 100);
}

const stripe = new Stripe(sk);

async function ensureSubscriptionPrice({ lookupKey, productName, planMeta, amountPln }) {
  const existing = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });
  if (existing.data.length > 0) {
    const id = existing.data[0].id;
    console.log(`— Już istnieje cena ${lookupKey} → ${id}`);
    return id;
  }

  const product = await stripe.products.create({
    name: productName,
    metadata: { app: "airksef", plan: planMeta },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: plnToUnitAmount(amountPln),
    currency: "pln",
    recurring: { interval: "month" },
    lookup_key: lookupKey,
  });

  console.log(`— Utworzono: ${productName} → ${price.id} (${amountPln} PLN / mies.)`);
  return price.id;
}

async function main() {
  console.log("Stripe bootstrap (AIRKSEF)…\n");

  const proId = await ensureSubscriptionPrice({
    lookupKey: "airksef_pro_monthly_pln",
    productName: "AIRKSEF Pro",
    planMeta: "pro",
    amountPln: proPln,
  });

  const businessId = await ensureSubscriptionPrice({
    lookupKey: "airksef_business_monthly_pln",
    productName: "AIRKSEF Business",
    planMeta: "business",
    amountPln: businessPln,
  });

  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  const line = "=".repeat(64);
  console.log("\n" + line);
  console.log("  SKOPIUJ TE DWIE LINIE DO PLIKU .env.local  (Cmd+A w terminalu nie działa na blok — zaznacz myszką)");
  console.log(line);
  console.log("");
  console.log(`STRIPE_PRO_PRICE_ID=${proId}`);
  console.log(`STRIPE_BUSINESS_PRICE_ID=${businessId}`);
  console.log("");
  console.log(line);
  console.log("");

  if (!pk) {
    console.log(
      `Opcjonalnie: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  (Developers → API keys)\n`
    );
  }
  console.log(`Następnie: STRIPE_WEBHOOK_SECRET=whsec_...  (stripe listen lub webhook na produkcji — patrz README)\n`);
  console.log("Webhook — wybierz jedno:");
  console.log(
    "  • Produkcja: Stripe → Webhooks → URL https://TWOJA-DOMENA/api/webhooks/stripe (zdarzenia: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted)"
  );
  console.log(
    "  • Lokalnie:  stripe listen --forward-to localhost:3000/api/webhooks/stripe  → skopiuj whsec_ do STRIPE_WEBHOOK_SECRET\n"
  );
}

main().catch((e) => {
  console.error("\n❌ BŁĄD — nie widzisz linii STRIPE_*_PRICE_ID, dopóki to się nie uda.\n");
  if (e?.type === "StripeInvalidRequestError" || e?.rawType) {
    console.error("Stripe:", e.message);
    if (e.code) console.error("Kod:", e.code);
  } else {
    console.error(e);
  }
  process.exit(1);
});
