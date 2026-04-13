import { auth } from "@clerk/nextjs/server";
import {
  ChevronRight,
  Download,
  Eye,
  FileText,
  Plus,
  Unplug,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ensureAppUser } from "@/lib/ensure-user";
import { prisma } from "@/lib/db";
import { getMaxInvoicesForPlan, type SubscriptionPlan } from "@/lib/plan-limits";
import type { InvoiceInput } from "@/types/invoice";

function monthStart(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function payloadAsInput(payload: unknown): InvoiceInput | null {
  if (!payload || typeof payload !== "object") return null;
  return payload as InvoiceInput;
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const u = await ensureAppUser();
  if (!u) redirect("/sign-in");

  const usedThisMonth = await prisma.invoice.count({
    where: { userId: u.id, createdAt: { gte: monthStart() } },
  });

  const plan = u.plan as SubscriptionPlan;
  const maxInvoices = getMaxInvoicesForPlan(plan);
  const planLabel =
    plan === "FREE" ? "Free" : plan === "PRO" ? "Pro" : "Business";

  const progressPct =
    Number.isFinite(maxInvoices) && maxInvoices > 0
      ? Math.min(100, (usedThisMonth / maxInvoices) * 100)
      : 0;

  const recent = await prisma.invoice.findMany({
    where: { userId: u.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, label: true, createdAt: true, payload: true },
  });

  return (
    <div className="min-h-screen text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="shrink-0 rounded-md bg-primary px-2.5 py-1 text-xs font-bold tracking-tight text-primary-foreground">
              AIRKSEF
            </span>
            <span className="truncate text-sm text-muted-foreground">
              <span className="text-foreground/80">/</span> Panel
            </span>
          </div>
          <Link
            href="/generator"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            Nowa faktura
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Witaj w AIRKSEF</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Zalogowano jako <span className="font-medium text-foreground">{u.email ?? "—"}</span>
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">Faktury w tym miesiącu</p>
              <FileText className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">
              {usedThisMonth} / {Number.isFinite(maxInvoices) ? maxInvoices : "∞"}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-red-500/90 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">Plan</p>
              <Zap className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">{planLabel}</p>
            <Link
              href="/billing"
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              Zmień plan
            </Link>
          </div>

          <Link
            href="/ksef"
            className="group rounded-xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/30"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">Status KSeF</p>
              <Unplug className="h-5 w-5 text-muted-foreground group-hover:text-primary" aria-hidden />
            </div>
            <p className="mt-3 text-sm font-medium leading-snug text-foreground">
              Tryb symulacji
            </p>
            <p className="mt-1 text-xs text-muted-foreground leading-snug">
              Kliknij, aby zobaczyć opcje integracji z KSeF
            </p>
            <ChevronRight className="mt-2 ml-auto h-5 w-5 text-muted-foreground transition group-hover:text-primary" />
          </Link>
        </div>

        <section className="mt-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-lg font-semibold text-foreground">Ostatnie faktury</h2>
            <Link
              href="/faktury"
              className="text-sm font-medium text-primary hover:underline"
            >
              Zobacz wszystkie →
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/80 px-6 py-12 text-center text-sm text-muted-foreground">
              Brak zapisanych faktur w chmurze. Użyj generatora i zapisz fakturę po zalogowaniu.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Numer</th>
                    <th className="px-4 py-3 font-medium">Dostawca</th>
                    <th className="px-4 py-3 font-medium">Data</th>
                    <th className="px-4 py-3 font-medium">Brutto</th>
                    <th className="px-4 py-3 font-medium">Waluta</th>
                    <th className="px-4 py-3 text-right font-medium">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((row) => {
                    const data = payloadAsInput(row.payload);
                    const num = data?.invoiceNumber ?? row.label;
                    const supplier = data?.supplierName ?? "—";
                    const dt = data?.issueDate ?? row.createdAt.toISOString().slice(0, 10);
                    const gross =
                      typeof data?.grossAmount === "number"
                        ? data.grossAmount.toFixed(2)
                        : "—";
                    const cur = data?.currency ?? "—";
                    return (
                      <tr key={row.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-medium text-foreground">{num}</td>
                        <td className="px-4 py-3 text-foreground">{supplier}</td>
                        <td className="px-4 py-3 text-muted-foreground">{dt}</td>
                        <td className="px-4 py-3 tabular-nums text-foreground">{gross}</td>
                        <td className="px-4 py-3 text-muted-foreground">{cur}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2 text-muted-foreground">
                            <Link
                              href="/faktury"
                              className="rounded-md p-1.5 hover:bg-muted hover:text-foreground"
                              title="Lista faktur"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <span className="rounded-md p-1.5 opacity-40" title="Pobierz z listy faktur">
                              <Download className="h-4 w-4" />
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
