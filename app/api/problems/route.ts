import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q") ?? "";
  const difficulty = searchParams.get("difficulty") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (q) {
    conditions.push("(p.title LIKE ? OR p.slug LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }
  if (difficulty) {
    conditions.push("p.difficulty = ?");
    params.push(difficulty);
  }
  if (tag) {
    conditions.push("EXISTS (SELECT 1 FROM json_each(p.tags) WHERE value = ?)");
    params.push(tag);
  }
  if (status) {
    if (status === "unsolved") {
      conditions.push("(up.status IS NULL OR up.status = 'unsolved')");
    } else {
      conditions.push("up.status = ?");
      params.push(status);
    }
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRow = db
    .prepare(
      `SELECT COUNT(*) as total FROM problems p LEFT JOIN user_progress up ON p.id = up.problem_id ${where}`
    )
    .get(...params) as { total: number };

  const rows = db
    .prepare(
      `SELECT p.id, p.slug, p.title, p.difficulty, p.tags, p.acceptance_rate, p.is_premium,
              COALESCE(up.status, 'unsolved') as status
       FROM problems p
       LEFT JOIN user_progress up ON p.id = up.problem_id
       ${where}
       ORDER BY p.id
       LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as Array<{
    id: number;
    slug: string;
    title: string;
    difficulty: string;
    tags: string;
    acceptance_rate: number;
    is_premium: number;
    status: string;
  }>;

  const problems = rows.map((r) => ({
    ...r,
    tags: JSON.parse(r.tags ?? "[]"),
  }));

  return Response.json({ problems, total: countRow.total, page, limit });
}
