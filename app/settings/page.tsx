import SettingsForm from "@/components/settings/SettingsForm";
import { getSetting } from "@/lib/db";

export default function SettingsPage() {
  const settings = {
    github_owner: getSetting("github_owner") ?? "",
    github_repo: getSetting("github_repo") ?? "",
    github_branch: getSetting("github_branch") ?? "main",
    github_solutions_path: getSetting("github_solutions_path") ?? "solutions",
    github_pat_configured: !!getSetting("github_pat"),
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>
      <SettingsForm settings={settings} />
    </div>
  );
}
