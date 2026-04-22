import { NextRequest } from "next/server";
import { getProblemWorkspaceData } from "@/lib/problems/workspace";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const problem = getProblemWorkspaceData(slug);

  if (!problem) {
    return Response.json({ error: "Problem not found" }, { status: 404 });
  }

  return Response.json(problem);
}
