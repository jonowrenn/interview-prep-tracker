import { z } from "zod";

const languageSchema = z
  .string()
  .trim()
  .min(1, "Language is required.")
  .max(32, "Language is too long.")
  .regex(/^[a-z0-9+#-]+$/i, "Language contains unsupported characters.");

export const solutionBodySchema = z.object({
  language: languageSchema,
  code: z.string().max(250_000, "Code is too large."),
});

export const notesBodySchema = z.object({
  content: z.string().max(100_000, "Notes are too large.").default(""),
});

export const progressBodySchema = z.object({
  status: z.enum(["unsolved", "attempted", "solved"]),
});

export const reviewBodySchema = z.object({
  quality: z.enum(["hard", "good", "easy"]),
});

export const settingsBodySchema = z
  .object({
    github_pat: z.string().trim().max(512).optional(),
    github_owner: z.string().trim().max(100).optional(),
    github_repo: z.string().trim().max(100).optional(),
    github_branch: z.string().trim().max(255).optional(),
    github_solutions_path: z.string().trim().max(255).optional(),
    anthropic_api_key: z.string().trim().max(512).optional(),
    leetcode_session: z.string().trim().max(4096).optional(),
    autopush_on_accept: z.enum(["true", "false"]).optional(),
  })
  .strict();

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(12_000),
});

export const chatBodySchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(30),
  problemContext: z
    .object({
      title: z.string().max(200),
      difficulty: z.string().max(32),
      description: z.string().max(25_000).optional(),
      slug: z.string().max(200),
    })
    .nullable()
    .optional(),
});
