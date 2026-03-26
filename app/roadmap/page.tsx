import Link from "next/link";

type Phase = {
  number: number;
  title: string;
  subtitle: string;
  color: string;
  border: string;
  topics: { name: string; tag: string; problems: number; why: string }[];
  goals: string[];
  tips: string[];
};

const PHASES: Phase[] = [
  {
    number: 1,
    title: "Foundation",
    subtitle: "Weeks 1–3 · ~50 problems",
    color: "text-green-400",
    border: "border-green-800",
    goals: [
      "Comfortably solve Easy problems",
      "Understand Big-O notation",
      "Master arrays, strings, and hash maps",
    ],
    topics: [
      { name: "Arrays & Hashing", tag: "array", problems: 9, why: "Most common interview topic. Learn the mental model of indexing and iteration." },
      { name: "Hash Tables", tag: "hash-table", problems: 8, why: "Turn O(n²) brute force into O(n) with a map. Critical pattern." },
      { name: "String Manipulation", tag: "string", problems: 7, why: "Substring, reversal, and pattern matching — appears in ~30% of problems." },
      { name: "Math & Logic", tag: "math", problems: 5, why: "Builds the modular arithmetic and base conversion intuition you'll need." },
    ],
    tips: [
      "Read the problem twice before touching code",
      "Always clarify constraints (negative numbers? duplicates? sorted?)",
      "Brute force first — then optimize",
      "Write test cases before coding",
    ],
  },
  {
    number: 2,
    title: "Core Patterns",
    subtitle: "Weeks 4–8 · ~100 problems",
    color: "text-yellow-400",
    border: "border-yellow-800",
    goals: [
      "Recognize the right pattern within 5 minutes",
      "Solve most Medium problems",
      "Understand recursion deeply",
    ],
    topics: [
      { name: "Two Pointers", tag: "two-pointers", problems: 8, why: "Reduce nested loops. Essential for sorted array and palindrome problems." },
      { name: "Sliding Window", tag: "sliding-window", problems: 6, why: "Optimal for subarray/substring problems. Learn fixed vs variable window." },
      { name: "Binary Search", tag: "binary-search", problems: 10, why: "Goes beyond sorted arrays — learn to binary search on the answer space." },
      { name: "Linked Lists", tag: "linked-list", problems: 7, why: "Pointer manipulation and the classic fast/slow pointer trick." },
      { name: "Stacks & Queues", tag: "stack", problems: 8, why: "Monotonic stack pattern unlocks dozens of problems instantly." },
      { name: "Trees (DFS/BFS)", tag: "tree", problems: 14, why: "Tree traversal is the foundation of graph algorithms and recursion." },
      { name: "Recursion & Backtracking", tag: "backtracking", problems: 9, why: "Learn the decision tree model — essential for combinations/permutations." },
    ],
    tips: [
      "After solving, look at the 'most votes' discussion solution",
      "Re-solve problems you struggled with 3 days later",
      "For trees: always think about what info each node needs to return",
      "Draw out examples on paper — don't start with code",
    ],
  },
  {
    number: 3,
    title: "Advanced Algorithms",
    subtitle: "Weeks 9–14 · ~80 problems",
    color: "text-orange-400",
    border: "border-orange-800",
    goals: [
      "Tackle most Hard problems",
      "Identify DP subproblems instinctively",
      "Handle graph algorithms confidently",
    ],
    topics: [
      { name: "Dynamic Programming", tag: "dynamic-programming", problems: 20, why: "The hardest and most important topic. Start with 1D, then 2D, then intervals." },
      { name: "Graphs (DFS/BFS)", tag: "graph", problems: 12, why: "Matrix traversal, connected components, topological sort." },
      { name: "Heap / Priority Queue", tag: "heap-priority-queue", problems: 7, why: "Top-K patterns, median of stream, scheduling problems." },
      { name: "Greedy", tag: "greedy", problems: 9, why: "Recognize when local optimal = global optimal. Hard to learn, easy to apply." },
      { name: "Tries", tag: "trie", problems: 5, why: "Prefix matching, autocomplete, word search — fast string lookup structure." },
      { name: "Union Find", tag: "union-find", problems: 6, why: "Connected components and cycle detection in one elegant structure." },
    ],
    tips: [
      "For DP: define the state clearly before writing recurrence",
      "For graphs: always track visited nodes to avoid infinite loops",
      "Practice explaining your approach out loud (mock interview habit)",
      "Time yourself — aim for 25 mins per Medium problem",
    ],
  },
  {
    number: 4,
    title: "Interview Ready",
    subtitle: "Weeks 15+ · Ongoing",
    color: "text-blue-400",
    border: "border-blue-800",
    goals: [
      "Solve any problem in a timed interview setting",
      "Communicate clearly while coding",
      "Handle follow-up questions about optimization",
    ],
    topics: [
      { name: "Bit Manipulation", tag: "bit-manipulation", problems: 6, why: "XOR tricks, bit masking — comes up in FAANG interviews." },
      { name: "Segment Trees", tag: "segment-tree", problems: 4, why: "Range query problems — advanced but impressive." },
      { name: "Monotonic Stack", tag: "monotonic-stack", problems: 5, why: "Next greater element, histogram problems, stock spans." },
      { name: "Advanced DP", tag: "dynamic-programming", problems: 15, why: "Knapsack variants, bitmask DP, digit DP — for senior roles." },
    ],
    tips: [
      "Do 2–3 mock interviews per week on Pramp or with friends",
      "Review your notes on each problem after finishing it",
      "Focus on the companies you're targeting (check their Blind posts)",
      "Don't chase a perfect streak — consistency beats perfection",
    ],
  },
];

