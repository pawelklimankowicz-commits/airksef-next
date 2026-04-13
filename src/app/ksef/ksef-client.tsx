"use client";

import { useEffect, useState } from "react";

import { submitXmlToKsefAction } from "@/actions/ksef-submit";
import { getSellerSettingsAction, saveSellerSettingsAction } from "@/actions/ksef-settings";

// ──────────────────────────────────────────
// Panel ustawień sprzedawcy + tokenu KSeF
// ──────────────────────────────────────────
function SellerSettingsPanel({ onSaved }: { onSaved: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [sellerNip, setSellerNip] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [sellerAddress, setSellerAddress] = useState("");
  const [sellerCity, setSellerCity] = useState("");
  const [sellerZip, setSellerZip] = useState("");
  const [ksefToken, setKsefToken] = useState("");
  const [ksefEnv, setKsefEnv] = useState<"test" | "prod">("test");
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    void (async () => {
      const r = await getSellerSettingsAction();
      if (r.ok) {
        const s = r.settings;
        setSellerNip(s.sellerNip);
        setSellerName(s.sellerName);
        setSellerAddress(s.sellerAddress);
        setSellerCity(s.sellerCity);
        setSellerZip(s.sellerZip);
        setKsefEnv(s.ksefEnvironment);
        setHasToken(s.hasToken);
      }
      setLoading(false);
    })();
  }, []);

  async function save() {
    setSaving(true);
    setErr(null);
    setMsg(null);
    const r = await saveSellerSettingsAction({
      sellerNip,
      sellerName,
      sellerAddress,
      sellerCity,
      sellerZip,
      ksefToken: ksefToken.trim() || undefined,
      ksefEnvironment: ksefEnv,
    });
    setSaving(false);
    if (!r.ok) { setErr(r.error); return; }
    setMsg("Zapisano.");
    if (ksefToken.trim()) setHasToken(true);
    setKsefToken(""); // wyczyść pole hasła po zapisie
    onSaved();
  }

  async function clearToken() {
    setSaving(true);
    await saveSellerSettingsAction({
      sellerNip, sellerName, sellerAddress, sellerCity, sellerZip,
      clearToken: true,
      ksefEnvironment: ksefEnv,
    });
    setSaving(false);
    setHasToken(false);
    setMsg("Token usunięty.");
  }

  if (loading) return <p className="text-sm text-muted-foreground">Ładowanie ustawień…</p>;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-base font-semibold">Dane sprzedawcy (Podmiot2)</h2>
      <p className="text-xs text-muted-foreground">
        Twoje dane jako wystawcy faktury. Trafiają do pola <strong>Podmiot2</strong> w FA(3). Zapisane tu dane możesz też
        wybrać automatycznie w generatorze.
      </p>

      {err && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">{err}</div>
      )}
      {msg && (
        <div className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-foreground">{msg}</div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm text-muted-foreground">Twój NIP (10 cyfr) *</span>
          <input
            className="mt-1 w-full rounded border border-input bg-background px-2 py-2 text-sm text-foreground shadow-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-ring"
            inputMode="numeric" maxLength={10} placeholder="np. 5260001546"
            value={sellerNip}
            onChange={(e) => setSellerNip(e.target.value.replace(/\D/g, "").slice(0, 10))}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm text-muted-foreground">Nazwa firmy / imię i nazwisko *</span>
          <input
            className="mt-1 w-full rounded border border-input bg-background px-2 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="np. Jan Kowalski Usługi IT"
            value={sellerName}
            onChange={(e) => setSellerName(e.target.value)}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm text-muted-foreground">Ulica i numer</span>
          <input
            className="mt-1 w-full rounded border border-input bg-background px-2 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="np. ul. Warszawska 12/3"
            value={sellerAddress}
            onChange={(e) => setSellerAddress(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm text-muted-foreground">Kod pocztowy</span>
          <input
            className="mt-1 w-full rounded border border-input bg-background px-2 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="00-000"
            value={sellerZip}
            onChange={(e) => setSellerZip(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm text-muted-foreground">Miasto</span>
          <input
            className="mt-1 w-full rounded border border-input bg-background px-2 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="np. Warszawa"
            value={sellerCity}
            onChange={(e) => setSellerCity(e.target.value)}
          />
        </label>
      </div>

      <hr className="border-border" />

      <h2 className="text-base font-semibold">Token autoryzacyjny KSeF</h2>
      <p className="text-xs text-muted-foreground">
        Token wygenerujesz na{" "}
        <a href="https://www.podatki.gov.pl/ksef/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
          portalu KSeF (podatki.gov.pl)
        </a>{" "}
        → Moje konto → Tokeny autoryzacyjne. Token jest szyfrowany AES-256-GCM przed zapisem.
      </p>

      <label className="block">
        <span className="text-sm text-muted-foreground">
          Token autoryzacyjny {hasToken ? <span className="ml-1 text-xs text-primary">(✓ zapisany)</span> : "(nie ustawiony)"}
        </span>
        <input
          type="password"
          className="mt-1 w-full rounded border border-input bg-background px-2 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder={hasToken ? "Wpisz nowy token aby nadpisać" : "Wklej token z portalu KSeF…"}
          value={ksefToken}
          onChange={(e) => setKsefToken(e.target.value)}
          autoComplete="off"
        />
      </label>

      <label className="block">
        <span className="text-sm text-muted-foreground">Środowisko</span>
        <select
          className="mt-1 w-full rounded border border-input bg-background px-2 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={ksefEnv}
          onChange={(e) => setKsefEnv(e.target.value as "test" | "prod")}
        >
          <option value="test">Test (ksef-test.mf.gov.pl) — bezpieczne testy, nie generuje prawdziwych dokumentów</option>
          <option value="prod">Produkcja (ksef.mf.gov.pl) — prawdziwe faktury</option>
        </select>
      </label>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:bg-primary/90"
        >
          {saving ? "Zapisywanie…" : "Zapisz ustawienia"}
        </button>
        {hasToken && (
          <button
            type="button"
            disabled={saving}
            onClick={() => void clearToken()}
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive-foreground hover:bg-destructive/20 disabled:opacity-50"
          >
            Usuń token
          </button>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Panel wysyłki XML do KSeF
// ──────────────────────────────────────────
function SendPanel({ hasToken }: { hasToken: boolean }) {
  const [xml, setXml] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ref, setRef] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>(null);

  async function send() {
    setErr(null); setMsg(null); setRef(null);
    setLoading(true);
    try {
      const r = await submitXmlToKsefAction(xml);
      if (!r.ok) { setErr(r.error); return; }
      setMsg(r.message);
      if (r.reference) setRef(r.reference);
      setMode(r.mode);
    } catch {
      setErr("Nie udało się wysłać. Sprawdź połączenie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-base font-semibold">Wyślij fakturę do KSeF</h2>

      {!hasToken && (
        <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-400">
          Brak tokenu KSeF — zostanie użyty tryb symulacji. Uzupełnij dane powyżej, aby wysyłać naprawdę.
        </div>
      )}

      <label className="block">
        <span className="text-sm text-muted-foreground">Wklej XML FA(3) z generatora</span>
        <textarea
          className="mt-2 h-56 w-full rounded-lg border border-input bg-background p-3 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          value={xml}
          onChange={(e) => setXml(e.target.value)}
          spellCheck={false}
          placeholder="Wklej zawartość pliku .xml…"
        />
      </label>

      {err && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">{err}</div>
      )}
      {msg && (
        <div className={`rounded-lg border px-3 py-2 text-sm ${
          mode === "mock"
            ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
            : "border-primary/40 bg-primary/10 text-foreground"
        }`}>
          {msg}
          {ref && mode !== "mock" && (
            <p className="mt-1 font-mono text-xs text-muted-foreground">Numer referencyjny: {ref}</p>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={loading || !xml.trim()}
        onClick={() => void send()}
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? "Wysyłanie…" : hasToken ? "Wyślij do KSeF (API MF)" : "Wyślij (symulacja)"}
      </button>
    </div>
  );
}

// ──────────────────────────────────────────
// Główny komponent
// ──────────────────────────────────────────
export function KsefClient() {
  const [hasToken, setHasToken] = useState(false);
  const [init, setInit] = useState(false);

  useEffect(() => {
    void (async () => {
      const r = await getSellerSettingsAction();
      if (r.ok) setHasToken(r.settings.hasToken);
      setInit(true);
    })();
  }, []);

  if (!init) return null;

  return (
    <div className="space-y-6">
      <SellerSettingsPanel onSaved={() => void getSellerSettingsAction().then((r) => r.ok && setHasToken(r.settings.hasToken))} />
      <SendPanel hasToken={hasToken} />
    </div>
  );
}
