import { NextRequest } from "next/server";
import { getDb, getSetting } from "@/lib/db";

// LeetCode language IDs
const LANG_IDS: Record<string, number> = {
  javascript: 63,
  typescript: 74,
  python3: 71,
  python: 71,
  java: 62,
  cpp: 54,
  c: 48,
  csharp: 51,
  go: 60,
  rust: 73,
  kotlin: 78,
  swift: 83,
  ruby: 72,
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { language, code } = await req.json() as { language: string; code: string };

  const session = getSetting("leetcode_session");
  if (!session) {
    return Response.json({ error: "LeetCode session cookie not configured. Add it in Settings." }, { status: 400 });
  }

  const db = getDb();
  const problem = db
    .prepare("SELECT id, title FROM problems WHERE slug = ?")
    .get(slug) as { id: number; title: string } | undefined;

  if (!problem) return Response.json({ error: "Problem not found" }, { status: 404 });

  const langId = LANG_IDS[language];
  if (!langId) return Response.json({ error: `Unsupported language: ${language}` }, { status: 400 });

  try {
    const res = await fetch(`https://leetcode.com/problems/${slug}/submit/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `LEETCODE_SESSION=${session}`,
        "Referer": `https://leetcode.com/problems/${slug}/`,
        "x-csrftoken": "dummy",
        "Origin": "https://leetcode.com",
      },
      body: JSON.stringify({
        lang: language === "python3" ? "python3" : language,
        question_id: problem.id,
        typed_code: code,
      }),
    });

    if (res.status === 401 || res.status === 403) {
      return Response.json({ error: "LeetCode session expired. Update your session cookie in Settings." }, { status: 401 });
    }

    if (!res.ok) {
      return Response.json({ error: `LeetCode returned ${res.status}. Check your session cookie.` }, { status: 502 });
    }

    const data = await res.json() as { submission_id?: number };
    if (!data.submission_id) {
      return Response.json({ error: "No submission ID returned from LeetCode." }, { status: 502 });
    }

    return Response.json({ submissionId: data.submission_id });
  } catch (err) {
    return Response.json({ error: `Network error: ${String(err)}` }, { status: 500 });
  }
}
