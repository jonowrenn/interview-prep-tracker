"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = { role: "user" | "assistant"; content: string };
type ProblemContext = { title: string; difficulty: string; description?: string; slug: string };

const QUICK_PROMPTS = [
  "Give me a hint",
  "What pattern should I use?",
  "Walk me through the approach",
  "What's the time complexity?",
  "Show me the solution",
];

export default function InlineChat({ problemContext }: { problemContext: ProblemContext }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMessage: Message = { role: "user", content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, problemContext }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: err.error ?? "Something went wrong." }]);
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
              setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: parsed.error }]);
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
          } catch { /* ignore */ }
        }
      }
    } catch {
      setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: "Network error. Please try again." }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, messages, problemContext]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-purple-400 uppercase tracking-wide">AI Tutor</span>
          <span className="text-zinc-600 text-xs">— ask for hints, explanations, or the solution</span>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="text-xs bg-zinc-800 hover:bg-purple-900/50 hover:border-purple-700 border border-zinc-700 text-zinc-300 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {apiKeyMissing && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-2.5 text-xs text-yellow-300">
            Add your Anthropic API key in{" "}
            <a href="/settings" className="underline hover:text-yellow-100">Settings</a>{" "}
            to use AI Tutor.
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-200"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-pre:my-1 prose-pre:text-xs">
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
      <div className="px-3 pb-3 pt-2 border-t border-zinc-800 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask for a hint... (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-purple-500 placeholder:text-zinc-600"
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="bg-purple-700 hover:bg-purple-600 text-white rounded-xl px-3 py-2 text-sm font-medium disabled:opacity-40 transition-colors shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
