import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type BetterSqlite3 from "better-sqlite3";

type SqliteDatabase = BetterSqlite3.Database;
type SqliteFactory = typeof BetterSqlite3;

const DATA_DIR_NAME = "fitcheck-data";

let db: SqliteDatabase | null = null;
let resolvedDir: string | null = null;

export class StorageUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "StorageUnavailableError";
  }
}

export type StorageMode = "persistent" | "ephemeral" | "unavailable";

function isTemporaryDir(dir: string): boolean {
  const tmp = os.tmpdir();
  return dir === tmp || dir.startsWith(tmp.endsWith(path.sep) ? tmp : `${tmp}${path.sep}`);
}

/**
 * Serverless hosts (Vercel, Netlify, ...) mount the project directory read-only,
 * so `./.data` cannot be created there. Walk the candidates and use the first
 * writable one — the temp dir always works, it is just not durable.
 */
function resolveDataDir(): string {
  if (resolvedDir) return resolvedDir;

  const candidates = [
    process.env.FIT_DATA_DIR,
    path.join(process.cwd(), ".data"),
    path.join(os.tmpdir(), DATA_DIR_NAME),
  ].filter((dir): dir is string => Boolean(dir && dir.trim()));

  let lastError: unknown = null;
  for (const dir of candidates) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.accessSync(dir, fs.constants.W_OK);
      resolvedDir = dir;
      return dir;
    } catch (err) {
      lastError = err;
    }
  }

  throw new StorageUnavailableError("No writable directory is available for the app database.", {
    cause: lastError,
  });
}

/**
 * Loaded lazily so a missing native binding degrades the storage-backed
 * features instead of breaking the module graph of every API route.
 */
function loadDriver(): SqliteFactory {
  try {
    return require("better-sqlite3") as SqliteFactory;
  } catch (err) {
    throw new StorageUnavailableError("The SQLite driver could not be loaded on this host.", {
      cause: err,
    });
  }
}

export function getDb(): SqliteDatabase {
  if (db) return db;

  const dir = resolveDataDir();
  const Database = loadDriver();

  db = new Database(path.join(dir, "app.db"));
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      user_id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS extension_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_plans (
      user_id TEXT PRIMARY KEY,
      plan TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS usage (
      user_id TEXT NOT NULL,
      metric TEXT NOT NULL,
      period TEXT NOT NULL,
      count INTEGER NOT NULL,
      PRIMARY KEY(user_id, metric, period),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  return db;
}

/** Where the database currently lives, from the point of view of durability. */
export function storageMode(): StorageMode {
  try {
    return isTemporaryDir(resolveDataDir()) ? "ephemeral" : "persistent";
  } catch {
    return "unavailable";
  }
}

/**
 * Accounts and workspace sync only make sense when the database outlives the
 * current process. On a read-only host the data would silently vanish, so the
 * account routes are refused with an explanation instead.
 */
export function durableStorageError(): string | null {
  if (process.env.FIT_ALLOW_EPHEMERAL_STORAGE === "1") return null;

  const mode = storageMode();
  if (mode === "persistent") return null;
  if (mode === "ephemeral") {
    return "Accounts and sync need a database that outlives a restart, and this host only has temporary storage. Everything else works — your workspace is saved in this browser.";
  }
  return "Accounts and sync are unavailable because this host has no writable storage. Everything else works — your workspace is saved in this browser.";
}
