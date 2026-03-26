"use client";

import { useState } from "react";
import { showToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

export default function OnboardingBanner() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ fetched: number; total: number } | null>(null);
  const router = useRouter();

  async function startSync() {
    setLoading(true);
    try {
      await fetch("/api/sync", { method: "POST" });
      showToast("Syncing LeetCode problems...", "info");

      // Poll for completion
      const interval = setInterval(async () => {
        const res = await fetch("/api/sync/status");
        const data = await res.json();
        setProgress(data.progress);

        if (data.status === "done") {
          clearInterval(interval);
          showToast("All problems synced!", "success");
          router.refresh();
        } else if (data.status === "error") {
          clearInterval(interval);
          showToast("Sync failed. Check your connection.", "error");
          setLoading(false);
        }
      }, 1500);
    } catch {
      showToast("Failed to start sync.", "error");
      setLoading(false);
    }
  }

  return (
    <div className="bg-blue-950 border border-blue-800 rounded-xl p-5">
      <h2 className="text-white font-semibold text-lg mb-1">Welcome to LeetTrack</h2>
      <p className="text-blue-200 text-sm mb-4">
        First, sync all LeetCode problems to your local database. This takes about 1-2 minutes.
      </p>

      {loading && progress ? (
        <div>
          <div className="flex justify-between text-sm text-blue-300 mb-1">
            <span>Syncing...</span>
            <span>{progress.fetched} / {progress.total || "?"}</span>
          </div>
          <div className="h-2 bg-blue-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-400 rounded-full transition-all"
              style={{ width: progress.total ? `${(progress.fetched / progress.total) * 100}%` : "0%" }}
            />
          </div>
        </div>
      ) : (
        <button
          onClick={startSync}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? "Starting..." : "Sync Problems"}
        </button>
      )}
    </div>
  );
}
