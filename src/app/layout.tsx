import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";

import { ClerkSetupBanner } from "@/components/clerk-setup-banner";
import { getClerkPublishableKeyNormalized, isClerkConfigured } from "@/lib/clerk-config";
import { clerkAppearance } from "@/lib/clerk-appearance";

import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "AIRKSEF — XML FA(3) dla KSeF",
  description:
    "Generator plików JPK_FA(3) z faktur zagranicznych (Uber, Airbnb, Netflix…) — przygotuj XML pod Krajowy System e-Faktur.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkOk = isClerkConfigured();

  const shell = (
    <>
      {!clerkOk && <ClerkSetupBanner />}
      {children}
    </>
  );

  return (
    <html lang="pl" className={`h-full ${jetbrainsMono.variable}`}>
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full font-sans antialiased">
        {clerkOk ? (
          <ClerkProvider appearance={clerkAppearance} publishableKey={getClerkPublishableKeyNormalized()}>
            {shell}
          </ClerkProvider>
        ) : (
          shell
        )}
      </body>
    </html>
  );
}
