import type Database from "better-sqlite3";
import { getDb } from "@/lib/db";

export type ReviewState = {
  next_review: number;
  interval_days: number;
  repetitions: number;
};

type ProgressRow = {
  status: string;
};

const DAY_IN_SECONDS = 24 * 60 * 60;

function nowInSeconds() {
  return Math.floor(Date.now() / 1000);
}

function todayDate() {
  return new Date().toISOString().split("T")[0];
}

function insertActivity(db: Database.Database, problemId: number, action: "attempted" | "solved" | "reviewed") {
  db.prepare("INSERT INTO activity_log (date, problem_id, action) VALUES (?, ?, ?)")
    .run(todayDate(), problemId, action);
}

function getReviewSchedule(db: Database.Database, problemId: number): ReviewState | null {
  const review = db
    .prepare("SELECT next_review, interval_days, repetitions FROM review_schedule WHERE problem_id = ?")
    .get(problemId) as ReviewState | undefined;

  return review ?? null;
}

function ensureReviewScheduleTx(db: Database.Database, problemId: number, now: number): ReviewState {
  const existing = getReviewSchedule(db, problemId);
  if (existing) return existing;

  const review = {
    next_review: now + DAY_IN_SECONDS,
    interval_days: 1,
    repetitions: 0,
  };

  db.prepare(
    `INSERT INTO review_schedule (problem_id, next_review, interval_days, ease_factor, repetitions, last_quality, updated_at)
     VALUES (?, ?, ?, 2.5, ?, NULL, ?)`
  ).run(problemId, review.next_review, review.interval_days, review.repetitions, now);

  return review;
}

export function saveSolution(problemId: number, language: string, code: string) {
  const db = getDb();
  const now = nowInSeconds();

  db.prepare(
    `INSERT INTO solutions (problem_id, language, code, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(problem_id, language) DO UPDATE SET
       code = excluded.code,
       updated_at = excluded.updated_at`
  ).run(problemId, language, code, now, now);

  return { updatedAt: now };
}

export function recordProblemAttempt(problemId: number) {
  const db = getDb();

  return db.transaction(() => {
    const existing = db
      .prepare("SELECT status FROM user_progress WHERE problem_id = ?")
      .get(problemId) as ProgressRow | undefined;
    const now = nowInSeconds();

    if (existing) {
      db.prepare(
        `UPDATE user_progress
         SET status = CASE WHEN status = 'solved' THEN 'solved' ELSE 'attempted' END,
             attempts = attempts + 1,
             updated_at = ?
         WHERE problem_id = ?`
      ).run(now, problemId);
    } else {
      db.prepare(
        `INSERT INTO user_progress (problem_id, status, solved_at, attempts, updated_at)
         VALUES (?, 'attempted', NULL, 1, ?)`
      ).run(problemId, now);
    }

    if (!existing || existing.status === "unsolved") {
      insertActivity(db, problemId, "attempted");
    }

    return {
      status: existing?.status === "solved" ? "solved" : "attempted",
    };
  })();
}

export function markProblemSolved(
  problemId: number,
  options: { attemptIncrement?: number; seedReview?: boolean } = {}
) {
  const { attemptIncrement = 0, seedReview = true } = options;
  const db = getDb();

  return db.transaction(() => {
    const existing = db
      .prepare("SELECT status FROM user_progress WHERE problem_id = ?")
      .get(problemId) as ProgressRow | undefined;
    const now = nowInSeconds();

    if (existing) {
      db.prepare(
        `UPDATE user_progress
         SET status = 'solved',
             solved_at = COALESCE(solved_at, ?),
             attempts = attempts + ?,
             updated_at = ?
         WHERE problem_id = ?`
      ).run(now, attemptIncrement, now, problemId);
    } else {
      db.prepare(
        `INSERT INTO user_progress (problem_id, status, solved_at, attempts, updated_at)
         VALUES (?, 'solved', ?, ?, ?)`
      ).run(problemId, now, Math.max(attemptIncrement, 1), now);
    }

    if (!existing || existing.status !== "solved") {
      insertActivity(db, problemId, "solved");
    }

    const review = seedReview ? ensureReviewScheduleTx(db, problemId, now) : getReviewSchedule(db, problemId);

    return {
      becameSolved: !existing || existing.status !== "solved",
      review,
    };
  })();
}

export function ensureReviewSchedule(problemId: number) {
  const db = getDb();
  const now = nowInSeconds();

  return db.transaction(() => ensureReviewScheduleTx(db, problemId, now))();
}
