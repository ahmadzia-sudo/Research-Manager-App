import { NewProjectForm } from "@/components/NewProjectForm";
import { requirePageUser } from "@/lib/auth";

export default async function NewProjectPage() {
  await requirePageUser();
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">New project</h1>
        <p className="mt-1 text-muted">Every field is optional. You can fill or change them later on the project page.</p>
      </div>
      <NewProjectForm />
    </div>
  );
}
