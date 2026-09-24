import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "./db";

/**
 * Fixed-window rate limiting. Serverless hosts run many instances of the same
 * function, so the counters have to be shared — they live in the database the
 * rest of the app already uses. The in-memory map is only a fallback for hosts
 * that have no storage at all.
 */
export interface RateLimitPolicy {
  /** Counters are namespaced per bucket so different limits never collide. */
  bucket: string;
  anonymous: number;
  signedIn: number;
  windowSeconds: number;
}

/** Every AI call costs real money, so anonymous callers get the free-plan budget. */
export const AI_RATE_LIMIT: RateLimitPolicy = {
  bucket: "ai",
  anonymous: 5,
  signedIn: 60,
  windowSeconds: 3600,
};

/**
 * Job feeds hit third-party APIs that have their own quotas. Browsing companies
 * costs two calls per card, so the anonymous budget stays generous enough for a
 * real session while still capping a scripted drain.
 */
export const FEED_RATE_LIMIT: RateLimitPolicy = {
  bucket: "feed",
  anonymous: 60,
  signedIn: 480,
  windowSeconds: 3600,
};

/** Parsing uploads burns CPU rather than credits. */
export const UPLOAD_RATE_LIMIT: RateLimitPolicy = {
  bucket: "upload",
  anonymous: 20,
  signedIn: 120,
  windowSeconds: 3600,
};

/** Sign-in and sign-up share a bucket: both are brute-force and spam surfaces. */
export const AUTH_RATE_LIMIT: RateLimitPolicy = {
  bucket: "auth",
  anonymous: 10,
  signedIn: 10,
  windowSeconds: 900,
};

/**
 * Vercel appends the real client address as the last hop, so that is the entry
 * worth trusting; a caller-supplied prefix cannot move itself to the end.
 */
function callerIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-vercel-forwarded-for") ?? req.headers.get("x-forwarded-for");
  const lastHop = forwarded?.split(",").pop()?.trim();
  return lastHop || req.headers.get("x-real-ip")?.trim() || "unknown";
}

const fallbackCounters = new Map<string, { count: number; resetAt: number }>();

function incrementInMemory(id: string, windowMs: number): number {
  const now = Date.now();
  const existing = fallbackCounters.get(id);
  if (!existing || existing.resetAt <= now) {
    if (fallbackCounters.size > 5000) fallbackCounters.clear();
    fallbackCounters.set(id, { count: 1, resetAt: now + windowMs });
    return 1;
  }
  existing.count += 1;
  return existing.count;
}

/**
 * Counters move in a single statement, so two requests landing on different
 * instances cannot both read the same value and slip past the limit together.
 */
async function increment(bucket: string, key: string, windowStart: number, windowMs: number): Promise<number> {
  try {
    const row = await getDb()
      .prepare(
        `INSERT INTO rate_limits (bucket, "key", window_start, "count") VALUES (?, ?, ?, 1)
         ON CONFLICT(bucket, "key", window_start) DO UPDATE SET "count" = "rate_limits"."count" + 1
         RETURNING "count"`,
      )
      .get<{ count: number }>(bucket, key, windowStart);
    if (row) {
      // The first hit of a window is a cheap moment to clear out expired rows.
      if (row.count === 1) {
        void getDb()
          .prepare("DELETE FROM rate_limits WHERE window_start < ?")
          .run(Date.now() - 24 * 60 * 60 * 1000)
          .catch(() => {});
      }
      return row.count;
    }
  } catch (err) {
    console.error("[rate-limit] database counters unavailable, using memory:", err);
  }
  return incrementInMemory(`${bucket}:${key}:${windowStart}`, windowMs);
}

/**
 * Returns the 429 to send back, or null when the caller is inside its budget.
 * A limiter that cannot count fails open: staying reachable matters more than
 * the tail of a window.
 */
export async function enforceRateLimit(
  req: NextRequest,
  policy: RateLimitPolicy,
  user: { id: string } | null,
): Promise<NextResponse | null> {
  const limit = user ? policy.signedIn : policy.anonymous;
  if (!Number.isFinite(limit) || limit <= 0) return null;

  const windowMs = policy.windowSeconds * 1000;
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
  const key = user ? `user:${user.id}` : `ip:${callerIp(req)}`;
  const count = await increment(policy.bucket, key, windowStart, windowMs);
  if (count <= limit) return null;

  const retryAfter = Math.max(1, Math.ceil((windowStart + windowMs - Date.now()) / 1000));
  const minutes = Math.max(1, Math.ceil(retryAfter / 60));
  return NextResponse.json(
    {
      error: user
        ? `That is more requests than we can run right now. Please try again in ${minutes} minute(s).`
        : `Too many requests from this network. Sign in for a higher limit, or try again in ${minutes} minute(s).`,
      retryAfter,
    },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
