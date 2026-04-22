import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { markProblemSolved, recordProblemAttempt } from "@/lib/problems/progress";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { status } = await req.json() as { status: "unsolved" | "attempted" | "solved" };
  const db = getDb();

  const problem = db.prepare("SELECT id FROM problems WHERE slug = ?").get(slug) as { id: number } | undefined;
  if (!problem) return Response.json({ error: "Not found" }, { status: 404 });

  if (status === "attempted") {
    recordProblemAttempt(problem.id);
    return Response.json({ ok: true });
  }

  if (status === "solved") {
    const result = markProblemSolved(problem.id, { attemptIncrement: 1, seedReview: true });
    return Response.json({ ok: true, review: result.review });
  }

  if (status === "unsolved") {
    const now = Math.floor(Date.now() / 1000);
    db.prepare(
      `INSERT INTO user_progress (problem_id, status, solved_at, attempts, updated_at)
       VALUES (?, 'unsolved', NULL, 0, ?)
       ON CONFLICT(problem_id) DO UPDATE SET
         status = 'unsolved',
         solved_at = NULL,
         updated_at = excluded.updated_at`
    ).run(problem.id, now);

    return Response.json({ ok: true });
  }

  return Response.json({ error: "Invalid status" }, { status: 400 });
}
