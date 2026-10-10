"use client";

import { useId, useMemo, useRef, useState } from "react";
import { authorName, primaryAffiliation, searchAuthors } from "@/lib/derive";
import type { Author } from "@/lib/types";

/**
 * Type a name, email or ORCID. Suggestions appear in a dropdown:
 * similar names, or an exact email match that fills in every saved detail.
 */
export function AuthorCombobox({
  authors,
  excludeIds,
  onPick,
  onCreate,
}: {
  authors: Author[];
  excludeIds: string[];
  onPick: (a: Author) => void;
  onCreate: (typed: string) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(
    () => (q.trim() ? searchAuthors(authors, q, 8) : []),
    [authors, q]
  );
  const options = [
    ...matches.map((m) => ({ kind: "author" as const, ...m })),
    ...(q.trim() ? [{ kind: "new" as const }] : []),
  ];

  const choose = (i: number) => {
    const o = options[i];
    if (!o) return;
    if (o.kind === "author") {
      if (excludeIds.includes(o.a.id)) return;
      onPick(o.a);
    } else onCreate(q.trim());
    setQ("");
    setOpen(false);
    setHi(0);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        className="input"
        role="combobox"
        aria-expanded={open && options.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder="Type an author's name, email or ORCID"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setHi(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHi((h) => Math.min(h + 1, options.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHi((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            choose(hi);
          } else if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && options.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-96 w-full overflow-y-auto rounded-lg border border-line bg-surface py-1 shadow-lg"
        >
          {options.map((o, i) => {
            if (o.kind === "new")
              return (
                <li
                  key="new"
                  role="option"
                  aria-selected={hi === i}
                  className={`cursor-pointer border-t border-line-soft px-3 py-2 text-sm ${hi === i ? "bg-accent-soft" : ""}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHi(i)}
                  onClick={() => choose(i)}
                >
                  Add <strong>{q.trim()}</strong> as a new author
                  <span className="block text-xs text-muted">Saved to the directory too, so you can reuse them later.</span>
                </li>
              );
            const already = excludeIds.includes(o.a.id);
            return (
              <li
                key={o.a.id}
                role="option"
                aria-selected={hi === i}
                aria-disabled={already}
                className={`px-3 py-2 text-sm ${already ? "cursor-default opacity-50" : "cursor-pointer"} ${hi === i ? "bg-accent-soft" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHi(i)}
                onClick={() => choose(i)}
              >
                {o.emailExact && (
                  <span className="mb-1 block text-xs font-semibold text-accent">
                    Email match: add with all saved details
                  </span>
                )}
                <span className="flex items-center gap-2">
                  <span className="font-medium">{authorName(o.a)}</span>
                  {o.a.notes && <span className="chip note-chip">Has notes</span>}
                  {already && <span className="text-xs text-muted">already on this paper</span>}
                </span>
                <span className="block truncate text-xs text-muted">
                  {[o.a.email, primaryAffiliation(o.a)].filter(Boolean).join(", ") || "No details saved yet"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
