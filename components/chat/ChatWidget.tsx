"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = { role: "user" | "assistant"; content: string };
type ProblemContext = { title: string; difficulty: string; description?: string; slug: string } | null;

export default function ChatWidget({ problemContext }: { problemContext?: ProblemContext }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // Add empty assistant message to stream into
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          problemContext: problemContext ?? null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: err.error ?? "Something went wrong." },
        ]);
        if (err.error?.includes("API key")) setApiKeyMissing(true);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              setMessages((prev) => [
                ...prev.slice(0, -1),
                { role: "assistant", content: parsed.error },
              ]);
              if (parsed.error.includes("API key")) setApiKeyMissing(true);
              break;
            }
            if (parsed.text) {
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role !== "assistant") return prev;
                return [...prev.slice(0, -1), { ...last, content: last.content + parsed.text }];
              });
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "Network error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, problemContext]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const diffColor: Record<string, string> = {
    Easy: "text-green-400",
    Medium: "text-yellow-400",
    Hard: "text-red-400",
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg flex items-center justify-center text-xl transition-all"
        title="AI Tutor"
      >
        {open ? "✕" : "💬"}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-40 w-[380px] h-[520px] bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900 shrink-0">
            <div>
              <div className="text-white font-semibold text-sm">AI Tutor</div>
              {problemContext && (
                <div className="text-xs text-zinc-500 mt-0.5">
                  Context:{" "}
                  <span className={diffColor[problemContext.difficulty] ?? "text-zinc-400"}>
                    {problemContext.title}
                  </span>
                </div>
              )}
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center mt-8 space-y-3">
                <div className="text-3xl">🤖</div>
                <p className="text-zinc-400 text-sm">
                  {problemContext
                    ? `I'm here to help with "${problemContext.title}". What are you stuck on?`
                    : "Ask me anything about LeetCode problems, algorithms, or data structures!"}
                </p>
                <div className="flex flex-col gap-2 mt-4">
                  {(problemContext
                    ? ["Give me a hint", "What pattern should I use?", "Walk me through the approach", "What's the time complexity?"]
                    : ["How do I start with LeetCode?", "Explain dynamic programming", "What's the two-pointer technique?", "How do I prepare for interviews?"]
                  ).map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 0); }}
                      className="text-xs text-left bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-lg transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {apiKeyMissing && (
              <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-xs text-yellow-300">
                Add your Anthropic API key in{" "}
                <a href="/settings" className="underline hover:text-yellow-100">Settings</a>{" "}
                to use the AI tutor.
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-200"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-pre:my-1">
                      {msg.content ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      ) : (
                        <span className="animate-pulse text-zinc-500">Thinking...</span>
                      )}
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-zinc-800 shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask a question... (Enter to send)"
                rows={2}
                className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-blue-500 placeholder:text-zinc-600"
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-3 py-2 text-sm font-medium disabled:opacity-40 transition-colors h-fit"
              >
                Send
              </button>
            </div>
            <p className="text-zinc-700 text-xs mt-1.5 text-center">Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </>
  );
}
