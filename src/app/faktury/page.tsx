"use client";

import Link from "next/link";

import { buildInvoiceXml } from "@/lib/xmlInvoice";
import type { InvoiceInput, SavedInvoice } from "@/types/invoice";
import { useInvoices } from "@/hooks/useInvoices";

function toCsvRow(s: string): string {
  if (s.includes('"') || s.includes(";") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Kopia `AIRKSEF-XML-Generator-KSeF/src/pages/InvoicesPage.tsx` (Vite). */
export default function FakturyPage() {
  const { list, remove, clear } = useInvoices();

  function downloadCsv() {
    const header = [
      "data_zapisu",
      "etykieta",
      "numer_fv",
      "nip_nabywcy",
      "dostawca",
      "kwota_brutto",
      "waluta",
      "stawka_vat",
    ].join(";");
    const lines = list.map((r) =>
      [
        r.createdAt,
        r.label,
        r.invoiceNumber,
        r.buyerNip,
        r.supplierName,
        String(r.grossAmount),
        r.currency,
        r.vatRate,
      ]
        .map((c) => toCsvRow(String(c)))
        .join(";")
    );
    const bom = "\uFEFF";
    const blob = new Blob([bom + [header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `faktury_airksef_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toInput(row: SavedInvoice): InvoiceInput {
    const { id: _i, createdAt: _c, label: _l, ...data } = row;
    void _i;
    void _c;
    void _l;
    return data;
  }

  function downloadXmlFor(row: SavedInvoice) {
    const xml = buildInvoiceXml(toInput(row));
    const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `faktura_${row.invoiceNumber.replace(/\//g, "-")}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function confirmClear() {
    if (list.length === 0) return;
    if (window.confirm("Usunąć wszystkie zapisane faktury z tej przeglądarki?")) clear();
  }

  return (
    <div className="relative min-h-screen text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-sm text-primary transition-colors hover:text-primary/80">
            ← Generator
          </Link>
          <span className="font-semibold tracking-tight">Zapisane faktury</span>
        </div>
      </nav>
      <main className="mx-auto max-w-4xl px-4 py-8">
        {list.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/60 p-8 text-center shadow-sm">
            <p className="text-muted-foreground">Nie masz jeszcze zapisanych pozycji.</p>
            <p className="mt-2 text-sm text-muted-foreground/90">
              Na stronie głównej przejdź przez kroki, wygeneruj XML i kliknij „Zapisz na liście”.
            </p>
            <Link
              href="/generator"
              className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-primary/90"
            >
              Przejdź do generatora
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
                onClick={downloadCsv}
              >
                Eksport CSV
              </button>
              <button
                type="button"
                className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent/50"
                onClick={confirmClear}
              >
                Wyczyść listę
              </button>
            </div>
            <ul className="space-y-3">
              {list.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-card/50 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-card-foreground">{row.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {row.grossAmount.toFixed(2)} {row.currency} · VAT {row.vatRate} · NIP {row.buyerNip}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground/70">{new Date(row.createdAt).toLocaleString("pl-PL")}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent/50"
                      onClick={() => downloadXmlFor(row)}
                    >
                      Pobierz XML
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-destructive/50 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                      onClick={() => remove(row.id)}
                    >
                      Usuń
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
