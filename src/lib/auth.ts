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

export function createSession(userId: string): { token: string; maxAge: number } {
  const token = randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_TTL_MS;
  getDb().prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(token, userId, expiresAt);
  return { token, maxAge: Math.floor(SESSION_TTL_MS / 1000) };
}

export function deleteSession(token: string): void {
  getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

const EXTENSION_TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

export function createExtensionToken(userId: string): string {
  const token = randomBytes(32).toString("hex");
  const expiresAt = Date.now() + EXTENSION_TOKEN_TTL_MS;
  getDb()
    .prepare("INSERT INTO extension_tokens (token, user_id, expires_at) VALUES (?, ?, ?)")
    .run(token, userId, expiresAt);
  return token;
}

export function getUserByExtensionToken(token: string | undefined): UserRow | null {
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT u.id, u.email, t.expires_at AS expires_at
       FROM extension_tokens t JOIN users u ON u.id = t.user_id
       WHERE t.token = ?`,
    )
    .get(token) as (UserRow & { expires_at: number }) | undefined;
  if (!row || row.expires_at < Date.now()) return null;
  return { id: row.id, email: row.email };
}

export function getUserByEmail(email: string): (UserRow & { password_hash: string }) | null {
  const row = getDb().prepare("SELECT id, email, password_hash FROM users WHERE email = ?").get(email);
  return (row as (UserRow & { password_hash: string }) | undefined) ?? null;
}

export function createUser(email: string, passwordHash: string): UserRow {
  const id = randomBytes(16).toString("hex");
  getDb()
    .prepare("INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)")
    .run(id, email, passwordHash, Date.now());
  return { id, email };
}

export function getSessionUser(token: string | undefined): UserRow | null {
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT u.id, u.email, s.expires_at AS expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`,
    )
    .get(token) as (UserRow & { expires_at: number }) | undefined;
  if (!row || row.expires_at < Date.now()) return null;
  return { id: row.id, email: row.email };
}

export function requireUser(req: NextRequest): UserRow | null {
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
