import { body, fail, json } from "@/lib/api";
import { hashPassword, startSession } from "@/lib/auth";
import { newId } from "@/lib/model";
import { mutate } from "@/lib/store";
import type { User } from "@/lib/types";

// Creates the very first (admin) account. Only works while there are no accounts.
export async function POST(req: Request) {
  try {
    const b = await body(req);
    const key = String(b.setupKey ?? "");
    const expected = process.env.SETUP_KEY ?? (process.env.VERCEL ? "" : "local");
    if (!expected) return fail("SETUP_KEY is not set in Vercel. Add it and redeploy.", 400);
    if (key !== expected) return fail("Setup key is not correct.", 403);
    const username = String(b.username ?? "").trim().toLowerCase();
    const password = String(b.password ?? "");
    if (!/^[a-z0-9._-]{3,40}$/.test(username))
      return fail("Username: 3 to 40 characters, letters, numbers, dot, dash or underscore.");
    if (password.length < 8) return fail("Password must be at least 8 characters.");
    const hash = await hashPassword(password);
    const user = await mutate("users", (users) => {
      if (users.length > 0) return null;
      const u: User = {
        id: newId(),
        username,
        displayName: String(b.displayName ?? "").trim() || username,
        passwordHash: hash,
        role: "admin",
        createdAt: new Date().toISOString(),
      };
      users.push(u);
      return u;
    });
    if (!user) return fail("An account already exists. Please sign in.", 409);
    await startSession(user);
    return json({ ok: true });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
