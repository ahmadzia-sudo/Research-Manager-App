"use client";

import { useMemo, useState } from "react";
import { api } from "@/lib/client";
import { authorName, primaryAffiliation, searchAuthors } from "@/lib/derive";
import { newId } from "@/lib/model";
import type { Affiliation, Author } from "@/lib/types";
import { ErrorText, Field } from "./ui";

type Draft = Omit<Author, "id" | "createdAt" | "updatedAt" | "createdBy"> & { id?: string };

const emptyAff = (): Affiliation => ({ id: newId(), department: "", institution: "", city: "", postalCode: "", country: "" });

export function blankAuthor(seed: Partial<Author> = {}): Draft {
  return {
    fullName: "",
    givenName: "",
    familyName: "",
    title: "",
    designation: "",
    email: "",
    altEmail: "",
    orcid: "",
    phone: "",
    scopusId: "",
    googleScholar: "",
    website: "",
    affiliations: [emptyAff()],
    notes: "",
    ...seed,
  };
}

export function AuthorForm({
  initial,
  directory,
  onSaved,
  onCancel,
  onUseExisting,
  saveLabel,
}: {
  initial: Draft;
  directory: Author[];
  onSaved: (a: Author) => void;
  onCancel: () => void;
  onUseExisting?: (a: Author) => void;
  saveLabel?: string;
}) {
  const [d, setD] = useState<Draft>(() => ({
    ...initial,
    affiliations: initial.affiliations.length ? initial.affiliations : [emptyAff()],
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [existing, setExisting] = useState<Author | null>(null);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const setAff = (i: number, k: keyof Affiliation, v: string) =>
    setD((x) => ({ ...x, affiliations: x.affiliations.map((a, j) => (j === i ? { ...a, [k]: v } : a)) }));

  // Warn about likely duplicates while creating a new author
  const similar = useMemo(() => {
    if (d.id) return [];
    const byName = d.fullName.trim().length >= 3 ? searchAuthors(directory, d.fullName, 3) : [];
    const byEmail = d.email.includes("@") ? searchAuthors(directory, d.email, 2) : [];
    const seen = new Set<string>();
    return [...byEmail, ...byName].filter((x) => !seen.has(x.a.id) && seen.add(x.a.id)).slice(0, 3);
  }, [d.fullName, d.email, d.id, directory]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setExisting(null);
    const payload = {
      ...d,
      affiliations: d.affiliations.filter((a) => a.department || a.institution || a.city || a.country || a.postalCode),
    };
    try {
      const saved = d.id
        ? await api<Author>(`/api/authors/${d.id}`, "PATCH", payload)
        : await api<Author>("/api/authors", "POST", payload);
      onSaved(saved);
    } catch (err) {
      const ex = (err as Error & { data?: { existing?: Author } }).data?.existing;
      if (ex) setExisting(ex);
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <fieldset className="space-y-3">
        <legend className="mb-2 font-serif text-base font-semibold">Name</legend>
        <div className="grid gap-3 sm:grid-cols-[6rem_1fr]">
          <Field label="Title">
            <input className="input" value={d.title} onChange={(e) => set("title", e.target.value)} placeholder="Dr." list="author-titles" />
            <datalist id="author-titles">
              <option value="Dr." />
              <option value="Prof." />
              <option value="Mr." />
              <option value="Ms." />
              <option value="Engr." />
            </datalist>
          </Field>
          <Field label="Full name, as printed on papers">
            <input className="input" value={d.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Muhammad Ahmad Zia" />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Given name(s)">
            <input className="input" value={d.givenName} onChange={(e) => set("givenName", e.target.value)} />
          </Field>
          <Field label="Family name">
            <input className="input" value={d.familyName} onChange={(e) => set("familyName", e.target.value)} />
          </Field>
          <Field label="Designation">
            <input className="input" value={d.designation} onChange={(e) => set("designation", e.target.value)} placeholder="Lecturer" />
          </Field>
        </div>
        {similar.length > 0 && (
          <div className="note-box">
            Already in the directory and similar:{" "}
            {similar.map((x, i) => (
              <span key={x.a.id}>
                {i > 0 && ", "}
                {onUseExisting ? (
                  <button type="button" className="link font-semibold" onClick={() => onUseExisting(x.a)}>
                    {authorName(x.a)}
                  </button>
                ) : (
                  <strong>{authorName(x.a)}</strong>
                )}
                {x.a.email ? ` (${x.a.email})` : ""}
              </span>
            ))}
            {onUseExisting ? ". Click a name to use it instead." : "."}
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 font-serif text-base font-semibold">Contact and identifiers</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Email">
            <input className="input" type="email" value={d.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Second email">
            <input className="input" type="email" value={d.altEmail} onChange={(e) => set("altEmail", e.target.value)} />
          </Field>
          <Field label="ORCID">
            <input className="input" value={d.orcid} onChange={(e) => set("orcid", e.target.value)} placeholder="0000-0002-3208-6246" />
          </Field>
          <Field label="Phone">
            <input className="input" value={d.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="Scopus Author ID">
            <input className="input" value={d.scopusId} onChange={(e) => set("scopusId", e.target.value)} />
          </Field>
          <Field label="Google Scholar link">
            <input className="input" value={d.googleScholar} onChange={(e) => set("googleScholar", e.target.value)} />
          </Field>
          <Field label="Website" className="sm:col-span-2">
            <input className="input" value={d.website} onChange={(e) => set("website", e.target.value)} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 font-serif text-base font-semibold">Affiliations</legend>
        {d.affiliations.map((a, i) => (
          <div key={a.id} className="space-y-3 rounded-lg border border-line-soft p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted">{i === 0 ? "Main affiliation" : `Affiliation ${i + 1}`}</span>
              {d.affiliations.length > 1 && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-danger"
                  onClick={() => set("affiliations", d.affiliations.filter((_, j) => j !== i))}
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Department">
                <input className="input" value={a.department} onChange={(e) => setAff(i, "department", e.target.value)} placeholder="Department of Computer Science & IT" />
              </Field>
              <Field label="Institution">
                <input className="input" value={a.institution} onChange={(e) => setAff(i, "institution", e.target.value)} placeholder="The University of Lahore" />
              </Field>
              <Field label="City">
                <input className="input" value={a.city} onChange={(e) => setAff(i, "city", e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Postal code">
                  <input className="input" value={a.postalCode} onChange={(e) => setAff(i, "postalCode", e.target.value)} />
                </Field>
                <Field label="Country">
                  <input className="input" value={a.country} onChange={(e) => setAff(i, "country", e.target.value)} />
                </Field>
              </div>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-sm" onClick={() => set("affiliations", [...d.affiliations, emptyAff()])}>
          Add another affiliation
        </button>
      </fieldset>

      <fieldset>
        <legend className="mb-2 font-serif text-base font-semibold">Institution requirements and notes</legend>
        <textarea
          className="textarea"
          rows={4}
          value={d.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="e.g. University requires its name exactly as 'COMSATS University Islamabad, Wah Campus'. Must be corresponding author on HEC-funded work."
        />
        <p className="mt-1 text-xs text-muted">These notes are highlighted whenever this author is added to a paper.</p>
      </fieldset>

      {error && (
        <div className="space-y-2">
          <ErrorText>{error}</ErrorText>
          {existing && onUseExisting && (
            <button type="button" className="btn btn-sm" onClick={() => onUseExisting(existing)}>
              Use {authorName(existing)} ({primaryAffiliation(existing) || existing.email}) instead
            </button>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Saving…" : saveLabel ?? (d.id ? "Save author" : "Add to directory")}
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
