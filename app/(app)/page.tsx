import Link from "next/link";
import { STAGE_COLOR, StageBadge, EventBadge } from "@/components/stage";
import { loadData } from "@/lib/data";
import {
  authorName,
  daysBetween,
  fmtDate,
  journalLabel,
  latestEvent,
  projectStage,
  sortedEvents,
  today,
} from "@/lib/derive";
import type { Stage } from "@/lib/types";
import { STAGE_LABELS } from "@/lib/types";

const TRACK: Stage[] = ["submitted", "revision", "accepted", "published"];

export default async function Dashboard() {
  const { projects, authors, journals, me } = await loadData();
  const journalById = new Map(journals.map((j) => [j.id, j]));
  const authorById = new Map(authors.map((a) => [a.id, a]));

  const staged = projects.map((p) => ({ p, ...projectStage(p) }));
  const count = (s: Stage) => staged.filter((x) => x.stage === s).length;
  const needsDecision = staged.filter((x) => x.stage === "needs-decision");

  const openTasks = projects
    .flatMap((p) => p.tasks.filter((t) => t.status === "open").map((t) => ({ t, p })))
    .sort((a, b) => (a.t.due || "9999").localeCompare(b.t.due || "9999"));

  // Author-wise counts
  const perAuthor = new Map<string, { total: number; pipeline: number; published: number; decision: number }>();
  for (const x of staged) {
    for (const pa of x.p.authors) {
      const e = perAuthor.get(pa.authorId) ?? { total: 0, pipeline: 0, published: 0, decision: 0 };
      e.total++;
      if (x.stage === "published") e.published++;
      else if (x.stage === "needs-decision") e.decision++;
      else e.pipeline++;
      perAuthor.set(pa.authorId, e);
    }
  }
  const authorRows = [...perAuthor.entries()]
    .map(([id, c]) => ({ id, name: authorName(authorById.get(id)), ...c }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  // Recent events across all papers
  const recent = projects
    .flatMap((p) =>
      p.submissions.flatMap((s) => sortedEvents(s).map((e) => ({ e, s, p })))
    )
    .filter((x) => x.e.date)
    .sort((a, b) => b.e.date.localeCompare(a.e.date))
    .slice(0, 8);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-muted">
            {projects.length} {projects.length === 1 ? "project" : "projects"} you can see, {me.displayName}.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/funding" className="btn btn-sm">
            Funding
          </Link>
          <Link href="/projects/new" className="btn btn-primary btn-sm">
            New project
          </Link>
        </div>
      </div>

      {/* Pipeline track */}
      <section aria-label="Pipeline" className="grid gap-4 lg:grid-cols-[minmax(0,13rem)_1fr]">
        <Link
          href="/pipeline/needs-decision"
          className="panel group flex flex-col justify-between p-5 hover:border-st-decision"
          style={{ borderStyle: "dashed" }}
        >
          <span className="text-sm font-semibold" style={{ color: STAGE_COLOR["needs-decision"] }}>
            Needs decision
          </span>
          <span className="tabular mt-3 font-serif text-5xl leading-none font-semibold">{count("needs-decision")}</span>
          <span className="mt-3 text-xs text-muted">Not yet submitted, or rejected / withdrawn and waiting for a new venue</span>
        </Link>
        <div className="panel relative overflow-hidden px-2 py-5 sm:px-4">
          <div className="absolute top-[3.15rem] right-[12%] left-[12%] hidden h-0.5 bg-line sm:block" aria-hidden />
          <ol className="relative grid grid-cols-2 gap-y-6 sm:grid-cols-4">
            {TRACK.map((s) => (
              <li key={s}>
                <Link href={`/pipeline/${s}`} className="group flex flex-col items-center rounded-lg px-2 py-1 text-center hover:bg-line-soft/60">
                  <span className="text-xs font-semibold" style={{ color: STAGE_COLOR[s] }}>
                    {STAGE_LABELS[s]}
                  </span>
                  <span
                    className="mt-2 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-surface"
                    style={{ borderColor: STAGE_COLOR[s] }}
                    aria-hidden
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: STAGE_COLOR[s] }} />
                  </span>
                  <span className="tabular mt-3 font-serif text-5xl leading-none font-semibold group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
                    {count(s)}
                  </span>
                  <span className="mt-1 text-xs text-muted">{count(s) === 1 ? "paper" : "papers"}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {/* Pending */}
        <section className="panel">
          <div className="panel-head">
            <h2>Pending</h2>
            <span className="text-sm text-muted">
              {needsDecision.length + openTasks.length} {needsDecision.length + openTasks.length === 1 ? "item" : "items"}
            </span>
          </div>
          {needsDecision.length === 0 && openTasks.length === 0 ? (
            <p className="empty">Nothing is waiting. Add tasks from any project page.</p>
          ) : (
            <div className="divide-y divide-line-soft">
              {needsDecision.map(({ p, reason }) => {
                const last = [...p.submissions].sort((a, b) =>
                  (latestEvent(b)?.date ?? "").localeCompare(latestEvent(a)?.date ?? "")
                )[0];
                const lastEv = last ? latestEvent(last) : undefined;
                return (
                  <Link key={p.id} href={`/projects/${p.id}`} className="block px-[18px] py-3 hover:bg-line-soft/50">
                    <div className="flex flex-wrap items-center gap-2">
                      <StageBadge stage="needs-decision" reason={reason} />
                      <span className="font-medium">{p.title || "Untitled project"}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {reason === "resubmit" && last
                        ? `${lastEv?.type === "withdrawn" ? "Withdrawn from" : "Rejected by"} ${journalLabel(journalById.get(last.journalId))}${lastEv?.date ? ` on ${fmtDate(lastEv.date)}` : ""}. Choose the next journal.`
                        : "Decide what's needed to submit: data, a target journal, or a final draft."}
                    </p>
                  </Link>
                );
              })}
              {openTasks.map(({ t, p }) => {
                const overdue = t.due && t.due < today();
                return (
                  <Link key={t.id} href={`/projects/${p.id}#tasks`} className="block px-[18px] py-3 hover:bg-line-soft/50">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium">{t.text || "Untitled task"}</span>
                      {t.due && (
                        <span className={`tabular shrink-0 text-xs ${overdue ? "font-semibold text-danger" : "text-muted"}`}>
                          {overdue ? "Overdue, " : "Due "}
                          {fmtDate(t.due)}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted">
                      {t.from ? `Waiting on ${t.from}. ` : ""}
                      {p.title || "Untitled project"}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Authors */}
        <section className="panel">
          <div className="panel-head">
            <h2>By author</h2>
            <Link href="/authors" className="link text-sm">
              Directory
            </Link>
          </div>
          {authorRows.length === 0 ? (
            <p className="empty">Add authors to a project to see their counts here.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Author</th>
                    <th className="text-right" title="Submitted, under revision or accepted">In pipeline</th>
                    <th className="text-right">Published</th>
                    <th className="text-right">All</th>
                  </tr>
                </thead>
                <tbody className="tabular">
                  {authorRows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link href={`/authors/${r.id}`} className="link">
                          {r.name}
                        </Link>
                      </td>
                      <td className="text-right">{r.pipeline}</td>
                      <td className="text-right">{r.published}</td>
                      <td className="text-right text-muted">{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Latest journal activity</h2>
        </div>
        {recent.length === 0 ? (
          <p className="empty">Submission dates, decisions and publications will show here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <tbody>
                {recent.map(({ e, s, p }) => (
                  <tr key={e.id}>
                    <td className="tabular w-32 whitespace-nowrap text-muted">{fmtDate(e.date)}</td>
                    <td className="w-40">
                      <EventBadge type={e.type} />
                    </td>
                    <td>
                      <Link href={`/projects/${p.id}`} className="link">
                        {p.title || "Untitled project"}
                      </Link>
                      <span className="text-muted"> at {journalLabel(journalById.get(s.journalId))}</span>
                    </td>
                    <td className="tabular text-right whitespace-nowrap text-xs text-muted">
                      {(() => {
                        const d = daysBetween(e.date, today());
                        return d != null && d >= 0 ? `${d} days ago` : "";
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
