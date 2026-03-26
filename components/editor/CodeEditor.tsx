"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type Props = {
  value: string;
  language: string;
  onChange: (code: string) => void;
};

export default function CodeEditor({ value, language, onChange }: Props) {
  return (
    <div className="h-full w-full">
      <MonacoEditor
        height="100%"
        language={language === "python3" ? "python" : language === "cpp" ? "cpp" : language}
        value={value}
        theme="vs-dark"
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          wordWrap: "on",
          tabSize: language === "python" || language === "python3" ? 4 : 2,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 12 },
        }}
        onChange={(val) => onChange(val ?? "")}
      />
    </div>
  );
}
