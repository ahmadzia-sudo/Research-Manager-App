"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { affiliationText, authorBlocks, authorName } from "@/lib/derive";
import type { Author, ProjectAuthor } from "@/lib/types";
import { CREDIT_ROLES } from "@/lib/types";
import { AuthorCombobox } from "../AuthorCombobox";
import { AuthorForm, blankAuthor } from "../AuthorForm";
import { CopyButton, CopyIconButton, Dialog } from "../ui";
import type { SectionProps } from "./types";

const newEntry = (a: Author): ProjectAuthor => ({
  authorId: a.id,
  affiliationIds: a.affiliations[0] ? [a.affiliations[0].id] : [],
  corresponding: false,
  equalContribution: false,
  creditRoles: [],
  note: "",
});

export function AuthorsSection({ project, save, authors, setAuthors }: SectionProps) {
  const byId = useMemo(() => new Map(authors.map((a) => [a.id, a])), [authors]);
  const [pending, setPending] = useState<Author | null>(null); // author with notes, waiting for confirmation
  const [creating, setCreating] = useState<string | null>(null);
  const [editing, setEditing] = useState<Author | null>(null);
  const [openNotes, setOpenNotes] = useState<string[]>([]);
  const [openRoles, setOpenRoles] = useState<string[]>([]);
  const [exportTab, setExportTab] = useState<"plain" | "detailed" | "latex" | "emails" | "orcids" | "credit">("plain");

  const list = project.authors;
  const setList = (next: ProjectAuthor[]) => save({ authors: next });
  const update = (i: number, patch: Partial<ProjectAuthor>) => setList(list.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    setList(next);
  };
  const add = (a: Author) => {
    if (list.some((x) => x.authorId === a.id)) return;
    setList([...list, newEntry(a)]);
    setPending(null);
  };
  const pick = (a: Author) => (a.notes ? setPending(a) : add(a));
  const toggle = (arr: string[], id: string) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const blocks = useMemo(() => authorBlocks(project, authors), [project, authors]);
  const exportText = blocks[exportTab];

  return (
    <section className="panel" id="authors">
      <div className="panel-head">
        <h2>Authors</h2>
        <span className="text-sm text-muted">{list.length || "None yet"}</span>
      </div>
      <div className="panel-body space-y-4">
        {list.length > 0 && (
          <ol className="space-y-3">
            {list.map((pa, i) => {
              const a = byId.get(pa.authorId);
              const notesOpen = openNotes.includes(pa.authorId);
              const rolesOpen = openRoles.includes(pa.authorId);
              const chosenAffs = a?.affiliations.filter((x) => pa.affiliationIds.includes(x.id)) ?? [];
              return (
                <li key={pa.authorId} className="rounded-lg border border-line-soft p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="tabular mt-0.5 font-serif text-lg text-faint">{i + 1}</span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/authors/${pa.authorId}`} className="font-semibold hover:underline">
                            {authorName(a)}
                          </Link>
                          <CopyIconButton text={authorName(a)} />
                          {a?.notes && (
                            <button
                              type="button"
                              className="chip note-chip"
                              onClick={() => setOpenNotes(toggle(openNotes, pa.authorId))}
                              aria-expanded={notesOpen}
                            >
                              {notesOpen ? "Hide notes" : "Has notes"}
                            </button>
                          )}
                          {pa.corresponding && <span className="chip bg-accent-soft text-accent">Corresponding</span>}
                          {pa.equalContribution && <span className="chip bg-line-soft text-muted">Equal contribution</span>}
                        </div>
                        <div className="mt-1 space-y-0.5 text-sm text-muted">
                          {a?.email && (
                            <div className="flex items-center gap-1">
                              {a.email} <CopyIconButton text={a.email} />
                            </div>
                          )}
                          {a?.orcid && (
                            <div className="flex items-center gap-1">
                              ORCID {a.orcid} <CopyIconButton text={`https://orcid.org/${a.orcid}`} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => move(i, 1)}
                        disabled={i === list.length - 1}
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                      {a && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(a)}>
                          Edit details
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-danger"
                        onClick={() => confirm(`Remove ${authorName(a)} from this paper? They stay in the directory.`) && setList(list.filter((_, j) => j !== i))}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {notesOpen && a?.notes && <div className="note-box mt-3">{a.notes}</div>}

                  {/* affiliations for this paper */}
                  <div className="mt-3 space-y-1.5">
                    {a && a.affiliations.length > 0 ? (
                      a.affiliations.map((af) => (
                        <label key={af.id} className="flex items-start gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={pa.affiliationIds.includes(af.id)}
                            onChange={() => update(i, { affiliationIds: toggle(pa.affiliationIds, af.id) })}
                          />
                          <span className="flex-1">{affiliationText(af) || "Empty affiliation"}</span>
                          <CopyIconButton text={affiliationText(af)} />
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-faint">
                        No affiliation saved.{" "}
                        {a && (
                          <button type="button" className="link" onClick={() => setEditing(a)}>
                            Add one
                          </button>
                        )}
                      </p>
                    )}
                    {a && a.affiliations.length > 0 && chosenAffs.length === 0 && (
                      <p className="text-xs text-muted">None ticked: the main affiliation will be used.</p>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <label className="flex items-center gap-1.5">
                      <input type="checkbox" checked={pa.corresponding} onChange={(e) => update(i, { corresponding: e.target.checked })} />
                      Corresponding author
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={pa.equalContribution}
                        onChange={(e) => update(i, { equalContribution: e.target.checked })}
                      />
                      Equal contribution
                    </label>
                    <button type="button" className="link" onClick={() => setOpenRoles(toggle(openRoles, pa.authorId))}>
                      {rolesOpen ? "Hide roles" : `CRediT roles${pa.creditRoles.length ? ` (${pa.creditRoles.length})` : ""}`}
                    </button>
                  </div>
                  {rolesOpen && (
                    <div className="mt-2 grid gap-1 sm:grid-cols-2">
                      {CREDIT_ROLES.map((r) => (
                        <label key={r} className="flex items-center gap-1.5 text-sm">
                          <input
                            type="checkbox"
                            checked={pa.creditRoles.includes(r)}
                            onChange={() => update(i, { creditRoles: toggle(pa.creditRoles, r) })}
                          />
                          {r}
                        </label>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}

        {pending ? (
          <div className="space-y-2 rounded-lg border border-[#efd9a4] p-3">
            <p className="text-sm font-semibold">{authorName(pending)} has notes from their institution. Check them before adding.</p>
            <div className="note-box">{pending.notes}</div>
            <div className="flex gap-2">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => add(pending)}>
                Add to paper
              </button>
              <button type="button" className="btn btn-sm" onClick={() => setPending(null)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <AuthorCombobox
            authors={authors}
            excludeIds={list.map((x) => x.authorId)}
            onPick={pick}
            onCreate={(typed) => setCreating(typed)}
          />
        )}

        {list.length > 0 && (
          <div className="rounded-lg bg-paper p-3">
            <div className="mb-2 flex flex-wrap items-center gap-1">
              <span className="mr-2 text-sm font-semibold">Copy for the paper</span>
              {(
                [
                  ["plain", "Author block"],
                  ["detailed", "Full details"],
                  ["latex", "LaTeX"],
                  ["emails", "Emails"],
                  ["orcids", "ORCIDs"],
                  ["credit", "CRediT statement"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  className={`btn btn-sm ${exportTab === k ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setExportTab(k)}
                >
                  {label}
                </button>
              ))}
            </div>
            <pre className="max-h-64 overflow-auto rounded-md border border-line bg-surface p-3 font-sans text-sm whitespace-pre-wrap">
              {exportText || (exportTab === "credit" ? "Tick CRediT roles for each author to build this." : "Nothing to show yet.")}
            </pre>
            <div className="mt-2">
              <CopyButton text={exportText} />
            </div>
          </div>
        )}
      </div>

      <Dialog open={creating !== null} title="New author" onClose={() => setCreating(null)} wide>
        {creating !== null && (
          <AuthorForm
            initial={blankAuthor(creating.includes("@") ? { email: creating } : { fullName: creating })}
            directory={authors}
            saveLabel="Save and add to paper"
            onCancel={() => setCreating(null)}
            onUseExisting={(a) => {
              setCreating(null);
              pick(a);
            }}
            onSaved={(a) => {
              setAuthors((prev) => [...prev, a]);
              setCreating(null);
              add(a);
            }}
          />
        )}
      </Dialog>

      <Dialog open={editing !== null} title={`Edit ${authorName(editing ?? undefined)}`} onClose={() => setEditing(null)} wide>
        {editing && (
          <>
            <p className="mb-4 text-sm text-muted">Changes are saved to the directory and apply to every paper this author is on.</p>
            <AuthorForm
              initial={editing}
              directory={authors}
              onCancel={() => setEditing(null)}
              onSaved={(a) => {
                setAuthors((prev) => prev.map((x) => (x.id === a.id ? a : x)));
                setEditing(null);
              }}
            />
          </>
        )}
      </Dialog>
    </section>
  );
}
