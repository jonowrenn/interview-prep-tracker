export default function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    Easy: "text-green-400 bg-green-400/10",
    Medium: "text-yellow-400 bg-yellow-400/10",
    Hard: "text-red-400 bg-red-400/10",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[difficulty] ?? "text-zinc-400 bg-zinc-800"}`}>
      {difficulty}
    </span>
  );
}
