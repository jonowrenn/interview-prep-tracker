import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare("SELECT key, value FROM settings WHERE key IN ('sync_status', 'sync_progress', 'sync_last', 'sync_error', 'has_synced')")
    .all() as Array<{ key: string; value: string }>;

  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;

  let progress = { fetched: 0, total: 0 };
  try { progress = JSON.parse(map.sync_progress ?? "{}"); } catch { /* ignore */ }

  return Response.json({
    status: map.sync_status ?? "idle",
    progress,
    lastSync: map.sync_last ? parseInt(map.sync_last) : null,
    error: map.sync_error ?? null,
    hasSynced: map.has_synced === "true",
  });
}
