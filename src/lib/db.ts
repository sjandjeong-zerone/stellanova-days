import { createClient, type Client } from "@libsql/client";
import BetterSqlite3 from "better-sqlite3";
import path from "path";
import { mkdirSync } from "fs";

let _client: Client | BetterSqlite3.Database;
let _isTurso = false;
let _dbReady = false;

function getClient() {
  if (_client) return _client;

  const tursoUrl = process.env.TURSO_URL;
  const tursoToken = process.env.TURSO_TOKEN;

  if (tursoUrl && tursoToken) {
    _client = createClient({ url: tursoUrl, authToken: tursoToken });
    _isTurso = true;
  } else {
    const dbPath = path.join(process.cwd(), "data", "days.db");
    mkdirSync(path.dirname(dbPath), { recursive: true });
    const db = new BetterSqlite3(dbPath);
    db.pragma("journal_mode = WAL");
    _client = db;
    _isTurso = false;
  }

  return _client;
}

// Ensure schema + migrations are applied before any query
async function ensureDb() {
  if (_dbReady) return;
  const db = getClient();

  // Create table if missing
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
  `;

  if (_isTurso) {
    await (db as Client).execute(schema);
    // Add images column if missing
    try {
      await (db as Client).execute("ALTER TABLE entries ADD COLUMN images TEXT NOT NULL DEFAULT '[]'");
    } catch {}
  } else {
    (db as BetterSqlite3.Database).exec(schema);
    try { (db as BetterSqlite3.Database).exec("ALTER TABLE entries ADD COLUMN images TEXT NOT NULL DEFAULT '[]'"); } catch {}
  }

  _dbReady = true;
}

// Unified async-safe query wrapper
async function queryAll(sql: string, args: any[] = []): Promise<Record<string, any>[]> {
  const db = getClient();
  if (_isTurso) {
    const result = await (db as Client).execute({ sql, args });
    return result.rows.map((r) => {
      const obj: Record<string, any> = {};
      for (let i = 0; i < result.columns.length; i++) {
        obj[result.columns[i]] = r[i];
      }
      return obj;
    });
  } else {
    const stmt = (db as BetterSqlite3.Database).prepare(sql);
    return (args.length ? stmt.all(...args) : stmt.all()) as Record<string, any>[];
  }
}

async function queryOne(sql: string, args: any[] = []): Promise<Record<string, any> | undefined> {
  const db = getClient();
  if (_isTurso) {
    const result = await (db as Client).execute({ sql: sql + " LIMIT 1", args });
    if (result.rows.length === 0) return undefined;
    const obj: Record<string, any> = {};
    for (let i = 0; i < result.columns.length; i++) {
      obj[result.columns[i]] = result.rows[0][i];
    }
    return obj;
  } else {
    const stmt = (db as BetterSqlite3.Database).prepare(sql);
    return (args.length ? stmt.get(...args) : stmt.get()) as Record<string, any> | undefined;
  }
}

async function run(sql: string, params: any[] = []): Promise<void> {
  const db = getClient();
  if (_isTurso) {
    await (db as Client).execute({ sql, args: params });
  } else {
    const stmt = (db as BetterSqlite3.Database).prepare(sql);
    params.length ? stmt.run(...params) : stmt.run();
  }
}

// ── Domain types and functions ──

export interface Entry {
  id: number;
  date: string;
  title: string;
  summary: string;
  tags: string[];
  images: string[];
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
  images: string;
  raw_content?: string | null;
  meeting_notes?: string | null;
  created_at: string;
  updated_at: string;
}

function rowToEntry(row: Record<string, any>): Entry {
  const r = row as unknown as EntryRow;
  return {
    ...r,
    tags: JSON.parse(r.tags || "[]"),
    images: JSON.parse(r.images || "[]"),
    raw_content: r.raw_content || undefined,
    meeting_notes: r.meeting_notes || undefined,
  };
}

export async function getAllEntries(month?: string): Promise<Entry[]> {
  await ensureDb();
  if (month) {
    const rows = await queryAll(
      "SELECT * FROM entries WHERE strftime('%Y-%m', date) = ? ORDER BY date DESC",
      [month]
    );
    return rows.map(rowToEntry);
  }
  const rows = await queryAll("SELECT * FROM entries ORDER BY date DESC");
  return rows.map(rowToEntry);
}

export async function getEntryByDate(date: string): Promise<Entry | undefined> {
  await ensureDb();
  const row = await queryOne("SELECT * FROM entries WHERE date = ?", [date]);
  return row ? rowToEntry(row) : undefined;
}

export async function createEntry(
  entry: Omit<Entry, "id" | "created_at" | "updated_at">
): Promise<Entry> {
  await ensureDb();
  await run(
    `INSERT OR REPLACE INTO entries (date, title, summary, tags, images, raw_content, meeting_notes, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      entry.date,
      entry.title,
      entry.summary,
      JSON.stringify(entry.tags),
      JSON.stringify(entry.images || []),
      entry.raw_content || null,
      entry.meeting_notes || null,
    ]
  );
  return (await getEntryByDate(entry.date))!;
}

export async function getAllTags(): Promise<string[]> {
  await ensureDb();
  const rows = await queryAll("SELECT tags FROM entries");
  const allTags = new Set<string>();
  for (const row of rows) {
    try {
      const tags = JSON.parse((row as { tags: string }).tags);
      tags.forEach((t: string) => allTags.add(t));
    } catch {}
  }
  return [...allTags].sort();
}