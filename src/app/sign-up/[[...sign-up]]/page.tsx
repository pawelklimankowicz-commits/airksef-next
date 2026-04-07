import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

import { isClerkConfigured } from "@/lib/clerk-config";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function SignUpPage() {
  if (!isClerkConfigured()) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 py-12 text-center text-sm">
        <p className="text-muted-foreground">Rejestracja wymaga poprawnie skonfigurowanego Clerk (klucze w .env.local).</p>
        <Link href="/setup" className="font-medium text-primary underline underline-offset-2">
          Instrukcja konfiguracji
        </Link>
      </div>
    );
  }
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <SignUp
        appearance={clerkAppearance}
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
