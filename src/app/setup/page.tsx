import type { Metadata } from "next";

import { isClerkConfigured } from "@/lib/clerk-config";

export const metadata: Metadata = {
  title: "Konfiguracja — AIRKSEF",
  description: "Jak skonfigurować Clerk i bazę danych dla AIRKSEF.",
};

export default function SetupPage() {
  const clerkOk = isClerkConfigured();

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Konfiguracja środowiska</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Poniżej minimalne kroki, żeby logowanie i zapis faktur działały lokalnie i na produkcji.
      </p>

      <section className="mt-8 space-y-3 text-sm leading-relaxed">
        <h2 className="text-base font-semibold">1. Clerk (logowanie)</h2>
        <p className="text-muted-foreground">
          Utwórz aplikację w{" "}
          <a
            href="https://dashboard.clerk.com"
            className="font-medium text-primary underline underline-offset-2"
            target="_blank"
            rel="noreferrer"
          >
            dashboard.clerk.com
          </a>
          , skopiuj klucze do{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">.env.local</code>{" "}
          (lokalnie) lub do zmiennych środowiskowych na hostingu (np. Vercel → Environment Variables — po zmianie{" "}
          <code className="rounded bg-muted px-1 font-mono text-xs">NEXT_PUBLIC_*</code> wymagany jest nowy deploy):
        </p>
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
          {`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...`}
        </pre>
        <p className="text-muted-foreground">
          W Clerk dodaj adresy: <code className="rounded bg-muted px-1 font-mono">http://localhost:3000</code> oraz ewentualny
          adres LAN (np. <code className="rounded bg-muted px-1 font-mono">http://192.168.x.x:3000</code>).
        </p>
        <p className="rounded-lg border border-border bg-card/50 px-3 py-2">
          Status:{" "}
          {clerkOk ? (
            <span className="font-medium text-primary">wykryto poprawny format klucza publicznego</span>
          ) : (
            <span className="font-medium text-amber-700">
              brak lub nieprawidłowy <code className="font-mono">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code>
            </span>
          )}
        </p>
      </section>

      <section className="mt-10 space-y-3 text-sm leading-relaxed">
        <h2 className="text-base font-semibold">2. Baza (Prisma)</h2>
        <p className="text-muted-foreground">
          Ustaw <code className="rounded bg-muted px-1 font-mono">DATABASE_URL</code> na PostgreSQL, potem:
        </p>
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-4 font-mono text-xs">
          npx prisma db push
        </pre>
      </section>

      <section className="mt-10 space-y-3 text-sm leading-relaxed">
        <h2 className="text-base font-semibold">3. Stripe (opcjonalnie)</h2>
        <p className="text-muted-foreground">
          Płatności wymagają kluczy API i webhooka — szczegóły w README projektu.
        </p>
      </section>
    </main>
  );
}
