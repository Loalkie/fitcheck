import { createHash, randomBytes } from "node:crypto";
import { getDb } from "./db";

export type AuthTokenPurpose = "password_reset" | "email_verify";

export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
export const EMAIL_VERIFY_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Only the digest is stored, so the database never holds a usable link. */
function digest(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueAuthToken(userId: string, purpose: AuthTokenPurpose, ttlMs: number): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await getDb()
    .prepare(
      "INSERT INTO auth_tokens (token, user_id, purpose, expires_at, used_at, created_at) VALUES (?, ?, ?, ?, NULL, ?)",
    )
    .run(digest(token), userId, purpose, Date.now() + ttlMs, Date.now());
  return token;
}

/**
 * Single use: the row is claimed by the same statement that reads it, so two
 * requests racing on one link cannot both succeed.
 */
export async function consumeAuthToken(token: string, purpose: AuthTokenPurpose): Promise<string | null> {
  const now = Date.now();
  const row = await getDb()
    .prepare(
      `UPDATE auth_tokens SET used_at = ?
       WHERE token = ? AND purpose = ? AND used_at IS NULL AND expires_at > ?
       RETURNING user_id`,
    )
    .get<{ user_id: string }>(now, digest(token), purpose, now);
  return row?.user_id ?? null;
}

/** Asking for a new link retires the previous ones. */
export async function invalidateAuthTokens(userId: string, purpose: AuthTokenPurpose): Promise<void> {
  await getDb()
    .prepare("UPDATE auth_tokens SET used_at = ? WHERE user_id = ? AND purpose = ? AND used_at IS NULL")
    .run(Date.now(), userId, purpose);
}
