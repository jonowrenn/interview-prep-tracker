import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { status } = await req.json() as { status: "unsolved" | "attempted" | "solved" };
  const db = getDb();

  const problem = db.prepare("SELECT id FROM problems WHERE slug = ?").get(slug) as { id: number } | undefined;
  if (!problem) return Response.json({ error: "Not found" }, { status: 404 });

  const now = Math.floor(Date.now() / 1000);
  const today = new Date().toISOString().split("T")[0];

  const existing = db.prepare("SELECT status FROM user_progress WHERE problem_id = ?").get(problem.id) as { status: string } | undefined;

  db.prepare(
    `INSERT INTO user_progress (problem_id, status, solved_at, attempts, updated_at)
     VALUES (?, ?, ?, 1, ?)
     ON CONFLICT(problem_id) DO UPDATE SET
       status = excluded.status,
       solved_at = CASE WHEN excluded.status = 'solved' AND user_progress.solved_at IS NULL THEN excluded.solved_at ELSE user_progress.solved_at END,
       attempts = user_progress.attempts + 1,
       updated_at = excluded.updated_at`
  ).run(problem.id, status, status === "solved" ? now : null, now);

  // Log activity
  if (status !== "unsolved" && existing?.status !== status) {
    db.prepare("INSERT INTO activity_log (date, problem_id, action) VALUES (?, ?, ?)").run(today, problem.id, status);
  }

  return Response.json({ ok: true });
}
