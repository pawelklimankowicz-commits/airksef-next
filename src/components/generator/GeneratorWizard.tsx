"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { parseInvoicePdfAction } from "@/actions/parse-pdf";
import { PLATFORMS } from "@/data/platforms";
import { CURRENCIES } from "@/data/currencies";
import { useInvoices } from "@/hooks/useInvoices";
import {
  loadBuyerProfile,
  normalizeNipDigits,
  saveBuyerProfile,
  validateStep1,
  validateStep2,
} from "@/lib/formValidation";
import { buildInvoiceXml } from "@/lib/xmlInvoice";
import { validateInvoiceXml } from "@/lib/validateInvoiceXml";
import { splitGross } from "@/lib/vatMath";
import type { InvoiceInput, VatRate } from "@/types/invoice";

const STEPS = ["Klient", "Faktura", "Sprzedawca", "XML"] as const;

const VAT_RATES: VatRate[] = ["23%", "8%", "5%", "0%", "ZW", "NP"];

/** Najpopularniejsze kody krajów UE + najczęstsi partnerzy */
const COUNTRY_CODES: { code: string; name: string; flag: string }[] = [
  { code: "DE", name: "Niemcy", flag: "🇩🇪" },
  { code: "FR", name: "Francja", flag: "🇫🇷" },
  { code: "NL", name: "Holandia", flag: "🇳🇱" },
  { code: "GB", name: "Wielka Brytania", flag: "🇬🇧" },
  { code: "IE", name: "Irlandia", flag: "🇮🇪" },
  { code: "US", name: "USA", flag: "🇺🇸" },
  { code: "SE", name: "Szwecja", flag: "🇸🇪" },
  { code: "NO", name: "Norwegia", flag: "🇳🇴" },
  { code: "DK", name: "Dania", flag: "🇩🇰" },
  { code: "FI", name: "Finlandia", flag: "🇫🇮" },
  { code: "ES", name: "Hiszpania", flag: "🇪🇸" },
  { code: "IT", name: "Włochy", flag: "🇮🇹" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "BE", name: "Belgia", flag: "🇧🇪" },
  { code: "CH", name: "Szwajcaria", flag: "🇨🇭" },
  { code: "CZ", name: "Czechy", flag: "🇨🇿" },
  { code: "SK", name: "Słowacja", flag: "🇸🇰" },
  { code: "HU", name: "Węgry", flag: "🇭🇺" },
  { code: "RO", name: "Rumunia", flag: "🇷🇴" },
  { code: "PT", name: "Portugalia", flag: "🇵🇹" },
  { code: "LU", name: "Luksemburg", flag: "🇱🇺" },
  { code: "EE", name: "Estonia", flag: "🇪🇪" },
  { code: "LV", name: "Łotwa", flag: "🇱🇻" },
  { code: "LT", name: "Litwa", flag: "🇱🇹" },
  { code: "CA", name: "Kanada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "SG", name: "Singapur", flag: "🇸🇬" },
  { code: "JP", name: "Japonia", flag: "🇯🇵" },
  { code: "IL", name: "Izrael", flag: "🇮🇱" },
  { code: "AE", name: "ZEA", flag: "🇦🇪" },
  { code: "CN", name: "Chiny", flag: "🇨🇳" },
];

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Kopia logiki i układu z `AIRKSEF-XML-Generator-KSeF/src/pages/HomeWizard.tsx` (Vite). */
export function GeneratorWizard() {
  const { add } = useInvoices();
  const [step, setStep] = useState(0);
  const [q, setQ] = useState("");
  const [platformIndex, setPlatformIndex] = useState<number | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customVat, setCustomVat] = useState("");
  const [customAddress, setCustomAddress] = useState("");
  const [customCountryCode, setCustomCountryCode] = useState("DE");
  const [customErrors, setCustomErrors] = useState<string[]>([]);

  const [grossStr, setGrossStr] = useState("100.00");
  const [vatRate, setVatRate] = useState<VatRate>("23%");
  const [currency, setCurrency] = useState("EUR");
  const [exchangeRate, setExchangeRate] = useState("");
  const [issueDate, setIssueDate] = useState(todayISODate());
  const [saleDate, setSaleDate] = useState(todayISODate());
  const [invoiceNumber, setInvoiceNumber] = useState(`AIRKSEF/${todayISODate().replace(/-/g, "/")}/001`);
  const [isCorrection, setIsCorrection] = useState(false);
  const [origNr, setOrigNr] = useState("");
  const [origIssueDate, setOrigIssueDate] = useState("");
  const [origKsef, setOrigKsef] = useState("");
  const [corrReason, setCorrReason] = useState("");

  const [buyerNip, setBuyerNip] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [buyerCity, setBuyerCity] = useState("");
  const [buyerZip, setBuyerZip] = useState("");

  const [xmlOut, setXmlOut] = useState("");
  const [valMsg, setValMsg] = useState<string[] | null>(null);
  const [valWarnings, setValWarnings] = useState<string[]>([]);
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [savedToast, setSavedToast] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfNote, setPdfNote] = useState<string | null>(null);

  useEffect(() => {
    const p = loadBuyerProfile();
    if (!p) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- profil nabywcy z localStorage po mount
    if (p.buyerNip) setBuyerNip(p.buyerNip);
    if (p.buyerName) setBuyerName(p.buyerName);
    if (p.buyerAddress) setBuyerAddress(p.buyerAddress);
    if (p.buyerCity) setBuyerCity(p.buyerCity);
    if (p.buyerZip) setBuyerZip(p.buyerZip);
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return PLATFORMS;
    return PLATFORMS.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.category.toLowerCase().includes(s) ||
        p.country.toLowerCase().includes(s)
    );
  }, [q]);

  const platformFromList = platformIndex !== null ? PLATFORMS[platformIndex] : null;

  const customPlatform = useMemo(() => {
    if (!customMode) return null;
    const cc = COUNTRY_CODES.find((c) => c.code === customCountryCode);
    return {
      name: customName.trim() || "—",
      vatId: customVat.trim() || "N/A",
      address: customAddress.trim(),
      countryCode: customCountryCode,
      country: cc?.name ?? customCountryCode,
      flag: cc?.flag ?? "🌍",
      category: "Własny klient",
    };
  }, [customMode, customName, customVat, customAddress, customCountryCode]);

  const platform = customMode ? customPlatform : platformFromList;

  const gross = parseFloat(grossStr.replace(",", ".")) || 0;
  const { net, vat } = splitGross(gross, vatRate);
  const exRate = exchangeRate.trim() ? parseFloat(exchangeRate.replace(",", ".")) : undefined;

  const nipDigits = normalizeNipDigits(buyerNip);

  const invoice: InvoiceInput | null = useMemo(() => {
    if (!platform) return null;
    return {
      buyerNip: nipDigits,
      buyerName: buyerName.trim(),
      buyerAddress: buyerAddress.trim(),
      buyerCity: buyerCity.trim(),
      buyerZip: buyerZip.trim(),
      supplierName: platform.name,
      supplierVat: platform.vatId,
      supplierAddress: platform.address,
      supplierCountryCode: platform.countryCode,
      currency,
      issueDate,
      saleDate,
      invoiceNumber: invoiceNumber.trim(),
      grossAmount: gross,
      netAmount: net,
      vatAmount: vat,
      vatRate,
      exchangeRate: currency !== "PLN" ? exRate : undefined,
      isCorrection: isCorrection || undefined,
      originalInvoiceNumber: isCorrection ? origNr.trim() : undefined,
      originalIssueDate: isCorrection && origIssueDate.trim() ? origIssueDate.trim() : undefined,
      originalKsefNumber: isCorrection ? origKsef.trim() : undefined,
      correctionReason: isCorrection ? corrReason.trim() : undefined,
    };
  }, [
    platform,
    nipDigits,
    buyerName,
    buyerAddress,
    buyerCity,
    buyerZip,
    currency,
    issueDate,
    saleDate,
    invoiceNumber,
    gross,
    net,
    vat,
    vatRate,
    exRate,
    isCorrection,
    origNr,
    origIssueDate,
    origKsef,
    corrReason,
  ]);

  const runGenerate = useCallback(() => {
    if (!invoice) return;
    const xml = buildInvoiceXml(invoice);
    setXmlOut(xml);
    const v = validateInvoiceXml(xml);
    setValMsg(v.valid ? [] : v.errors);
    setValWarnings(v.warnings ?? []);
  }, [invoice]);

  function downloadXml() {
    if (!xmlOut) return;
    const blob = new Blob([xmlOut], { type: "application/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `faktura_${invoice?.invoiceNumber.replace(/\//g, "-") || "airksef"}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function persistBuyer() {
    if (!invoice) return;
    saveBuyerProfile({
      buyerNip: invoice.buyerNip,
      buyerName: invoice.buyerName,
      buyerAddress: invoice.buyerAddress,
      buyerCity: invoice.buyerCity,
      buyerZip: invoice.buyerZip,
    });
  }

  function saveToList() {
    if (!invoice || !xmlOut) return;
    persistBuyer();
    add(invoice, `${platform?.name ?? ""} — ${invoice.invoiceNumber}`);
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 3500);
  }

  function goStep1Next() {
    const err = validateStep1({
      gross,
      invoiceNumber,
      isCorrection,
      origNr,
    });
    setStepErrors(err);
    if (err.length) return;
    setStepErrors([]);
    setStep(2);
  }

  async function onPdfSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPdfLoading(true);
    setPdfNote(null);
    const fd = new FormData();
    fd.append("file", f);
    const r = await parseInvoicePdfAction(fd);
    setPdfLoading(false);
    e.target.value = "";
    if (!r.ok) {
      setPdfNote(r.error);
      return;
    }
    const h = r.hints;
    if (h.buyerNip) setBuyerNip(h.buyerNip);
    if (h.grossStr) setGrossStr(h.grossStr);
    if (h.currency && (CURRENCIES as readonly string[]).includes(h.currency)) {
      setCurrency(h.currency as (typeof CURRENCIES)[number]);
    }
    if (h.issueDate) setIssueDate(h.issueDate);
    if (h.saleDate) setSaleDate(h.saleDate);
    if (h.invoiceNumber) setInvoiceNumber(h.invoiceNumber);
    setPdfNote(
      `PDF: ${r.pages} str., wykryto podpowiedzi pól — sprawdź kwoty i daty przed „Dalej”.`,
    );
  }

  function goStep2Next() {
    const err = validateStep2({
      buyerNip: nipDigits,
      buyerName,
      buyerAddress,
      buyerCity,
      buyerZip,
    });
    setStepErrors(err);
    if (err.length) return;
    setStepErrors([]);
    persistBuyer();
    setStep(3);
    runGenerate();
  }

  return (
    <div className="relative min-h-screen text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-semibold tracking-tight text-primary">
            AIRKSEF
          </Link>
          <Link href="/faktury" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Zapisane faktury
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Generator XML FA (3) — KSeF</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Wybierz zagranicznego klienta lub platformę, której wystawiasz fakturę. Uzupełnij kwoty i swoje dane jako sprzedawca (Podmiot2 w KSeF). Pobierz plik XML FA(3) gotowy do wysłania do KSeF.
          </p>
        </div>

        <ol className="mb-6 flex flex-wrap gap-2 text-xs sm:text-sm">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={`rounded-full px-3 py-1 transition-colors ${
                i === step
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : i < step
                    ? "bg-muted text-muted-foreground"
                    : "bg-muted/50 text-muted-foreground/70"
              }`}
            >
              {i + 1}. {label}
            </li>
          ))}
        </ol>

        {stepErrors.length > 0 && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground">
            <ul className="list-inside list-disc space-y-0.5">
              {stepErrors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {step === 0 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <p className="text-muted-foreground">
                <strong className="text-foreground">PDF</strong> — wgraj fakturę od klienta z warstwą tekstową (nie skan); pola
                kwot i dat uzupełnią się heurystycznie.
              </p>
              <label className="mt-2 inline-block">
                <span className="cursor-pointer rounded-lg border border-primary bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20">
                  {pdfLoading ? "Odczyt PDF…" : "Wybierz plik PDF"}
                </span>
                <input type="file" accept="application/pdf" className="sr-only" disabled={pdfLoading} onChange={onPdfSelected} />
              </label>
              {pdfNote && <p className="mt-2 text-xs text-muted-foreground">{pdfNote}</p>}
            </div>
            <input
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Szukaj klienta / platformy (nazwa, kategoria, kraj)…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoComplete="off"
            />
            <div className=”flex items-center justify-between”>
              <p className=”text-xs text-muted-foreground”>
                Znaleziono: {filtered.length} · kliknij pozycję, potem „Dalej”
              </p>
              <button
                type=”button”
                className=”rounded-lg border border-primary/50 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20”
                onClick={() => {
                  setCustomMode(true);
                  setPlatformIndex(null);
                  setCustomErrors([]);
                }}
              >
                + Wpisz klienta ręcznie
              </button>
            </div>
            <div className=”max-h-[28rem] overflow-auto rounded-lg border border-border bg-card/40 shadow-inner”>
              {filtered.map((p) => {
                const idx = PLATFORMS.indexOf(p);
                return (
                  <button
                    key={`${p.name}-${p.vatId}-${idx}`}
                    type="button"
                    className={`flex w-full items-start gap-2 border-b border-border px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent/50 ${
                      platformIndex === idx ? "bg-accent/40 ring-1 ring-inset ring-primary/50" : ""
                    }`}
                    onClick={() => setPlatformIndex(idx)}
                  >
                    <span className="text-lg leading-none">{p.flag}</span>
                    <span>
                      <span className="font-medium text-card-foreground">{p.name}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {p.category} · {p.country} · VAT: {p.vatId}
                        {p.vatId === "N/A" && (
                          <span className="ml-1 text-yellow-600 dark:text-yellow-400" title="Brak numeru VAT — XML może być niezgodny z KSeF">⚠</span>
                        )}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            {customMode && (
              <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">Dane klienta (ręcznie)</p>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => { setCustomMode(false); setCustomErrors([]); }}
                  >
                    ✕ Anuluj — wróć do listy
                  </button>
                </div>
                {customErrors.length > 0 && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive-foreground">
                    {customErrors.map((e) => <p key={e}>{e}</p>)}
                  </div>
                )}
                <label className="block">
                  <span className="text-muted-foreground">Nazwa klienta / firmy *</span>
                  <input
                    className="mt-1 w-full rounded border border-input bg-card px-2 py-2 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="np. Acme GmbH"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-muted-foreground">Numer VAT klienta *</span>
                  <input
                    className="mt-1 w-full rounded border border-input bg-card px-2 py-2 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring tracking-widest"
                    placeholder="np. DE123456789"
                    value={customVat}
                    onChange={(e) => setCustomVat(e.target.value.trim())}
                  />
                  <span className="text-xs text-muted-foreground">Jeśli klient nie ma numeru VAT, wpisz N/A</span>
                </label>
                <label className="block">
                  <span className="text-muted-foreground">Kraj klienta *</span>
                  <select
                    className="mt-1 w-full rounded border border-input bg-card px-2 py-2 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={customCountryCode}
                    onChange={(e) => setCustomCountryCode(e.target.value)}
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>{c.flag} {c.name} ({c.code})</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-muted-foreground">Adres klienta (opcjonalnie)</span>
                  <input
                    className="mt-1 w-full rounded border border-input bg-card px-2 py-2 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="np. Musterstraße 1, 10115 Berlin"
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                  />
                </label>
              </div>
            )}
          <button
              type="button"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-md shadow-primary/25 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!customMode && platformIndex === null}
              onClick={() => {
                if (customMode) {
                  const errs: string[] = [];
                  if (!customName.trim()) errs.push("Podaj nazwę klienta.");
                  if (!customVat.trim()) errs.push("Podaj numer VAT klienta (lub wpisz N/A jeśli nie dotyczy).");
                  if (errs.length) { setCustomErrors(errs); return; }
                  setCustomErrors([]);
                }
                setStepErrors([]);
                setStep(1);
              }}
            >
              Dalej
            </button>
          </div>
        )}

        {step === 1 && platform && (
          <div className="space-y-3 text-sm">
            <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-muted-foreground">
              Klient / nabywca (Podmiot1): <span className="text-foreground">{platform.name}</span> ({platform.countryCode})
            </p>
            {platform.vatId === "N/A" && (
              <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-400">
                <strong>Uwaga:</strong> Ten klient ({platform.name}) nie posiada zarejestrowanego numeru VAT/NIP w naszej bazie (wartość &quot;N/A&quot;). Wygenerowany XML FA może zostać odrzucony przez system KSeF. Zweryfikuj numer VAT klienta samodzielnie i w razie potrzeby wprowadź go ręcznie.
              </div>
            )}
            <label className="block">
              <span className="text-muted-foreground">Kwota brutto</span>
              <input
                className="mt-1 w-full rounded border border-input bg-card px-2 py-2 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                inputMode="decimal"
                value={grossStr}
                onChange={(e) => setGrossStr(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-muted-foreground">Stawka VAT</span>
              <select
                className="mt-1 w-full rounded border border-input bg-card px-2 py-2 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={vatRate}
                onChange={(e) => setVatRate(e.target.value as VatRate)}
              >
                {VAT_RATES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-muted-foreground">
              Netto: {net.toFixed(2)} · VAT: {vat.toFixed(2)} (od kwoty brutto)
            </p>
            <label className="block">
              <span className="text-muted-foreground">Waluta</span>
              <select
                className="mt-1 w-full rounded border border-input bg-card px-2 py-2 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            {currency !== "PLN" && (
              <label className="block">
                <span className="text-muted-foreground">Kurs średni NBP do PLN (opcjonalnie)</span>
                <input
                  className="mt-1 w-full rounded border border-input bg-card px-2 py-2 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="np. 4.2500"
                  inputMode="decimal"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                />
              </label>
            )}
            <label className="block">
              <span className="text-muted-foreground">Data wystawienia</span>
              <input
                type="date"
                className="mt-1 w-full rounded border border-input bg-card px-2 py-2 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-muted-foreground">Data sprzedaży / świadczenia</span>
              <input
                type="date"
                className="mt-1 w-full rounded border border-input bg-card px-2 py-2 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-muted-foreground">Numer faktury (nadajesz sam jako sprzedawca)</span>
              <input
                className="mt-1 w-full rounded border border-input bg-card px-2 py-2 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="rounded border-border text-primary"
                checked={isCorrection}
                onChange={(e) => setIsCorrection(e.target.checked)}
              />
              <span>Faktura korygująca</span>
            </label>
            {isCorrection && (
              <div className="space-y-2 border-l-2 border-primary pl-3">
                <input
                  className="w-full rounded border border-input bg-card px-2 py-2 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Numer faktury korygowanej *"
                  value={origNr}
                  onChange={(e) => setOrigNr(e.target.value)}
                />
                <label className="block">
                  <span className="text-xs text-muted-foreground">
                    Data wystawienia faktury korygowanej * (wymagana przez KSeF)
                  </span>
                  <input
                    type="date"
                    className="mt-1 w-full rounded border border-input bg-card px-2 py-2 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={origIssueDate}
                    onChange={(e) => setOrigIssueDate(e.target.value)}
                  />
                </label>
                <input
                  className="w-full rounded border border-input bg-card px-2 py-2 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Numer KSeF faktury korygowanej (opcjonalnie)"
                  value={origKsef}
                  onChange={(e) => setOrigKsef(e.target.value)}
                />
                <input
                  className="w-full rounded border border-input bg-card px-2 py-2 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Przyczyna korekty (opcjonalnie)"
                  value={corrReason}
                  onChange={(e) => setCorrReason(e.target.value)}
                />
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <button type="button" className="rounded-lg border border-border px-4 py-2 hover:bg-accent/50" onClick={() => setStep(0)}>
                Wstecz
              </button>
              <button type="button" className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90" onClick={goStep1Next}>
                Dalej
              </button>
            </div>
          </div>
        )}

        {step === 2 && platform && (
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
              <strong className="text-foreground">Twoje dane sprzedawcy</strong> — trafią do sekcji <strong>Podmiot2</strong> w pliku XML (KSeF). Możesz je zapamiętać i zostaną uzupełnione automatycznie przy następnej fakturze.
            </div>
            <label className="block">
              <span className="text-muted-foreground">Twój NIP (10 cyfr) — sprzedawca</span>
              <input
                className="mt-1 w-full rounded border border-input bg-card px-2 py-2 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring tracking-widest"
                inputMode="numeric"
                autoComplete="off"
                maxLength={14}
                placeholder="np. 5260001546"
                value={buyerNip}
                onChange={(e) => setBuyerNip(normalizeNipDigits(e.target.value))}
              />
            </label>
            <label className="block">
              <span className="text-muted-foreground">Twoja nazwa firmy lub imię i nazwisko</span>
              <input
                className="mt-1 w-full rounded border border-input bg-card px-2 py-2 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-muted-foreground">Ulica i numer (adres sprzedawcy)</span>
              <input
                className="mt-1 w-full rounded border border-input bg-card px-2 py-2 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={buyerAddress}
                onChange={(e) => setBuyerAddress(e.target.value)}
              />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label>
                <span className="text-muted-foreground">Kod pocztowy</span>
                <input
                  className="mt-1 w-full rounded border border-input bg-card px-2 py-2 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="00-000"
                  value={buyerZip}
                  onChange={(e) => setBuyerZip(e.target.value)}
                />
              </label>
              <label>
                <span className="text-muted-foreground">Miasto</span>
                <input
                  className="mt-1 w-full rounded border border-input bg-card px-2 py-2 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={buyerCity}
                  onChange={(e) => setBuyerCity(e.target.value)}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <button type="button" className="rounded-lg border border-border px-4 py-2 hover:bg-accent/50" onClick={() => setStep(1)}>
                Wstecz
              </button>
              <button type="button" className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90" onClick={goStep2Next}>
                Generuj XML FA(3)
              </button>
            </div>
          </div>
        )}

        {step === 3 && invoice && (
          <div className="space-y-4">
            {savedToast && (
              <div className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-foreground">
                Zapisano na liście faktur — możesz wyeksportować CSV w zakładce „Zapisane faktury”.
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent/50"
                onClick={() => runGenerate()}
              >
                Odśwież XML
              </button>
              <span className="text-xs text-muted-foreground">XML przelicza się przy zmianie danych w poprzednich krokach.</span>
            </div>
            {valMsg && valMsg.length > 0 && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground">
                <p className="font-medium">Błędy struktury XML — plik może zostać odrzucony przez KSeF:</p>
                <ul className="mt-2 list-inside list-disc space-y-0.5">
                  {valMsg.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            {valWarnings.length > 0 && (
              <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-foreground">
                <p className="font-medium text-yellow-700 dark:text-yellow-400">Ostrzeżenia — sprawdź przed wysłaniem:</p>
                <ul className="mt-2 list-inside list-disc space-y-0.5 text-muted-foreground">
                  {valWarnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
            {valMsg && valMsg.length === 0 && xmlOut && (
              <p className="text-sm text-primary">✓ Walidacja struktury XML zakończona pomyślnie.</p>
            )}
            {xmlOut && (
              <>
                <textarea
                  className="h-72 w-full rounded-lg border border-input bg-muted/30 p-3 font-mono text-xs leading-relaxed text-muted-foreground"
                  readOnly
                  value={xmlOut}
                  spellCheck={false}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90"
                    onClick={downloadXml}
                  >
                    Pobierz plik .xml
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent/50"
                    onClick={saveToList}
                  >
                    Zapisz na liście
                  </button>
                  <button type="button" className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent/50" onClick={() => setStep(2)}>
                    Wstecz — edycja sprzedawcy
                  </button>
                  <button type="button" className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent/50" onClick={() => setStep(1)}>
                    Edycja faktury
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <footer className="mt-12 border-t border-border py-8 text-center text-xs leading-relaxed text-muted-foreground">
        <p>
          Narzędzie pomocnicze — nie zastępuje porady księgowej. Sprawdź poprawność danych i zgodność z aktualnym schematem FA przed
          wysyłką do KSeF.
        </p>
      </footer>
    </div>
  );
}
