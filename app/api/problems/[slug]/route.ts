import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { fetchProblemDetail } from "@/lib/leetcode/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  let row = db
    .prepare(
      `SELECT p.*, COALESCE(up.status, 'unsolved') as status, up.solved_at, up.attempts
       FROM problems p
       LEFT JOIN user_progress up ON p.id = up.problem_id
       WHERE p.slug = ?`
    )
    .get(slug) as Record<string, unknown> | undefined;

  if (!row) {
    return Response.json({ error: "Problem not found" }, { status: 404 });
  }

  // Fetch detail if not yet cached or stale (>7 days)
  const sevenDays = 7 * 24 * 60 * 60;
  const needsFetch = !row.fetched_at || (now - (row.fetched_at as number)) > sevenDays;

  if (needsFetch && !row.is_premium) {
    const detail = await fetchProblemDetail(slug);
    if (detail) {
      db.prepare(
        `UPDATE problems SET description = ?, constraints = ?, fetched_at = ? WHERE slug = ?`
      ).run(detail.content, detail.constraints ?? null, now, slug);

      row = {
        ...row,
        description: detail.content,
        constraints: detail.constraints,
        fetched_at: now,
        code_snippets: JSON.stringify(detail.codeSnippets),
      };
    }
  }

  // Get code snippets from detail if available, otherwise fetch
  let codeSnippets: Array<{ lang: string; langSlug: string; code: string }> = [];
  if (row.code_snippets) {
    try { codeSnippets = JSON.parse(row.code_snippets as string); } catch { /* ignore */ }
  }

  // Get saved solutions
  const solutions = db
    .prepare("SELECT language, code, updated_at FROM solutions WHERE problem_id = ?")
    .all(row.id) as Array<{ language: string; code: string; updated_at: number }>;

  // Get notes
  const notes = db
    .prepare("SELECT content FROM notes WHERE problem_id = ?")
    .get(row.id) as { content: string } | undefined;

  // Get review schedule
  const review = db
    .prepare("SELECT next_review, interval_days, repetitions FROM review_schedule WHERE problem_id = ?")
    .get(row.id) as { next_review: number; interval_days: number; repetitions: number } | undefined;

  return Response.json({
    ...row,
    tags: JSON.parse((row.tags as string) ?? "[]"),
    codeSnippets,
    solutions,
    notes: notes?.content ?? "",
    review: review ?? null,
  });
}
