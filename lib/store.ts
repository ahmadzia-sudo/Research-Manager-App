import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { driveConfigured, driveRead, driveWrite } from "./drive";
import type { CollectionName, Collections } from "./types";

// Storage: one JSON file per collection (users.json, authors.json, journals.json, projects.json).
// On Vercel the files live in Google Drive. When running on your own computer without
// Google keys, they are written to a local ".data" folder instead.

const READ_TTL_MS = 2000;
const cache = new Map<CollectionName, { data: unknown[]; at: number }>();
const queues = new Map<CollectionName, Promise<unknown>>();

export class StorageNotConfiguredError extends Error {}

function mode(): "drive" | "local" {
  if (driveConfigured()) return "drive";
  if (process.env.VERCEL) {
    throw new StorageNotConfiguredError(
      "Google Drive keys are missing. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REFRESH_TOKEN in Vercel, then redeploy."
    );
  }
  return "local";
}

const localDir = () => path.join(process.cwd(), ".data");

async function rawRead(name: CollectionName): Promise<string | null> {
  if (mode() === "drive") return driveRead(`${name}.json`);
  try {
    return await fs.readFile(path.join(localDir(), `${name}.json`), "utf8");
  } catch {
    return null;
  }
}

async function rawWrite(name: CollectionName, content: string): Promise<void> {
  if (mode() === "drive") return driveWrite(`${name}.json`, content);
  await fs.mkdir(localDir(), { recursive: true });
  await fs.writeFile(path.join(localDir(), `${name}.json`), content, "utf8");
}

async function load<K extends CollectionName>(name: K): Promise<Collections[K]> {
  const text = await rawRead(name);
  if (!text || !text.trim()) return [] as unknown as Collections[K];
  const parsed = JSON.parse(text);
  const items = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.items) ? parsed.items : [];
  return items as Collections[K];
}

/** Read a whole collection (cached for 2 seconds). */
export async function readAll<K extends CollectionName>(name: K): Promise<Collections[K]> {
  const hit = cache.get(name);
  if (hit && Date.now() - hit.at < READ_TTL_MS) return structuredClone(hit.data) as Collections[K];
  const data = await load(name);
  cache.set(name, { data, at: Date.now() });
  return structuredClone(data);
}

/**
 * Read the latest copy, let `fn` change it, and save it back.
 * Writes to the same collection are run one after another.
 */
export async function mutate<K extends CollectionName, R>(
  name: K,
  fn: (items: Collections[K]) => R | Promise<R>
): Promise<R> {
  const previous = queues.get(name) ?? Promise.resolve();
  const run = previous
    .catch(() => undefined)
    .then(async () => {
      const items = await load(name);
      const result = await fn(items);
      const content = JSON.stringify({ version: 1, savedAt: new Date().toISOString(), items }, null, 2);
      await rawWrite(name, content);
      cache.set(name, { data: items, at: Date.now() });
      return result;
    });
  queues.set(name, run);
  return run;
}

export async function readEverything(): Promise<Collections> {
  const [users, authors, journals, projects] = await Promise.all([
    readAll("users"),
    readAll("authors"),
    readAll("journals"),
    readAll("projects"),
  ]);
  return { users, authors, journals, projects };
}

export function storageMode(): string {
  try {
    return mode();
  } catch {
    return "not-configured";
  }
}
