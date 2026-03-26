"use client";

import { useState } from "react";
import { showToast } from "@/components/ui/Toast";

type Props = {
  settings: {
    github_owner: string;
    github_repo: string;
    github_branch: string;
    github_solutions_path: string;
    github_pat_configured: boolean;
  };
};

export default function SettingsForm({ settings }: Props) {
  const [form, setForm] = useState({
    github_owner: settings.github_owner,
    github_repo: settings.github_repo,
    github_branch: settings.github_branch,
    github_solutions_path: settings.github_solutions_path,
    github_pat: "",
  });
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, string> = {
        github_owner: form.github_owner,
        github_repo: form.github_repo,
        github_branch: form.github_branch,
        github_solutions_path: form.github_solutions_path,
      };
      if (form.github_pat) body.github_pat = form.github_pat;

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        showToast("Settings saved!", "success");
        setForm((f) => ({ ...f, github_pat: "" }));
      } else {
        showToast("Failed to save settings.", "error");
      }
    } catch {
      showToast("Error saving settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="text-white font-semibold">GitHub Integration</h2>
        <p className="text-zinc-400 text-sm">
          Solutions will be auto-pushed to{" "}
          <code className="bg-zinc-800 px-1 rounded text-xs">
            {form.github_owner || "owner"}/{form.github_repo || "repo"}/{form.github_solutions_path}/{"{difficulty}/{slug}/{language}.{ext}"}
          </code>
        </p>

        <Field label="GitHub Username / Org" value={form.github_owner} onChange={(v) => update("github_owner", v)} placeholder="octocat" />
        <Field label="Repository Name" value={form.github_repo} onChange={(v) => update("github_repo", v)} placeholder="leetcode-solutions" />
        <Field label="Branch" value={form.github_branch} onChange={(v) => update("github_branch", v)} placeholder="main" />
        <Field label="Solutions Root Path" value={form.github_solutions_path} onChange={(v) => update("github_solutions_path", v)} placeholder="solutions" />

        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">
            Personal Access Token{" "}
            {settings.github_pat_configured && (
              <span className="text-green-400 text-xs">(configured)</span>
            )}
          </label>
          <input
            type="password"
            value={form.github_pat}
            onChange={(e) => update("github_pat", e.target.value)}
            placeholder={settings.github_pat_configured ? "Leave blank to keep existing" : "ghp_..."}
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-zinc-600"
          />
          <p className="text-zinc-600 text-xs mt-1">
            Needs <code className="bg-zinc-800 px-1 rounded">repo</code> scope. Stored locally in SQLite, never sent anywhere.
          </p>
        </div>
      </section>

      <button
        onClick={save}
        disabled={saving}
        className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-zinc-400 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-zinc-600"
      />
    </div>
  );
}
