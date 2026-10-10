"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
import type { Project } from "@/lib/types";
import { ErrorText, Field } from "./ui";

export function NewProjectForm() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", abstract: "", keywords: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const p = await api<Project>("/api/projects", "POST", form);
      router.push(`/projects/${p.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="panel panel-body space-y-4">
      <Field label="Title">
        <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Working title of the paper" />
      </Field>
      <Field label="Abstract">
        <textarea className="textarea" rows={7} value={form.abstract} onChange={(e) => setForm({ ...form, abstract: e.target.value })} />
      </Field>
      <Field label="Keywords">
        <input
          className="input"
          value={form.keywords}
          onChange={(e) => setForm({ ...form, keywords: e.target.value })}
          placeholder="gradient boosting; green AI; inference latency"
        />
      </Field>
      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Creating…" : "Create project"}
        </button>
        <button type="button" className="btn" onClick={() => router.back()}>
          Cancel
        </button>
      </div>
    </form>
  );
}
