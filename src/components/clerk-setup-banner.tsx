import Link from "next/link";

export function ClerkSetupBanner() {
  return (
    <div className="clerk-setup-banner border-b border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-center text-sm text-foreground">
      <strong className="font-semibold">Clerk nie jest skonfigurowany</strong>
      {" — "}
      ustaw prawdziwe klucze w pliku{" "}
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">.env.local</code>.{" "}
      <Link href="/setup" className="font-medium text-primary underline underline-offset-2">
        Instrukcja konfiguracji
      </Link>
    </div>
  );
}
