import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { pushSolution } from "@/lib/github/push";
import { saveSolution } from "@/lib/problems/progress";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { language, code } = await req.json() as { language: string; code: string };
  const db = getDb();

  const problem = db
    .prepare("SELECT id, title, difficulty FROM problems WHERE slug = ?")
    .get(slug) as { id: number; title: string; difficulty: string } | undefined;

  if (!problem) return Response.json({ error: "Not found" }, { status: 404 });

  saveSolution(problem.id, language, code);

  const pushResult = await pushSolution({
    problemId: problem.id,
    slug,
    title: problem.title,
    difficulty: problem.difficulty,
    language,
    code,
  });

  return Response.json({
    pushed: pushResult.status === "success",
    pushStatus: pushResult.status,
    pushError: pushResult.error,
  });
}
