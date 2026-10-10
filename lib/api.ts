import "server-only";
import { NextResponse } from "next/server";
import { currentUser } from "./auth";
import type { Project, User } from "./types";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Wrap an API handler: requires a signed-in user and turns errors into JSON. */
export function withUser<C>(handler: (req: Request, user: User, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C) => {
    try {
      const user = await currentUser();
      if (!user) return fail("Please sign in again.", 401);
      return await handler(req, user, ctx);
    } catch (e) {
      console.error(e);
      return fail((e as Error).message || "Something went wrong.", 500);
    }
  };
}

export async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    const b = await req.json();
    return b && typeof b === "object" ? b : {};
  } catch {
    return {};
  }
}

export function canSee(p: Project, u: User) {
  return u.role === "admin" || p.ownerId === u.id || p.contributorIds.includes(u.id);
}

export function canManage(p: Project, u: User) {
  return u.role === "admin" || p.ownerId === u.id;
}

export function visibleProjects(projects: Project[], u: User) {
  return projects.filter((p) => canSee(p, u));
}
