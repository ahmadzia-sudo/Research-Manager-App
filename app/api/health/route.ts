import { json } from "@/lib/api";
import { driveConfigured, driveStatus } from "@/lib/drive";
import { storageMode } from "@/lib/store";

// Open https://YOUR-APP.vercel.app/api/health to check the Google Drive connection.
export async function GET() {
  const checks = {
    storage: storageMode(),
    googleKeysPresent: driveConfigured(),
    sessionSecretPresent: Boolean(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16),
    setupKeyPresent: Boolean(process.env.SETUP_KEY),
  };
  const drive = checks.googleKeysPresent ? await driveStatus() : { ok: false, error: "Google keys missing" };
  return json({ ok: drive.ok && checks.sessionSecretPresent, ...checks, drive });
}

export const dynamic = "force-dynamic";
