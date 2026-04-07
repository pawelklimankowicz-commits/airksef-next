"use server";

import { revalidatePath } from "next/cache";

import { assertInvoiceQuotaOrRedirect } from "@/lib/assert-invoice-quota";
import { prisma } from "@/lib/db";
import { ensureAppUser } from "@/lib/ensure-user";
import { buildInvoiceXml } from "@/lib/xmlInvoice";
import type { InvoiceInput } from "@/types/invoice";

function monthStart(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function saveInvoiceToDb(input: InvoiceInput, label: string) {
  const u = await ensureAppUser();
  if (!u) {
    throw new Error("Brak sesji — zaloguj się, aby zapisać w chmurze.");
  }

  const used = await prisma.invoice.count({
    where: { userId: u.id, createdAt: { gte: monthStart() } },
  });
  assertInvoiceQuotaOrRedirect(u.plan, used);

  const xmlContent = buildInvoiceXml(input);
  await prisma.invoice.create({
    data: {
      userId: u.id,
      label,
      xmlContent,
      payload: JSON.parse(JSON.stringify(input)) as object,
    },
  });
  revalidatePath("/faktury");
}

export async function deleteInvoice(id: string) {
  const u = await ensureAppUser();
  if (!u) throw new Error("Brak sesji.");
  await prisma.invoice.deleteMany({
    where: { id, userId: u.id },
  });
  revalidatePath("/faktury");
}

export async function getMyInvoices() {
  const u = await ensureAppUser();
  if (!u) return [];
  return prisma.invoice.findMany({
    where: { userId: u.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      label: true,
      createdAt: true,
      xmlContent: true,
      payload: true,
    },
  });
}
