import { getDb, setSetting } from "@/lib/db";

export async function POST() {
  const db = getDb();
  const status = db.prepare("SELECT value FROM settings WHERE key = 'sync_status'").get() as { value: string } | undefined;

  if (status?.value === "running") {
    return Response.json({ error: "Sync already running" }, { status: 409 });
  }

  // Fire and forget
  import("@/lib/leetcode/sync").then(({ syncProblemList }) => {
    syncProblemList().catch((err) => {
      console.error("Sync failed:", err);
      setSetting("sync_status", "error");
    });
  });

  return Response.json({ ok: true, message: "Sync started" }, { status: 202 });
}
