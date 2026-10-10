import { AuthorDirectory } from "@/components/AuthorDirectory";
import { loadData } from "@/lib/data";
import { projectStage } from "@/lib/derive";

export default async function AuthorsPage() {
  const { authors, projects } = await loadData();
  const counts: Record<string, { total: number; published: number }> = {};
  for (const p of projects) {
    const published = projectStage(p).stage === "published";
    for (const pa of p.authors) {
      counts[pa.authorId] ??= { total: 0, published: 0 };
      counts[pa.authorId].total++;
      if (published) counts[pa.authorId].published++;
    }
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Authors</h1>
        <p className="mt-1 text-muted">
          A shared directory. Authors you add to any paper are saved here automatically, ready to copy into the next one.
        </p>
      </div>
      <AuthorDirectory authors={authors} counts={counts} />
    </div>
  );
}
