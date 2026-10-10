import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthorDetail } from "@/components/AuthorDetail";
import { StageBadge } from "@/components/stage";
import { loadData } from "@/lib/data";
import { projectStage } from "@/lib/derive";

export default async function AuthorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { authors, projects } = await loadData();
  const author = authors.find((a) => a.id === id);
  if (!author) notFound();
  const papers = projects.filter((p) => p.authors.some((a) => a.authorId === id));

  return (
    <div className="space-y-6">
      <Link href="/authors" className="link text-sm">
        Authors
      </Link>
      <AuthorDetail author={author} directory={authors} paperCount={papers.length} />
      <section className="panel">
        <div className="panel-head">
          <h2>Papers</h2>
          <span className="text-sm text-muted">{papers.length}</span>
        </div>
        {papers.length === 0 ? (
          <p className="empty">Not on any paper you can see.</p>
        ) : (
          <ul className="divide-y divide-line-soft">
            {papers.map((p) => {
              const st = projectStage(p);
              const pos = p.authors.findIndex((a) => a.authorId === id) + 1;
              const pa = p.authors[pos - 1];
              return (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-[18px] py-3">
                  <div>
                    <Link href={`/projects/${p.id}`} className="link font-medium">
                      {p.title || "Untitled project"}
                    </Link>
                    <p className="text-xs text-muted">
                      Author {pos} of {p.authors.length}
                      {pa?.corresponding ? ", corresponding" : ""}
                    </p>
                  </div>
                  <StageBadge stage={st.stage} reason={st.reason} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
