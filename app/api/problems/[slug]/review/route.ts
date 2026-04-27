import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { parseJsonBody } from "@/lib/api/validation";
import { reviewBodySchema } from "@/lib/api/schemas";
import { sm2, QUALITY } from "@/lib/spaced-repetition/sm2";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const parsed = await parseJsonBody(req, reviewBodySchema);
  if ("response" in parsed) return parsed.response;

  const { quality } = parsed.data;
  const db = getDb();

  const problem = db.prepare("SELECT id FROM problems WHERE slug = ?").get(slug) as { id: number } | undefined;
  if (!problem) return Response.json({ error: "Not found" }, { status: 404 });

  const existing = db
    .prepare("SELECT * FROM review_schedule WHERE problem_id = ?")
    .get(problem.id) as { interval_days: number; ease_factor: number; repetitions: number } | undefined;

  const q = QUALITY[quality] ?? 3;
  const result = sm2({
    repetitions: existing?.repetitions ?? 0,
    interval: existing?.interval_days ?? 1,
    easeFactor: existing?.ease_factor ?? 2.5,
    quality: q,
  });

  const now = Math.floor(Date.now() / 1000);
  const nextReview = now + result.nextInterval * 24 * 60 * 60;
  const today = new Date().toISOString().split("T")[0];

  db.prepare(
    `INSERT INTO review_schedule (problem_id, next_review, interval_days, ease_factor, repetitions, last_quality, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(problem_id) DO UPDATE SET
       next_review = excluded.next_review,
       interval_days = excluded.interval_days,
       ease_factor = excluded.ease_factor,
       repetitions = excluded.repetitions,
       last_quality = excluded.last_quality,
       updated_at = excluded.updated_at`
  ).run(problem.id, nextReview, result.nextInterval, result.nextEaseFactor, result.nextRepetitions, q, now);

  db.prepare("INSERT INTO activity_log (date, problem_id, action) VALUES (?, ?, 'reviewed')").run(today, problem.id);

  return Response.json({
    nextReview,
    intervalDays: result.nextInterval,
    review: {
      next_review: nextReview,
      interval_days: result.nextInterval,
      repetitions: result.nextRepetitions,
    },
  });
}
