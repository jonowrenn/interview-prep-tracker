"use client";

import { useState, useEffect, useRef } from "react";
import CodeEditor from "@/components/editor/CodeEditor";
import LanguageSelector from "@/components/editor/LanguageSelector";
import NotesEditor from "@/components/notes/NotesEditor";
import DifficultyBadge from "@/components/ui/DifficultyBadge";
import StatusIcon from "@/components/ui/StatusIcon";
import { showToast } from "@/components/ui/Toast";
import InlineChat from "@/components/chat/InlineChat";

type CodeSnippet = { lang: string; langSlug: string; code: string };
type ReviewState = { next_review: number; interval_days: number; repetitions: number };

type Problem = {
  id: number;
  slug: string;
  title: string;
  difficulty: string;
  description: string | null;
  descriptionCached: boolean;
  tags: string[];
  status: string;
  notes: string;
  solutions: Array<{ language: string; code: string }>;
  codeSnippets: CodeSnippet[];
  review: ReviewState | null;
};

type SubmissionResult = {
  state: string;
  status_msg?: string;
  status_code?: number;
  runtime?: string;
  memory?: string;
  runtime_percentile?: number;
  memory_percentile?: number;
  total_correct?: number;
  total_testcases?: number;
  compile_error?: string;
  full_runtime_error?: string;
  accepted?: boolean;
  autopushStatus?: string;
  review?: ReviewState | null;
};

const STARTER: Record<string, string> = {
  javascript: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar solve = function() {\n  \n};",
  typescript: "function solve(): void {\n  \n}",
  python3: "class Solution:\n    def solve(self) -> None:\n        pass",
  java: "class Solution {\n    public void solve() {\n        \n    }\n}",
  cpp: "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve() {\n        \n    }\n};",
  go: "func solve() {\n    \n}",
  rust: "impl Solution {\n    pub fn solve() {\n        \n    }\n}",
};

function getStarter(langSlug: string, snippets: CodeSnippet[]): string {
  const snippet = snippets.find((s) => s.langSlug === langSlug);
  return snippet?.code ?? STARTER[langSlug] ?? "// Start coding here\n";
}

async function readJson<T>(res: Response): Promise<T | null> {
  try {
    return await res.json() as T;
  } catch {
    return null;
  }
}

const STATUS_COLORS: Record<number, string> = {
  10: "text-green-400 bg-green-400/10 border-green-700",   // Accepted
  11: "text-red-400 bg-red-400/10 border-red-700",          // Wrong Answer
  12: "text-red-400 bg-red-400/10 border-red-700",          // Memory Limit
  13: "text-red-400 bg-red-400/10 border-red-700",          // Output Limit
  14: "text-yellow-400 bg-yellow-400/10 border-yellow-700", // TLE
  15: "text-orange-400 bg-orange-400/10 border-orange-700", // Runtime Error
  20: "text-orange-400 bg-orange-400/10 border-orange-700", // Compile Error
};

