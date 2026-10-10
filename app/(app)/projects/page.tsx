import Link from "next/link";
import { ProjectList } from "@/components/ProjectList";
import { loadData } from "@/lib/data";
import { authorName, journalLabel, projectStage } from "@/lib/derive";

export default async function ProjectsPage() {
  const { projects, authors, journals, users } = await loadData();
  const authorById = new Map(authors.map((a) => [a.id, a]));
  const journalById = new Map(journals.map((j) => [j.id, j]));
  const userById = new Map(users.map((u) => [u.id, u]));

  const rows = projects
    .map((p) => {
      const st = projectStage(p);
      return {
        id: p.id,
        title: p.title,
        keywords: p.keywords,
        stage: st.stage,
        reason: st.reason,
        journal: st.submission ? journalLabel(journalById.get(st.submission.journalId)) : "",
        authors: p.authors.map((a) => authorName(authorById.get(a.authorId))),
        owner: userById.get(p.ownerId)?.displayName ?? "",
        openTasks: p.tasks.filter((t) => t.status === "open").length,
        updatedAt: p.updatedAt,
      };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Projects</h1>
          <p className="mt-1 text-muted">Every paper you own or contribute to.</p>
        </div>
        <Link href="/projects/new" className="btn btn-primary btn-sm">
          New project
        </Link>
      </div>
      <ProjectList rows={rows} />
    </div>
  );
}
