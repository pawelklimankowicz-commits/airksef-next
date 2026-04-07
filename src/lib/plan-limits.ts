export type SubscriptionPlan = "FREE" | "PRO" | "BUSINESS";

/** Maksymalna liczba generacji faktur w okresie rozliczeniowym (dopasuj okres w zapytaniu do bazy). */
export const PLAN_LIMITS: Record<SubscriptionPlan, number> = {
  FREE: 1,
  PRO: 50,
  BUSINESS: Number.POSITIVE_INFINITY,
};

export const BILLING_PATH = "/billing" as const;

export function getMaxInvoicesForPlan(plan: SubscriptionPlan): number {
  return PLAN_LIMITS[plan];
}

/**
 * @param invoicesUsedInPeriod — liczba już wygenerowanych faktur w danym okresie (np. miesiąc).
 * Przed kolejną generacją: jeśli `used >= limit`, należy przekierować na `/billing`.
 */
export function hasExceededInvoiceLimit(
  plan: SubscriptionPlan,
  invoicesUsedInPeriod: number
): boolean {
  const max = PLAN_LIMITS[plan];
  if (!Number.isFinite(max)) {
    return false;
  }
  return invoicesUsedInPeriod >= max;
}
