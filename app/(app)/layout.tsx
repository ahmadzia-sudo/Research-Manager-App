import { Nav } from "@/components/Nav";
import { SetupProblem } from "@/components/SetupProblem";
import { requirePageUser } from "@/lib/auth";
import { unstable_rethrow } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let name = "";
  try {
    const user = await requirePageUser();
    name = user.displayName || user.username;
  } catch (e) {
    unstable_rethrow(e);
    return <SetupProblem message={(e as Error).message} />;
  }
  return (
    <div className="min-h-screen">
      <Nav name={name} />
      <main className="lg:pl-56">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
