export type SqlValue = string | number | boolean | null;

/**
 * The little bit of the driver a migration needs. Both backends already know
 * how to run these three things, so the migration list stays dialect-free.
 */
export interface MigrationClient {
  /** Runs one or more statements without parameters. */
  exec(sql: string): Promise<void>;
  get<T>(sql: string, params: SqlValue[]): Promise<T | undefined>;
  hasColumn(table: string, column: string): Promise<boolean>;
}

export interface Migration {
  id: string;
  sql?: string;
  run?: (client: MigrationClient) => Promise<void>;
}

/**
 * One schema for both engines. `BIGINT` keeps epoch-millisecond timestamps from
 * overflowing in Postgres and is plain INTEGER affinity in SQLite. `CREATE TABLE
 * IF NOT EXISTS` keeps this safe to replay against a database that predates the
 * migration table.
 */
const INITIAL_SCHEMA = `
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

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket TEXT NOT NULL,
  "key" TEXT NOT NULL,
  window_start BIGINT NOT NULL,
  "count" INTEGER NOT NULL,
  PRIMARY KEY(bucket, "key", window_start)
);
`;

/**
 * Applied in order, once each. Add new migrations at the bottom; never edit an
 * id that has already shipped, because deployed databases have already run it.
 */
export const MIGRATIONS: Migration[] = [
  { id: "0001_initial_schema", sql: INITIAL_SCHEMA },
  {
    id: "0002_foreign_key_indexes",
    sql: `
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);
CREATE INDEX IF NOT EXISTS extension_tokens_user_id_idx ON extension_tokens (user_id);
CREATE INDEX IF NOT EXISTS rate_limits_window_start_idx ON rate_limits (window_start);
CREATE INDEX IF NOT EXISTS usage_user_period_idx ON "usage" (user_id, period);
`,
  },
  {
    id: "0003_auth_tokens",
    sql: `
CREATE TABLE IF NOT EXISTS auth_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  purpose TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  used_at BIGINT,
  created_at BIGINT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS auth_tokens_user_id_idx ON auth_tokens (user_id);
CREATE INDEX IF NOT EXISTS auth_tokens_expires_at_idx ON auth_tokens (expires_at);
`,
  },
  {
    // `CREATE TABLE IF NOT EXISTS` cannot widen an existing table, so the
    // column is added separately and guarded.
    id: "0004_users_email_verified_at",
    run: async (client) => {
      if (await client.hasColumn("users", "email_verified_at")) return;
      await client.exec("ALTER TABLE users ADD COLUMN email_verified_at BIGINT");
    },
  },
  {
    id: "0005_subscriptions",
    sql: `
CREATE TABLE IF NOT EXISTS subscriptions (
  user_id TEXT PRIMARY KEY,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end BIGINT,
  updated_at BIGINT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_customer_idx ON subscriptions (stripe_customer_id);
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_subscription_idx ON subscriptions (stripe_subscription_id);

CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY,
  processed_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS stripe_events_processed_at_idx ON stripe_events (processed_at);
`,
  },
];

/**
 * Runs whatever has not been applied yet. Every migration is individually
 * safe to replay, so a crash between a migration and its bookkeeping row only
 * costs one redundant pass.
 */
export async function runMigrations(client: MigrationClient): Promise<void> {
  await client.exec(`
CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at BIGINT NOT NULL
);`);

  for (const migration of MIGRATIONS) {
    const applied = await client.get<{ id: string }>("SELECT id FROM schema_migrations WHERE id = ?", [migration.id]);
    if (applied) continue;

    if (migration.sql) await client.exec(migration.sql);
    if (migration.run) await migration.run(client);

    await client.get("INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?) RETURNING id", [
      migration.id,
      Date.now(),
    ]);
  }
}
