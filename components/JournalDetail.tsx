"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
import type { Journal } from "@/lib/types";
import { JournalForm } from "./JournalForm";
import { CopyIconButton, ErrorText } from "./ui";

function Item({ label, value, href }: { label: string; value: string; href?: string }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[8.5rem_1fr_auto] items-start gap-2 py-1.5 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words">
        {href ? (
          <a className="link" href={href} target="_blank" rel="noreferrer">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
      <CopyIconButton text={value} />
    </div>
  );
}

export function JournalDetail({ journal: initial, used }: { journal: Journal; used: boolean }) {
  const router = useRouter();
  const [j, setJ] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  if (editing)
    return (
      <div className="panel panel-body">
        <h1 className="mb-4 text-2xl font-semibold">Edit {j.name}</h1>
        <JournalForm
          initial={j}
          onCancel={() => setEditing(false)}
          onSaved={(x) => {
            setJ(x);
            setEditing(false);
            router.refresh();
          }}
        />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{j.name}</h1>
          <p className="mt-1 text-muted">{[j.alias, j.publisher].filter(Boolean).join(", ")}</p>
        </div>
        <div className="flex gap-2">
          {j.submissionUrl && (
            <a className="btn btn-sm btn-primary" href={j.submissionUrl} target="_blank" rel="noreferrer">
              Open submission system
            </a>
          )}
          <button className="btn btn-sm" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button
            className="btn btn-sm btn-danger"
            onClick={async () => {
              if (used) return setError("This journal is in the history of a paper, so it stays in the directory.");
              if (!confirm(`Delete ${j.name}?`)) return;
              try {
                await api(`/api/journals/${j.id}`, "DELETE");
                router.push("/journals");
                router.refresh();
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Delete
          </button>
        </div>
      </div>
      <ErrorText>{error}</ErrorText>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="panel">
          <div className="panel-head">
            <h2>Indexing</h2>
          </div>
          <dl className="panel-body divide-y divide-line-soft">
            <Item label="Scopus quartile" value={j.scopusQuartile} />
            <Item label="JCR quartile" value={j.jcrQuartile} />
            <Item label="Impact factor" value={j.impactFactor} />
            <Item label="CiteScore" value={j.citeScore} />
            <Item label="ISSN (print)" value={j.issnPrint} />
            <Item label="ISSN (online)" value={j.issnOnline} />
            {!j.scopusQuartile && !j.impactFactor && !j.issnPrint && !j.issnOnline && <p className="text-sm text-muted">Nothing saved yet.</p>}
          </dl>
        </section>
        <section className="panel">
          <div className="panel-head">
            <h2>Charges</h2>
          </div>
          <div className="panel-body space-y-2 text-sm">
            <p>
              <span className="text-muted">APC </span>
              <span className="tabular font-semibold">{j.apcAmount ? `${j.apcCurrency} ${j.apcAmount}` : "Not recorded"}</span>
            </p>
            {j.extraCharges.map((c) => (
              <p key={c.id}>
                <span className="text-muted">{c.label} </span>
                <span className="tabular font-semibold">
                  {j.apcCurrency} {c.amount}
                </span>
              </p>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <h2>Links and templates</h2>
          </div>
          <dl className="panel-body divide-y divide-line-soft">
            <Item label="Website" value={j.url} href={j.url || undefined} />
            <Item label="SCImago" value={j.scimagoUrl} href={j.scimagoUrl || undefined} />
            <Item label="Submission" value={j.submissionUrl} href={j.submissionUrl || undefined} />
            <div className="py-1.5 text-sm">
              <span className="text-muted">Templates: </span>
              {!j.hasWordTemplate && !j.hasLatexTemplate && "none recorded"}
              {j.hasWordTemplate &&
                (j.wordTemplateUrl ? (
                  <a className="link" href={j.wordTemplateUrl} target="_blank" rel="noreferrer">
                    Word
                  </a>
                ) : (
                  "Word"
                ))}
              {j.hasWordTemplate && j.hasLatexTemplate && ", "}
              {j.hasLatexTemplate &&
                (j.latexTemplateUrl ? (
                  <a className="link" href={j.latexTemplateUrl} target="_blank" rel="noreferrer">
                    LaTeX
                  </a>
                ) : (
                  "LaTeX"
                ))}
            </div>
          </dl>
        </section>
      </div>
      {j.notes && (
        <section className="panel panel-body">
          <h2 className="mb-2 text-lg font-semibold">Notes</h2>
          <p className="text-sm whitespace-pre-wrap">{j.notes}</p>
        </section>
      )}
    </div>
  );
}
