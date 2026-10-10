import { visibleProjects, withUser } from "@/lib/api";
import { publicUser } from "@/lib/auth";
import { readEverything } from "@/lib/store";

// Download a backup of everything you can see.
export const GET = withUser(async (_req, user) => {
  const all = await readEverything();
  const data = {
    exportedAt: new Date().toISOString(),
    users: all.users.map(publicUser),
    authors: all.authors,
    journals: all.journals,
    projects: visibleProjects(all.projects, user),
  };
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="research-manager-backup-${data.exportedAt.slice(0, 10)}.json"`,
    },
  });
});
