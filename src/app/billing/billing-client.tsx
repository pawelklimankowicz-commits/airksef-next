"use client";

import { useState } from "react";

import { createCheckoutSession, createCustomerPortalSession } from "@/actions/billing";

export function BillingClient({
  plan,
  hasStripeCustomer,
}: {
  plan: string;
  hasStripeCustomer: boolean;
}) {
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function go(planKey: "PRO" | "BUSINESS") {
    setErr(null);
    setLoading(planKey);
    try {
      const { url } = await createCheckoutSession(planKey);
      window.location.href = url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Błąd Stripe");
    } finally {
      setLoading(null);
    }
  }

  async function portal() {
    setErr(null);
    setLoading("portal");
    try {
      const { url } = await createCustomerPortalSession();
      window.location.href = url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Błąd portalu");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {err && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          {err}
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        Obecny plan: <span className="font-semibold text-foreground">{plan}</span>
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => go("PRO")}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {loading === "PRO" ? "…" : "Wykup Pro"}
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => go("BUSINESS")}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent/40 disabled:opacity-50"
        >
          {loading === "BUSINESS" ? "…" : "Wykup Business"}
        </button>
        {hasStripeCustomer && (
          <button
            type="button"
            disabled={loading !== null}
            onClick={portal}
            className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent/40 disabled:opacity-50"
          >
            {loading === "portal" ? "…" : "Zarządzaj subskrypcją"}
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Płatności obsługuje Stripe. Ustaw <code className="rounded bg-muted px-1">STRIPE_*</code> i produkty w
        panelu Stripe przed uruchomieniem na produkcji.
      </p>
    </div>
  );
}
