type Row = { difficulty: string; solved: number; total: number };

export default function DifficultyBreakdown({ breakdown }: { breakdown: Row[] }) {
  const order = ["Easy", "Medium", "Hard"];
  const sorted = order.map((d) => breakdown.find((r) => r.difficulty === d) ?? { difficulty: d, solved: 0, total: 0 });

  const colors: Record<string, string> = {
    Easy: "bg-green-500",
    Medium: "bg-yellow-500",
    Hard: "bg-red-500",
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="text-zinc-400 text-sm font-medium mb-4">Progress by Difficulty</div>
      <div className="space-y-3">
        {sorted.map((r) => {
          const pct = r.total ? Math.round((r.solved / r.total) * 100) : 0;
          return (
            <div key={r.difficulty}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-zinc-300">{r.difficulty}</span>
                <span className="text-zinc-500">{r.solved}/{r.total}</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${colors[r.difficulty]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
