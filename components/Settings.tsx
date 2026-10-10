"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
import type { PublicUser } from "@/lib/types";
import { ErrorText, Field } from "./ui";

export function Settings({ me, users, storage }: { me: PublicUser; users: PublicUser[]; storage: string }) {
  return (
    <div className="space-y-6">
      <MyAccount me={me} />
      {me.role === "admin" && <Accounts me={me} users={users} />}
      <section className="panel">
        <div className="panel-head">
          <h2>Data</h2>
        </div>
        <div className="panel-body space-y-3 text-sm">
          <p>
            Stored in: <strong>{storage}</strong>. Google Drive keeps earlier versions of each file (right-click a file in Drive, then
            “Manage versions”).
          </p>
          <a className="btn btn-sm" href="/api/export">
            Download a backup (JSON)
          </a>
        </div>
      </section>
    </div>
  );
}

function MyAccount({ me }: { me: PublicUser }) {
  const router = useRouter();
  const [name, setName] = useState(me.displayName);
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setError("");
    try {
      await api("/api/me", "PATCH", { displayName: name, currentPassword: cur, newPassword: pw || undefined });
      setCur("");
      setPw("");
      setMsg(pw ? "Name and password saved." : "Name saved.");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Your account</h2>
        <span className="text-sm text-muted">
          @{me.username}, {me.role}
        </span>
      </div>
      <form onSubmit={submit} className="panel-body space-y-3">
        <Field label="Display name">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Current password (only to change password)">
            <input className="input" type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />
          </Field>
          <Field label="New password">
            <input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" minLength={8} />
          </Field>
        </div>
        <ErrorText>{error}</ErrorText>
        {msg && <p className="text-sm text-accent">{msg}</p>}
        <button className="btn btn-primary btn-sm">Save</button>
      </form>
    </section>
  );
}

function Accounts({ me, users: initial }: { me: PublicUser; users: PublicUser[] }) {
  const [users, setUsers] = useState(initial);
  const [form, setForm] = useState({ username: "", displayName: "", password: "", role: "member" });
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      const u = await api<PublicUser>("/api/users", "POST", form);
      setUsers([...users, u]);
      setMsg(`Account @${u.username} created. Share the username and password with them.`);
      setForm({ username: "", displayName: "", password: "", role: "member" });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Accounts</h2>
        <span className="text-sm text-muted">{users.length}</span>
      </div>
      <div className="panel-body space-y-5">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  {u.displayName} <span className="text-muted">@{u.username}</span>
                </td>
                <td>
                  <select
                    className="select w-28"
                    value={u.role}
                    disabled={u.id === me.id}
                    onChange={async (e) => {
                      try {
                        const x = await api<PublicUser>(`/api/users/${u.id}`, "PATCH", { role: e.target.value });
                        setUsers(users.map((y) => (y.id === x.id ? x : y)));
                      } catch (err) {
                        setError((err as Error).message);
                      }
                    }}
                    aria-label="Role"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="text-right whitespace-nowrap">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={async () => {
                      const pw = prompt(`New password for @${u.username} (at least 8 characters)`);
                      if (!pw) return;
                      try {
                        await api(`/api/users/${u.id}`, "PATCH", { password: pw });
                        setMsg(`Password for @${u.username} changed.`);
                      } catch (err) {
                        setError((err as Error).message);
                      }
                    }}
                  >
                    Reset password
                  </button>
                  {u.id !== me.id && (
                    <button
                      className="btn btn-ghost btn-sm btn-danger"
                      onClick={async () => {
                        if (!confirm(`Delete @${u.username}? Their projects stay, but they can no longer sign in.`)) return;
                        try {
                          await api(`/api/users/${u.id}`, "DELETE");
                          setUsers(users.filter((y) => y.id !== u.id));
                        } catch (err) {
                          setError((err as Error).message);
                        }
                      }}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <form onSubmit={create} className="space-y-3 rounded-lg bg-paper p-4">
          <h3 className="text-base font-semibold">Create an account</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Username">
              <input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </Field>
            <Field label="Display name">
              <input className="input" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
            </Field>
            <Field label="Password (at least 8 characters)">
              <input className="input" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required />
            </Field>
            <Field label="Role">
              <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="member">Member: sees projects they own or are added to</option>
                <option value="admin">Admin: sees everything, manages accounts</option>
              </select>
            </Field>
          </div>
          <ErrorText>{error}</ErrorText>
          {msg && <p className="text-sm text-accent">{msg}</p>}
          <button className="btn btn-primary btn-sm">Create account</button>
        </form>
      </div>
    </section>
  );
}
