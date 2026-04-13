import { Plan } from "@prisma/client";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { planFromStripePriceId } from "@/lib/stripe-plan";

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe disabled" }, { status: 501 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkId = session.metadata?.clerkId;
        const planMeta = session.metadata?.plan as Plan | undefined;
        const customerId = typeof session.customer === "string" ? session.customer : null;
        const subId = typeof session.subscription === "string" ? session.subscription : null;

        if (clerkId && customerId && planMeta && (planMeta === Plan.PRO || planMeta === Plan.BUSINESS)) {
          // Pobierz priceId z subskrypcji, jeśli subId jest dostępne
          let priceId: string | null = null;
          if (subId && stripe) {
            try {
              const sub = await stripe.subscriptions.retrieve(subId);
              priceId = sub.items.data[0]?.price?.id ?? null;
            } catch {
              // nie blokuj zapisu planu gdy nie uda się pobrać priceId
            }
          }
          await prisma.user.updateMany({
            where: { clerkId },
            data: {
              stripeCustomerId: customerId,
              stripeSubscriptionId: subId,
              stripePriceId: priceId,
              plan: planMeta,
              subscriptionStatus: "active",
            },
          });
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const clerkId = sub.metadata?.clerkId;
        const priceId = sub.items.data[0]?.price?.id;
        const plan = planFromStripePriceId(priceId);
        const status = sub.status;

        if (clerkId) {
          await prisma.user.updateMany({
            where: { clerkId },
            data: {
              stripeSubscriptionId: sub.id,
              stripePriceId: priceId ?? null,
              plan: status === "active" ? plan : Plan.FREE,
              subscriptionStatus: status,
            },
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const clerkId = sub.metadata?.clerkId;
        if (clerkId) {
          await prisma.user.updateMany({
            where: { clerkId },
            data: {
              stripeSubscriptionId: null,
              stripePriceId: null,
              plan: Plan.FREE,
              subscriptionStatus: "canceled",
            },
          });
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("Stripe webhook handler error", e);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