const STRATEGIES = [
  {
    title: "The Pattern Recognition Framework",
    icon: "🎯",
    body: "Stop trying to memorize solutions. Instead, learn to map problem characteristics to patterns: sorted array → binary search or two pointers; subarray/substring → sliding window; tree/graph traversal → DFS/BFS; optimize a value → DP or greedy. With ~15 core patterns, you can tackle 90% of problems.",
  },
  {
    title: "The Neetcode 150 Approach",
    icon: "📋",
    body: "Don't grind 2000+ random problems. The Neetcode 150 (subset of Blind 75 + extras) covers every core pattern with the most representative problems. Quality over quantity — solve 150 problems deeply rather than 500 problems shallowly.",
  },
  {
    title: "The 25-Minute Rule",
    icon: "⏱️",
    body: "Spend max 25 minutes on a problem. If you're stuck, look at the hint or solution. Understand it completely, implement it yourself without looking, then come back and re-solve it from scratch in 3 days. Struggling past 25 minutes has diminishing returns.",
  },
  {
    title: "Spaced Repetition (built in)",
    icon: "🔁",
    body: "Use the review system in this app. After solving a problem, rate it Hard/Good/Easy. The SM-2 algorithm schedules re-reviews at optimal intervals. This is how you retain what you learn instead of forgetting it within a week.",
  },
  {
    title: "Think Out Loud",
    icon: "🗣️",
    body: "Practice narrating your thought process as you code. Interviewers care about how you think, not just whether you get the answer. Say things like 'I'm noticing the array is sorted, so I could use binary search...' — it shows analytical thinking even when you're stuck.",
  },
  {
    title: "The 3-Pass Method",
    icon: "📝",
    body: "Pass 1: understand the problem and draw examples. Pass 2: think of the brute force approach and its complexity. Pass 3: optimize by identifying the bottleneck. Never skip to Pass 3 — the brute force pass often reveals the pattern.",
  },
];

export default function RoadmapPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white">Learning Roadmap</h1>
        <p className="text-zinc-400 text-sm mt-1">
          A structured path from beginner to interview-ready. Each topic links directly to filtered problems.
        </p>
      </div>

      {/* Phases */}
      <div className="space-y-8">
        {PHASES.map((phase) => (
          <div key={phase.number} className={`border ${phase.border} rounded-2xl overflow-hidden`}>
            {/* Phase header */}
            <div className="px-5 py-4 bg-zinc-900/60">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold uppercase tracking-wider ${phase.color}`}>
                      Phase {phase.number}
                    </span>
                    <span className="text-white font-bold text-lg">{phase.title}</span>
                  </div>
                  <div className="text-zinc-500 text-sm mt-0.5">{phase.subtitle}</div>
                </div>
              </div>

              {/* Goals */}
              <div className="mt-3 flex flex-wrap gap-2">
                {phase.goals.map((g) => (
                  <span key={g} className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full">
                    ✓ {g}
                  </span>
                ))}
              </div>
            </div>

            {/* Topics */}
            <div className="divide-y divide-zinc-800">
              {phase.topics.map((topic) => (
                <div key={topic.tag} className="px-5 py-3 flex items-start justify-between gap-4 hover:bg-zinc-800/30 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-200 text-sm font-medium">{topic.name}</span>
                      <span className="text-xs text-zinc-600">{topic.problems}+ problems</span>
                    </div>
                    <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">{topic.why}</p>
                  </div>
                  <Link
                    href={`/problems?tag=${encodeURIComponent(topic.tag)}`}
                    className="shrink-0 text-xs bg-zinc-800 hover:bg-blue-600 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Practice →
                  </Link>
                </div>
              ))}
            </div>

            {/* Tips */}
            <div className="px-5 py-3 bg-zinc-950/40 border-t border-zinc-800">
              <div className="text-xs text-zinc-500 font-medium uppercase tracking-wide mb-2">Tips for this phase</div>
              <ul className="space-y-1">
                {phase.tips.map((tip) => (
                  <li key={tip} className="text-xs text-zinc-400 flex gap-2">
                    <span className="text-zinc-600 shrink-0">–</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Strategy section */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Study Strategies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STRATEGIES.map((s) => (
            <div key={s.title} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{s.icon}</span>
                <span className="text-white font-semibold text-sm">{s.title}</span>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick reference */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-3">Pattern Quick Reference</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {[
            ["Sorted array", "Binary search or two pointers"],
            ["Subarray / substring", "Sliding window"],
            ["Tree / graph", "DFS or BFS"],
            ["Shortest path", "BFS (unweighted) or Dijkstra"],
            ["Top-K elements", "Heap / priority queue"],
            ["Combinations / subsets", "Backtracking"],
            ["Overlapping subproblems", "Dynamic programming"],
            ["Prefix sums", "Range query or cumulative sum"],
            ["Intervals overlap", "Sort by start, greedy merge"],
            ["Parentheses / nesting", "Stack"],
            ["Connected components", "Union-Find or DFS"],
            ["String prefix matching", "Trie"],
          ].map(([cue, pattern]) => (
            <div key={cue} className="flex items-start gap-2 py-1.5 border-b border-zinc-800/50">
              <span className="text-zinc-500 shrink-0 w-44">{cue}</span>
              <span className="text-blue-400">→</span>
              <span className="text-zinc-300">{pattern}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
