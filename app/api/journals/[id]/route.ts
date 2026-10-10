import { body, fail, json, withUser } from "@/lib/api";
import { normJournal } from "@/lib/model";
import { mutate, readAll } from "@/lib/store";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withUser<Ctx>(async (req, _user, { params }) => {
  const { id } = await params;
  const b = await body(req);
  const result = await mutate("journals", (items) => {
    const i = items.findIndex((j) => j.id === id);
    if (i < 0) return null;
    const next = normJournal({ ...items[i], ...b }, items[i]);
    items[i] = next;
    return next;
  });
  if (!result) return fail("Journal not found.", 404);
  return json(result);
});

export const DELETE = withUser<Ctx>(async (_req, _user, { params }) => {
  const { id } = await params;
  const projects = await readAll("projects");
  const used = projects.filter((p) => p.submissions.some((s) => s.journalId === id));
  if (used.length)
    return fail(`This journal appears in the history of ${used.length} project(s), so it can't be deleted.`, 409);
  await mutate("journals", (items) => {
    const i = items.findIndex((j) => j.id === id);
    if (i >= 0) items.splice(i, 1);
  });
  return json({ ok: true });
});
