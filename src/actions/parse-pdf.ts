"use server";

import { PDFParse } from "pdf-parse";

import { extractInvoiceHintsFromText } from "@/lib/pdfHints";

export type ParsePdfResult =
  | { ok: true; hints: ReturnType<typeof extractInvoiceHintsFromText>; pages: number; textLength: number }
  | { ok: false; error: string };

export async function parseInvoicePdfAction(formData: FormData): Promise<ParsePdfResult> {
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return { ok: false, error: "Nie wybrano pliku PDF." };
  }
  if (file.size > 6 * 1024 * 1024) {
    return { ok: false, error: "Plik za duży (max 6 MB)." };
  }
  if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
    return { ok: false, error: "Wymagany plik PDF." };
  }

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buf });
    try {
      const textResult = await parser.getText();
      const text = typeof textResult.text === "string" ? textResult.text : "";
      if (!text.trim()) {
        return {
          ok: false,
          error:
            "Brak warstwy tekstowej w PDF (np. skan). Użyj PDF z tekstem lub uzupełnij dane ręcznie.",
        };
      }
      const hints = extractInvoiceHintsFromText(text);
      return {
        ok: true,
        hints,
        pages: textResult.total > 0 ? textResult.total : 1,
        textLength: text.length,
      };
    } finally {
      await parser.destroy();
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Nie udało się odczytać PDF.",
    };
  }
}
