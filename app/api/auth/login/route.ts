import { body, fail, json } from "@/lib/api";
import { checkPassword, startSession } from "@/lib/auth";
import { readAll } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const b = await body(req);
    const username = String(b.username ?? "").trim().toLowerCase();
    const password = String(b.password ?? "");
    const users = await readAll("users");
    const user = users.find((u) => u.username === username);
    if (!user || !(await checkPassword(password, user.passwordHash))) {
      await new Promise((r) => setTimeout(r, 600)); // slow down guessing
      return fail("Wrong username or password.", 401);
    }
    await startSession(user);
    return json({ ok: true });
  } catch (e) {
    return fail((e as Error).message, 500);
  }
}
