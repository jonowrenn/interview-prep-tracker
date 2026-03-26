"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

export default function ProblemSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  const push = useCallback(
    (q: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (q) params.set("q", q);
      else params.delete("q");
      params.delete("page");
      router.push(`/problems?${params.toString()}`);
    },
    [router, searchParams]
  );

  useEffect(() => {
    const timer = setTimeout(() => push(value), 300);
    return () => clearTimeout(timer);
  }, [value, push]);

  return (
    <input
      type="search"
      placeholder="Search problems..."
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-1.5 w-64 focus:outline-none focus:border-blue-500 placeholder:text-zinc-500"
    />
  );
}
