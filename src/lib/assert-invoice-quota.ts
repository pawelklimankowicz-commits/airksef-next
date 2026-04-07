import { redirect } from "next/navigation";

import {
  BILLING_PATH,
  hasExceededInvoiceLimit,
  type SubscriptionPlan,
} from "./plan-limits";

/**
 * Wywołaj na początku Server Action / route handlera przed generowaniem XML.
 * Przy przekroczeniu limitu wykonuje redirect (rzuca — nie zwraca).
 */
export function assertInvoiceQuotaOrRedirect(
  plan: SubscriptionPlan,
  invoicesUsedInPeriod: number
): void {
  if (hasExceededInvoiceLimit(plan, invoicesUsedInPeriod)) {
    redirect(BILLING_PATH);
  }
}
