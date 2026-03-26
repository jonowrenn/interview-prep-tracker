import { getOctokit, getGithubConfig } from "./client";
import { getDb } from "../db";

const LANG_EXT: Record<string, string> = {
  javascript: "js",
  typescript: "ts",
  python: "py",
  python3: "py",
  java: "java",
  cpp: "cpp",
  c: "c",
  csharp: "cs",
  go: "go",
  rust: "rs",
  kotlin: "kt",
  swift: "swift",
  ruby: "rb",
};

export async function pushSolution(params: {
  problemId: number;
  slug: string;
  title: string;
  difficulty: string;
  language: string;
  code: string;
}): Promise<{ status: "success" | "failed" | "not_configured"; sha?: string; error?: string }> {
  const { owner, repo, branch, rootPath } = getGithubConfig();

  if (!owner || !repo) {
    return { status: "not_configured" };
  }

  const ext = LANG_EXT[params.language] ?? params.language;
  const filePath = `${rootPath}/${params.difficulty.toLowerCase()}/${params.slug}/${params.language}.${ext}`;
  const commitMessage = `feat: solve ${params.title} in ${params.language}`;
  const content = Buffer.from(params.code).toString("base64");

  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  try {
    const octokit = getOctokit();

    // Check if file exists to get SHA for update
    let existingSha: string | undefined;
    try {
      const existing = await octokit.repos.getContent({ owner, repo, path: filePath, ref: branch });
      if (!Array.isArray(existing.data) && existing.data.type === "file") {
        existingSha = existing.data.sha;
      }
    } catch {
      // File doesn't exist yet, that's fine
    }

    const result = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: commitMessage,
      content,
      branch,
      ...(existingSha ? { sha: existingSha } : {}),
    });

    const sha = result.data.content?.sha ?? undefined;

    db.prepare(`
      INSERT INTO github_push_log (problem_id, language, sha, pushed_at, status)
      VALUES (?, ?, ?, ?, 'success')
    `).run(params.problemId, params.language, sha ?? null, now);

    return { status: "success", sha };
  } catch (err) {
    const error = String(err);
    db.prepare(`
      INSERT INTO github_push_log (problem_id, language, pushed_at, status, error)
      VALUES (?, ?, ?, 'failed', ?)
    `).run(params.problemId, params.language, now, error);

    return { status: "failed", error };
  }
}
