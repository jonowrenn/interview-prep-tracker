import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { pushSolution } from "@/lib/github/push";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = getDb();
  const problem = db.prepare("SELECT id FROM problems WHERE slug = ?").get(slug) as { id: number } | undefined;
  if (!problem) return Response.json({ error: "Not found" }, { status: 404 });

  const solutions = db
    .prepare("SELECT language, code, updated_at FROM solutions WHERE problem_id = ?")
    .all(problem.id);

  return Response.json({ solutions });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { language, code } = await req.json() as { language: string; code: string };
  const db = getDb();

  const problem = db
    .prepare("SELECT id, title, difficulty FROM problems WHERE slug = ?")
    .get(slug) as { id: number; title: string; difficulty: string } | undefined;

  if (!problem) return Response.json({ error: "Not found" }, { status: 404 });

  const now = Math.floor(Date.now() / 1000);
  const today = new Date().toISOString().split("T")[0];

  // Save solution to DB
  db.prepare(
    `INSERT INTO solutions (problem_id, language, code, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(problem_id, language) DO UPDATE SET
       code = excluded.code,
       updated_at = excluded.updated_at`
  ).run(problem.id, language, code, now, now);

  // Mark as solved
  db.prepare(
    `INSERT INTO user_progress (problem_id, status, solved_at, attempts, updated_at)
     VALUES (?, 'solved', ?, 1, ?)
     ON CONFLICT(problem_id) DO UPDATE SET
       status = 'solved',
       solved_at = COALESCE(user_progress.solved_at, excluded.solved_at),
       attempts = user_progress.attempts + 1,
       updated_at = excluded.updated_at`
  ).run(problem.id, now, now);

  // Log activity
  db.prepare("INSERT INTO activity_log (date, problem_id, action) VALUES (?, ?, 'solved')").run(today, problem.id);

  // Push to GitHub (fire and don't fail the response)
  const pushResult = await pushSolution({
    problemId: problem.id,
    slug,
    title: problem.title,
    difficulty: problem.difficulty,
    language,
    code,
  });

  return Response.json({ saved: true, pushStatus: pushResult.status, pushError: pushResult.error });
}
