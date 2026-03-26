"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import CodeEditor from "@/components/editor/CodeEditor";
import LanguageSelector, { LANGUAGES } from "@/components/editor/LanguageSelector";
import NotesEditor from "@/components/notes/NotesEditor";
import DifficultyBadge from "@/components/ui/DifficultyBadge";
import StatusIcon from "@/components/ui/StatusIcon";
import { showToast } from "@/components/ui/Toast";
import InlineChat from "@/components/chat/InlineChat";

type CodeSnippet = { lang: string; langSlug: string; code: string };

type Problem = {
  id: number;
  slug: string;
  title: string;
  difficulty: string;
  description: string | null;
  tags: string[];
  status: string;
  notes: string;
  solutions: Array<{ language: string; code: string }>;
  codeSnippets: CodeSnippet[];
  review: { next_review: number; interval_days: number } | null;
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
  const [saving, setSaving] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50); // percentage
  const dragging = useRef(false);
  const container = useRef<HTMLDivElement>(null);

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

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    const saved = problem.solutions.find((s) => s.language === lang);
    if (saved) {
      setCode(saved.code);
    } else {
      const draft = typeof window !== "undefined" ? localStorage.getItem(`draft-${problem.slug}-${lang}`) : null;
      setCode(draft ?? getStarter(lang, problem.codeSnippets));
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/solutions/${problem.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code }),
      });
      const data = await res.json();
      setStatus("solved");

      if (data.pushStatus === "success") {
        showToast("Solution saved and pushed to GitHub!", "success");
      } else if (data.pushStatus === "not_configured") {
        showToast("Solution saved. Configure GitHub in Settings to auto-push.", "info");
      } else if (data.pushStatus === "failed") {
        showToast(`Solution saved. GitHub push failed: ${data.pushError}`, "error");
      } else {
        showToast("Solution saved!", "success");
      }
    } catch {
      showToast("Failed to save solution.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAttempted = async () => {
    await fetch(`/api/problems/${problem.slug}/progress`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "attempted" }),
    });
    setStatus("attempted");
    showToast("Marked as attempted.", "info");
  };

  const handleReview = async (quality: "hard" | "good" | "easy") => {
    const res = await fetch(`/api/problems/${problem.slug}/review`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quality }),
    });
    const data = await res.json();
    showToast(`Review logged. Next review in ${data.intervalDays} day(s).`, "success");
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
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-zinc-500 text-sm">#{problem.id}</span>
          <h1 className="text-white font-semibold">{problem.title}</h1>
          <DifficultyBadge difficulty={problem.difficulty} />
          <StatusIcon status={status} />
          <div className="flex gap-1 flex-wrap">
            {problem.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status !== "attempted" && status !== "solved" && (
            <button
              onClick={handleMarkAttempted}
              className="text-sm px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            >
              Mark Attempted
            </button>
          )}
          {problem.review && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-zinc-500 mr-1">Review:</span>
              {(["hard", "good", "easy"] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => handleReview(q)}
                  className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 capitalize transition-colors"
                >
                  {q}
                </button>
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
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="text-sm px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save & Push"}
          </button>
        </div>
      </div>

      {/* Split pane */}
      <div ref={container} className="flex flex-1 overflow-hidden">
        {/* Left pane */}
        <div className="flex flex-col overflow-hidden" style={{ width: `${leftWidth}%` }}>
          {/* Tabs */}
          <div className="flex border-b border-zinc-800 bg-zinc-900 shrink-0">
            {(["description", "notes"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm capitalize transition-colors ${
                  tab === t
                    ? "text-white border-b-2 border-blue-500"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto">
            {tab === "description" ? (
              <div
                className="p-4 prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: problem.description ?? "<p class='text-zinc-500'>Loading description...</p>",
                }}
              />
            ) : (
              <NotesEditor value={notes} onChange={setNotes} />
            )}
          </div>
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={onMouseDown}
          className="w-1 bg-zinc-800 hover:bg-blue-600 cursor-col-resize transition-colors shrink-0"
        />

        {/* Right pane - Editor + optional chat */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className={`${chatOpen ? "h-[55%]" : "flex-1"} overflow-hidden transition-all`}>
            <CodeEditor value={code} language={language} onChange={setCode} />
          </div>
          {chatOpen && (
            <>
              <div className="h-px bg-zinc-800 shrink-0" />
              <div className="flex-1 overflow-hidden">
                <InlineChat
                  problemContext={{
                    title: problem.title,
                    difficulty: problem.difficulty,
                    description: problem.description ?? undefined,
                    slug: problem.slug,
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
