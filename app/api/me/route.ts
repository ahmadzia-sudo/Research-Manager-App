import { body, fail, json, withUser } from "@/lib/api";
import { checkPassword, hashPassword, publicUser } from "@/lib/auth";
import { mutate } from "@/lib/store";

// Change your own display name or password.
export const PATCH = withUser(async (req, user) => {
  const b = await body(req);
  let hash: string | null = null;
  if (b.newPassword) {
    if (!(await checkPassword(String(b.currentPassword ?? ""), user.passwordHash)))
      return fail("Current password is not correct.", 403);
    if (String(b.newPassword).length < 8) return fail("New password must be at least 8 characters.");
    hash = await hashPassword(String(b.newPassword));
  }
  const updated = await mutate("users", (users) => {
    const u = users.find((x) => x.id === user.id);
    if (!u) return null;
    if (typeof b.displayName === "string" && b.displayName.trim()) u.displayName = b.displayName.trim();
    if (hash) u.passwordHash = hash;
    return u;
  });
  if (!updated) return fail("Account not found.", 404);
  return json(publicUser(updated));
});
