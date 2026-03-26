"use client";

import { useState, useEffect } from "react";

export type ToastType = "success" | "error" | "info";

let _show: ((msg: string, type?: ToastType) => void) | null = null;

export function showToast(msg: string, type: ToastType = "info") {
  _show?.(msg, type);
}

export default function Toast() {
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string; type: ToastType }>>([]);

  useEffect(() => {
    _show = (msg, type = "info") => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, msg, type }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
    };
    return () => { _show = null; };
  }, []);

  const colors: Record<ToastType, string> = {
    success: "bg-green-800 border-green-700 text-green-100",
    error: "bg-red-900 border-red-800 text-red-100",
    info: "bg-zinc-800 border-zinc-700 text-zinc-100",
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`px-4 py-2.5 rounded-lg border text-sm shadow-lg ${colors[t.type]}`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
