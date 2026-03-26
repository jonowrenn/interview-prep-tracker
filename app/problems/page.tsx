import { Suspense } from "react";
import ProblemTable from "@/components/problems/ProblemTable";
import ProblemFilters from "@/components/problems/ProblemFilters";
import ProblemSearch from "@/components/problems/ProblemSearch";
import { getDb, getSetting } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

type SearchParams = Promise<{ q?: string; difficulty?: string; tag?: string; status?: string; page?: string; limit?: string }>;

function getProblems(params: Record<string, string | undefined>) {
  const db = getDb();
  const { q, difficulty, tag, status, page = "1", limit: limitStr = "50" } = params;
  const limit = Math.min(parseInt(limitStr, 10) || 50, 200);
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const offset = (pageNum - 1) * limit;

  const conditions: string[] = [];
  const args: unknown[] = [];

  if (q) {
    conditions.push("(p.title LIKE ? OR p.slug LIKE ?)");
    args.push(`%${q}%`, `%${q}%`);
  }
  if (difficulty) {
    conditions.push("p.difficulty = ?");
    args.push(difficulty);
  }
  if (tag) {
    conditions.push("EXISTS (SELECT 1 FROM json_each(p.tags) WHERE value = ?)");
    args.push(tag);
  }
  if (status) {
    if (status === "unsolved") {
      conditions.push("(up.status IS NULL OR up.status = 'unsolved')");
    } else {
      conditions.push("up.status = ?");
      args.push(status);
    }
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const { total } = db.prepare(
    `SELECT COUNT(*) as total FROM problems p LEFT JOIN user_progress up ON p.id = up.problem_id ${where}`
  ).get(...args) as { total: number };

  const rows = db.prepare(
    `SELECT p.id, p.slug, p.title, p.difficulty, p.tags, p.acceptance_rate, p.is_premium,
            COALESCE(up.status, 'unsolved') as status
     FROM problems p
     LEFT JOIN user_progress up ON p.id = up.problem_id
     ${where}
     ORDER BY p.id
     LIMIT ? OFFSET ?`
  ).all(...args, limit, offset) as Array<{
    id: number; slug: string; title: string; difficulty: string;
    tags: string; acceptance_rate: number; is_premium: number; status: string;
  }>;

  return {
    problems: rows.map((r) => ({ ...r, tags: JSON.parse(r.tags ?? "[]") })),
    total,
    page: pageNum,
    limit,
  };
}

export default async function ProblemsPage({ searchParams }: { searchParams: SearchParams }) {
  const hasSynced = getSetting("has_synced") === "true";
  if (!hasSynced) redirect("/dashboard");

  const params = await searchParams;
  const data = getProblems(params);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Problems</h1>
          {params.tag && (
            <div className="flex items-center gap-2">
              <span className="text-sm bg-blue-600/20 text-blue-300 border border-blue-700 px-3 py-1 rounded-full">
                {params.tag.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
              <Link href="/problems" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">✕ Clear</Link>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Suspense>
            <ProblemSearch />
            <ProblemFilters />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<div className="text-zinc-500 text-sm">Loading...</div>}>
        <ProblemTable
          problems={data.problems}
          total={data.total}
          page={data.page}
          limit={data.limit}
        />
      </Suspense>
    </div>
  );
}
