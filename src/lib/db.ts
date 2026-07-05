import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "days.db");

// Ensure data directory exists
import { mkdirSync } from "fs";
mkdirSync(path.dirname(DB_PATH), { recursive: true });

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        tags TEXT NOT NULL DEFAULT '[]',
        raw_content TEXT,
        meeting_notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);
      CREATE INDEX IF NOT EXISTS idx_entries_created ON entries(created_at);
    `);
  }
  return db;
}

export interface Entry {
  id: number;
  date: string;
  title: string;
  summary: string;
  tags: string[];
  raw_content?: string;
  meeting_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EntryRow {
  id: number;
  date: string;
  title: string;
  summary: string;
  tags: string;
  raw_content?: string | null;
  meeting_notes?: string | null;
  created_at: string;
  updated_at: string;
}

function rowToEntry(row: EntryRow): Entry {
  return {
    ...row,
    tags: JSON.parse(row.tags || "[]"),
    raw_content: row.raw_content || undefined,
    meeting_notes: row.meeting_notes || undefined,
  };
}

export function getAllEntries(month?: string): Entry[] {
  const conn = getDb();
  let rows: EntryRow[];
  if (month) {
    rows = conn
      .prepare("SELECT * FROM entries WHERE strftime('%Y-%m', date) = ? ORDER BY date DESC")
      .all(month) as EntryRow[];
  } else {
    rows = conn.prepare("SELECT * FROM entries ORDER BY date DESC").all() as EntryRow[];
  }
  return rows.map(rowToEntry);
}

export function getEntryByDate(date: string): Entry | undefined {
  const conn = getDb();
  const row = conn.prepare("SELECT * FROM entries WHERE date = ?").get(date) as EntryRow | undefined;
  return row ? rowToEntry(row) : undefined;
}

export function createEntry(entry: Omit<Entry, "id" | "created_at" | "updated_at">): Entry {
  const conn = getDb();
  const result = conn
    .prepare(
      `INSERT OR REPLACE INTO entries (date, title, summary, tags, raw_content, meeting_notes, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
    )
    .run(
      entry.date,
      entry.title,
      entry.summary,
      JSON.stringify(entry.tags),
      entry.raw_content || null,
      entry.meeting_notes || null
    );
  return getEntryByDate(entry.date)!;
}

export function getAllTags(): string[] {
  const conn = getDb();
  const rows = conn.prepare("SELECT tags FROM entries").all() as { tags: string }[];
  const allTags = new Set<string>();
  rows.forEach((r) => {
    try {
      JSON.parse(r.tags).forEach((t: string) => allTags.add(t));
    } catch {}
  });
  return [...allTags].sort();
}