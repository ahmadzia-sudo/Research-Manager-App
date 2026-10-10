"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { authorName, primaryAffiliation, searchAuthors } from "@/lib/derive";
import type { Author } from "@/lib/types";
import { AuthorForm, blankAuthor } from "./AuthorForm";
import { CopyIconButton, Dialog } from "./ui";

export function AuthorDirectory({ authors, counts }: { authors: Author[]; counts: Record<string, { total: number; published: number }> }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);

  const shown = useMemo(() => {
    if (!q.trim()) return [...authors].sort((a, b) => authorName(a).localeCompare(authorName(b)));
    const fuzzy = searchAuthors(authors, q, 200).map((x) => x.a);
    const t = q.toLowerCase();
    const extra = authors.filter((a) => !fuzzy.includes(a) && primaryAffiliation(a).toLowerCase().includes(t));
    return [...fuzzy, ...extra];
  }, [authors, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="input max-w-sm"
          placeholder="Search name, email, ORCID or institution"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search authors"
        />
        <span className="text-sm text-muted">{shown.length} of {authors.length}</span>
        <button className="btn btn-primary btn-sm ml-auto" onClick={() => setAdding(true)}>
          Add author
        </button>
      </div>

      <div className="panel overflow-x-auto">
        {shown.length === 0 ? (
          <p className="empty">{authors.length ? "No authors match this search." : "The directory is empty. Add an author, or add one straight from a project."}</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Affiliation</th>
                <th>Email</th>
                <th>ORCID</th>
                <th className="text-right">Papers</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/authors/${a.id}`} className="link font-medium">
                        {authorName(a)}
                      </Link>
                      {a.notes && <span className="chip note-chip">Has notes</span>}
                    </div>
                    {a.designation && <div className="text-xs text-muted">{a.designation}</div>}
                  </td>
                  <td className="max-w-xs text-sm text-muted">{primaryAffiliation(a)}</td>
                  <td className="text-sm">
                    <span className="flex items-center gap-1">
                      {a.email}
                      <CopyIconButton text={a.email} />
                    </span>
                  </td>
                  <td className="tabular text-sm whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      {a.orcid}
                      <CopyIconButton text={a.orcid} />
                    </span>
                  </td>
                  <td className="tabular text-right text-sm">
                    {counts[a.id]?.total ?? 0}
                    {counts[a.id]?.published ? <span className="text-muted"> ({counts[a.id].published} published)</span> : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={adding} title="Add author" onClose={() => setAdding(false)} wide>
        {adding && (
          <AuthorForm
            initial={blankAuthor()}
            directory={authors}
            onCancel={() => setAdding(false)}
            onUseExisting={(a) => router.push(`/authors/${a.id}`)}
            onSaved={(a) => {
              setAdding(false);
              router.push(`/authors/${a.id}`);
            }}
          />
        )}
      </Dialog>
    </div>
  );
}
