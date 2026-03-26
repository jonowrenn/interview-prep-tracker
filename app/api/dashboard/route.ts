import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  // Stats
  const stats = db.prepare(`
    SELECT
      COUNT(CASE WHEN up.status = 'solved' THEN 1 END) as solved,
      COUNT(CASE WHEN up.status = 'attempted' THEN 1 END) as attempted,
      COUNT(*) as total
    FROM problems p
    LEFT JOIN user_progress up ON p.id = up.problem_id
  `).get() as { solved: number; attempted: number; total: number };

  // Difficulty breakdown
  const breakdown = db.prepare(`
    SELECT p.difficulty,
      COUNT(CASE WHEN up.status = 'solved' THEN 1 END) as solved,
      COUNT(*) as total
    FROM problems p
    LEFT JOIN user_progress up ON p.id = up.problem_id
    GROUP BY p.difficulty
  `).all() as Array<{ difficulty: string; solved: number; total: number }>;

  // Review queue (due now)
  const reviewQueue = db.prepare(`
    SELECT p.id, p.slug, p.title, p.difficulty, p.tags,
           rs.next_review, rs.interval_days, rs.repetitions
    FROM review_schedule rs
    JOIN problems p ON p.id = rs.problem_id
    WHERE rs.next_review <= ?
    ORDER BY rs.next_review
    LIMIT 10
  `).all(now) as Array<{
    id: number; slug: string; title: string; difficulty: string;
    tags: string; next_review: number; interval_days: number; repetitions: number;
  }>;

  // Recent activity (last 10 solved)
  const recent = db.prepare(`
    SELECT p.id, p.slug, p.title, p.difficulty, up.solved_at
    FROM user_progress up
    JOIN problems p ON p.id = up.problem_id
    WHERE up.status = 'solved'
    ORDER BY up.solved_at DESC
    LIMIT 10
  `).all() as Array<{ id: number; slug: string; title: string; difficulty: string; solved_at: number }>;

  // Activity heatmap (last 365 days)
  const heatmap = db.prepare(`
    SELECT date, COUNT(*) as count
    FROM activity_log
    WHERE date >= date('now', '-365 days')
    GROUP BY date
    ORDER BY date
  `).all() as Array<{ date: string; count: number }>;

  // Streak
  const streak = computeStreak(db);

  return Response.json({
    stats,
    breakdown,
    reviewQueue: reviewQueue.map((r) => ({ ...r, tags: JSON.parse(r.tags ?? "[]") })),
    recent,
    heatmap,
    streak,
  });
}

function computeStreak(db: ReturnType<typeof getDb>): number {
  const dates = db.prepare(`
    SELECT DISTINCT date FROM activity_log
    ORDER BY date DESC
  `).all() as Array<{ date: string }>;

  if (!dates.length) return 0;

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Streak must include today or yesterday
  if (dates[0].date !== today && dates[0].date !== yesterday) return 0;

  let streak = 0;
  let expected = dates[0].date === today ? today : yesterday;

  for (const { date } of dates) {
    if (date === expected) {
      streak++;
      const d = new Date(expected);
      d.setDate(d.getDate() - 1);
      expected = d.toISOString().split("T")[0];
    } else {
      break;
    }
  }

  return streak;
}
