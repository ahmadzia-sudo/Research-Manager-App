import { body, fail, json, withUser } from "@/lib/api";
import { hashPassword, publicUser } from "@/lib/auth";
import { mutate } from "@/lib/store";

type Ctx = { params: Promise<{ id: string }> };

// Admin: reset password, change name or role.
export const PATCH = withUser<Ctx>(async (req, user, { params }) => {
  if (user.role !== "admin") return fail("Only admins can change accounts.", 403);
  const { id } = await params;
  const b = await body(req);
  const hash = b.password ? await hashPassword(String(b.password)) : null;
  if (b.password && String(b.password).length < 8) return fail("Password must be at least 8 characters.");
  const result = await mutate("users", (users) => {
    const u = users.find((x) => x.id === id);
    if (!u) return "missing" as const;
    if (b.role && b.role !== u.role) {
      if (u.role === "admin" && users.filter((x) => x.role === "admin").length === 1)
        return "last-admin" as const;
      u.role = b.role === "admin" ? "admin" : "member";
    }
    if (typeof b.displayName === "string" && b.displayName.trim()) u.displayName = b.displayName.trim();
    if (hash) u.passwordHash = hash;
    return u;
  });
  if (result === "missing") return fail("Account not found.", 404);
  if (result === "last-admin") return fail("There must be at least one admin.", 409);
  return json(publicUser(result));
});

export const DELETE = withUser<Ctx>(async (_req, user, { params }) => {
  if (user.role !== "admin") return fail("Only admins can delete accounts.", 403);
  const { id } = await params;
  if (id === user.id) return fail("You can't delete your own account.", 409);
  await mutate("users", (users) => {
    const i = users.findIndex((x) => x.id === id);
    if (i >= 0) users.splice(i, 1);
  });
  return json({ ok: true });
});
