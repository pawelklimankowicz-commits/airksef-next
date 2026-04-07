"use client";

import { useState } from "react";

import { submitXmlToKsefAction } from "@/actions/ksef-submit";

export function KsefClient() {
  const [xml, setXml] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function send() {
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      const r = await submitXmlToKsefAction(xml);
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      setMsg(
        `${r.mode === "mock" ? "[Tryb testowy] " : ""}${r.message}${r.reference ? ` · Ref: ${r.reference}` : ""}`,
      );
    } catch {
      setErr("Nie udało się wysłać.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm text-muted-foreground">Wklej wygenerowany XML FA (3)</span>
        <textarea
          className="mt-2 h-64 w-full rounded-lg border border-border bg-card p-3 font-mono text-xs text-foreground"
          value={xml}
          onChange={(e) => setXml(e.target.value)}
          spellCheck={false}
          placeholder="Wklej zawartość pliku .xml z generatora…"
        />
      </label>
      {err && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
          {err}
        </div>
      )}
      {msg && (
        <div className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-foreground">
          {msg}
        </div>
      )}
      <button
        type="button"
        disabled={loading || !xml.trim()}
        onClick={() => void send()}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {loading ? "Wysyłanie…" : "Wyślij do KSeF"}
      </button>
    </div>
  );
}
