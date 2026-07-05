import { createClient, type Client } from "@libsql/client";
import Database from "better-sqlite3";
import path from "path";
import { mkdirSync } from "fs";

let client: Client | Database.Database;

function getClient() {
  if (client) return client;

  const tursoUrl = process.env.TURSO_URL;
  const tursoToken = process.env.TURSO_TOKEN;

  if (tursoUrl && tursoToken) {
    // Turso (cloud)
    client = createClient({ url: tursoUrl, authToken: tursoToken });
  } else {
    // Local SQLite
    const dbPath = path.join(process.cwd(), "data", "days.db");
    mkdirSync(path.dirname(dbPath), { recursive: true });
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    client = db;
  }

  // Create schema
  const schema = `
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
  `;

  if ("exec" in client) {
    client.exec(schema);
  } else {
    // Turso client uses execute for multiple statements
    const stmts = schema.split(";").filter((s) => s.trim());
    for (const stmt of stmts) {
      (client as Client).execute(stmt);
    }
  }

  return client;
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

interface EntryRow {
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
  const db = getClient();
  let rows: EntryRow[];

  if (month) {
    const result = db.execute({
      sql: "SELECT * FROM entries WHERE strftime('%Y-%m', date) = ? ORDER BY date DESC",
      args: [month],
    });
    rows = result.rows.map((r) => r as unknown as EntryRow);
  } else {
    const result = db.execute("SELECT * FROM entries ORDER BY date DESC");
    rows = result.rows.map((r) => r as unknown as EntryRow);
  }

  return rows.map(rowToEntry);
}

export function getEntryByDate(date: string): Entry | undefined {
  const db = getClient();
  const result = db.execute({
    sql: "SELECT * FROM entries WHERE date = ?",
    args: [date],
  });
  const row = result.rows[0] as EntryRow | undefined;
  return row ? rowToEntry(row) : undefined;
}

export function createEntry(
  entry: Omit<Entry, "id" | "created_at" | "updated_at">
): Entry {
  const db = getClient();
  db.execute({
    sql: `INSERT OR REPLACE INTO entries (date, title, summary, tags, raw_content, meeting_notes, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    args: [
      entry.date,
      entry.title,
      entry.summary,
      JSON.stringify(entry.tags),
      entry.raw_content || null,
      entry.meeting_notes || null,
    ],
  });
  return getEntryByDate(entry.date)!;
}

export function getAllTags(): string[] {
  const db = getClient();
  const result = db.execute("SELECT tags FROM entries");
  const allTags = new Set<string>();
  for (const row of result.rows) {
    try {
      const tags = JSON.parse((row as { tags: string }).tags);
      tags.forEach((t: string) => allTags.add(t));
    } catch {}
  }
  return [...allTags].sort();
}