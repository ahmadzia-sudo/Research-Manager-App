"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
import { affiliationText, authorName } from "@/lib/derive";
import type { Author } from "@/lib/types";
import { AuthorForm } from "./AuthorForm";
import { CopyButton, CopyIconButton, ErrorText } from "./ui";

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[8.5rem_1fr_auto] items-start gap-2 py-1.5 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words">
        {href ? (
          <a className="link" href={href} target="_blank" rel="noreferrer">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
      <CopyIconButton text={value} />
    </div>
  );
}

export function AuthorDetail({ author: initial, directory, paperCount }: { author: Author; directory: Author[]; paperCount: number }) {
  const router = useRouter();
  const [author, setAuthor] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const a = author;

  const block = [
    authorName(a),
    ...a.affiliations.map(affiliationText),
    a.email && `Email: ${a.email}`,
    a.orcid && `ORCID: https://orcid.org/${a.orcid}`,
  ]
    .filter(Boolean)
    .join("\n");

  if (editing)
    return (
      <div className="panel panel-body">
        <h1 className="mb-4 text-2xl font-semibold">Edit {authorName(a)}</h1>
        <AuthorForm
          initial={a}
          directory={directory}
          onCancel={() => setEditing(false)}
          onSaved={(x) => {
            setAuthor(x);
            setEditing(false);
            router.refresh();
          }}
        />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">
            {a.title && <span className="text-muted">{a.title} </span>}
            {authorName(a)}
          </h1>
          {a.designation && <p className="mt-1 text-muted">{a.designation}</p>}
        </div>
        <div className="flex gap-2">
          <CopyButton text={block} label="Copy author block" />
          <button className="btn btn-sm" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button
            className="btn btn-sm btn-danger"
            onClick={async () => {
              if (paperCount > 0) return setError("Remove this author from their papers before deleting them from the directory.");
              if (!confirm(`Delete ${authorName(a)} from the directory?`)) return;
              try {
                await api(`/api/authors/${a.id}`, "DELETE");
                router.push("/authors");
                router.refresh();
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Delete
          </button>
        </div>
      </div>
      <ErrorText>{error}</ErrorText>

      {a.notes && (
        <div className="note-box">
          <strong className="block">Institution requirements and notes</strong>
          {a.notes}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel">
          <div className="panel-head">
            <h2>Details</h2>
          </div>
          <dl className="panel-body divide-y divide-line-soft">
            <Row label="Full name" value={authorName(a)} />
            <Row label="Given name" value={a.givenName} />
            <Row label="Family name" value={a.familyName} />
            <Row label="Email" value={a.email} href={a.email ? `mailto:${a.email}` : undefined} />
            <Row label="Second email" value={a.altEmail} />
            <Row label="ORCID" value={a.orcid} href={a.orcid ? `https://orcid.org/${a.orcid}` : undefined} />
            <Row label="Phone" value={a.phone} />
            <Row label="Scopus ID" value={a.scopusId} href={a.scopusId ? `https://www.scopus.com/authid/detail.uri?authorId=${a.scopusId}` : undefined} />
            <Row label="Google Scholar" value={a.googleScholar} href={a.googleScholar || undefined} />
            <Row label="Website" value={a.website} href={a.website || undefined} />
          </dl>
        </section>
        <section className="panel">
          <div className="panel-head">
            <h2>Affiliations</h2>
          </div>
          <div className="panel-body space-y-4">
            {a.affiliations.length === 0 && <p className="text-sm text-muted">None saved.</p>}
            {a.affiliations.map((af, i) => (
              <div key={af.id} className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{affiliationText(af)}</p>
                  <CopyIconButton text={affiliationText(af)} />
                </div>
                <p className="text-xs text-muted">{i === 0 ? "Main affiliation" : `Affiliation ${i + 1}`}</p>
                <dl className="divide-y divide-line-soft">
                  <Row label="Department" value={af.department} />
                  <Row label="Institution" value={af.institution} />
                  <Row label="City" value={af.city} />
                  <Row label="Postal code" value={af.postalCode} />
                  <Row label="Country" value={af.country} />
                </dl>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
