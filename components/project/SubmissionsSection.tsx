"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  activeSubmission,
  daysBetween,
  fmtDate,
  journalLabel,
  latestEvent,
  sortedEvents,
  sortedSubmissions,
  submissionStage,
  submissionStartDate,
  today,
} from "@/lib/derive";
import { newId } from "@/lib/model";
import type { EventType, Journal, Submission } from "@/lib/types";
import { EVENT_LABELS } from "@/lib/types";
import { JournalForm, blankJournal } from "../JournalForm";
import { EventBadge, StageBadge } from "../stage";
import { CopyIconButton, Dialog, ErrorText, Field } from "../ui";
import type { SectionProps } from "./types";

const NEXT_STEP: Partial<Record<EventType, EventType>> = {
  submitted: "under_review",
  under_review: "revision_requested",
  revision_requested: "revision_submitted",
  revision_submitted: "accepted",
  accepted: "published",
};

export function SubmissionsSection({ project, save, journals, setJournals }: SectionProps) {
  const journalById = useMemo(() => new Map(journals.map((j) => [j.id, j])), [journals]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Submission | null>(null);
  const subs = sortedSubmissions(project);
  const active = activeSubmission(project);

  const setSubs = (next: Submission[]) => save({ submissions: next });
  const updateSub = (id: string, patch: Partial<Submission>) =>
    setSubs(project.submissions.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  return (
    <section className="panel" id="venues">
      <div className="panel-head">
        <h2>Journal history</h2>
        <button type="button" className="btn btn-sm" onClick={() => setAdding(true)}>
          New submission
        </button>
      </div>
      <div className="panel-body space-y-4">
        {subs.length === 0 && (
          <p className="text-sm text-muted">
            Not submitted anywhere yet. When you submit, record it here; rejections and withdrawals stay in the history and
            the paper moves to “Needs a new venue”.
          </p>
        )}
        {subs.map((s) => {
          const j = journalById.get(s.journalId);
          const stage = submissionStage(s);
          const events = sortedEvents(s);
          const start = submissionStartDate(s);
          const end = latestEvent(s)?.date;
          return (
            <article key={s.id} className={`rounded-lg border p-4 ${stage === "closed" ? "border-line-soft bg-paper/60" : "border-line"}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link href={`/journals/${s.journalId}`} className="font-serif text-lg font-semibold hover:underline">
                    {journalLabel(j)}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                    {stage === "closed" ? (
                      <EventBadge type={latestEvent(s)!.type} />
                    ) : (
                      <StageBadge stage={stage} />
                    )}
                    {s.manuscriptId && (
                      <span className="flex items-center gap-1">
                        Manuscript {s.manuscriptId} <CopyIconButton text={s.manuscriptId} />
                      </span>
                    )}
                    {start && end && start !== end && (
                      <span className="tabular">{daysBetween(start, end)} days so far</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(s)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-danger"
                    onClick={() =>
                      confirm("Delete this submission and its timeline? Use “Rejected” or “Withdrawn” instead to keep the history.") &&
                      setSubs(project.submissions.filter((x) => x.id !== s.id))
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>

              {(s.doi || s.articleUrl || s.notes) && (
                <div className="mt-2 space-y-1 text-sm">
                  {s.doi && (
                    <div className="flex items-center gap-1">
                      DOI{" "}
                      <a className="link" href={`https://doi.org/${s.doi}`} target="_blank" rel="noreferrer">
                        {s.doi}
                      </a>
                      <CopyIconButton text={s.doi} />
                    </div>
                  )}
                  {s.articleUrl && (
                    <a className="link block truncate" href={s.articleUrl} target="_blank" rel="noreferrer">
                      {s.articleUrl}
                    </a>
                  )}
                  {s.notes && <p className="whitespace-pre-wrap text-muted">{s.notes}</p>}
                </div>
              )}

              <ol className="mt-3 space-y-2 border-l-2 border-line-soft pl-4">
                {events.map((e) => (
                  <li key={e.id} className="group relative text-sm">
                    <span className="absolute top-1.5 -left-[1.4rem] h-2.5 w-2.5 rounded-full border-2 border-surface bg-line" aria-hidden />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="tabular w-24 text-muted">{e.date ? fmtDate(e.date) : "No date"}</span>
                      <EventBadge type={e.type} />
                      {e.note && <span className="text-muted">{e.note}</span>}
                      <button
                        type="button"
                        className="text-xs text-faint opacity-0 group-hover:opacity-100 hover:text-danger focus:opacity-100"
                        onClick={() => updateSub(s.id, { events: s.events.filter((x) => x.id !== e.id) })}
                      >
                        remove
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
              <AddEvent
                suggested={NEXT_STEP[latestEvent(s)?.type ?? "submitted"] ?? "submitted"}
                onAdd={(type, date, note) => updateSub(s.id, { events: [...s.events, { id: newId(), type, date, note }] })}
              />
            </article>
          );
        })}
      </div>

      <Dialog open={adding} title="New submission" onClose={() => setAdding(false)} wide>
        {adding && (
          <NewSubmission
            journals={journals}
            activeLabel={active ? journalLabel(journalById.get(active.journalId)) : ""}
            onJournalCreated={(j) => setJournals((prev) => [...prev, j])}
            onCancel={() => setAdding(false)}
            onCreate={async (sub) => {
              await setSubs([...project.submissions, sub]);
              setAdding(false);
            }}
          />
        )}
      </Dialog>

      <Dialog open={editing !== null} title="Submission details" onClose={() => setEditing(null)}>
        {editing && (
          <EditSubmission
            sub={editing}
            journals={journals}
            onCancel={() => setEditing(null)}
            onSave={async (patch) => {
              await updateSub(editing.id, patch);
              setEditing(null);
            }}
          />
        )}
      </Dialog>
    </section>
  );
}

function AddEvent({ suggested, onAdd }: { suggested: EventType; onAdd: (t: EventType, d: string, n: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<EventType>(suggested);
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  if (!open)
    return (
      <button
        type="button"
        className="btn btn-sm mt-3"
        onClick={() => {
          setType(suggested);
          setDate(today());
          setNote("");
          setOpen(true);
        }}
      >
        Add update
      </button>
    );
  return (
    <div className="mt-3 grid gap-2 rounded-md bg-paper p-3 sm:grid-cols-[11rem_9.5rem_1fr_auto]">
      <select className="select" value={type} onChange={(e) => setType(e.target.value as EventType)} aria-label="What happened">
        {(Object.keys(EVENT_LABELS) as EventType[]).map((t) => (
          <option key={t} value={t}>
            {EVENT_LABELS[t]}
          </option>
        ))}
      </select>
      <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
      <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" aria-label="Note" />
      <div className="flex gap-1">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onAdd(type, date, note);
              setOpen(false);
            } finally {
              setBusy(false);
            }
          }}
        >
          Add
        </button>
        <button type="button" className="btn btn-sm" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function NewSubmission({
  journals,
  activeLabel,
  onJournalCreated,
  onCreate,
  onCancel,
}: {
  journals: Journal[];
  activeLabel: string;
  onJournalCreated: (j: Journal) => void;
  onCreate: (s: Submission) => Promise<void>;
  onCancel: () => void;
}) {
  const [journalId, setJournalId] = useState("");
  const [newJournal, setNewJournal] = useState(journals.length === 0);
  const [manuscriptId, setManuscriptId] = useState("");
  const [date, setDate] = useState(today());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const sorted = [...journals].sort((a, b) => a.name.localeCompare(b.name));
  const chosen = journals.find((j) => j.id === journalId);

  if (newJournal)
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">Add the journal to your directory first. Only the name is required.</p>
        <JournalForm
          initial={blankJournal()}
          onCancel={() => (journals.length ? setNewJournal(false) : onCancel())}
          onUseExisting={(j) => {
            setJournalId(j.id);
            setNewJournal(false);
          }}
          onSaved={(j) => {
            onJournalCreated(j);
            setJournalId(j.id);
            setNewJournal(false);
          }}
        />
      </div>
    );

  return (
    <div className="space-y-4">
      {activeLabel && (
        <div className="note-box">
          This paper is still active at {activeLabel}. Usually you would add “Rejected” or “Withdrawn” there first.
        </div>
      )}
      <Field label="Journal">
        <div className="flex gap-2">
          <select className="select" value={journalId} onChange={(e) => setJournalId(e.target.value)}>
            <option value="">Choose a journal</option>
            {sorted.map((j) => (
              <option key={j.id} value={j.id}>
                {journalLabel(j)}
                {j.scopusQuartile ? `, ${j.scopusQuartile}` : ""}
              </option>
            ))}
          </select>
          <button type="button" className="btn" onClick={() => setNewJournal(true)}>
            New journal
          </button>
        </div>
      </Field>
      {chosen && (chosen.apcAmount || chosen.hasWordTemplate || chosen.hasLatexTemplate || chosen.notes) && (
        <div className="space-y-1 rounded-md bg-paper p-3 text-sm">
          {chosen.apcAmount && (
            <p>
              APC: {chosen.apcCurrency} {chosen.apcAmount}
              {chosen.extraCharges.length > 0 && `, plus ${chosen.extraCharges.map((c) => `${c.label} ${c.amount}`).join(", ")}`}
            </p>
          )}
          {(chosen.hasWordTemplate || chosen.hasLatexTemplate) && (
            <p>
              Templates:{" "}
              {chosen.hasWordTemplate &&
                (chosen.wordTemplateUrl ? (
                  <a className="link" href={chosen.wordTemplateUrl} target="_blank" rel="noreferrer">
                    Word
                  </a>
                ) : (
                  "Word"
                ))}
              {chosen.hasWordTemplate && chosen.hasLatexTemplate && ", "}
              {chosen.hasLatexTemplate &&
                (chosen.latexTemplateUrl ? (
                  <a className="link" href={chosen.latexTemplateUrl} target="_blank" rel="noreferrer">
                    LaTeX
                  </a>
                ) : (
                  "LaTeX"
                ))}
            </p>
          )}
          {chosen.notes && <p className="whitespace-pre-wrap text-muted">{chosen.notes}</p>}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Manuscript ID">
          <input className="input" value={manuscriptId} onChange={(e) => setManuscriptId(e.target.value)} placeholder="Optional" />
        </Field>
        <Field label="Date submitted">
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy}
          onClick={async () => {
            if (!journalId) return setError("Choose a journal or add a new one.");
            setBusy(true);
            setError("");
            try {
              await onCreate({
                id: newId(),
                journalId,
                manuscriptId,
                doi: "",
                articleUrl: "",
                notes: "",
                events: [{ id: newId(), type: "submitted", date, note: "" }],
                createdAt: new Date().toISOString(),
              });
            } catch (e) {
              setError((e as Error).message);
              setBusy(false);
            }
          }}
        >
          {busy ? "Saving…" : "Record submission"}
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function EditSubmission({
  sub,
  journals,
  onSave,
  onCancel,
}: {
  sub: Submission;
  journals: Journal[];
  onSave: (p: Partial<Submission>) => Promise<void>;
  onCancel: () => void;
}) {
  const [d, setD] = useState({
    journalId: sub.journalId,
    manuscriptId: sub.manuscriptId,
    doi: sub.doi,
    articleUrl: sub.articleUrl,
    notes: sub.notes,
  });
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-3">
      <Field label="Journal">
        <select className="select" value={d.journalId} onChange={(e) => setD({ ...d, journalId: e.target.value })}>
          {[...journals]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((j) => (
              <option key={j.id} value={j.id}>
                {journalLabel(j)}
              </option>
            ))}
        </select>
      </Field>
      <Field label="Manuscript ID">
        <input className="input" value={d.manuscriptId} onChange={(e) => setD({ ...d, manuscriptId: e.target.value })} />
      </Field>
      <Field label="DOI (after publication)">
        <input className="input" value={d.doi} onChange={(e) => setD({ ...d, doi: e.target.value.replace(/^https?:\/\/(dx\.)?doi\.org\//, "") })} placeholder="10.1016/j.eswa.2026.123456" />
      </Field>
      <Field label="Article link">
        <input className="input" value={d.articleUrl} onChange={(e) => setD({ ...d, articleUrl: e.target.value })} />
      </Field>
      <Field label="Notes">
        <textarea className="textarea" value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} />
      </Field>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onSave(d);
            } finally {
              setBusy(false);
            }
          }}
        >
          Save
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
