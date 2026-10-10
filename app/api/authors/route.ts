import { body, fail, json, withUser } from "@/lib/api";
import { normAuthor } from "@/lib/model";
import { mutate } from "@/lib/store";

export const POST = withUser(async (req, user) => {
  const b = await body(req);
  const draft = normAuthor({ ...b, createdBy: user.id });
  if (!draft.fullName && !draft.email) return fail("Give the author at least a name or an email.");
  const result = await mutate("authors", (items) => {
    if (draft.email) {
      const same = items.find((a) => a.email === draft.email || a.altEmail === draft.email);
      if (same) return { existing: same };
    }
    items.push(draft);
    return { created: draft };
  });
  if ("existing" in result)
    return json({ error: "An author with this email is already in the directory.", existing: result.existing }, 409);
  return json(result.created, 201);
});
