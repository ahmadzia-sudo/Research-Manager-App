import { JournalDirectory } from "@/components/JournalDirectory";
import { loadData } from "@/lib/data";
import { journalStats } from "@/lib/derive";

export default async function JournalsPage() {
  const { journals, projects } = await loadData();
  const stats = Object.fromEntries(
    journals.map((j) => {
      const s = journalStats(j.id, projects);
      return [j.id, { submissions: s.submissions, toAcceptance: s.toAcceptance.avg, toPublication: s.toPublication.avg, acceptanceRate: s.acceptanceRate }];
    })
  );
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Journals</h1>
        <p className="mt-1 text-muted">Venues you use, with review times calculated from your own submission history.</p>
      </div>
      <JournalDirectory journals={journals} stats={stats} />
    </div>
  );
}
