import Link from "next/link";
import { notFound } from "next/navigation";
import { JournalDetail } from "@/components/JournalDetail";
import { EventBadge } from "@/components/stage";
import { loadData } from "@/lib/data";
import { daysBetween, fmtDate, fmtDays, journalStats, type Avg } from "@/lib/derive";

function StatCard({ label, a, hint }: { label: string; a: Avg; hint: string }) {
  return (
    <div className="rounded-lg border border-line-soft p-4">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="tabular mt-2 font-serif text-3xl font-semibold">{a.avg == null ? "—" : `${a.avg}`}<span className="ml-1 font-sans text-base font-normal text-muted">{a.avg == null ? "" : "days"}</span></p>
      <p className="tabular mt-1 text-xs text-muted">
        {a.count ? `${a.avg != null && a.avg >= 60 ? `About ${(a.avg / 30.44).toFixed(1)} months. ` : ""}Range ${a.min}–${a.max} days, from ${a.count} paper${a.count === 1 ? "" : "s"}` : hint}
      </p>
    </div>
  );
}

export default async function JournalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { journals, projects } = await loadData();
  const journal = journals.find((j) => j.id === id);
  if (!journal) notFound();
  const s = journalStats(id, projects);

  return (
    <div className="space-y-6">
      <Link href="/journals" className="link text-sm">
        Journals
      </Link>
      <JournalDetail journal={journal} used={s.submissions > 0} />

      <section className="panel">
        <div className="panel-head">
          <h2>How long it took with you</h2>
          <span className="tabular text-sm text-muted">
            {s.submissions} sent, {s.accepted} accepted, {s.rejected} rejected
            {s.acceptanceRate != null ? `, ${s.acceptanceRate}% acceptance` : ""}
          </span>
        </div>
        <div className="panel-body grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="To first decision" a={s.firstDecision} hint="Needs a revision, acceptance or rejection date." />
          <StatCard label="Submission to acceptance" a={s.toAcceptance} hint="Needs an accepted paper." />
          <StatCard label="Acceptance to publication" a={s.acceptanceToPublication} hint="Needs a published paper." />
          <StatCard label="Submission to publication" a={s.toPublication} hint="Needs a published paper." />
          <StatCard label="Submission to rejection" a={s.toRejection} hint="No rejections recorded." />
        </div>
      </section>

      <section className="panel overflow-x-auto">
        <div className="panel-head">
          <h2>Submissions</h2>
        </div>
        {s.rows.length === 0 ? (
          <p className="empty">You haven&apos;t recorded a submission to this journal yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Paper</th>
                <th>Submitted</th>
                <th>Accepted</th>
                <th>Published</th>
                <th>Status</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {s.rows.map((r) => (
                <tr key={r.submission.id}>
                  <td className="max-w-sm">
                    <Link className="link" href={`/projects/${r.projectId}`}>
                      {r.projectTitle}
                    </Link>
                    {r.submission.manuscriptId && <div className="text-xs text-muted">{r.submission.manuscriptId}</div>}
                  </td>
                  <td className="whitespace-nowrap">{fmtDate(r.submitted) || "—"}</td>
                  <td className="whitespace-nowrap">{fmtDate(r.accepted) || "—"}</td>
                  <td className="whitespace-nowrap">{fmtDate(r.published) || "—"}</td>
                  <td>
                    <EventBadge type={r.status as never} />
                  </td>
                  <td className="text-right whitespace-nowrap">
                    {fmtDays(daysBetween(r.submitted, r.published || r.rejected || r.accepted))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
