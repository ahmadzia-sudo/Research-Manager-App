"use client";

import { useMemo, useState } from "react";
import { authorName, fmtDate, fundingStatementText, journalLabel, money, poolSummary, today } from "@/lib/derive";
import { newId } from "@/lib/model";
import type { Contribution, FundingStatement, Payment, PaymentKind } from "@/lib/types";
import { CopyButton, CopyIconButton, Field } from "../ui";
import type { SectionProps } from "./types";

export function FundingStatementsSection({ project, save, authors }: SectionProps) {
  const byId = useMemo(() => new Map(authors.map((a) => [a.id, a])), [authors]);
  const [draft, setDraft] = useState<FundingStatement | null>(null);
  const list = project.fundingStatements;
  const text = fundingStatementText(project, authors);
  const projectAuthors = project.authors.map((pa) => byId.get(pa.authorId)).filter(Boolean);

  const commit = async () => {
    if (!draft) return;
    const exists = list.some((x) => x.id === draft.id);
    await save({ fundingStatements: exists ? list.map((x) => (x.id === draft.id ? draft : x)) : [...list, draft] });
    setDraft(null);
  };

  return (
    <section className="panel" id="grants">
      <div className="panel-head">
        <h2>Funding statement</h2>
        {!draft && (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setDraft({ id: newId(), funder: "", grantNumber: "", recipientAuthorIds: [], declare: true, note: "" })}
          >
            Add grant
          </button>
        )}
      </div>
      <div className="panel-body space-y-4">
        {list.length > 0 && (
          <ul className="divide-y divide-line-soft rounded-lg border border-line-soft">
            {list.map((f) => (
              <li key={f.id} className={`flex flex-wrap items-start justify-between gap-2 p-3 ${f.declare ? "" : "bg-paper/70"}`}>
                <div className="min-w-0 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{f.funder || "Unnamed funder"}</span>
                    {f.grantNumber && (
                      <span className="tabular flex items-center gap-1 text-muted">
                        {f.grantNumber} <CopyIconButton text={f.grantNumber} />
                      </span>
                    )}
                    {!f.declare && <span className="chip bg-line-soft text-muted">Not printed in paper</span>}
                  </div>
                  {f.recipientAuthorIds.length > 0 && (
                    <p className="text-muted">Awarded to {f.recipientAuthorIds.map((id) => authorName(byId.get(id))).join(", ")}</p>
                  )}
                  {f.note && <p className="text-muted">{f.note}</p>}
                </div>
                <div className="flex gap-1">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDraft({ ...f })}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-danger"
                    onClick={() => confirm("Remove this grant?") && save({ fundingStatements: list.filter((x) => x.id !== f.id) })}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {draft && (
          <div className="space-y-3 rounded-lg bg-paper p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Funder">
                <input className="input" value={draft.funder} onChange={(e) => setDraft({ ...draft, funder: e.target.value })} placeholder="Higher Education Commission, Pakistan" />
              </Field>
              <Field label="Grant number">
                <input className="input" value={draft.grantNumber} onChange={(e) => setDraft({ ...draft, grantNumber: e.target.value })} />
              </Field>
            </div>
            {projectAuthors.length > 0 && (
              <div>
                <span className="field-label">Awarded to</span>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {projectAuthors.map((a) => (
                    <label key={a!.id} className="flex items-center gap-1.5 text-sm">
                      <input
                        type="checkbox"
                        checked={draft.recipientAuthorIds.includes(a!.id)}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            recipientAuthorIds: e.target.checked
                              ? [...draft.recipientAuthorIds, a!.id]
                              : draft.recipientAuthorIds.filter((x) => x !== a!.id),
                          })
                        }
                      />
                      {authorName(a!)}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.declare} onChange={(e) => setDraft({ ...draft, declare: e.target.checked })} />
              Print this grant in the paper&apos;s funding statement
            </label>
            <Field label="Note">
              <input className="input" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="e.g. funder asks for exact wording in acknowledgements" />
            </Field>
            <div className="flex gap-2">
              <button type="button" className="btn btn-primary btn-sm" onClick={commit}>
                Save grant
              </button>
              <button type="button" className="btn btn-sm" onClick={() => setDraft(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div>
          <span className="field-label">Text for the paper</span>
          <p className="rounded-md border border-line bg-surface p-3 text-sm">{text}</p>
          <div className="mt-2">
            <CopyButton text={text} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------- internal pool ------------------------- */

type ContribDraft = { id: string; authorId: string; amount: string; date: string; note: string };
type PayDraft = { id: string; kind: PaymentKind; authorId: string; submissionId: string; amount: string; date: string; note: string };

export function FundingPoolSection({ project, save, authors, journals }: SectionProps) {
  const byId = useMemo(() => new Map(authors.map((a) => [a.id, a])), [authors]);
  const journalById = useMemo(() => new Map(journals.map((j) => [j.id, j])), [journals]);
  const pool = project.pool;
  const sum = poolSummary(project);
  const cur = pool.currency;
  const [c, setC] = useState<ContribDraft | null>(null);
  const [p, setP] = useState<PayDraft | null>(null);
  const [error, setError] = useState("");

  // People you can pick: authors on this paper first, then anyone already in the pool
  const peopleIds = Array.from(
    new Set([
      ...project.authors.map((a) => a.authorId),
      ...pool.contributions.map((x) => x.authorId),
      ...pool.payments.filter((x) => x.authorId).map((x) => x.authorId),
    ])
  ).filter((id) => byId.has(id));

  const savePool = (patch: Partial<typeof pool>) => save({ pool: { ...pool, ...patch } });

  const commitC = async () => {
    if (!c) return;
    const amount = parseFloat(c.amount.replace(/,/g, ""));
    if (!c.authorId || !Number.isFinite(amount) || amount <= 0) return setError("Choose who contributed and enter an amount above zero.");
    const row: Contribution = { id: c.id, authorId: c.authorId, amount, date: c.date, note: c.note };
    const exists = pool.contributions.some((x) => x.id === c.id);
    await savePool({ contributions: exists ? pool.contributions.map((x) => (x.id === c.id ? row : x)) : [...pool.contributions, row] });
    setC(null);
    setError("");
  };

  const commitP = async () => {
    if (!p) return;
    const amount = parseFloat(p.amount.replace(/,/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) return setError("Enter an amount above zero.");
    if (p.kind === "author" && !p.authorId) return setError("Choose which author receives this payment.");
    const row: Payment = {
      id: p.id,
      kind: p.kind,
      authorId: p.kind === "author" ? p.authorId : "",
      submissionId: p.kind === "apc" ? p.submissionId : "",
      amount,
      date: p.date,
      note: p.note,
    };
    const exists = pool.payments.some((x) => x.id === p.id);
    await savePool({ payments: exists ? pool.payments.map((x) => (x.id === p.id ? row : x)) : [...pool.payments, row] });
    setP(null);
    setError("");
  };

  const kindLabel = (x: Payment) =>
    x.kind === "apc"
      ? `APC${x.submissionId ? `, ${journalLabel(journalById.get(project.submissions.find((s) => s.id === x.submissionId)?.journalId ?? ""))}` : ""}`
      : x.kind === "author"
        ? `Paid to ${authorName(byId.get(x.authorId))}`
        : "Other expense";

  const personSelect = (value: string, onChange: (v: string) => void) => (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Choose author</option>
      {peopleIds.map((id) => (
        <option key={id} value={id}>
          {authorName(byId.get(id))}
        </option>
      ))}
      <optgroup label="Everyone in the directory">
        {authors
          .filter((a) => !peopleIds.includes(a.id))
          .sort((a, b) => authorName(a).localeCompare(authorName(b)))
          .map((a) => (
            <option key={a.id} value={a.id}>
              {authorName(a)}
            </option>
          ))}
      </optgroup>
    </select>
  );

  return (
    <section className="panel border-dashed" id="pool">
      <div className="panel-head">
        <div>
          <h2>Internal funding pool</h2>
          <p className="text-xs text-muted">Only project members see this. It is never printed in the paper.</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          Currency
          <input
            className="input w-20"
            defaultValue={cur}
            onBlur={(e) => {
              const v = e.target.value.trim().toUpperCase();
              if (v && v !== cur) savePool({ currency: v });
            }}
            aria-label="Currency"
          />
        </label>
      </div>
      <div className="panel-body space-y-6">
        {/* summary */}
        <dl className="tabular grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ["Collected", sum.contributed],
            ["Paid as APC", sum.apc],
            ["Other expenses", sum.other],
            ["Paid to authors", sum.toAuthors],
            ["Balance", sum.balance],
          ].map(([label, v]) => (
            <div key={label as string} className={`rounded-lg p-3 ${label === "Balance" ? "bg-accent-soft" : "bg-paper"}`}>
              <dt className="text-xs text-muted">{label}</dt>
              <dd className={`mt-1 font-semibold ${label === "Balance" && (v as number) < 0 ? "text-danger" : ""}`}>
                {money(v as number, cur)}
              </dd>
            </div>
          ))}
        </dl>

        {/* contributions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Money in</h3>
            {!c && (
              <button type="button" className="btn btn-sm" onClick={() => setC({ id: newId(), authorId: "", amount: "", date: today(), note: "" })}>
                Add contribution
              </button>
            )}
          </div>
          {pool.contributions.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-line-soft">
              <table className="table">
                <tbody>
                  {[...pool.contributions]
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((x) => (
                      <tr key={x.id}>
                        <td className="tabular w-28 text-muted">{fmtDate(x.date)}</td>
                        <td>
                          {authorName(byId.get(x.authorId))}
                          {x.note && <div className="text-xs text-muted">{x.note}</div>}
                        </td>
                        <td className="tabular text-right font-medium">{money(x.amount, cur)}</td>
                        <td className="w-32 text-right">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setC({ id: x.id, authorId: x.authorId, amount: String(x.amount), date: x.date, note: x.note })}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm btn-danger"
                            onClick={() => confirm("Delete this contribution?") && savePool({ contributions: pool.contributions.filter((y) => y.id !== x.id) })}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
          {c && (
            <div className="grid gap-2 rounded-lg bg-paper p-3 sm:grid-cols-[1fr_8rem_9.5rem]">
              {personSelect(c.authorId, (v) => setC({ ...c, authorId: v }))}
              <input className="input" inputMode="decimal" placeholder={`Amount (${cur})`} value={c.amount} onChange={(e) => setC({ ...c, amount: e.target.value })} />
              <input className="input" type="date" value={c.date} onChange={(e) => setC({ ...c, date: e.target.value })} />
              <input className="input sm:col-span-3" placeholder="Note (optional)" value={c.note} onChange={(e) => setC({ ...c, note: e.target.value })} />
              <div className="flex gap-2 sm:col-span-3">
                <button type="button" className="btn btn-primary btn-sm" onClick={commitC}>
                  Save contribution
                </button>
                <button type="button" className="btn btn-sm" onClick={() => (setC(null), setError(""))}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* payments */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Money out</h3>
            {!p && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setP({ id: newId(), kind: "apc", authorId: "", submissionId: "", amount: "", date: today(), note: "" })}
              >
                Add payment
              </button>
            )}
          </div>
          {pool.payments.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-line-soft">
              <table className="table">
                <tbody>
                  {[...pool.payments]
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((x) => (
                      <tr key={x.id}>
                        <td className="tabular w-28 text-muted">{fmtDate(x.date)}</td>
                        <td>
                          {kindLabel(x)}
                          {x.note && <div className="text-xs text-muted">{x.note}</div>}
                        </td>
                        <td className="tabular text-right font-medium">{money(x.amount, cur)}</td>
                        <td className="w-32 text-right">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() =>
                              setP({ id: x.id, kind: x.kind, authorId: x.authorId, submissionId: x.submissionId, amount: String(x.amount), date: x.date, note: x.note })
                            }
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm btn-danger"
                            onClick={() => confirm("Delete this payment?") && savePool({ payments: pool.payments.filter((y) => y.id !== x.id) })}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
          {p && (
            <div className="grid gap-2 rounded-lg bg-paper p-3 sm:grid-cols-[11rem_1fr]">
              <select className="select" value={p.kind} onChange={(e) => setP({ ...p, kind: e.target.value as PaymentKind })} aria-label="Payment type">
                <option value="apc">APC to journal</option>
                <option value="author">Paid to an author</option>
                <option value="other">Other expense</option>
              </select>
              {p.kind === "author" ? (
                personSelect(p.authorId, (v) => setP({ ...p, authorId: v }))
              ) : p.kind === "apc" ? (
                <select className="select" value={p.submissionId} onChange={(e) => setP({ ...p, submissionId: e.target.value })} aria-label="Journal">
                  <option value="">Which submission? (optional)</option>
                  {project.submissions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {journalLabel(journalById.get(s.journalId))}
                      {s.manuscriptId ? `, ${s.manuscriptId}` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="self-center text-sm text-muted">Describe it in the note, e.g. proofreading, paid tool, dataset licence.</span>
              )}
              <input className="input" inputMode="decimal" placeholder={`Amount (${cur})`} value={p.amount} onChange={(e) => setP({ ...p, amount: e.target.value })} />
              <input className="input" type="date" value={p.date} onChange={(e) => setP({ ...p, date: e.target.value })} />
              <input
                className="input sm:col-span-2"
                placeholder={p.kind === "author" ? "Reason, e.g. extra experiments, reimbursed Overleaf subscription" : "Note (optional)"}
                value={p.note}
                onChange={(e) => setP({ ...p, note: e.target.value })}
              />
              <div className="flex gap-2 sm:col-span-2">
                <button type="button" className="btn btn-primary btn-sm" onClick={commitP}>
                  Save payment
                </button>
                <button type="button" className="btn btn-sm" onClick={() => (setP(null), setError(""))}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        {sum.perAuthor.size > 0 && (
          <div>
            <h3 className="mb-2 text-base font-semibold">Per author</h3>
            <div className="overflow-x-auto rounded-lg border border-line-soft">
              <table className="table">
                <thead>
                  <tr>
                    <th>Author</th>
                    <th className="text-right">Put in</th>
                    <th className="text-right">Received</th>
                    <th className="text-right">Net</th>
                  </tr>
                </thead>
                <tbody className="tabular">
                  {[...sum.perAuthor.entries()].map(([id, v]) => (
                    <tr key={id}>
                      <td>{authorName(byId.get(id))}</td>
                      <td className="text-right">{money(v.contributed, cur)}</td>
                      <td className="text-right">{money(v.received, cur)}</td>
                      <td className={`text-right ${v.received - v.contributed < 0 ? "text-muted" : "text-accent"}`}>
                        {money(v.received - v.contributed, cur)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
