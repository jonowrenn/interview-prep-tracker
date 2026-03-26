import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";

export const problems = sqliteTable("problems", {
  id: integer("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  difficulty: text("difficulty").notNull(), // 'Easy' | 'Medium' | 'Hard'
  description: text("description"), // HTML, null until fetched
  examples: text("examples"), // JSON array
  constraints: text("constraints"),
  tags: text("tags").notNull().default("[]"), // JSON array of tag slugs
  acceptanceRate: real("acceptance_rate"),
  isPremium: integer("is_premium").notNull().default(0),
  fetchedAt: integer("fetched_at"), // Unix epoch, null = stub only
  syncedAt: integer("synced_at").notNull(),
});

export const userProgress = sqliteTable("user_progress", {
  problemId: integer("problem_id").notNull().primaryKey(),
  status: text("status").notNull().default("unsolved"), // 'unsolved'|'attempted'|'solved'
  solvedAt: integer("solved_at"),
  attempts: integer("attempts").notNull().default(0),
  updatedAt: integer("updated_at").notNull(),
});

export const solutions = sqliteTable(
  "solutions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    problemId: integer("problem_id").notNull(),
    language: text("language").notNull(), // 'javascript'|'python'|'java'|'cpp'
    code: text("code").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => ({
    uniqProblemLang: uniqueIndex("solutions_problem_lang").on(t.problemId, t.language),
  })
);

export const notes = sqliteTable("notes", {
  problemId: integer("problem_id").notNull().primaryKey(),
  content: text("content").notNull().default(""),
  updatedAt: integer("updated_at").notNull(),
});

export const reviewSchedule = sqliteTable("review_schedule", {
  problemId: integer("problem_id").notNull().primaryKey(),
  nextReview: integer("next_review").notNull(),
  intervalDays: integer("interval_days").notNull().default(1),
  easeFactor: real("ease_factor").notNull().default(2.5),
  repetitions: integer("repetitions").notNull().default(0),
  lastQuality: integer("last_quality"),
  updatedAt: integer("updated_at").notNull(),
});

export const githubPushLog = sqliteTable("github_push_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  problemId: integer("problem_id").notNull(),
  language: text("language").notNull(),
  sha: text("sha"),
  pushedAt: integer("pushed_at").notNull(),
  status: text("status").notNull(), // 'success' | 'failed'
  error: text("error"),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const activityLog = sqliteTable("activity_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(), // 'YYYY-MM-DD'
  problemId: integer("problem_id"),
  action: text("action").notNull(), // 'solved' | 'attempted' | 'reviewed'
});
