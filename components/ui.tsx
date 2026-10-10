"use client";

import { useEffect, useRef, useState } from "react";

export function CopyButton({ text, label = "Copy", className = "" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={`btn btn-sm ${className}`}
      disabled={!text}
      title={text ? `Copy: ${text.slice(0, 80)}` : "Nothing to copy"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }}
    >
      <CopyIcon />
      {done ? "Copied" : label}
    </button>
  );
}

/** A small icon-only copy button that sits next to a value. */
export function CopyIconButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  if (!text) return null;
  return (
    <button
      type="button"
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-faint hover:bg-line-soft hover:text-ink"
      title={done ? "Copied" : "Copy"}
      aria-label="Copy"
      onClick={async () => {
        await navigator.clipboard.writeText(text).catch(() => undefined);
        setDone(true);
        setTimeout(() => setDone(false), 1000);
      }}
    >
      {done ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}

export function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="5" y="5" width="9" height="9" rx="1.5" />
      <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 8.5l3 3 7-7" />
    </svg>
  );
}

/**
 * Shows a value; click "Add" or "Edit" to change it. Used for every optional project field.
 */
export function EditableField({
  label,
  value,
  placeholder,
  multiline = false,
  onSave,
  display,
  hint,
}: {
  label: string;
  value: string;
  placeholder: string;
  multiline?: boolean;
  onSave: (v: string) => Promise<void>;
  display?: (v: string) => React.ReactNode;
  hint?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await onSave(draft.trim());
      setEditing(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="field-label !mb-0">{label}</span>
        {!editing && (
          <div className="flex items-center gap-1">
            <CopyIconButton text={value} />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setDraft(value);
                setEditing(true);
              }}
            >
              {value ? "Edit" : "Add"}
            </button>
          </div>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          {multiline ? (
            <textarea
              ref={ref}
              className="textarea"
              rows={6}
              value={draft}
              placeholder={placeholder}
              onChange={(e) => setDraft(e.target.value)}
            />
          ) : (
            <input
              ref={ref}
              className="input"
              value={draft}
              placeholder={placeholder}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") setEditing(false);
              }}
            />
          )}
          {hint && <p className="text-xs text-muted">{hint}</p>}
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={save}>
              {busy ? "Saving…" : "Save"}
            </button>
            <button type="button" className="btn btn-sm" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : value ? (
        <div className={multiline ? "whitespace-pre-wrap text-[0.95rem] leading-relaxed" : ""}>
          {display ? display(value) : value}
        </div>
      ) : (
        <p className="text-sm text-faint italic">{placeholder}</p>
      )}
    </div>
  );
}

export function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{children}</p>;
}

/** Simple centered dialog. */
export function Dialog({
  open,
  title,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 pt-[6vh]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={`panel w-full ${wide ? "max-w-3xl" : "max-w-lg"} shadow-xl`}>
        <div className="panel-head">
          <h2>{title}</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="panel-body">{children}</div>
      </div>
    </div>
  );
}
