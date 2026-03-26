import { NextRequest } from "next/server";
import { getSetting, getDb } from "@/lib/db";
import { pushSolution } from "@/lib/github/push";

export type SubmissionResult = {
  state: "PENDING" | "STARTED" | "SUCCESS" | "FAILED";
  status_msg?: string; // "Accepted", "Wrong Answer", "Time Limit Exceeded", etc.
  status_code?: number; // 10=Accepted, 11=WA, 14=TLE, 15=RE, 20=CE
  runtime?: string;
  memory?: string;
  runtime_percentile?: number;
  memory_percentile?: number;
  total_correct?: number;
  total_testcases?: number;
  compile_error?: string;
  full_runtime_error?: string;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; submissionId: string }> }
) {
  const { slug, submissionId } = await params;
  const session = getSetting("leetcode_session");

  if (!session) {
    return Response.json({ error: "LeetCode session not configured." }, { status: 400 });
  }

  try {
    const res = await fetch(`https://leetcode.com/submissions/detail/${submissionId}/check/`, {
      headers: {
        "Cookie": `LEETCODE_SESSION=${session}`,
        "Referer": `https://leetcode.com/problems/${slug}/`,
      },
    });

    if (!res.ok) {
      return Response.json({ error: `LeetCode check returned ${res.status}` }, { status: 502 });
    }

    const raw = await res.json() as Record<string, unknown>;

    const result: SubmissionResult = {
      state: (raw.state as string) === "SUCCESS" ? "SUCCESS"
        : (raw.state as string) === "STARTED" ? "STARTED"
        : (raw.state as string) === "FAILED" ? "FAILED"
        : "PENDING",
      status_msg: raw.status_msg as string | undefined,
      status_code: raw.status_code as number | undefined,
      runtime: raw.status_runtime as string | undefined,
      memory: raw.status_memory as string | undefined,
      runtime_percentile: raw.runtime_percentile as number | undefined,
      memory_percentile: raw.memory_percentile as number | undefined,
      total_correct: raw.total_correct as number | undefined,
      total_testcases: raw.total_testcases as number | undefined,
      compile_error: raw.compile_error as string | undefined,
      full_runtime_error: raw.full_runtime_error as string | undefined,
    };

    // If accepted, handle progress + optional auto-push
    if (result.state === "SUCCESS" && result.status_code === 10) {
      const db = getDb();
      const problem = db
        .prepare("SELECT id, title, difficulty FROM problems WHERE slug = ?")
        .get(slug) as { id: number; title: string; difficulty: string } | undefined;

      if (problem) {
        const now = Math.floor(Date.now() / 1000);
        const today = new Date().toISOString().split("T")[0];

        db.prepare(
          `INSERT INTO user_progress (problem_id, status, solved_at, attempts, updated_at)
           VALUES (?, 'solved', ?, 1, ?)
           ON CONFLICT(problem_id) DO UPDATE SET
             status = 'solved',
             solved_at = COALESCE(user_progress.solved_at, excluded.solved_at),
             attempts = user_progress.attempts + 1,
             updated_at = excluded.updated_at`
        ).run(problem.id, now, now);

        db.prepare("INSERT INTO activity_log (date, problem_id, action) VALUES (?, ?, 'solved')").run(today, problem.id);

        // Auto-push if enabled
        const autopush = getSetting("autopush_on_accept") === "true";
        const language = req.nextUrl.searchParams.get("language") ?? "javascript";
        const codeSolution = db
          .prepare("SELECT code FROM solutions WHERE problem_id = ? AND language = ?")
          .get(problem.id, language) as { code: string } | undefined;

        let pushStatus = "not_configured";
        if (autopush && codeSolution) {
          const pushed = await pushSolution({
            problemId: problem.id,
            slug,
            title: problem.title,
            difficulty: problem.difficulty,
            language,
            code: codeSolution.code,
          });
          pushStatus = pushed.status;
        }

        return Response.json({ ...result, accepted: true, autopushStatus: pushStatus });
      }
    }

    return Response.json({ ...result, accepted: result.status_code === 10 });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
