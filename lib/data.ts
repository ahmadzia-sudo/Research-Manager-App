import "server-only";
import { visibleProjects } from "./api";
import { publicUser, requirePageUser } from "./auth";
import { normAuthor, normJournal, normProject } from "./model";
import { readEverything } from "./store";

/** Everything a page needs, limited to what the signed-in user may see. */
export async function loadData() {
  const user = await requirePageUser();
  const all = await readEverything();
  return {
    me: publicUser(user),
    users: all.users.map(publicUser),
    authors: all.authors.map((a) => ({ ...normAuthor(a, a), updatedAt: a.updatedAt })),
    journals: all.journals.map((j) => ({ ...normJournal(j, j), updatedAt: j.updatedAt })),
    projects: visibleProjects(all.projects.map(normProject), user),
  };
}

export type PageData = Awaited<ReturnType<typeof loadData>>;
