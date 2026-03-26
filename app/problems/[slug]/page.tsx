import { notFound } from "next/navigation";
import ProblemWorkspace from "@/components/problems/ProblemWorkspace";

type Params = Promise<{ slug: string }>;

async function getProblem(slug: string) {
  const res = await fetch(`http://localhost:3000/api/problems/${slug}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load problem");
  return res.json();
}

export default async function ProblemPage({ params }: { params: Params }) {
  const { slug } = await params;
  const problem = await getProblem(slug);
  if (!problem) notFound();

  return <ProblemWorkspace problem={problem} />;
}
