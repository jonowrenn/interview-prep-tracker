"use client";

type Entry = { date: string; count: number };

export default function ActivityHeatmap({ heatmap }: { heatmap: Entry[] }) {
  const map = new Map(heatmap.map((e) => [e.date, e.count]));

  // Build 52 weeks of dates ending today
  const today = new Date();
  const weeks: string[][] = [];
  let current = new Date(today);
  current.setDate(current.getDate() - current.getDay()); // start of current week (Sunday)
  current.setDate(current.getDate() - 51 * 7); // go back 51 more weeks

  for (let w = 0; w < 52; w++) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  const colorFor = (count: number) => {
    if (!count) return "bg-zinc-800";
    if (count >= 4) return "bg-green-500";
    if (count >= 2) return "bg-green-600";
    return "bg-green-800";
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="text-zinc-400 text-sm font-medium mb-3">Activity (last year)</div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((date) => {
              const count = map.get(date) ?? 0;
              return (
                <div
                  key={date}
                  title={`${date}: ${count} actions`}
                  className={`w-3 h-3 rounded-sm ${colorFor(count)}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
