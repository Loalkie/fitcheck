import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export type SqlValue = string | number | boolean | null;

interface Statement {
  get<T>(...params: SqlValue[]): Promise<T | undefined>;
  run(...params: SqlValue[]): Promise<void>;
}

export interface Db {
  prepare(sql: string): Statement;
}

export type StorageMode = "persistent" | "ephemeral" | "unavailable";
export type StorageBackend = "postgres" | "sqlite" | "none";

const DATA_DIR_NAME = "fitcheck-data";

let cached: Db | null = null;
let resolvedDir: string | null = null;
let backend: StorageBackend = "none";
let postgresSource: string | null = null;
let sqliteSource: "FIT_DATA_DIR" | ".data" | "tmpdir" | null = null;

export class StorageUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "StorageUnavailableError";
  }
}

/**
 * One schema for both engines. `BIGINT` keeps epoch-millisecond timestamps from
 * overflowing in Postgres and is plain INTEGER affinity in SQLite.
 */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workspaces (
  user_id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at BIGINT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS extension_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_plans (
  user_id TEXT PRIMARY KEY,
  plan TEXT NOT NULL,
  updated_at BIGINT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "usage" (
  user_id TEXT NOT NULL,
  metric TEXT NOT NULL,
  period TEXT NOT NULL,
  "count" INTEGER NOT NULL,
  PRIMARY KEY(user_id, metric, period),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
`;

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
    { source: "FIT_DATA_DIR" as const, dir: process.env.FIT_DATA_DIR ?? "" },
    { source: ".data" as const, dir: path.join(process.cwd(), ".data") },
    { source: "tmpdir" as const, dir: path.join(os.tmpdir(), DATA_DIR_NAME) },
  ];

  let lastError: unknown = null;
  for (const candidate of candidates) {
    const dir = candidate.dir.trim();
    if (!dir) continue;
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.accessSync(dir, fs.constants.W_OK);
      resolvedDir = dir;
      sqliteSource = candidate.source;
      return dir;
    } catch (err) {
      lastError = err;
    }
  }

  throw new StorageUnavailableError("No writable directory is available for the app database.", {
    cause: lastError,
  });
}

/** Names the common integrations use, in order of preference. */
const PREFERRED_POSTGRES_VARS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
];

function asPostgresUrl(value: string | undefined): string | null {
  const url = value?.trim();
  if (!url || !/^postgres(ql)?:\/\//i.test(url)) return null;
  return url;
}

/** Direct/unpooled endpoints are a last resort: serverless functions exhaust them. */
const UNPOOLED_VAR = /(unpooled|non[_-]?pooling|no[_-]?ssl|direct)/i;

/**
 * Connection string of a hosted Postgres, when the host provides one. Beyond
 * the well-known names, any variable holding a `postgres://` value counts — a
 * marketplace integration is free to call it `STORAGE_URL`, `NEON_...`, or
 * anything else, and the value is the only signal that stays reliable.
 */
function postgresUrl(): string | null {
  for (const name of PREFERRED_POSTGRES_VARS) {
    const url = asPostgresUrl(process.env[name]);
    if (url) {
      postgresSource = name;
      return url;
    }
  }
  const candidates = Object.entries(process.env)
    .flatMap(([name, value]) => {
      const url = asPostgresUrl(value);
      return url ? [{ name, url }] : [];
    })
    .sort(
      (a, b) =>
        Number(UNPOOLED_VAR.test(a.name)) - Number(UNPOOLED_VAR.test(b.name)) ||
        Number(!/url/i.test(a.name)) - Number(!/url/i.test(b.name)) ||
        a.name.localeCompare(b.name),
    );

  const fallback = candidates[0];
  if (fallback) {
    console.log(`[db] using Postgres from ${fallback.name}`);
    postgresSource = fallback.name;
    return fallback.url;
  }
  return null;
}

function needsSsl(connectionString: string): boolean {
  if (/sslmode=disable/i.test(connectionString)) return false;
  if (/sslmode=(require|verify-ca|verify-full)/i.test(connectionString)) return true;
  return !/@(localhost|127\.0\.0\.1|\[::1\])[:/]/i.test(connectionString);
}

function toPostgresPlaceholders(sql: string): string {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function createPostgresDb(connectionString: string): Db {
  const pg = require("pg") as typeof import("pg");

  // int8 (epoch millis) is returned as a string unless we say otherwise.
  pg.types.setTypeParser(20, (value: string) => Number(value));

  const pool = new pg.Pool({
    connectionString,
    // Hosted Postgres (Vercel/Neon/Supabase) terminates TLS; serverless
    // runtimes rarely ship the full CA chain, so verification is relaxed.
    ssl: needsSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 15_000,
  });

  let schemaError: unknown = null;
  const schemaReady = pool.query(SCHEMA).catch((err) => {
    schemaError = err;
  });

  async function ready(): Promise<void> {
    await schemaReady;
    if (schemaError) {
      throw new StorageUnavailableError("Could not prepare the Postgres schema.", {
        cause: schemaError,
      });
    }
  }

  backend = "postgres";

  return {
    prepare(sql) {
      const text = toPostgresPlaceholders(sql);
      return {
        async get<T>(...params: SqlValue[]): Promise<T | undefined> {
          await ready();
          const result = await pool.query(text, params);
          return result.rows[0] as T | undefined;
        },
        async run(...params: SqlValue[]): Promise<void> {
          await ready();
          await pool.query(text, params);
        },
      };
    },
  };
}

function createSqliteDb(): Db {
  const dir = resolveDataDir();
  const Database = require("better-sqlite3") as typeof import("better-sqlite3");
  const sqlite = new Database(path.join(dir, "app.db"));

  sqlite.pragma("journal_mode = WAL");
  sqlite.exec(SCHEMA);
  backend = "sqlite";

  return {
    prepare(sql) {
      return {
        async get<T>(...params: SqlValue[]): Promise<T | undefined> {
          return sqlite.prepare(sql).get(...params) as T | undefined;
        },
        async run(...params: SqlValue[]): Promise<void> {
          sqlite.prepare(sql).run(...params);
        },
      };
    },
  };
}

function createFailingDb(cause: unknown): Db {
  const fail = (): never => {
    throw new StorageUnavailableError("The app database is unavailable on this host.", { cause });
  };
  backend = "none";
  return {
    prepare: () => ({
      get: async () => fail(),
      run: async () => fail(),
    }),
  };
}

function createDb(): Db {
  const url = postgresUrl();
  if (url) {
    try {
      return createPostgresDb(url);
    } catch (err) {
      console.error("[db] Postgres is configured but unusable, using SQLite instead:", err);
    }
  }
  try {
    return createSqliteDb();
  } catch (err) {
    console.error("[db] no writable storage:", err);
    return createFailingDb(err);
  }
}

export function getDb(): Db {
  if (!cached) cached = createDb();
  return cached;
}

export function storageBackend(): StorageBackend {
  getDb();
  return backend;
}

/** Where the backend actually came from: an env var name, or a directory label. */
export function storageSource(): string | null {
  getDb();
  if (backend === "postgres") return postgresSource;
  if (backend === "sqlite") return sqliteSource;
  return null;
}

/** Where the data lives, from the point of view of durability. */
export function storageMode(): StorageMode {
  getDb();
  if (backend === "postgres") return "persistent";
  if (backend === "sqlite" && resolvedDir) return isTemporaryDir(resolvedDir) ? "ephemeral" : "persistent";
  return "unavailable";
}

/**
 * Accounts and workspace sync only make sense when the data outlives the
 * current process. Without that, sign-up would look like it worked and then
 * quietly lose the workspace, so the account routes are refused instead.
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
