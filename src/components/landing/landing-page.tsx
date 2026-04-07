import { ArrowRight, Check, Code2, FileText, Globe, Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { LandingCalculator } from "./landing-calculator";

/** Wymiary PNG po obcięciu prawego dolnego rogu (znak wodny) — muszą zgadzać się z plikiem `public/logo-airksef.png`. */
const LOGO_INTRINSIC = { w: 885, h: 462 } as const;

const PLATFORMS = ["Uber", "Airbnb", "Bolt", "Booking", "Upwork", "Fiverr", "Netflix", "AWS", "+1000 więcej"];

const FEATURES = [
  {
    icon: FileText,
    title: "PDF → pola",
    text: "Wgraj PDF z warstwą tekstową — heurystyczne podpowiedzi NIP, kwot i dat. Skany wymagają osobnego OCR.",
  },
  {
    icon: Globe,
    title: "1000+ platform",
    text: "Uber, Airbnb, Bolt, Booking, Upwork, Steam, Netflix i ponad 1000 innych. Gotowe dane sprzedawców z NIP i adresem.",
  },
  {
    icon: Code2,
    title: "XML JPK_FA(3)",
    text: "Generowanie pliku zgodnego ze schematem Ministerstwa Finansów. Gotowy do importu w KSeF.",
  },
  {
    icon: Send,
    title: "Wysyłka do KSeF",
    text: "Strona /ksef i zmienne środowiskowe — podłącz własny endpoint lub tryb testowy. Pełna integracja MF wymaga certyfikatu.",
  },
];

const LANDING_BG = "#f58220" as const;

export function LandingPage() {
  return (
    <div
      className="landing-root min-h-screen min-h-[100dvh] text-white"
      style={{ backgroundColor: LANDING_BG }}
    >
      {/* Header — identyczny hex co tło PNG (inline = zawsze pomarańcz) */}
      <header
        className="sticky top-0 z-50 border-b border-white/10"
        style={{ backgroundColor: LANDING_BG }}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex flex-col gap-1">
            <span className="rounded bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white/80">Osadzona aplikacja</span>
            <Link href="/" className="flex items-center">
              <Image
                src="/logo-airksef.png"
                alt="airksef — XML Generator KSeF"
                width={200}
                height={Math.round((200 * LOGO_INTRINSIC.h) / LOGO_INTRINSIC.w)}
                className="h-10 w-auto object-contain object-left"
                priority
              />
            </Link>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Link
              href="/sign-in"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
            >
              Zaloguj
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
            >
              Zarejestruj
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
            >
              Panel klienta
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 pb-16 pt-12 sm:pt-20">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className="mb-8 flex justify-center px-2">
            <Image
              src="/logo-airksef.png"
              alt="airksef — XML Generator KSeF"
              width={LOGO_INTRINSIC.w}
              height={LOGO_INTRINSIC.h}
              className="h-auto w-full max-w-xl object-contain sm:max-w-2xl"
              priority
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>

          <h1 className="text-balance text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
            Faktury zagraniczne? Załatwiamy KSeF za Ciebie
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-base text-white/95 sm:text-lg">
            Dostajesz faktury od Uber, Airbnb, Bolt czy Booking? Wrzuć je do nas – przygotujemy plik, który wyślesz do Urzędu
            Skarbowego. Bez księgowego, bez stresu.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/generator"
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-green-700"
            >
              Wypróbuj za darmo
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#funkcje"
              className="rounded-xl border-2 border-white/80 bg-transparent px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Dowiedz się więcej
            </a>
          </div>

          <div className="mt-14 flex max-w-3xl flex-wrap justify-center gap-2">
            {PLATFORMS.map((p) => (
              <span
                key={p}
                className="rounded-full border border-white/20 bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funkcje" className="border-t border-white/10 px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Funkcje</p>
          <h2 className="mt-2 text-center text-2xl font-bold sm:text-3xl">Wszystko czego potrzebujesz do KSeF</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex flex-col rounded-2xl border border-white/15 bg-white/15 p-6 backdrop-blur-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                  <f.icon className="h-6 w-6 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/90">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingCalculator />

      {/* Pricing */}
      <section id="cennik" className="border-t border-white/10 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Cennik</p>
          <h2 className="mt-2 text-center text-2xl font-bold sm:text-3xl">Prosty i przejrzysty cennik</h2>

          <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:items-stretch">
            {/* Free */}
            <div className="flex flex-col rounded-2xl border border-white/20 bg-white/15 p-8 backdrop-blur-md">
              <h3 className="text-xl font-bold">Free</h3>
              <p className="mt-4 text-3xl font-bold">0 PLN</p>
              <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm">
                {["1 faktura / miesiąc", "Generator XML", "1000+ platform", "Podgląd i pobieranie XML"].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" />
                    {t}
                  </li>
                ))}
              </ul>
              <Link
                href="/generator"
                className="mt-8 rounded-lg border-2 border-white py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Zacznij za darmo
              </Link>
            </div>

            {/* Pro */}
            <div className="relative flex flex-col rounded-2xl border-2 border-white bg-white p-8 text-neutral-900 shadow-2xl lg:-mt-2 lg:mb-2 lg:scale-[1.02]">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-600 px-4 py-1 text-xs font-bold text-white">
                Popularny
              </span>
              <h3 className="text-xl font-bold">Pro</h3>
              <p className="mt-4">
                <span className="text-4xl font-bold text-airksef">49</span>
                <span className="text-lg font-semibold"> PLN / mc</span>
              </p>
              <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm">
                {[
                  "Do 50 faktur / miesiąc",
                  "AI OCR z PDF",
                  "Wysyłka do KSeF",
                  "Archiwum faktur",
                  "Wsparcie e-mail",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    {t}
                  </li>
                ))}
              </ul>
              <Link
                href="/billing"
                className="mt-8 rounded-lg bg-green-600 py-3 text-center text-sm font-semibold text-white transition hover:bg-green-700"
              >
                Wybierz Pro
              </Link>
            </div>

            {/* Business */}
            <div className="flex flex-col rounded-2xl border border-white/20 bg-white/15 p-8 backdrop-blur-md">
              <h3 className="text-xl font-bold">Business</h3>
              <p className="mt-4 text-3xl font-bold">99 PLN / mc</p>
              <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm">
                {[
                  "Faktury bez limitu",
                  "Wszystko z Pro",
                  "Dostęp API",
                  "Wielu użytkowników",
                  "Wsparcie priorytetowe",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" />
                    {t}
                  </li>
                ))}
              </ul>
              <Link
                href="/billing"
                className="mt-8 rounded-lg border-2 border-white py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Wybierz Business
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-4 py-8" style={{ backgroundColor: LANDING_BG }}>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-white/90 sm:flex-row">
          <p className="flex flex-wrap items-center gap-3">
            <Image
              src="/logo-airksef.png"
              alt=""
              width={120}
              height={Math.round((120 * LOGO_INTRINSIC.h) / LOGO_INTRINSIC.w)}
              className="h-8 w-auto object-contain opacity-90"
            />
            <span>© {new Date().getFullYear()} AIRKSEF. Wszelkie prawa zastrzeżone.</span>
          </p>
          <div className="flex gap-6">
            <Link href="/regulamin" className="hover:underline">
              Regulamin
            </Link>
            <Link href="/polityka-prywatnosci" className="hover:underline">
              Polityka prywatności
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
