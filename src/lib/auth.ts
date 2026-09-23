import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { getDb } from "./db";

export const SESSION_COOKIE = "fit_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface UserRow {
  id: string;
  email: string;
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
    .run(token, userId, expiresAt);
  return { token, maxAge: Math.floor(SESSION_TTL_MS / 1000) };
}

export async function deleteSession(token: string): Promise<void> {
  try {
    await getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
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
    .run(token, userId, expiresAt);
  return token;
}

export async function getUserByExtensionToken(token: string | undefined): Promise<UserRow | null> {
  if (!token) return null;
  let row: (UserRow & { expires_at: number }) | undefined;
  try {
    row = await getDb()
      .prepare(
        `SELECT u.id, u.email, t.expires_at AS expires_at
         FROM extension_tokens t JOIN users u ON u.id = t.user_id
         WHERE t.token = ?`,
      )
      .get<(UserRow & { expires_at: number })>(token);
  } catch {
    return null;
  }
  if (!row || row.expires_at < Date.now()) return null;
  return { id: row.id, email: row.email };
}

export async function getUserByEmail(email: string): Promise<(UserRow & { password_hash: string }) | null> {
  const row = await getDb()
    .prepare("SELECT id, email, password_hash FROM users WHERE email = ?")
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
        `SELECT u.id, u.email, s.expires_at AS expires_at
         FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token = ?`,
      )
      .get<(UserRow & { expires_at: number })>(token);
  } catch {
    return null;
  }
  if (!row || row.expires_at < Date.now()) return null;
  return { id: row.id, email: row.email };
}

export async function requireUser(req: NextRequest): Promise<UserRow | null> {
  return getSessionUser(req.cookies.get(SESSION_COOKIE)?.value);
}

export function sessionCookie(token: string, maxAge: number): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}
