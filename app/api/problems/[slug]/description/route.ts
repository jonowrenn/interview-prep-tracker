import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { fetchProblemDetail } from "@/lib/leetcode/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const sevenDays = 7 * 24 * 60 * 60;

  const row = db
    .prepare("SELECT id, description, fetched_at, is_premium FROM problems WHERE slug = ?")
    .get(slug) as { id: number; description: string | null; fetched_at: number | null; is_premium: number } | undefined;

  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  const needsFetch = !row.fetched_at || (now - row.fetched_at) > sevenDays;

  if (!needsFetch && row.description) {
    return Response.json({ description: row.description, codeSnippets: [] });
  }

  if (row.is_premium) {
    return Response.json({ description: "<p class='text-zinc-500 italic'>This is a premium problem.</p>", codeSnippets: [] });
  }

  const detail = await fetchProblemDetail(slug);
  if (!detail) {
    return Response.json({ description: row.description ?? "<p class='text-zinc-500'>Could not load description.</p>", codeSnippets: [] });
  }

  db.prepare(
    "UPDATE problems SET description = ?, constraints = ?, fetched_at = ? WHERE slug = ?"
  ).run(detail.content, detail.constraints ?? null, now, slug);

  return Response.json({
    description: detail.content,
    codeSnippets: detail.codeSnippets ?? [],
  });
}
