export function SetupProblem({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="panel panel-body max-w-lg space-y-3">
        <h1 className="text-2xl font-semibold">The app can't reach its storage</h1>
        <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{message}</p>
        <p className="text-sm text-muted">
          Check the environment variables in Vercel (Project → Settings → Environment Variables), then redeploy. Open{" "}
          <a className="link" href="/api/health">
            /api/health
          </a>{" "}
          to see which setting is missing.
        </p>
      </div>
    </main>
  );
}
