import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { AuthShell } from "@/components/AuthShell";
import { SetupProblem } from "@/components/SetupProblem";
import { currentUser } from "@/lib/auth";
import { readAll } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  let users;
  try {
    users = await readAll("users");
  } catch (e) {
    return <SetupProblem message={(e as Error).message} />;
  }
  if (users.length === 0) redirect("/setup");
  if (await currentUser()) redirect("/");
  return (
    <AuthShell title="Sign in" intro="Use the username and password your admin gave you.">
      <AuthForm mode="login" />
    </AuthShell>
  );
}
