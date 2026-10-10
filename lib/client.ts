"use client";

/** Small fetch helper for the browser. Throws an Error with the server's message. */
export async function api<T = unknown>(url: string, method = "GET", data?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: data !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });
  const out = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.location.href = "/login";
  }
  if (!res.ok) {
    const err = new Error(out.error || `Request failed (${res.status})`) as Error & { data?: unknown; status?: number };
    err.data = out;
    err.status = res.status;
    throw err;
  }
  return out as T;
}
