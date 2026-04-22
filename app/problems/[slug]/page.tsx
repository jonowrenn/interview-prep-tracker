import { notFound } from "next/navigation";
import ProblemWorkspace from "@/components/problems/ProblemWorkspace";
import { getProblemWorkspaceData } from "@/lib/problems/workspace";

type Params = Promise<{ slug: string }>;

export default async function ProblemPage({ params }: { params: Params }) {
  const { slug } = await params;
  const problem = getProblemWorkspaceData(slug);
  if (!problem) notFound();

  return <ProblemWorkspace problem={problem} />;
}
