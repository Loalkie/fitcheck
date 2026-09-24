import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, requireUser, SESSION_COOKIE, SESSION_COOKIE_OPTIONS, verifyPassword } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

/** Tables that reference a user, cleared explicitly so no engine setting can strand rows. */
const OWNED_TABLES = ["sessions", "extension_tokens", "auth_tokens", "workspaces", "user_plans", "subscriptions"];

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as { password?: unknown };
    const password = typeof body.password === "string" ? body.password : "";

    const record = await getUserByEmail(user.email);
    // Deletion is irreversible, so the password is required even though the
    // session already proves who is asking.
    if (!record || !password || !verifyPassword(password, record.password_hash)) {
      return NextResponse.json({ error: "Enter your password to confirm." }, { status: 403 });
    }

    const db = getDb();
    for (const table of OWNED_TABLES) {
      await db.prepare(`DELETE FROM ${table} WHERE user_id = ?`).run(user.id);
    }
    await db.prepare('DELETE FROM "usage" WHERE user_id = ?').run(user.id);
    await db.prepare("DELETE FROM users WHERE id = ?").run(user.id);

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
    return res;
  } catch (err) {
    console.error("[auth/delete-account]", err);
    return NextResponse.json({ error: "Could not delete the account." }, { status: 500 });
  }
}
