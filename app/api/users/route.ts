import { body, fail, json, withUser } from "@/lib/api";
import { hashPassword, publicUser } from "@/lib/auth";
import { newId } from "@/lib/model";
import { mutate } from "@/lib/store";
import type { User } from "@/lib/types";

// Admins create accounts for other people.
export const POST = withUser(async (req, user) => {
  if (user.role !== "admin") return fail("Only admins can create accounts.", 403);
  const b = await body(req);
  const username = String(b.username ?? "").trim().toLowerCase();
  const password = String(b.password ?? "");
  if (!/^[a-z0-9._-]{3,40}$/.test(username))
    return fail("Username: 3 to 40 characters, letters, numbers, dot, dash or underscore.");
  if (password.length < 8) return fail("Password must be at least 8 characters.");
  const hash = await hashPassword(password);
  const created = await mutate("users", (users) => {
    if (users.some((u) => u.username === username)) return null;
    const u: User = {
      id: newId(),
      username,
      displayName: String(b.displayName ?? "").trim() || username,
      passwordHash: hash,
      role: b.role === "admin" ? "admin" : "member",
      createdAt: new Date().toISOString(),
    };
    users.push(u);
    return u;
  });
  if (!created) return fail("That username is taken.", 409);
  return json(publicUser(created), 201);
});
