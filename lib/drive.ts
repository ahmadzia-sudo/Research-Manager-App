// Minimal Google Drive REST client (no extra packages).
// Uses an OAuth refresh token for YOUR Google account, so files live in your own Drive.
// Scope used: https://www.googleapis.com/auth/drive.file (the app only sees files it created).

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://www.googleapis.com/drive/v3";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3";
const FOLDER_MIME = "application/vnd.google-apps.folder";

let tokenCache: { token: string; expiresAt: number } | null = null;
let folderIdCache: string | null = null;
const fileIdCache = new Map<string, string>();

export function driveConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN
  );
}

function folderName(): string {
  return (process.env.DRIVE_FOLDER_NAME || "Research Manager Data").trim();
}

async function accessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token;
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
    client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN!.trim(),
    grant_type: "refresh_token",
  });
  const res = await fetch(TOKEN_URL, { method: "POST", body, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(
      `Google sign-in failed (${data.error || res.status}: ${data.error_description || "no details"}). ` +
        `Check GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REFRESH_TOKEN in Vercel.`
    );
  }
  tokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return tokenCache.token;
}

async function gfetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = await accessToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(url, { ...init, headers, cache: "no-store" });
  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google Drive error ${res.status}: ${text.slice(0, 300)}`);
  }
  return res;
}

function q(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function folderId(): Promise<string> {
  if (folderIdCache) return folderIdCache;
  const query = `name='${q(folderName())}' and mimeType='${FOLDER_MIME}' and trashed=false`;
  const res = await gfetch(
    `${API}/files?q=${encodeURIComponent(query)}&orderBy=createdTime&fields=files(id,name)&pageSize=10`
  );
  const data = await res.json();
  if (data.files?.length) {
    folderIdCache = data.files[0].id as string;
    return folderIdCache;
  }
  const created = await gfetch(`${API}/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: folderName(), mimeType: FOLDER_MIME }),
  });
  folderIdCache = (await created.json()).id as string;
  return folderIdCache;
}

async function fileId(name: string): Promise<string | null> {
  const cached = fileIdCache.get(name);
  if (cached) return cached;
  const parent = await folderId();
  const query = `name='${q(name)}' and '${parent}' in parents and trashed=false`;
  const res = await gfetch(
    `${API}/files?q=${encodeURIComponent(query)}&orderBy=createdTime&fields=files(id,name)&pageSize=10`
  );
  const data = await res.json();
  const id = data.files?.[0]?.id ?? null;
  if (id) fileIdCache.set(name, id);
  return id;
}

export async function driveRead(name: string): Promise<string | null> {
  const id = await fileId(name);
  if (!id) return null;
  const res = await gfetch(`${API}/files/${id}?alt=media`);
  if (res.status === 404) {
    fileIdCache.delete(name);
    return null;
  }
  return res.text();
}

export async function driveWrite(name: string, content: string): Promise<void> {
  const id = await fileId(name);
  if (id) {
    const res = await gfetch(`${UPLOAD}/files/${id}?uploadType=media`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: content,
    });
    if (res.status !== 404) return;
    fileIdCache.delete(name); // file was deleted in Drive; create it again below
  }
  const parent = await folderId();
  const boundary = "rm_boundary_" + Math.random().toString(36).slice(2);
  const meta = JSON.stringify({ name, parents: [parent], mimeType: "application/json" });
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${content}\r\n--${boundary}--`;
  const res = await gfetch(`${UPLOAD}/files?uploadType=multipart&fields=id`, {
    method: "POST",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });
  const data = await res.json();
  fileIdCache.set(name, data.id);
}

export async function driveStatus(): Promise<{ ok: boolean; folder?: string; error?: string }> {
  try {
    await folderId();
    return { ok: true, folder: folderName() };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
