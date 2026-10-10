"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { fmtDays } from "@/lib/derive";
import type { Journal } from "@/lib/types";
import { JournalForm, blankJournal } from "./JournalForm";
import { Dialog } from "./ui";

type Stat = { submissions: number; toAcceptance: number | null; toPublication: number | null; acceptanceRate: number | null };

export function JournalDirectory({ journals, stats }: { journals: Journal[]; stats: Record<string, Stat> }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return [...journals]
      .filter((j) => !t || [j.name, j.alias, j.publisher, j.issnPrint, j.issnOnline].join(" ").toLowerCase().includes(t))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [journals, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input className="input max-w-sm" placeholder="Search name, alias, publisher or ISSN" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search journals" />
        <button className="btn btn-primary btn-sm ml-auto" onClick={() => setAdding(true)}>
          Add journal
        </button>
      </div>
      <div className="panel overflow-x-auto">
        {shown.length === 0 ? (
          <p className="empty">{journals.length ? "No journals match this search." : "No journals yet. Add the venues you usually submit to."}</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Journal</th>
                <th>Scopus</th>
                <th className="text-right">IF</th>
                <th className="text-right">APC</th>
                <th>Templates</th>
                <th className="text-right" title="Average days from submission to acceptance, your papers only">To acceptance</th>
                <th className="text-right" title="Average days from submission to publication, your papers only">To publication</th>
                <th className="text-right">Sent</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {shown.map((j) => {
                const s = stats[j.id];
                return (
                  <tr key={j.id}>
                    <td className="max-w-xs">
                      <Link href={`/journals/${j.id}`} className="link font-medium">
                        {j.name}
                      </Link>
                      {(j.alias || j.publisher) && <div className="text-xs text-muted">{[j.alias, j.publisher].filter(Boolean).join(", ")}</div>}
                    </td>
                    <td>{j.scopusQuartile || "—"}</td>
                    <td className="text-right">{j.impactFactor || "—"}</td>
                    <td className="text-right whitespace-nowrap">{j.apcAmount ? `${j.apcCurrency} ${j.apcAmount}` : "—"}</td>
                    <td className="text-sm whitespace-nowrap">
                      {[j.hasWordTemplate && "Word", j.hasLatexTemplate && "LaTeX"].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="text-right text-sm whitespace-nowrap">{fmtDays(s?.toAcceptance)}</td>
                    <td className="text-right text-sm whitespace-nowrap">{fmtDays(s?.toPublication)}</td>
                    <td className="text-right">{s?.submissions || 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <Dialog open={adding} title="Add journal" onClose={() => setAdding(false)} wide>
        {adding && (
          <JournalForm
            initial={blankJournal()}
            onCancel={() => setAdding(false)}
            onUseExisting={(j) => router.push(`/journals/${j.id}`)}
            onSaved={(j) => {
              setAdding(false);
              router.push(`/journals/${j.id}`);
            }}
          />
        )}
      </Dialog>
    </div>
  );
}
