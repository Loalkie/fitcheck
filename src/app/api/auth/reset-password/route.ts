import { NextRequest, NextResponse } from "next/server";
import { deleteSessionsForUser, hashPassword, markEmailVerified } from "@/lib/auth";
import { consumeAuthToken } from "@/lib/authTokens";
import { getDb } from "@/lib/db";
import { enforceRateLimit, RECOVERY_RATE_LIMIT } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const limited = await enforceRateLimit(req, RECOVERY_RATE_LIMIT, null);
    if (limited) return limited;

    const body = (await req.json().catch(() => ({}))) as { token?: unknown; password?: unknown };
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!token) return NextResponse.json({ error: "That reset link is incomplete." }, { status: 400 });
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const userId = await consumeAuthToken(token, "password_reset");
    if (!userId) {
      return NextResponse.json(
        { error: "That reset link is invalid or has expired. Request a new one." },
        { status: 400 },
      );
    }

    await getDb().prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(password), userId);
    // Whoever held the old sessions is signed out: a reset means the account may
    // have been reached by someone else.
    await deleteSessionsForUser(userId);
    // Reaching the link proves control of the mailbox.
    await markEmailVerified(userId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/reset-password]", err);
    return NextResponse.json({ error: "Could not reset the password." }, { status: 500 });
  }
}
