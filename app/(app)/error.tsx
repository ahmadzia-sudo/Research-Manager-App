"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="panel panel-body max-w-xl space-y-3">
      <h1 className="text-2xl font-semibold">This page couldn't load</h1>
      <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error.message}</p>
      <p className="text-sm text-muted">
        If it mentions Google, open <a className="link" href="/api/health">/api/health</a> to check the Drive connection.
      </p>
      <button className="btn" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
