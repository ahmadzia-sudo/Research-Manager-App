import { body, json, withUser } from "@/lib/api";
import { normProject } from "@/lib/model";
import { mutate } from "@/lib/store";

export const POST = withUser(async (req, user) => {
  const b = await body(req);
  const now = new Date().toISOString();
  const project = normProject({
    title: b.title,
    abstract: b.abstract,
    keywords: b.keywords,
    ownerId: user.id,
    createdAt: now,
    updatedAt: now,
  });
  await mutate("projects", (items) => {
    items.push(project);
  });
  return json(project, 201);
});
