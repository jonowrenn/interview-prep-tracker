import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { solutionBodySchema } from "@/lib/api/schemas";
import { parseJsonBody } from "@/lib/api/validation";
import { saveSolution } from "@/lib/problems/progress";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = getDb();
  const problem = db.prepare("SELECT id FROM problems WHERE slug = ?").get(slug) as { id: number } | undefined;
  if (!problem) return Response.json({ error: "Not found" }, { status: 404 });

  const solutions = db
    .prepare("SELECT language, code, updated_at FROM solutions WHERE problem_id = ?")
    .all(problem.id);

  return Response.json({ solutions });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const parsed = await parseJsonBody(req, solutionBodySchema);
  if ("response" in parsed) return parsed.response;

  const { language, code } = parsed.data;
  const db = getDb();

  const problem = db
    .prepare("SELECT id FROM problems WHERE slug = ?")
    .get(slug) as { id: number } | undefined;

  if (!problem) return Response.json({ error: "Not found" }, { status: 404 });

  saveSolution(problem.id, language, code);

  return Response.json({ saved: true });
}
