import { UserProfile } from "@clerk/nextjs";
import Link from "next/link";

import { isClerkConfigured } from "@/lib/clerk-config";

export default function ProfilePage() {
  if (!isClerkConfigured()) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center text-sm">
        <p className="text-muted-foreground">Profil konta wymaga poprawnie skonfigurowanego Clerk.</p>
        <Link href="/setup" className="font-medium text-primary underline underline-offset-2">
          Instrukcja konfiguracji
        </Link>
      </div>
    );
  }
  return (
    <div className="mx-auto flex max-w-3xl justify-center px-4 py-10">
      <UserProfile path="/profile" routing="path" />
    </div>
  );
}
