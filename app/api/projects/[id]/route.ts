import { body, canManage, canSee, fail, json, withUser } from "@/lib/api";
import { normProject, PROJECT_EDITABLE } from "@/lib/model";
import { mutate } from "@/lib/store";
import type { Project } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

// Save one or more sections of a project. Only the sections sent are replaced.
export const PATCH = withUser<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const b = await body(req);
  const result = await mutate("projects", (items): { error: string; status: number } | { project: Project } => {
    const i = items.findIndex((p) => p.id === id);
    if (i < 0) return { error: "Project not found.", status: 404 };
    const current = normProject(items[i]);
    if (!canSee(current, user)) return { error: "You do not have access to this project.", status: 403 };
    const merged: Record<string, unknown> = { ...current };
    for (const key of PROJECT_EDITABLE) {
      if (!(key in b)) continue;
      if (key === "contributorIds" && !canManage(current, user)) continue;
      merged[key] = b[key];
    }
    merged.updatedAt = new Date().toISOString();
    const next: Project = normProject(merged);
    next.ownerId = current.ownerId;
    next.createdAt = current.createdAt;
    items[i] = next;
    return { project: next };
  });
  if ("error" in result) return fail(result.error, result.status);
  return json(result.project);
});

export const DELETE = withUser<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  const result = await mutate("projects", (items) => {
    const i = items.findIndex((p) => p.id === id);
    if (i < 0) return "missing";
    if (!canManage(normProject(items[i]), user)) return "forbidden";
    items.splice(i, 1);
    return "ok";
  });
  if (result === "missing") return fail("Project not found.", 404);
  if (result === "forbidden") return fail("Only the project owner or an admin can delete it.", 403);
  return json({ ok: true });
});
