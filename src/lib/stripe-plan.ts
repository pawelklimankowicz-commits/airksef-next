import { Plan } from "@prisma/client";

export function planFromStripePriceId(priceId: string | undefined): Plan {
  if (!priceId) return Plan.FREE;
  if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID) return Plan.BUSINESS;
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return Plan.PRO;
  return Plan.FREE;
}
