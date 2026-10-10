import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { AuthShell } from "@/components/AuthShell";
import { SetupProblem } from "@/components/SetupProblem";
import { readAll } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  let users;
  try {
    users = await readAll("users");
  } catch (e) {
    return <SetupProblem message={(e as Error).message} />;
  }
  if (users.length > 0) redirect("/login");
  return (
    <AuthShell
      title="Create the first account"
      intro="This account becomes the admin. You can create accounts for co-authors later in Settings."
    >
      <AuthForm mode="setup" />
    </AuthShell>
  );
}
