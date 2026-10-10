"use client";

import { useMemo, useState } from "react";
import { authorName, fmtDate, today } from "@/lib/derive";
import { newId } from "@/lib/model";
import type { Task } from "@/lib/types";
import { EditableField } from "../ui";
import type { SectionProps } from "./types";

export function TasksSection({ project, save, authors }: SectionProps) {
  const byId = useMemo(() => new Map(authors.map((a) => [a.id, a])), [authors]);
  const [text, setText] = useState("");
  const [from, setFrom] = useState("");
  const [due, setDue] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const open = project.tasks.filter((t) => t.status === "open");
  const done = project.tasks.filter((t) => t.status === "done");
  const setTasks = (tasks: Task[]) => save({ tasks });
  const names = project.authors.map((a) => authorName(byId.get(a.authorId)));

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      await setTasks([
        ...project.tasks,
        { id: newId(), text: text.trim(), from: from.trim(), due, status: "open", createdAt: new Date().toISOString(), doneAt: "" },
      ]);
      setText("");
      setFrom("");
      setDue("");
    } finally {
      setBusy(false);
    }
  };

  const toggle = (t: Task) =>
    setTasks(
      project.tasks.map((x) =>
        x.id === t.id
          ? { ...x, status: x.status === "open" ? "done" : "open", doneAt: x.status === "open" ? new Date().toISOString() : "" }
          : x
      )
    );

  const row = (t: Task) => (
    <li key={t.id} className="group flex items-start gap-2.5 py-2">
      <input type="checkbox" className="mt-1" checked={t.status === "done"} onChange={() => toggle(t)} aria-label="Mark done" />
      <div className="min-w-0 flex-1 text-sm">
        <p className={t.status === "done" ? "text-muted line-through" : "font-medium"}>{t.text}</p>
        <p className="text-xs text-muted">
          {t.from && `From ${t.from}`}
          {t.from && t.due && ", "}
          {t.due && (
            <span className={t.status === "open" && t.due < today() ? "font-semibold text-danger" : ""}>due {fmtDate(t.due)}</span>
          )}
        </p>
      </div>
      <button
        type="button"
        className="text-xs text-faint opacity-0 group-hover:opacity-100 hover:text-danger focus:opacity-100"
        onClick={() => setTasks(project.tasks.filter((x) => x.id !== t.id))}
      >
        delete
      </button>
    </li>
  );

  return (
    <section className="panel" id="tasks">
      <div className="panel-head">
        <h2>Pending</h2>
        <span className="text-sm text-muted">{open.length} open</span>
      </div>
      <div className="panel-body space-y-3">
        {open.length > 0 ? (
          <ul className="divide-y divide-line-soft">{open.map(row)}</ul>
        ) : (
          <p className="text-sm text-muted">Nothing pending. Add what this paper is waiting for, and from whom.</p>
        )}
        <form onSubmit={add} className="space-y-2 rounded-lg bg-paper p-3">
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="What's pending, e.g. revised figures" aria-label="Task" />
          <div className="grid grid-cols-[1fr_9.5rem] gap-2">
            <input className="input" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From whom" list="task-people" aria-label="From whom" />
            <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" />
          </div>
          <datalist id="task-people">
            {names.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
          <button className="btn btn-primary btn-sm" disabled={busy || !text.trim()}>
            Add task
          </button>
        </form>
        {done.length > 0 && (
          <div>
            <button type="button" className="link text-sm" onClick={() => setShowDone(!showDone)}>
              {showDone ? "Hide" : "Show"} {done.length} done
            </button>
            {showDone && <ul className="divide-y divide-line-soft">{done.map(row)}</ul>}
          </div>
        )}
      </div>
    </section>
  );
}

export function ContributorsSection({ project, save, users, me, canManage }: SectionProps) {
  const [pick, setPick] = useState("");
  const owner = users.find((u) => u.id === project.ownerId);
  const members = project.contributorIds.map((id) => users.find((u) => u.id === id)).filter(Boolean);
  const candidates = users.filter((u) => u.id !== project.ownerId && !project.contributorIds.includes(u.id));

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Who can edit</h2>
      </div>
      <div className="panel-body space-y-3 text-sm">
        <ul className="space-y-1.5">
          <li className="flex justify-between">
            <span>
              {owner?.displayName ?? "Unknown"} <span className="text-muted">@{owner?.username}</span>
            </span>
            <span className="text-xs text-muted">Owner</span>
          </li>
          {members.map((u) => (
            <li key={u!.id} className="flex items-center justify-between">
              <span>
                {u!.displayName} <span className="text-muted">@{u!.username}</span>
              </span>
              {canManage && (
                <button
                  type="button"
                  className="text-xs text-faint hover:text-danger"
                  onClick={() => save({ contributorIds: project.contributorIds.filter((x) => x !== u!.id) })}
                >
                  remove
                </button>
              )}
            </li>
          ))}
        </ul>
        {canManage ? (
          candidates.length > 0 ? (
            <div className="flex gap-2">
              <select className="select" value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Add contributor">
                <option value="">Add a contributor</option>
                {candidates.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.displayName} (@{u.username})
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-sm"
                disabled={!pick}
                onClick={async () => {
                  await save({ contributorIds: [...project.contributorIds, pick] });
                  setPick("");
                }}
              >
                Add
              </button>
            </div>
          ) : (
            <p className="text-xs text-muted">
              {me.role === "admin" ? "Create more accounts in Settings to add contributors." : "Ask an admin to create accounts for co-authors."}
            </p>
          )
        ) : (
          <p className="text-xs text-muted">Only the owner can change who has access.</p>
        )}
      </div>
    </section>
  );
}

export function NotesSection({ project, save }: SectionProps) {
  return (
    <section className="panel">
      <div className="panel-body">
        <EditableField
          label="Project notes"
          value={project.notes}
          placeholder="Anything else: data location, Overleaf link, decisions made"
          multiline
          onSave={(v) => save({ notes: v })}
        />
      </div>
    </section>
  );
}
