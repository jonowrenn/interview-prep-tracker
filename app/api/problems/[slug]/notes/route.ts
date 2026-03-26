import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = getDb();
  const problem = db.prepare("SELECT id FROM problems WHERE slug = ?").get(slug) as { id: number } | undefined;
  if (!problem) return Response.json({ error: "Not found" }, { status: 404 });

  const row = db.prepare("SELECT content FROM notes WHERE problem_id = ?").get(problem.id) as { content: string } | undefined;
  return Response.json({ content: row?.content ?? "" });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { content } = await req.json() as { content: string };
  const db = getDb();
  const problem = db.prepare("SELECT id FROM problems WHERE slug = ?").get(slug) as { id: number } | undefined;
  if (!problem) return Response.json({ error: "Not found" }, { status: 404 });

  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    `INSERT INTO notes (problem_id, content, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(problem_id) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at`
  ).run(problem.id, content ?? "", now);

  return Response.json({ ok: true });
}
