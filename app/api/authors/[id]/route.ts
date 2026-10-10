import { body, fail, json, withUser } from "@/lib/api";
import { normAuthor } from "@/lib/model";
import { mutate, readAll } from "@/lib/store";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withUser<Ctx>(async (req, _user, { params }) => {
  const { id } = await params;
  const b = await body(req);
  const result = await mutate("authors", (items) => {
    const i = items.findIndex((a) => a.id === id);
    if (i < 0) return null;
    const next = normAuthor({ ...items[i], ...b }, items[i]);
    items[i] = next;
    return next;
  });
  if (!result) return fail("Author not found.", 404);
  return json(result);
});

export const DELETE = withUser<Ctx>(async (_req, _user, { params }) => {
  const { id } = await params;
  const projects = await readAll("projects");
  const used = projects.filter((p) => p.authors.some((a) => a.authorId === id));
  if (used.length)
    return fail(
      `This author is on ${used.length} project(s): ${used
        .map((p) => p.title || "Untitled")
        .slice(0, 5)
        .join("; ")}. Remove them from those projects first.`,
      409
    );
  await mutate("authors", (items) => {
    const i = items.findIndex((a) => a.id === id);
    if (i >= 0) items.splice(i, 1);
  });
  return json({ ok: true });
});
