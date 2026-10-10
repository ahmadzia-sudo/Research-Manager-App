export function AuthShell({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <p className="font-serif text-lg text-accent">Manuscript Desk</p>
          <h1 className="mt-1 text-3xl font-semibold">{title}</h1>
          <p className="mt-2 text-muted">{intro}</p>
        </div>
        <div className="panel panel-body">{children}</div>
      </div>
    </main>
  );
}
