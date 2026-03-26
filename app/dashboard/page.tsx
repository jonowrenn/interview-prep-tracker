import { getDb, getSetting } from "@/lib/db";
import StatsCards from "@/components/dashboard/StatsCards";
import DifficultyBreakdown from "@/components/dashboard/DifficultyBreakdown";
import ReviewQueue from "@/components/dashboard/ReviewQueue";
import RecentActivity from "@/components/dashboard/RecentActivity";
import ActivityHeatmap from "@/components/dashboard/ActivityHeatmap";
import OnboardingBanner from "@/components/dashboard/OnboardingBanner";

function getDashboardData() {
  const db = getDb();
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
  `).all(now) as Array<{ id: number; slug: string; title: string; difficulty: string; tags: string; next_review: number; interval_days: number; repetitions: number }>;

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

  // Compute streak
  const dates = db.prepare(`SELECT DISTINCT date FROM activity_log ORDER BY date DESC`).all() as Array<{ date: string }>;
  let streak = 0;
  if (dates.length) {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (dates[0].date === today || dates[0].date === yesterday) {
      let expected = dates[0].date;
      for (const { date } of dates) {
        if (date === expected) {
          streak++;
          const d = new Date(expected);
          d.setDate(d.getDate() - 1);
          expected = d.toISOString().split("T")[0];
        } else break;
      }
    }
  }

  return {
    stats,
    breakdown,
    reviewQueue: reviewQueue.map((r) => ({ ...r, tags: JSON.parse(r.tags ?? "[]") })),
    recent,
    heatmap,
    streak,
  };
}

export default function DashboardPage() {
  const hasSynced = getSetting("has_synced") === "true";
  const data = hasSynced ? getDashboardData() : null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      {!hasSynced && <OnboardingBanner />}

      {data && (
        <>
          <StatsCards stats={data.stats} streak={data.streak} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DifficultyBreakdown breakdown={data.breakdown} />
            <ReviewQueue items={data.reviewQueue} />
          </div>

          <ActivityHeatmap heatmap={data.heatmap} />
          <RecentActivity items={data.recent} />
        </>
      )}
    </div>
  );
}
