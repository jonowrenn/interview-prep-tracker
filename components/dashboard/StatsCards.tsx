type Stats = { solved: number; attempted: number; total: number };

export default function StatsCards({ stats, streak }: { stats: Stats; streak: number }) {
  const unsolved = stats.total - stats.solved - stats.attempted;
  const pct = stats.total ? Math.round((stats.solved / stats.total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card label="Solved" value={stats.solved} sub={`${pct}% of total`} color="text-green-400" />
      <Card label="Attempted" value={stats.attempted} sub="in progress" color="text-yellow-400" />
      <Card label="Unsolved" value={unsolved} sub="not started" color="text-zinc-400" />
      <Card label="Streak" value={streak} sub="days" color="text-blue-400" />
    </div>
  );
}

function Card({ label, value, sub, color }: { label: string; value: number; sub: string; color: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="text-zinc-500 text-xs font-medium uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-3xl font-bold ${color}`}>{value.toLocaleString()}</div>
      <div className="text-zinc-600 text-xs mt-1">{sub}</div>
    </div>
  );
}
