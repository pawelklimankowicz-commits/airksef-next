import { ensureAppUser } from "@/lib/ensure-user";

import { BillingClient } from "./billing-client";

export default async function BillingPage() {
  const u = await ensureAppUser();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Płatności i plany</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Wybierz plan dopasowany do liczby faktur z platform zagranicznych. Możesz zmienić lub anulować subskrypcję w
        portalu Stripe.
      </p>
      <div className="mt-8">
        <BillingClient plan={u?.plan ?? "FREE"} hasStripeCustomer={!!u?.stripeCustomerId} />
      </div>
    </div>
  );
}
