import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { getDb } from "./db";

export const SESSION_COOKIE = "fit_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Sessions and extension tokens are stored as digests, so read access to the
 * database is not the same thing as holding every live login.
 */
function tokenDigest(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

interface UserRow {
  id: string;
  email: string;
  email_verified_at?: number | null;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export async function createSession(userId: string): Promise<{ token: string; maxAge: number }> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_TTL_MS;
  await getDb()
    .prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
    .run(tokenDigest(token), userId, expiresAt);
  return { token, maxAge: Math.floor(SESSION_TTL_MS / 1000) };
}

export async function deleteSession(token: string): Promise<void> {
  try {
    await getDb().prepare("DELETE FROM sessions WHERE token = ?").run(tokenDigest(token));
  } catch {
    // Signing out must never fail, even without storage.
  }
}

const EXTENSION_TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

export async function createExtensionToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = Date.now() + EXTENSION_TOKEN_TTL_MS;
  await getDb()
    .prepare("INSERT INTO extension_tokens (token, user_id, expires_at) VALUES (?, ?, ?)")
    .run(tokenDigest(token), userId, expiresAt);
  return token;
}

export async function getUserByExtensionToken(token: string | undefined): Promise<UserRow | null> {
  if (!token) return null;
  let row: (UserRow & { expires_at: number }) | undefined;
  try {
    row = await getDb()
      .prepare(
        `SELECT u.id, u.email, u.email_verified_at, t.expires_at AS expires_at
         FROM extension_tokens t JOIN users u ON u.id = t.user_id
         WHERE t.token = ?`,
      )
      .get<(UserRow & { expires_at: number })>(tokenDigest(token));
  } catch {
    return null;
  }
  if (!row || row.expires_at < Date.now()) return null;
  return { id: row.id, email: row.email, email_verified_at: row.email_verified_at ?? null };
}

export async function getUserByEmail(email: string): Promise<(UserRow & { password_hash: string }) | null> {
  const row = await getDb()
    .prepare("SELECT id, email, password_hash, email_verified_at FROM users WHERE email = ?")
    .get<UserRow & { password_hash: string }>(email);
  return row ?? null;
}

export async function createUser(email: string, passwordHash: string): Promise<UserRow> {
  const id = randomBytes(16).toString("hex");
  await getDb()
    .prepare("INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)")
    .run(id, email, passwordHash, Date.now());
  return { id, email };
}

export async function getSessionUser(token: string | undefined): Promise<UserRow | null> {
  if (!token) return null;
  let row: (UserRow & { expires_at: number }) | undefined;
  try {
    row = await getDb()
      .prepare(
        `SELECT u.id, u.email, u.email_verified_at, s.expires_at AS expires_at
         FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token = ?`,
      )
      .get<(UserRow & { expires_at: number })>(tokenDigest(token));
  } catch {
    return null;
  }
  if (!row || row.expires_at < Date.now()) return null;
  return { id: row.id, email: row.email, email_verified_at: row.email_verified_at ?? null };
}

export async function requireUser(req: NextRequest): Promise<UserRow | null> {
  return getSessionUser(req.cookies.get(SESSION_COOKIE)?.value);
}

/**
 * `Secure` is on in production only: browsers refuse to store a Secure cookie
 * over plain http, which is how the app runs during local development.
 */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: process.env.NODE_ENV === "production",
} as const;

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

/**
 * Site-wide integration keys (AI provider, Stripe, job feeds) belong to whoever
 * runs the deployment, not to whoever signs up. Without a configured owner the
 * endpoint stays closed rather than open.
 */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  return adminEmails().includes(email.trim().toLowerCase());
}

export async function markEmailVerified(userId: string): Promise<void> {
  await getDb()
    .prepare("UPDATE users SET email_verified_at = ? WHERE id = ? AND email_verified_at IS NULL")
    .run(Date.now(), userId);
}

/** Used by the reset flow, and by logout-everywhere style actions. */
export async function deleteSessionsForUser(userId: string): Promise<void> {
  await getDb().prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}
