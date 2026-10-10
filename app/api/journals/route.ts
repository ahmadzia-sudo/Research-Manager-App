import { body, fail, json, withUser } from "@/lib/api";
import { normJournal } from "@/lib/model";
import { mutate } from "@/lib/store";

export const POST = withUser(async (req, user) => {
  const b = await body(req);
  const draft = normJournal({ ...b, createdBy: user.id });
  if (!draft.name) return fail("Journal name is required.");
  const result = await mutate("journals", (items) => {
    const same = items.find((j) => j.name.toLowerCase() === draft.name.toLowerCase());
    if (same) return { existing: same };
    items.push(draft);
    return { created: draft };
  });
  if ("existing" in result)
    return json({ error: "This journal is already in the directory.", existing: result.existing }, 409);
  return json(result.created, 201);
});
