import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { chatBodySchema } from "@/lib/api/schemas";
import { getSetting } from "@/lib/db";
import { parseJsonBody } from "@/lib/api/validation";

const SYSTEM_PROMPT = `You are an expert LeetCode tutor and competitive programming coach. You help users understand and solve LeetCode problems.

Your approach:
- Give hints and guide users toward the solution rather than immediately revealing it
- Explain the underlying patterns and algorithms clearly (two pointers, sliding window, dynamic programming, etc.)
- Point out common pitfalls and edge cases
- When asked for the solution, provide clean, well-commented code
- Adjust your explanation depth based on what the user is struggling with
- Encourage thinking about time and space complexity

If the user is working on a specific problem, use that context to give targeted help.
Keep responses concise and focused. Use code blocks when showing code.`;

export async function POST(req: NextRequest) {
  const apiKey = getSetting("anthropic_api_key");
  if (!apiKey) {
    return Response.json({ error: "Anthropic API key not configured. Add it in Settings." }, { status: 400 });
  }

  const parsed = await parseJsonBody(req, chatBodySchema);
  if ("response" in parsed) return parsed.response;

  const { messages, problemContext } = parsed.data;

  const client = new Anthropic({ apiKey });

  let system = SYSTEM_PROMPT;
  if (problemContext) {
    system += `\n\nThe user is currently working on this LeetCode problem:\n`;
    system += `Title: ${problemContext.title}\n`;
    system += `Difficulty: ${problemContext.difficulty}\n`;
    if (problemContext.description) {
      // Strip HTML tags for cleaner context
      const plainDesc = problemContext.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000);
      system += `Description: ${plainDesc}\n`;
    }
    system += `\nTailor your hints and explanations to this specific problem.`;
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = client.messages.stream({
          model: "claude-opus-4-6",
          max_tokens: 2048,
          system,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        });

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        const msg = err instanceof Anthropic.AuthenticationError
          ? "Invalid API key."
          : err instanceof Anthropic.RateLimitError
          ? "Rate limit hit. Please wait a moment."
          : "An error occurred with the AI service.";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
