import { getDb } from "@/lib/db";
import { sanitizeProblemHtml } from "@/lib/content/sanitize";

type CodeSnippet = { lang: string; langSlug: string; code: string };

type ReviewState = {
  next_review: number;
  interval_days: number;
  repetitions: number;
};

type ProblemRow = {
  id: number;
  slug: string;
  title: string;
  difficulty: string;
  description: string | null;
  tags: string;
  status: string;
};

type SolutionRow = {
  language: string;
  code: string;
  updated_at: number;
};

export type ProblemWorkspaceData = {
  id: number;
  slug: string;
  title: string;
  difficulty: string;
  description: string | null;
  descriptionCached: boolean;
  tags: string[];
  status: string;
  notes: string;
  solutions: SolutionRow[];
  codeSnippets: CodeSnippet[];
  review: ReviewState | null;
};

export function getProblemWorkspaceData(slug: string): ProblemWorkspaceData | null {
  const db = getDb();

  const row = db
    .prepare(
      `SELECT p.id, p.slug, p.title, p.difficulty, p.description, p.tags,
              COALESCE(up.status, 'unsolved') as status
       FROM problems p
       LEFT JOIN user_progress up ON p.id = up.problem_id
       WHERE p.slug = ?`
    )
    .get(slug) as ProblemRow | undefined;

  if (!row) return null;

  const solutions = db
    .prepare("SELECT language, code, updated_at FROM solutions WHERE problem_id = ?")
    .all(row.id) as SolutionRow[];

  const notes = db
    .prepare("SELECT content FROM notes WHERE problem_id = ?")
    .get(row.id) as { content: string } | undefined;

  const review = db
    .prepare("SELECT next_review, interval_days, repetitions FROM review_schedule WHERE problem_id = ?")
    .get(row.id) as ReviewState | undefined;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    difficulty: row.difficulty,
    description: row.description ? sanitizeProblemHtml(row.description) : null,
    descriptionCached: !!row.description,
    tags: JSON.parse(row.tags ?? "[]"),
    status: row.status,
    notes: notes?.content ?? "",
    solutions,
    codeSnippets: [],
    review: review ?? null,
  };
}
