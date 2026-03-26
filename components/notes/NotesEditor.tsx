"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function NotesEditor({ value, onChange }: Props) {
  const [preview, setPreview] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Notes</span>
        <button
          onClick={() => setPreview((p) => !p)}
          className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
        >
          {preview ? "Edit" : "Preview"}
        </button>
      </div>

      {preview ? (
        <div className="flex-1 overflow-auto p-4 prose prose-invert prose-sm max-w-none">
          {value ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-zinc-600 italic">No notes yet.</p>
          )}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write notes in markdown..."
          className="flex-1 bg-transparent text-zinc-300 text-sm p-4 resize-none focus:outline-none font-mono placeholder:text-zinc-600"
        />
      )}
    </div>
  );
}
