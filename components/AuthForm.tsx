"use client";

import { useState } from "react";
import { api } from "@/lib/client";
import { ErrorText, Field } from "./ui";

export function AuthForm({ mode }: { mode: "login" | "setup" }) {
  const [form, setForm] = useState({ username: "", password: "", displayName: "", setupKey: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(mode === "login" ? "/api/auth/login" : "/api/auth/setup", "POST", form);
      window.location.href = "/";
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === "setup" && (
        <>
          <Field label="Setup key (the SETUP_KEY value you added in Vercel)">
            <input className="input" type="password" value={form.setupKey} onChange={set("setupKey")} required />
          </Field>
          <Field label="Your name">
            <input className="input" value={form.displayName} onChange={set("displayName")} placeholder="Ahmad Zia" />
          </Field>
        </>
      )}
      <Field label="Username">
        <input className="input" value={form.username} onChange={set("username")} autoComplete="username" required />
      </Field>
      <Field label="Password">
        <input
          className="input"
          type="password"
          value={form.password}
          onChange={set("password")}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={mode === "setup" ? 8 : undefined}
          required
        />
      </Field>
      <ErrorText>{error}</ErrorText>
      <button className="btn btn-primary w-full" disabled={busy}>
        {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create admin account"}
      </button>
    </form>
  );
}
