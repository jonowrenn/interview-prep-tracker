import Database from "better-sqlite3";
import path from "path";

let _db: Database.Database | undefined;

export function getDb(): Database.Database {
  if (!_db) {
    const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), "database.sqlite");
    _db = new Database(dbPath);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS problems (
      id              INTEGER PRIMARY KEY,
      slug            TEXT    NOT NULL UNIQUE,
      title           TEXT    NOT NULL,
      difficulty      TEXT    NOT NULL,
      description     TEXT,
      examples        TEXT,
      constraints     TEXT,
      tags            TEXT    NOT NULL DEFAULT '[]',
      acceptance_rate REAL,
      is_premium      INTEGER NOT NULL DEFAULT 0,
      fetched_at      INTEGER,
      synced_at       INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      problem_id  INTEGER NOT NULL PRIMARY KEY,
      status      TEXT    NOT NULL DEFAULT 'unsolved',
      solved_at   INTEGER,
      attempts    INTEGER NOT NULL DEFAULT 0,
      updated_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS solutions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      problem_id  INTEGER NOT NULL,
      language    TEXT    NOT NULL,
      code        TEXT    NOT NULL,
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL,
      UNIQUE (problem_id, language)
    );

    CREATE TABLE IF NOT EXISTS notes (
      problem_id  INTEGER PRIMARY KEY,
      content     TEXT    NOT NULL DEFAULT '',
      updated_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS review_schedule (
      problem_id    INTEGER PRIMARY KEY,
      next_review   INTEGER NOT NULL,
      interval_days INTEGER NOT NULL DEFAULT 1,
      ease_factor   REAL    NOT NULL DEFAULT 2.5,
      repetitions   INTEGER NOT NULL DEFAULT 0,
      last_quality  INTEGER,
      updated_at    INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS github_push_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      problem_id  INTEGER NOT NULL,
      language    TEXT    NOT NULL,
      sha         TEXT,
      pushed_at   INTEGER NOT NULL,
      status      TEXT    NOT NULL,
      error       TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key         TEXT PRIMARY KEY,
      value       TEXT NOT NULL,
      updated_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      date       TEXT    NOT NULL,
      problem_id INTEGER,
      action     TEXT    NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_log(date);
    CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
    CREATE INDEX IF NOT EXISTS idx_problems_slug ON problems(slug);
  `);
}

export function getSetting(key: string): string | null {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string) {
  const db = getDb();
  db.prepare(
    "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
  ).run(key, value, Math.floor(Date.now() / 1000));
}
