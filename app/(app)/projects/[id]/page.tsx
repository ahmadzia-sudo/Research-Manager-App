import { notFound } from "next/navigation";
import { ProjectEditor } from "@/components/project/ProjectEditor";
import { loadData } from "@/lib/data";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { projects, authors, journals, users, me } = await loadData();
  const project = projects.find((p) => p.id === id);
  if (!project) notFound();
  const canManage = me.role === "admin" || project.ownerId === me.id;
  return <ProjectEditor key={project.updatedAt} project={project} authors={authors} journals={journals} users={users} me={me} canManage={canManage} />;
}
