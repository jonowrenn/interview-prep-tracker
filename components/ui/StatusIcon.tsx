export default function StatusIcon({ status }: { status: string }) {
  if (status === "solved") return <span className="text-green-400 text-sm">✓</span>;
  if (status === "attempted") return <span className="text-yellow-400 text-sm">~</span>;
  return <span className="text-zinc-600 text-sm">○</span>;
}
