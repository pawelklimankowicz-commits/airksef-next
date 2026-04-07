/**
 * True when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY looks like a real Clerk publishable key.
 * Placeholders (e.g. pk_test_...) from templates must not enable Clerk — they crash the SDK.
 */
export function isClerkConfigured(): boolean {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  if (pk.length < 40) return false;
  return /^pk_(test|live)_[A-Za-z0-9_-]+$/.test(pk);
}
