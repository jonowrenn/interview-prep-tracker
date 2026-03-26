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
    anthropic_api_key_configured: boolean;
    leetcode_session_configured: boolean;
    autopush_on_accept: boolean;
  };
};

export default function SettingsForm({ settings }: Props) {
  const [form, setForm] = useState({
    github_owner: settings.github_owner,
    github_repo: settings.github_repo,
    github_branch: settings.github_branch,
    github_solutions_path: settings.github_solutions_path,
    github_pat: "",
    anthropic_api_key: "",
    leetcode_session: "",
    autopush_on_accept: settings.autopush_on_accept,
  });
  const [saving, setSaving] = useState(false);

  const update = (key: string, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, string> = {
        github_owner: form.github_owner,
        github_repo: form.github_repo,
        github_branch: form.github_branch,
        github_solutions_path: form.github_solutions_path,
        autopush_on_accept: String(form.autopush_on_accept),
      };
      if (form.github_pat) body.github_pat = form.github_pat;
      if (form.anthropic_api_key) body.anthropic_api_key = form.anthropic_api_key;
      if (form.leetcode_session) body.leetcode_session = form.leetcode_session;

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        showToast("Settings saved!", "success");
        setForm((f) => ({ ...f, github_pat: "", anthropic_api_key: "", leetcode_session: "" }));
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

      {/* GitHub */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="text-white font-semibold">GitHub Integration</h2>
        <p className="text-zinc-400 text-sm">
          Solutions pushed to{" "}
          <code className="bg-zinc-800 px-1 rounded text-xs">
            {form.github_owner || "owner"}/{form.github_repo || "repo"}/{form.github_solutions_path}/{"{difficulty}/{slug}/{language}.{ext}"}
          </code>
        </p>
        <Field label="GitHub Username / Org" value={form.github_owner} onChange={(v) => update("github_owner", v)} placeholder="octocat" />
        <Field label="Repository Name" value={form.github_repo} onChange={(v) => update("github_repo", v)} placeholder="leetcode-solutions" />
        <Field label="Branch" value={form.github_branch} onChange={(v) => update("github_branch", v)} placeholder="main" />
        <Field label="Solutions Root Path" value={form.github_solutions_path} onChange={(v) => update("github_solutions_path", v)} placeholder="solutions" />
        <PasswordField
          label="Personal Access Token"
          configured={settings.github_pat_configured}
          value={form.github_pat}
          onChange={(v) => update("github_pat", v)}
          placeholder="ghp_..."
          hint={<>Needs <code className="bg-zinc-800 px-1 rounded">repo</code> scope. Stored locally, never sent anywhere.</>}
        />
      </section>

      {/* LeetCode */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="text-white font-semibold">LeetCode Submission</h2>
        <p className="text-zinc-400 text-sm">
          Required to submit code directly and see your runtime/verdict. Uses your LeetCode session cookie.
        </p>
        <PasswordField
          label="LeetCode Session Cookie"
          configured={settings.leetcode_session_configured}
          value={form.leetcode_session}
          onChange={(v) => update("leetcode_session", v)}
          placeholder="eyJ0eXAiOiJKV1Q..."
          hint={
            <>
              In Chrome: go to leetcode.com → DevTools → Application → Cookies →{" "}
              <code className="bg-zinc-800 px-1 rounded">LEETCODE_SESSION</code>. Stored locally in SQLite.
            </>
          }
          focusColor="focus:border-orange-500"
        />

        {/* Auto-push toggle */}
        <div className="flex items-start justify-between gap-4 pt-1">
          <div>
            <div className="text-sm text-zinc-300 font-medium">Auto-push to GitHub on Accept</div>
            <div className="text-zinc-500 text-xs mt-0.5">
              When your submission is accepted, automatically push the solution to GitHub without clicking a button.
            </div>
          </div>
          <button
            type="button"
            onClick={() => update("autopush_on_accept", !form.autopush_on_accept)}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
              form.autopush_on_accept ? "bg-green-600" : "bg-zinc-700"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                form.autopush_on_accept ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </section>

      {/* AI Tutor */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="text-white font-semibold">AI Tutor</h2>
        <p className="text-zinc-400 text-sm">
          Inline chat panel on problem pages — powered by Claude.
        </p>
        <PasswordField
          label="Anthropic API Key"
          configured={settings.anthropic_api_key_configured}
          value={form.anthropic_api_key}
          onChange={(v) => update("anthropic_api_key", v)}
          placeholder="sk-ant-..."
          hint="Get your key at console.anthropic.com. Stored locally in SQLite."
          focusColor="focus:border-purple-500"
        />
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

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
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

function PasswordField({ label, configured, value, onChange, placeholder, hint, focusColor = "focus:border-blue-500" }: {
  label: string; configured: boolean; value: string; onChange: (v: string) => void;
  placeholder: string; hint: React.ReactNode; focusColor?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-zinc-400 mb-1.5">
        {label}{" "}
        {configured && <span className="text-green-400 text-xs">(configured)</span>}
      </label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={configured ? "Leave blank to keep existing" : placeholder}
        className={`w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none placeholder:text-zinc-600 ${focusColor}`}
      />
      <p className="text-zinc-600 text-xs mt-1">{hint}</p>
    </div>
  );
}
