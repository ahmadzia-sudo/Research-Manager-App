import Link from "next/link";
import { notFound } from "next/navigation";
import { StageBadge, STAGE_COLOR } from "@/components/stage";
import { loadData } from "@/lib/data";
import {
  authorName,
  daysBetween,
  fmtDate,
  journalLabel,
  latestEvent,
  PIPELINE_ORDER,
  projectStage,
  today,
} from "@/lib/derive";
import type { Stage } from "@/lib/types";
import { EVENT_LABELS, STAGE_LABELS } from "@/lib/types";

export default async function PipelinePage({ params }: { params: Promise<{ stage: string }> }) {
  const { stage } = (await params) as { stage: Stage };
  if (!PIPELINE_ORDER.includes(stage)) notFound();
  const { projects, journals, authors } = await loadData();
  const journalById = new Map(journals.map((j) => [j.id, j]));
  const authorById = new Map(authors.map((a) => [a.id, a]));

  const rows = projects
    .map((p) => ({ p, ...projectStage(p) }))
    .filter((x) => x.stage === stage)
    .map((x) => {
      const sub =
        x.submission ??
        [...x.p.submissions].sort((a, b) => (latestEvent(b)?.date ?? "").localeCompare(latestEvent(a)?.date ?? ""))[0];
      const ev = sub ? latestEvent(sub) : undefined;
      return { ...x, sub, ev, since: ev?.date || x.p.createdAt.slice(0, 10) };
    })
    .sort((a, b) => a.since.localeCompare(b.since));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="link text-sm">
          Dashboard
        </Link>
        <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold">
          <span className="h-3 w-3 rounded-full" style={{ background: STAGE_COLOR[stage] }} aria-hidden />
          {STAGE_LABELS[stage]}
        </h1>
        <p className="mt-1 text-muted">
          {rows.length} {rows.length === 1 ? "paper" : "papers"}, longest waiting first.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Other stages">
        {PIPELINE_ORDER.map((s) => (
          <Link key={s} href={`/pipeline/${s}`} className={`btn btn-sm ${s === stage ? "btn-primary" : ""}`}>
            {STAGE_LABELS[s]}
          </Link>
        ))}
      </nav>

      <div className="panel overflow-x-auto">
        {rows.length === 0 ? (
          <p className="empty">No papers are in this stage.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Paper</th>
                <th>{stage === "needs-decision" ? "Last venue" : "Journal"}</th>
                <th>Last update</th>
                <th className="text-right">Days</th>
                <th className="text-right">Open tasks</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ p, reason, sub, ev, since }) => (
                <tr key={p.id}>
                  <td className="max-w-md">
                    <Link href={`/projects/${p.id}`} className="link font-medium">
                      {p.title || "Untitled project"}
                    </Link>
                    <div className="mt-1 text-xs text-muted">
                      {p.authors.map((a) => authorName(authorById.get(a.authorId))).join(", ") || "No authors yet"}
                    </div>
                    {stage === "needs-decision" && (
                      <div className="mt-1.5">
                        <StageBadge stage="needs-decision" reason={reason} />
                      </div>
                    )}
                  </td>
                  <td className="text-sm">
                    {sub ? journalLabel(journalById.get(sub.journalId)) : <span className="text-faint">None yet</span>}
                    {sub?.manuscriptId && <div className="text-xs text-muted">{sub.manuscriptId}</div>}
                  </td>
                  <td className="text-sm whitespace-nowrap">
                    {ev ? EVENT_LABELS[ev.type] : "Created"}
                    <div className="tabular text-xs text-muted">{fmtDate(since)}</div>
                  </td>
                  <td className="tabular text-right">{daysBetween(since, today()) ?? "—"}</td>
                  <td className="tabular text-right">{p.tasks.filter((t) => t.status === "open").length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
