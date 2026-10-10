"use client";

import { useState } from "react";
import { api } from "@/lib/client";
import { newId } from "@/lib/model";
import type { Journal } from "@/lib/types";
import { ErrorText, Field } from "./ui";

type Draft = Omit<Journal, "id" | "createdAt" | "updatedAt" | "createdBy"> & { id?: string };

export function blankJournal(seed: Partial<Journal> = {}): Draft {
  return {
    name: "",
    alias: "",
    publisher: "",
    issnPrint: "",
    issnOnline: "",
    scopusQuartile: "",
    jcrQuartile: "",
    impactFactor: "",
    citeScore: "",
    url: "",
    scimagoUrl: "",
    submissionUrl: "",
    apcAmount: "",
    apcCurrency: "USD",
    extraCharges: [],
    hasWordTemplate: false,
    hasLatexTemplate: false,
    wordTemplateUrl: "",
    latexTemplateUrl: "",
    notes: "",
    ...seed,
  };
}

const QUARTILES = ["", "Q1", "Q2", "Q3", "Q4", "Not indexed"];

export function JournalForm({
  initial,
  onSaved,
  onCancel,
  onUseExisting,
}: {
  initial: Draft;
  onSaved: (j: Journal) => void;
  onCancel: () => void;
  onUseExisting?: (j: Journal) => void;
}) {
  const [d, setD] = useState<Draft>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [existing, setExisting] = useState<Journal | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = { ...d, extraCharges: d.extraCharges.filter((c) => c.label || c.amount) };
      const saved = d.id
        ? await api<Journal>(`/api/journals/${d.id}`, "PATCH", payload)
        : await api<Journal>("/api/journals", "POST", payload);
      onSaved(saved);
    } catch (err) {
      const ex = (err as Error & { data?: { existing?: Journal } }).data?.existing;
      if (ex) setExisting(ex);
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <fieldset className="space-y-3">
        <legend className="mb-2 font-serif text-base font-semibold">Journal</legend>
        <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
          <Field label="Journal name (required)">
            <input className="input" required value={d.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Alias / short name">
            <input className="input" value={d.alias} onChange={(e) => set("alias", e.target.value)} placeholder="ESWA" />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Publisher">
            <input className="input" value={d.publisher} onChange={(e) => set("publisher", e.target.value)} />
          </Field>
          <Field label="ISSN (print)">
            <input className="input" value={d.issnPrint} onChange={(e) => set("issnPrint", e.target.value)} />
          </Field>
          <Field label="ISSN (online)">
            <input className="input" value={d.issnOnline} onChange={(e) => set("issnOnline", e.target.value)} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 font-serif text-base font-semibold">Ranking</legend>
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Scopus quartile">
            <select className="select" value={d.scopusQuartile} onChange={(e) => set("scopusQuartile", e.target.value)}>
              {QUARTILES.map((q) => (
                <option key={q} value={q}>
                  {q || "Unknown"}
                </option>
              ))}
            </select>
          </Field>
          <Field label="JCR / WoS quartile">
            <select className="select" value={d.jcrQuartile} onChange={(e) => set("jcrQuartile", e.target.value)}>
              {QUARTILES.map((q) => (
                <option key={q} value={q}>
                  {q || "Unknown"}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Impact factor">
            <input className="input" value={d.impactFactor} onChange={(e) => set("impactFactor", e.target.value)} />
          </Field>
          <Field label="CiteScore">
            <input className="input" value={d.citeScore} onChange={(e) => set("citeScore", e.target.value)} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 font-serif text-base font-semibold">Links</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Journal website">
            <input className="input" value={d.url} onChange={(e) => set("url", e.target.value)} placeholder="https://" />
          </Field>
          <Field label="SCImago page">
            <input className="input" value={d.scimagoUrl} onChange={(e) => set("scimagoUrl", e.target.value)} placeholder="https://www.scimagojr.com/…" />
          </Field>
          <Field label="Submission system">
            <input className="input" value={d.submissionUrl} onChange={(e) => set("submissionUrl", e.target.value)} placeholder="https://" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 font-serif text-base font-semibold">Templates</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={d.hasWordTemplate} onChange={(e) => set("hasWordTemplate", e.target.checked)} />
              Has a Word template
            </label>
            <input
              className="input"
              value={d.wordTemplateUrl}
              onChange={(e) => set("wordTemplateUrl", e.target.value)}
              placeholder="Word template link"
              disabled={!d.hasWordTemplate}
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={d.hasLatexTemplate} onChange={(e) => set("hasLatexTemplate", e.target.checked)} />
              Has a LaTeX template
            </label>
            <input
              className="input"
              value={d.latexTemplateUrl}
              onChange={(e) => set("latexTemplateUrl", e.target.value)}
              placeholder="LaTeX template or Overleaf link"
              disabled={!d.hasLatexTemplate}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 font-serif text-base font-semibold">Charges</legend>
        <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
          <Field label="APC amount">
            <input className="input" value={d.apcAmount} onChange={(e) => set("apcAmount", e.target.value)} placeholder="2,500 (blank if free)" />
          </Field>
          <Field label="Currency">
            <input className="input" value={d.apcCurrency} onChange={(e) => set("apcCurrency", e.target.value.toUpperCase())} />
          </Field>
        </div>
        {d.extraCharges.map((c, i) => (
          <div key={c.id} className="grid gap-2 sm:grid-cols-[1fr_9rem_auto]">
            <input
              className="input"
              value={c.label}
              placeholder="Charge (e.g. colour figures, page over limit, submission fee)"
              onChange={(e) => set("extraCharges", d.extraCharges.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
            />
            <input
              className="input"
              value={c.amount}
              placeholder="Amount"
              onChange={(e) => set("extraCharges", d.extraCharges.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))}
            />
            <button type="button" className="btn btn-ghost btn-sm btn-danger" onClick={() => set("extraCharges", d.extraCharges.filter((_, j) => j !== i))}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-sm" onClick={() => set("extraCharges", [...d.extraCharges, { id: newId(), label: "", amount: "" }])}>
          Add another charge
        </button>
      </fieldset>

      <fieldset>
        <legend className="mb-2 font-serif text-base font-semibold">Notes</legend>
        <textarea
          className="textarea"
          rows={4}
          value={d.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="What the journal says about review time, word limits, reference style, anything worth remembering"
        />
      </fieldset>

      {error && (
        <div className="space-y-2">
          <ErrorText>{error}</ErrorText>
          {existing && onUseExisting && (
            <button type="button" className="btn btn-sm" onClick={() => onUseExisting(existing)}>
              Use the saved {existing.name}
            </button>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Saving…" : d.id ? "Save journal" : "Add journal"}
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
