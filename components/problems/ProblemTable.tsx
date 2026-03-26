"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import DifficultyBadge from "@/components/ui/DifficultyBadge";
import StatusIcon from "@/components/ui/StatusIcon";

type Problem = {
  id: number;
  slug: string;
  title: string;
  difficulty: string;
  tags: string[];
  acceptance_rate: number;
  is_premium: number;
  status: string;
};

export default function ProblemTable({
  problems,
  total,
  page,
  limit,
}: {
  problems: Problem[];
  total: number;
  page: number;
  limit: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / limit);

  const goPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/problems?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-zinc-500 text-sm">{total.toLocaleString()} problems</div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900">
              <th className="text-left px-4 py-3 text-zinc-500 font-medium w-8">#</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Title</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Difficulty</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium hidden md:table-cell">Acceptance</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium hidden lg:table-cell">Tags</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium w-8">Status</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((p, i) => (
              <tr
                key={p.id}
                className="border-b border-zinc-800/50 hover:bg-zinc-800/40 transition-colors"
              >
                <td className="px-4 py-3 text-zinc-500">{p.id}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/problems/${p.slug}`}
                    className="text-zinc-200 hover:text-blue-400 transition-colors font-medium"
                  >
                    {p.title}
                    {p.is_premium === 1 && <span className="ml-2 text-yellow-500 text-xs">★</span>}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <DifficultyBadge difficulty={p.difficulty} />
                </td>
                <td className="px-4 py-3 text-zinc-500 hidden md:table-cell">
                  {p.acceptance_rate ? `${p.acceptance_rate.toFixed(1)}%` : "-"}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {p.tags.slice(0, 3).map((tag) => (
                      <Link
                        key={tag}
                        href={`/problems?tag=${encodeURIComponent(tag)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                    {p.tags.length > 3 && (
                      <span className="text-xs text-zinc-600">+{p.tags.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusIcon status={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => goPage(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm rounded-lg bg-zinc-800 text-zinc-300 disabled:opacity-30 hover:bg-zinc-700 transition-colors"
          >
            Previous
          </button>
          <span className="text-zinc-500 text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => goPage(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm rounded-lg bg-zinc-800 text-zinc-300 disabled:opacity-30 hover:bg-zinc-700 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
