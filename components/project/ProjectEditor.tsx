"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { api } from "@/lib/client";
import { projectStage } from "@/lib/derive";
import type { Author, Journal, Project, PublicUser } from "@/lib/types";
import { StageBadge } from "../stage";
import { EditableField } from "../ui";
import { AuthorsSection } from "./AuthorsSection";
import { FundingPoolSection, FundingStatementsSection } from "./FundingSection";
import { ContributorsSection, NotesSection, TasksSection } from "./SideSections";
import { SubmissionsSection } from "./SubmissionsSection";
import type { SectionProps } from "./types";

export function ProjectEditor(props: {
  project: Project;
  authors: Author[];
  journals: Journal[];
  users: PublicUser[];
  me: PublicUser;
  canManage: boolean;
}) {
  const router = useRouter();
  const [project, setProject] = useState(props.project);
  const [authors, setAuthors] = useState(props.authors);
  const [journals, setJournals] = useState(props.journals);
  const [status, setStatus] = useState<{ kind: "saving" | "saved" | "error"; msg?: string } | null>(null);

  const save = useCallback(
    async (patch: Partial<Project>) => {
      setStatus({ kind: "saving" });
      try {
        const updated = await api<Project>(`/api/projects/${project.id}`, "PATCH", patch);
        setProject(updated);
        setStatus({ kind: "saved" });
        setTimeout(() => setStatus((s) => (s?.kind === "saved" ? null : s)), 1500);
      } catch (e) {
        setStatus({ kind: "error", msg: (e as Error).message });
        throw e;
      }
    },
    [project.id]
  );

  const ctx: SectionProps = { project, save, authors, setAuthors, journals, setJournals, users: props.users, me: props.me, canManage: props.canManage };
  const st = projectStage(project);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/projects" className="link text-sm">
          Projects
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <h1 className="max-w-3xl text-3xl font-semibold">{project.title || "Untitled project"}</h1>
          <StageBadge stage={st.stage} reason={st.reason} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <section className="panel">
            <div className="panel-head">
              <h2>Paper details</h2>
            </div>
            <div className="panel-body space-y-5">
              <EditableField label="Title" value={project.title} placeholder="No title yet" onSave={(v) => save({ title: v })} />
              <EditableField label="Abstract" value={project.abstract} placeholder="No abstract yet" multiline onSave={(v) => save({ abstract: v })} />
              <EditableField
                label="Keywords"
                value={project.keywords}
                placeholder="No keywords yet"
                hint="Write them the way the journal wants, e.g. separated by semicolons."
                onSave={(v) => save({ keywords: v })}
              />
            </div>
          </section>
          <AuthorsSection {...ctx} />
          <SubmissionsSection {...ctx} />
          <FundingStatementsSection {...ctx} />
          <FundingPoolSection {...ctx} />
        </div>

        <aside className="space-y-6">
          <TasksSection {...ctx} />
          <NotesSection {...ctx} />
          <ContributorsSection {...ctx} />
          {props.canManage && (
            <button
              type="button"
              className="btn btn-sm btn-danger w-full"
              onClick={async () => {
                if (!confirm("Delete this whole project? This can't be undone from the app (Google Drive keeps older file versions).")) return;
                await api(`/api/projects/${project.id}`, "DELETE");
                router.push("/projects");
                router.refresh();
              }}
            >
              Delete project
            </button>
          )}
        </aside>
      </div>

      {status && (
        <div
          role="status"
          className={`fixed right-4 bottom-4 z-50 max-w-sm rounded-lg px-4 py-2 text-sm font-medium shadow-lg ${
            status.kind === "error" ? "bg-danger text-white" : "bg-ink text-white"
          }`}
        >
          {status.kind === "saving" ? "Saving…" : status.kind === "saved" ? "Saved to Drive" : status.msg}
          {status.kind === "error" && (
            <button className="ml-3 underline" onClick={() => setStatus(null)}>
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
}
