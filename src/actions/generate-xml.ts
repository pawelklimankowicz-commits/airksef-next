"use server";

import { auth } from "@clerk/nextjs/server";

import { buildInvoiceXml } from "@/lib/xmlInvoice";
import { validateInvoiceXml } from "@/lib/validateInvoiceXml";
import type { InvoiceInput } from "@/types/invoice";

/**
 * Walidacja bez zwracania XML — dla gości (treść XML nigdy nie trafia do przeglądarki).
 */
export async function previewInvoiceValidationAction(input: InvoiceInput) {
  const xml = buildInvoiceXml(input);
  const v = validateInvoiceXml(xml);
  return { valid: v.valid, errors: v.errors };
}

export type GenerateXmlResult =
  | { ok: true; xml: string; errors: string[] }
  | { ok: false; reason: "UNAUTHORIZED" };

/**
 * Pełne generowanie XML tylko dla zalogowanego użytkownika (wyłącznie na serwerze).
 */
export async function generateInvoiceXmlAction(input: InvoiceInput): Promise<GenerateXmlResult> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, reason: "UNAUTHORIZED" };
  }
  const xml = buildInvoiceXml(input);
  const v = validateInvoiceXml(xml);
  return { ok: true, xml, errors: v.errors };
}
