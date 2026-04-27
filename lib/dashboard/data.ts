import type Database from "better-sqlite3";
import { getDb } from "@/lib/db";

export type DashboardData = ReturnType<typeof getDashboardData>;

export function getDashboardData(db: Database.Database = getDb()) {
  const now = Math.floor(Date.now() / 1000);

  const stats = db.prepare(`
    SELECT
      COUNT(CASE WHEN up.status = 'solved' THEN 1 END) as solved,
      COUNT(CASE WHEN up.status = 'attempted' THEN 1 END) as attempted,
      COUNT(*) as total
    FROM problems p
    LEFT JOIN user_progress up ON p.id = up.problem_id
  `).get() as { solved: number; attempted: number; total: number };

  const breakdown = db.prepare(`
    SELECT p.difficulty,
      COUNT(CASE WHEN up.status = 'solved' THEN 1 END) as solved,
      COUNT(*) as total
    FROM problems p
    LEFT JOIN user_progress up ON p.id = up.problem_id
    GROUP BY p.difficulty
  `).all() as Array<{ difficulty: string; solved: number; total: number }>;

  const reviewQueue = db.prepare(`
    SELECT p.id, p.slug, p.title, p.difficulty, p.tags,
           rs.next_review, rs.interval_days, rs.repetitions
    FROM review_schedule rs
    JOIN problems p ON p.id = rs.problem_id
    WHERE rs.next_review <= ?
    ORDER BY rs.next_review
    LIMIT 10
  `).all(now) as Array<{
    id: number;
    slug: string;
    title: string;
    difficulty: string;
    tags: string;
    next_review: number;
    interval_days: number;
    repetitions: number;
  }>;

  const recent = db.prepare(`
    SELECT p.id, p.slug, p.title, p.difficulty, up.solved_at
    FROM user_progress up
    JOIN problems p ON p.id = up.problem_id
    WHERE up.status = 'solved'
    ORDER BY up.solved_at DESC
    LIMIT 10
  `).all() as Array<{ id: number; slug: string; title: string; difficulty: string; solved_at: number }>;

  const heatmap = db.prepare(`
    SELECT date, COUNT(*) as count
    FROM activity_log
    WHERE date >= date('now', '-365 days')
    GROUP BY date
    ORDER BY date
  `).all() as Array<{ date: string; count: number }>;

  const dates = db.prepare(`
    SELECT DISTINCT date FROM activity_log
    ORDER BY date DESC
  `).all() as Array<{ date: string }>;

  return {
    stats,
    breakdown,
    reviewQueue: reviewQueue.map((r) => ({ ...r, tags: JSON.parse(r.tags ?? "[]") as string[] })),
    recent,
    heatmap,
    streak: computeStreak(dates),
  };
}

export function computeStreak(
  dates: Array<{ date: string }>,
  now: Date = new Date()
): number {
  if (!dates.length) return 0;

  const today = toDateKey(now);
  const yesterdayDate = new Date(now);
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
  const yesterday = toDateKey(yesterdayDate);

  if (dates[0].date !== today && dates[0].date !== yesterday) return 0;

  let streak = 0;
  let expected = dates[0].date;

  for (const { date } of dates) {
    if (date !== expected) break;

    streak++;
    const previous = new Date(`${expected}T00:00:00.000Z`);
    previous.setUTCDate(previous.getUTCDate() - 1);
    expected = toDateKey(previous);
  }

  return streak;
}

function toDateKey(date: Date) {
  return date.toISOString().split("T")[0];
}