export default function ProblemWorkspace({ problem }: { problem: Problem }) {
  const [tab, setTab] = useState<"description" | "notes">("description");
  const [chatOpen, setChatOpen] = useState(false);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(() => {
    const saved = problem.solutions.find((s) => s.language === "javascript");
    if (saved) return saved.code;
    if (typeof window !== "undefined") {
      const draft = localStorage.getItem(`draft-${problem.slug}-javascript`);
      if (draft) return draft;
    }
    return getStarter("javascript", problem.codeSnippets);
  });
  const [notes, setNotes] = useState(problem.notes ?? "");
  const [status, setStatus] = useState(problem.status);
  const [review, setReview] = useState(problem.review);
  const [saving, setSaving] = useState(false);

  // Description lazy loading
  const [description, setDescription] = useState<string | null>(problem.description);
  const [codeSnippets, setCodeSnippets] = useState<CodeSnippet[]>(problem.codeSnippets ?? []);
  const [descLoading, setDescLoading] = useState(!problem.descriptionCached);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmissionResult | null>(null);
  const [pushing, setPushing] = useState(false);

  const [leftWidth, setLeftWidth] = useState(50);
  const dragging = useRef(false);
  const container = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Lazy-load description
  useEffect(() => {
    if (problem.descriptionCached && problem.description) {
      setDescription(problem.description);
      setDescLoading(false);
      return;
    }
    setDescLoading(true);
    fetch(`/api/problems/${problem.slug}/description`)
      .then((r) => r.json())
      .then((data) => {
        if (data.description) setDescription(data.description);
        if (data.codeSnippets?.length) setCodeSnippets(data.codeSnippets);
      })
      .catch(() => {/* ignore */})
      .finally(() => setDescLoading(false));
  }, [problem.slug, problem.descriptionCached, problem.description]);

  // Auto-save draft
  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem(`draft-${problem.slug}-${language}`, code);
    }, 2000);
    return () => clearTimeout(t);
  }, [code, language, problem.slug]);

  // Auto-save notes
  useEffect(() => {
    const t = setTimeout(async () => {
      await fetch(`/api/problems/${problem.slug}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: notes }),
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [notes, problem.slug]);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    const saved = problem.solutions.find((s) => s.language === lang);
    if (saved) {
      setCode(saved.code);
    } else {
      const draft = typeof window !== "undefined" ? localStorage.getItem(`draft-${problem.slug}-${lang}`) : null;
      setCode(draft ?? getStarter(lang, codeSnippets));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/solutions/${problem.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code }),
      });
      const data = await readJson<{ error?: string }>(res);
      if (!res.ok) {
        showToast(data?.error ?? "Failed to save.", "error");
        return;
      }
      showToast("Draft saved.", "success");
    } catch {
      showToast("Failed to save.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setSubmitting(true);
    setSubmitResult(null);

    try {
      const saveRes = await fetch(`/api/solutions/${problem.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code }),
      });
      const saveData = await readJson<{ error?: string }>(saveRes);

      if (!saveRes.ok) {
        showToast(saveData?.error ?? "Failed to save before submitting.", "error");
        setSubmitting(false);
        return;
      }

      const res = await fetch(`/api/submit/${problem.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code }),
      });
      const data = await readJson<{ error?: string; submissionId?: number }>(res);

      if (!res.ok) {
        showToast(data?.error ?? "Submission failed.", "error");
        setSubmitting(false);
        return;
      }

      const submissionId = data?.submissionId;
      if (!submissionId) {
        showToast("Submission failed.", "error");
        setSubmitting(false);
        return;
      }

      // Poll for result
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        if (attempts > 30) {
          clearInterval(pollRef.current!);
          setSubmitting(false);
          showToast("Timed out waiting for result.", "error");
          return;
        }

        const checkRes = await fetch(`/api/submit/${problem.slug}/check/${submissionId}?language=${language}`);
        const result = await readJson<SubmissionResult & { error?: string }>(checkRes);

        if (!checkRes.ok) {
          clearInterval(pollRef.current!);
          setSubmitting(false);
          showToast(result?.error ?? "Failed to check submission.", "error");
          return;
        }

        if (!result) {
          clearInterval(pollRef.current!);
          setSubmitting(false);
          showToast("Failed to read submission result.", "error");
          return;
        }

        if (result.state === "SUCCESS" || result.state === "FAILED") {
          clearInterval(pollRef.current!);
          setSubmitting(false);
          setSubmitResult(result);

          if (result.accepted) {
            setStatus("solved");
            if (result.review) setReview(result.review);
            if (result.autopushStatus === "success") {
              showToast("Accepted! Solution auto-pushed to GitHub.", "success");
            } else {
              showToast("Accepted!", "success");
            }
          }
        }
      }, 2000);
    } catch {
      showToast("Submission error.", "error");
      setSubmitting(false);
    }
  };

  const handlePushToGithub = async () => {
    setPushing(true);
    try {
      const res = await fetch(`/api/solutions/${problem.slug}/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code }),
      });
      const data = await readJson<{ error?: string; pushStatus?: string; pushError?: string }>(res);

      if (!res.ok) {
        showToast(data?.error ?? "Push failed.", "error");
        return;
      }

      if (data?.pushStatus === "success") {
        setSubmitResult((current) => current ? { ...current, autopushStatus: "success" } : current);
        showToast("Pushed to GitHub!", "success");
      } else if (data?.pushStatus === "not_configured") {
        showToast("Configure GitHub in Settings first.", "info");
      } else {
        showToast(`Push failed: ${data?.pushError ?? "Unknown error"}`, "error");
      }
    } finally {
      setPushing(false);
    }
  };

  const handleMarkAttempted = async () => {
    const res = await fetch(`/api/problems/${problem.slug}/progress`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "attempted" }),
    });
    if (!res.ok) {
      showToast("Failed to mark attempted.", "error");
      return;
    }
    setStatus("attempted");
    showToast("Marked as attempted.", "info");
  };

  const handleReview = async (quality: "hard" | "good" | "easy") => {
    const res = await fetch(`/api/problems/${problem.slug}/review`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quality }),
    });
    const data = await readJson<{ error?: string; intervalDays?: number; review?: ReviewState }>(res);
    if (!res.ok || data?.intervalDays == null || !data.review) {
      showToast(data?.error ?? "Failed to log review.", "error");
      return;
    }
    setReview(data.review);
    showToast(`Review logged. Next in ${data.intervalDays} day(s).`, "success");
  };

  // Drag to resize
  const onMouseDown = () => { dragging.current = true; };
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !container.current) return;
      const rect = container.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftWidth(Math.max(25, Math.min(75, pct)));
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900 shrink-0 gap-2 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-zinc-500 text-sm shrink-0">#{problem.id}</span>
          <h1 className="text-white font-semibold truncate">{problem.title}</h1>
          <DifficultyBadge difficulty={problem.difficulty} />
          <StatusIcon status={status} />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {status !== "attempted" && status !== "solved" && (
            <button onClick={handleMarkAttempted} className="text-sm px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors">
              Attempted
            </button>
          )}
          {(status === "solved" || review) && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-zinc-500">Review:</span>
              {(["hard", "good", "easy"] as const).map((q) => (
                <button key={q} onClick={() => handleReview(q)} className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 capitalize transition-colors">{q}</button>
              ))}
            </div>
          )}
          <LanguageSelector value={language} onChange={handleLanguageChange} />
          <button
            onClick={() => setChatOpen((o) => !o)}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${chatOpen ? "bg-purple-700 text-white" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"}`}
          >
            🤖 AI Tutor
          </button>
          <button onClick={handleSave} disabled={saving} className="text-sm px-3 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 transition-colors disabled:opacity-50">
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button onClick={handlePushToGithub} disabled={pushing} className="text-sm px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors disabled:opacity-50">
            {pushing ? "Pushing..." : "Push"}
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="text-sm px-4 py-1.5 rounded-lg bg-green-700 hover:bg-green-600 text-white font-medium transition-colors disabled:opacity-50">
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>

      {/* Submission result bar */}
      {submitResult && submitResult.state === "SUCCESS" && (
        <div className={`px-4 py-2.5 border-b flex items-center justify-between gap-4 flex-wrap shrink-0 ${STATUS_COLORS[submitResult.status_code ?? 0] ?? "text-zinc-300 bg-zinc-800/50 border-zinc-700"} border`}>
          <div className="flex items-center gap-4 flex-wrap text-sm">
            <span className="font-semibold">{submitResult.status_msg}</span>
            {submitResult.status_code === 10 && (
              <>
                {submitResult.runtime && (
                  <span className="text-xs opacity-80">
                    Runtime: <strong>{submitResult.runtime}</strong>
                    {submitResult.runtime_percentile != null && ` — beats ${submitResult.runtime_percentile.toFixed(1)}%`}
                  </span>
                )}
                {submitResult.memory && (
                  <span className="text-xs opacity-80">
                    Memory: <strong>{submitResult.memory}</strong>
                    {submitResult.memory_percentile != null && ` — beats ${submitResult.memory_percentile.toFixed(1)}%`}
                  </span>
                )}
              </>
            )}
            {submitResult.total_testcases != null && submitResult.status_code !== 10 && (
              <span className="text-xs opacity-80">
                {submitResult.total_correct}/{submitResult.total_testcases} test cases passed
              </span>
            )}
            {submitResult.compile_error && (
              <span className="text-xs opacity-80 truncate max-w-xs">{submitResult.compile_error}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {submitResult.accepted && submitResult.autopushStatus !== "success" && (
              <button
                onClick={handlePushToGithub}
                disabled={pushing}
                className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/20 font-medium"
              >
                {pushing ? "Pushing..." : "Push to GitHub"}
              </button>
            )}
            {submitResult.accepted && submitResult.autopushStatus === "success" && (
              <span className="text-xs opacity-70">✓ Pushed to GitHub</span>
            )}
            <button onClick={() => setSubmitResult(null)} className="text-xs opacity-50 hover:opacity-100 transition-opacity">✕</button>
          </div>
        </div>
      )}

      {/* Split pane */}
      <div ref={container} className="flex flex-1 overflow-hidden">
        {/* Left pane */}
        <div className="flex flex-col overflow-hidden" style={{ width: `${leftWidth}%` }}>
          <div className="flex border-b border-zinc-800 bg-zinc-900 shrink-0">
            {(["description", "notes"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm capitalize transition-colors ${tab === t ? "text-white border-b-2 border-blue-500" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto">
            {tab === "description" ? (
              descLoading ? (
                <div className="p-4 space-y-3 animate-pulse">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className={`h-3 bg-zinc-800 rounded ${i % 3 === 0 ? "w-3/4" : i % 2 === 0 ? "w-full" : "w-5/6"}`} />
                  ))}
                </div>
              ) : (
                <div
                  className="p-4 prose prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: description ?? "<p class='text-zinc-500'>Could not load description.</p>" }}
                />
              )
            ) : (
              <NotesEditor value={notes} onChange={setNotes} />
            )}
          </div>
        </div>

        {/* Drag handle */}
        <div onMouseDown={onMouseDown} className="w-1 bg-zinc-800 hover:bg-blue-600 cursor-col-resize transition-colors shrink-0" />

        {/* Right pane */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className={`${chatOpen ? "h-[55%]" : "flex-1"} overflow-hidden`}>
            <CodeEditor value={code} language={language} onChange={setCode} />
          </div>
          {chatOpen && (
            <>
              <div className="h-px bg-zinc-800 shrink-0" />
              <div className="flex-1 overflow-hidden">
                <InlineChat problemContext={{ title: problem.title, difficulty: problem.difficulty, description: description ?? undefined, slug: problem.slug }} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
