import { useCallback, useEffect, useState } from "react";
import type { InvoiceInput, SavedInvoice } from "@/types/invoice";

const KEY = "airksef_invoices_v1";

function load(): SavedInvoice[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedInvoice[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useInvoices() {
  const [list, setList] = useState<SavedInvoice[]>([]);

  useEffect(() => {
    setList(load());
  }, []);

  const add = useCallback((data: InvoiceInput, label: string) => {
    const row: SavedInvoice = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      label,
    };
    setList((prev) => {
      const next = [row, ...prev];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setList((prev) => {
      const next = prev.filter((x) => x.id !== id);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    localStorage.setItem(KEY, JSON.stringify([]));
    setList([]);
  }, []);

  return { list, add, remove, clear };
}
