import { NextRequest } from "next/server";
import { setSetting, getSetting } from "@/lib/db";
import { settingsBodySchema } from "@/lib/api/schemas";
import { parseJsonBody } from "@/lib/api/validation";

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
  const parsed = await parseJsonBody(req, settingsBodySchema);
  if ("response" in parsed) return parsed.response;

  const allowed = ["github_pat", "github_owner", "github_repo", "github_branch", "github_solutions_path", "anthropic_api_key", "leetcode_session", "autopush_on_accept"];
  for (const key of allowed) {
    const value = parsed.data[key as keyof typeof parsed.data];
    if (value !== undefined) {
      setSetting(key, value);
    }
  }

  return Response.json({ ok: true });
}
