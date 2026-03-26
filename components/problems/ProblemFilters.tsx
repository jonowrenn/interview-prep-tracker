"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const DIFFICULTIES = ["", "Easy", "Medium", "Hard"];
const STATUSES = [
  { value: "", label: "All" },
  { value: "unsolved", label: "Unsolved" },
  { value: "attempted", label: "Attempted" },
  { value: "solved", label: "Solved" },
];

export default function ProblemFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push(`/problems?${params.toString()}`);
    },
    [router, searchParams]
  );

  const difficulty = searchParams.get("difficulty") ?? "";
  const status = searchParams.get("status") ?? "";

  return (
    <div className="flex gap-3">
      <select
        value={difficulty}
        onChange={(e) => update("difficulty", e.target.value)}
        className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
      >
        {DIFFICULTIES.map((d) => (
          <option key={d} value={d}>{d || "All Difficulties"}</option>
        ))}
      </select>

      <select
        value={status}
        onChange={(e) => update("status", e.target.value)}
        className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </div>
  );
}
