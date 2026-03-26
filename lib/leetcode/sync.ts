import { getDb, setSetting } from "../db";
import { fetchProblemList } from "./client";

export async function syncProblemList(): Promise<void> {
  const db = getDb();
  setSetting("sync_status", "running");
  setSetting("sync_progress", JSON.stringify({ fetched: 0, total: 0 }));

  try {
    // Fetch first page to get total
    const first = await fetchProblemList(0, 100);
    const total = first.total;
    const allProblems = [...first.questions];

    setSetting("sync_progress", JSON.stringify({ fetched: allProblems.length, total }));

    // Fetch remaining pages
    let skip = 100;
    while (allProblems.length < total) {
      await sleep(500);
      const page = await fetchProblemList(skip, 100);
      allProblems.push(...page.questions);
      skip += 100;
      setSetting("sync_progress", JSON.stringify({ fetched: allProblems.length, total }));
    }

    // Bulk upsert
    const now = Math.floor(Date.now() / 1000);
    const upsert = db.prepare(`
      INSERT INTO problems (id, slug, title, difficulty, tags, acceptance_rate, is_premium, synced_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        difficulty = excluded.difficulty,
        tags = excluded.tags,
        acceptance_rate = excluded.acceptance_rate,
        is_premium = excluded.is_premium,
        synced_at = excluded.synced_at
    `);

    const insertMany = db.transaction((problems: typeof allProblems) => {
      for (const p of problems) {
        const id = parseInt(p.frontendQuestionId, 10);
        if (isNaN(id)) continue;
        upsert.run(
          id,
          p.titleSlug,
          p.title,
          p.difficulty,
          JSON.stringify(p.topicTags.map((t) => t.slug)),
          p.acRate,
          p.paidOnly ? 1 : 0,
          now
        );
      }
    });

    insertMany(allProblems);

    setSetting("sync_status", "done");
    setSetting("sync_last", String(now));
    setSetting("has_synced", "true");
  } catch (err) {
    setSetting("sync_status", "error");
    setSetting("sync_error", String(err));
    throw err;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
