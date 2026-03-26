import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = getDb();

  const row = db
    .prepare(
      `SELECT p.*, COALESCE(up.status, 'unsolved') as status, up.solved_at, up.attempts
       FROM problems p
       LEFT JOIN user_progress up ON p.id = up.problem_id
       WHERE p.slug = ?`
    )
    .get(slug) as Record<string, unknown> | undefined;

  if (!row) return Response.json({ error: "Problem not found" }, { status: 404 });

  // Return immediately — description loaded lazily by client
  const solutions = db
    .prepare("SELECT language, code, updated_at FROM solutions WHERE problem_id = ?")
    .all(row.id) as Array<{ language: string; code: string; updated_at: number }>;

  const notes = db
    .prepare("SELECT content FROM notes WHERE problem_id = ?")
    .get(row.id) as { content: string } | undefined;

  const review = db
    .prepare("SELECT next_review, interval_days, repetitions FROM review_schedule WHERE problem_id = ?")
    .get(row.id) as { next_review: number; interval_days: number; repetitions: number } | undefined;

  return Response.json({
    ...row,
    tags: JSON.parse((row.tags as string) ?? "[]"),
    // description returned as-is from cache (may be null — client fetches lazily)
    descriptionCached: !!row.description,
    solutions,
    notes: notes?.content ?? "",
    review: review ?? null,
  });
}
