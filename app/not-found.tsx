import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="panel panel-body max-w-md space-y-3">
        <h1 className="text-2xl font-semibold">Not found</h1>
        <p className="text-muted">This page doesn&apos;t exist, or you don&apos;t have access to it.</p>
        <Link href="/" className="btn btn-sm">
          Go to the dashboard
        </Link>
      </div>
    </main>
  );
}
