"use client";

import { useMemo, useState } from "react";

export function LandingCalculator() {
  const [n, setN] = useState(10);

  const stats = useMemo(() => {
    const timeWithoutMin = n * 20; // ~20 min ręcznie (wypełnienie XML, weryfikacja schematu, upload do KSeF)
    const timeWithMin = n * 2;    // ~2 min z AIRKSEF (wybór klienta, kwota, pobierz XML)
    const timeSavedMin = Math.max(0, timeWithoutMin - timeWithMin);
    const accountantLow = n * 10;
    const accountantHigh = n * 20;
    const savingsLow = Math.max(0, accountantLow - 49);
    const savingsHigh = Math.max(0, accountantHigh - 49);
    const yearlySavings = savingsHigh * 12;
    return {
      timeWithoutMin,
      timeWithMin,
      timeSavedMin,
      accountantLow,
      accountantHigh,
      savingsLow,
      savingsHigh,
      yearlySavings,
    };
  }, [n]);

  return (
    <section className="border-t border-white/10 px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Kalkulator</p>
        <h2 className="mt-2 text-center text-2xl font-bold text-white sm:text-3xl">Ile oszczędzasz z AIRKSEF?</h2>

        <div className="mt-10 rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-sm sm:p-8">
          <p className="text-center text-sm text-white/90">Ile faktur wystawiasz zagranicznym klientom miesięcznie?</p>
          <div className="mt-6 px-2">
            <input
              type="range"
              min={1}
              max={100}
              value={n}
              onChange={(e) => setN(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/30 accent-white [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
            />
            <div className="mt-1 flex justify-between text-xs text-white/70">
              <span>1</span>
              <span>100</span>
            </div>
          </div>
          <p className="mt-4 text-center text-lg font-semibold text-white">{n} faktur</p>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/10 p-4 text-center backdrop-blur-sm">
              <p className="text-xs text-white/80">Czas bez AIRKSEF</p>
              <p className="mt-1 text-xl font-bold text-white">{stats.timeWithoutMin} min/mc</p>
              <p className="mt-1 text-xs text-white/60">~20 min na fakturę ręcznie (XML + upload KSeF)</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 p-4 text-center backdrop-blur-sm">
              <p className="text-xs text-white/80">Czas z AIRKSEF</p>
              <p className="mt-1 text-xl font-bold text-white">{stats.timeWithMin} min/mc</p>
              <p className="mt-1 text-xs text-white/60">~2 min na fakturę (generator XML)</p>
            </div>
            <div className="rounded-xl border border-emerald-300/40 bg-emerald-500/20 p-4 text-center backdrop-blur-sm">
              <p className="text-xs text-emerald-100">Oszczędność czasu</p>
              <p className="mt-1 text-xl font-bold text-emerald-200">{stats.timeSavedMin} min/mc</p>
              <p className="mt-1 text-xs text-emerald-100/80">~{Math.round(stats.timeSavedMin / 60)} godz.</p>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/10 p-4 text-center backdrop-blur-sm">
              <p className="text-xs text-white/80">Koszt księgowego</p>
              <p className="mt-1 text-xl font-bold text-white">
                {stats.accountantLow}–{stats.accountantHigh} PLN/mc
              </p>
              <p className="mt-1 text-xs text-white/60">10–20 PLN za fakturę u księgowego</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 p-4 text-center backdrop-blur-sm">
              <p className="text-xs text-white/80">Koszt AIRKSEF</p>
              <p className="mt-1 text-xl font-bold text-white">49 PLN/mc</p>
              <p className="mt-1 text-xs text-white/60">Plan Pro (do 50 faktur)</p>
            </div>
            <div className="rounded-xl border border-emerald-300/40 bg-emerald-500/20 p-4 text-center backdrop-blur-sm">
              <p className="text-xs text-emerald-100">Oszczędzasz</p>
              <p className="mt-1 text-xl font-bold text-emerald-200">
                {stats.savingsLow}–{stats.savingsHigh} PLN/mc
              </p>
              <p className="mt-1 text-xs text-emerald-100/80">rocznie ~{stats.yearlySavings.toLocaleString("pl-PL")} PLN</p>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-emerald-400/30 bg-emerald-600/25 p-6 text-center">
            <p className="text-sm text-white/90">Zwrot z inwestycji</p>
            <p className="mt-2 text-3xl font-bold text-emerald-200">2× ROI</p>
            <p className="mt-1 text-sm text-emerald-100/90">AIRKSEF zwróci się 2-krotnie</p>
          </div>
        </div>
      </div>
    </section>
  );
}
