/**
 * True when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY looks like a real Clerk publishable key.
 * Placeholders (e.g. pk_test_...) from templates must not enable Clerk — they crash the SDK.
 */
function normalizePublishableKey(raw: string): string {
  let s = raw.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

/** Używane przez ClerkProvider, żeby ta sama wartość co w walidacji trafiła do SDK (trim, cudzysłowy w .env). */
export function getClerkPublishableKeyNormalized(): string {
  return normalizePublishableKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "");
}

export function isClerkConfigured(): boolean {
  const pk = getClerkPublishableKeyNormalized();
  if (pk.length < 40) return false;
  return /^pk_(test|live)_[A-Za-z0-9_-]+$/.test(pk);
}
