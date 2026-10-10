import { Settings } from "@/components/Settings";
import { loadData } from "@/lib/data";
import { storageMode } from "@/lib/store";

export default async function SettingsPage() {
  const { me, users } = await loadData();
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-semibold">Settings</h1>
      <Settings
        me={me}
        users={me.role === "admin" ? users : []}
        storage={storageMode() === "drive" ? `Google Drive folder “${process.env.DRIVE_FOLDER_NAME || "Research Manager Data"}”` : "Local .data folder on this computer"}
      />
    </div>
  );
}
