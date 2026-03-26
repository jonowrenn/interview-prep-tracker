import Link from "next/link";
import DifficultyBadge from "@/components/ui/DifficultyBadge";

type Item = {
  slug: string;
  title: string;
  difficulty: string;
  next_review: number;
  interval_days: number;
};

export default function ReviewQueue({ items }: { items: Item[] }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="text-zinc-400 text-sm font-medium mb-3">
        Due for Review
        {items.length > 0 && (
          <span className="ml-2 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">{items.length}</span>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-zinc-600 text-sm">Nothing due — great job!</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Link
              key={item.slug}
              href={`/problems/${item.slug}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800 transition-colors group"
            >
              <div>
                <div className="text-zinc-200 text-sm group-hover:text-blue-400 transition-colors">{item.title}</div>
                <div className="text-zinc-600 text-xs mt-0.5">Every {item.interval_days}d</div>
              </div>
              <DifficultyBadge difficulty={item.difficulty} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
