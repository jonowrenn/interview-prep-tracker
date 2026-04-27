import { getSetting } from "@/lib/db";
import StatsCards from "@/components/dashboard/StatsCards";
import DifficultyBreakdown from "@/components/dashboard/DifficultyBreakdown";
import ReviewQueue from "@/components/dashboard/ReviewQueue";
import RecentActivity from "@/components/dashboard/RecentActivity";
import ActivityHeatmap from "@/components/dashboard/ActivityHeatmap";
import OnboardingBanner from "@/components/dashboard/OnboardingBanner";
import { getDashboardData } from "@/lib/dashboard/data";

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
