"use server";

import { auth } from "@clerk/nextjs/server";

import { ensureAppUser } from "@/lib/ensure-user";
import { stripe } from "@/lib/stripe";

function appUrl(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return u.replace(/\/$/, "");
}

export async function createCheckoutSession(plan: "PRO" | "BUSINESS") {
  if (!stripe) {
    throw new Error("Stripe nie jest skonfigurowany (STRIPE_SECRET_KEY).");
  }
  const { userId } = await auth();
  if (!userId) throw new Error("Zaloguj się, aby wykupić plan.");

  const priceId =
    plan === "BUSINESS"
      ? process.env.STRIPE_BUSINESS_PRICE_ID
      : process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    throw new Error(`Brak STRIPE_${plan}_PRICE_ID w zmiennych środowiskowych.`);
  }

  const user = await ensureAppUser();
  if (!user) throw new Error("Nie znaleziono konta użytkownika.");

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl()}/billing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl()}/billing?canceled=1`,
    metadata: {
      clerkId: userId,
      plan,
    },
    subscription_data: {
      metadata: {
        clerkId: userId,
        plan,
      },
    },
    customer_email: user.email ?? undefined,
  });

  if (!session.url) throw new Error("Brak URL sesji Stripe.");
  return { url: session.url };
}

export async function createCustomerPortalSession() {
  if (!stripe) {
    throw new Error("Stripe nie jest skonfigurowany.");
  }
  const { userId } = await auth();
  if (!userId) throw new Error("Zaloguj się.");

  const u = await ensureAppUser();
  if (!u?.stripeCustomerId) {
    throw new Error("Brak profilu płatności — wykup plan w zakładce Cennik.");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: u.stripeCustomerId,
    return_url: `${appUrl()}/billing`,
  });
  return { url: session.url };
}
