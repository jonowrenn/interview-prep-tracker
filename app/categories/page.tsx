import { getDb, getSetting } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

type TagRow = { tag: string; total: number; solved: number };

function getCategories(): TagRow[] {
  const db = getDb();

  // Expand JSON tag arrays into rows, join with progress
  const rows = db.prepare(`
    SELECT
      t.value as tag,
      COUNT(*) as total,
      COUNT(CASE WHEN up.status = 'solved' THEN 1 END) as solved
    FROM problems p, json_each(p.tags) t
    LEFT JOIN user_progress up ON p.id = up.problem_id
    GROUP BY t.value
    ORDER BY total DESC
  `).all() as TagRow[];

  return rows;
}

// Friendly display names for common slugs
const TAG_LABELS: Record<string, string> = {
  "array": "Array",
  "string": "String",
  "hash-table": "Hash Table",
  "dynamic-programming": "Dynamic Programming",
  "math": "Math",
  "sorting": "Sorting",
  "greedy": "Greedy",
  "depth-first-search": "Depth-First Search",
  "binary-search": "Binary Search",
  "database": "Database",
  "breadth-first-search": "Breadth-First Search",
  "tree": "Tree",
  "matrix": "Matrix",
  "two-pointers": "Two Pointers",
  "bit-manipulation": "Bit Manipulation",
  "stack": "Stack",
  "graph": "Graph",
  "design": "Design",
  "simulation": "Simulation",
  "backtracking": "Backtracking",
  "prefix-sum": "Prefix Sum",
  "counting": "Counting",
  "sliding-window": "Sliding Window",
  "linked-list": "Linked List",
  "union-find": "Union Find",
  "ordered-set": "Ordered Set",
  "monotonic-stack": "Monotonic Stack",
  "enumeration": "Enumeration",
  "recursion": "Recursion",
  "trie": "Trie",
  "divide-and-conquer": "Divide and Conquer",
  "binary-search-tree": "Binary Search Tree",
  "bitmask": "Bitmask",
  "queue": "Queue",
  "memoization": "Memoization",
  "topological-sort": "Topological Sort",
  "segment-tree": "Segment Tree",
  "heap-priority-queue": "Heap / Priority Queue",
  "geometry": "Geometry",
  "binary-indexed-tree": "Binary Indexed Tree",
  "hash-function": "Hash Function",
  "number-theory": "Number Theory",
  "string-matching": "String Matching",
  "shortest-path": "Shortest Path",
  "interactive": "Interactive",
  "data-stream": "Data Stream",
  "brainteaser": "Brainteaser",
  "monotonic-queue": "Monotonic Queue",
  "randomized": "Randomized",
  "merge-sort": "Merge Sort",
  "game-theory": "Game Theory",
  "combinatorics": "Combinatorics",
  "doubly-linked-list": "Doubly Linked List",
  "iterator": "Iterator",
  "concurrency": "Concurrency",
  "probability-and-statistics": "Probability & Statistics",
  "suffix-array": "Suffix Array",
};

function label(slug: string) {
  return TAG_LABELS[slug] ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const CATEGORY_COLORS = [
  "border-blue-700 hover:border-blue-500",
  "border-purple-700 hover:border-purple-500",
  "border-green-700 hover:border-green-500",
  "border-yellow-700 hover:border-yellow-500",
  "border-pink-700 hover:border-pink-500",
  "border-cyan-700 hover:border-cyan-500",
  "border-orange-700 hover:border-orange-500",
  "border-rose-700 hover:border-rose-500",
];

export default function CategoriesPage() {
  const hasSynced = getSetting("has_synced") === "true";
  if (!hasSynced) redirect("/dashboard");

  const categories = getCategories();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Categories</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {categories.map((cat, i) => {
          const pct = cat.total ? Math.round((cat.solved / cat.total) * 100) : 0;
          const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
          return (
            <Link
              key={cat.tag}
              href={`/problems?tag=${encodeURIComponent(cat.tag)}`}
              className={`bg-zinc-900 border rounded-xl p-4 transition-all group ${color}`}
            >
              <div className="text-zinc-200 text-sm font-medium group-hover:text-white transition-colors leading-snug mb-2">
                {label(cat.tag)}
              </div>
              <div className="text-zinc-500 text-xs mb-2">{cat.total} problems</div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {cat.solved > 0 && (
                <div className="text-zinc-600 text-xs mt-1">{cat.solved} solved</div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
