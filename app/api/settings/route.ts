import { NextRequest } from "next/server";
import { getDb, setSetting, getSetting } from "@/lib/db";

export async function GET() {
  return Response.json({
    github_pat: getSetting("github_pat") ? "configured" : null,
    github_owner: getSetting("github_owner"),
    github_repo: getSetting("github_repo"),
    github_branch: getSetting("github_branch") ?? "main",
    github_solutions_path: getSetting("github_solutions_path") ?? "solutions",
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json() as Record<string, string>;

  const allowed = ["github_pat", "github_owner", "github_repo", "github_branch", "github_solutions_path", "anthropic_api_key", "leetcode_session", "autopush_on_accept"];
  for (const key of allowed) {
    if (body[key] !== undefined) {
      setSetting(key, body[key]);
    }
  }

  return Response.json({ ok: true });
}
