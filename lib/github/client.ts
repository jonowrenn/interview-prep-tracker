import { Octokit } from "@octokit/rest";
import { getSetting } from "../db";

export function getOctokit(): Octokit {
  const pat = getSetting("github_pat");
  if (!pat) throw new Error("GitHub PAT not configured");
  return new Octokit({ auth: pat });
}

export function getGithubConfig() {
  const owner = getSetting("github_owner");
  const repo = getSetting("github_repo");
  const branch = getSetting("github_branch") ?? "main";
  const rootPath = getSetting("github_solutions_path") ?? "solutions";
  return { owner, repo, branch, rootPath };
}
