"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PIPELINE_ORDER } from "@/lib/derive";
import type { Stage } from "@/lib/types";
import { STAGE_LABELS } from "@/lib/types";
import { StageBadge } from "./stage";

export interface ProjectRow {
  id: string;
  title: string;
  keywords: string;
  stage: Stage;
  reason?: "new" | "resubmit";
  journal: string;
  authors: string[];
  owner: string;
  openTasks: number;
  updatedAt: string;
}

export function ProjectList({ rows }: { rows: ProjectRow[] }) {
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<Stage | "all">("all");

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (stage === "all" || r.stage === stage) &&
        (!t || [r.title, r.keywords, r.journal, ...r.authors].join(" ").toLowerCase().includes(t))
    );
  }, [rows, q, stage]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search title, keyword, author, journal"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search projects"
        />
        <select className="select max-w-[14rem]" value={stage} onChange={(e) => setStage(e.target.value as Stage | "all")} aria-label="Stage">
          <option value="all">All stages</option>
          {PIPELINE_ORDER.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
        <span className="text-sm text-muted">{shown.length} shown</span>
      </div>
      <div className="panel overflow-x-auto">
        {shown.length === 0 ? (
          <p className="empty">
            {rows.length === 0 ? (
              <>
                No projects yet.{" "}
                <Link className="link" href="/projects/new">
                  Start your first one
                </Link>
                .
              </>
            ) : (
              "No projects match this search."
            )}
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Stage</th>
                <th>Authors</th>
                <th className="text-right">Tasks</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id}>
                  <td className="max-w-md">
                    <Link className="link font-medium" href={`/projects/${r.id}`}>
                      {r.title || "Untitled project"}
                    </Link>
                    {r.journal && <div className="mt-0.5 text-xs text-muted">{r.journal}</div>}
                  </td>
                  <td>
                    <StageBadge stage={r.stage} reason={r.reason} />
                  </td>
                  <td className="text-sm text-muted">{r.authors.join(", ") || "—"}</td>
                  <td className="tabular text-right">{r.openTasks || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
