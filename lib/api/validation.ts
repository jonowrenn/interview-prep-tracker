import { ZodError, type ZodType } from "zod";

export async function parseJsonBody<T>(
  req: Request,
  schema: ZodType<T>
): Promise<{ data: T } | { response: Response }> {
  let raw: unknown;

  try {
    raw = await req.json();
  } catch {
    return {
      response: Response.json({ error: "Request body must be valid JSON." }, { status: 400 }),
    };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      response: Response.json({ error: formatZodError(parsed.error) }, { status: 400 }),
    };
  }

  return { data: parsed.data };
}

function formatZodError(error: ZodError) {
  const issue = error.issues[0];
  if (!issue) return "Invalid request body.";

  const path = issue.path.length ? `${issue.path.join(".")}: ` : "";
  return `${path}${issue.message}`;
}
