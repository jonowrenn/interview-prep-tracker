import Link from "next/link";
import DifficultyBadge from "@/components/ui/DifficultyBadge";

type Item = {
  slug: string;
  title: string;
  difficulty: string;
  solved_at: number;
};

export default function RecentActivity({ items }: { items: Item[] }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="text-zinc-400 text-sm font-medium mb-3">Recently Solved</div>
      {items.length === 0 ? (
        <p className="text-zinc-600 text-sm">No problems solved yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Link
              key={item.slug}
              href={`/problems/${item.slug}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800 transition-colors group"
            >
              <div className="text-zinc-200 text-sm group-hover:text-blue-400 transition-colors truncate mr-2">
                {item.title}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <DifficultyBadge difficulty={item.difficulty} />
                <span className="text-zinc-600 text-xs">
                  {new Date(item.solved_at * 1000).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
