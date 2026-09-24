import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  createSession,
  getUserByEmail,
  isValidEmail,
  verifyPassword,
} from "@/lib/auth";
import { durableStorageError } from "@/lib/db";
import { AUTH_RATE_LIMIT, enforceRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const limited = await enforceRateLimit(req, AUTH_RATE_LIMIT, null);
    if (limited) return limited;

    const storageIssue = durableStorageError();
    if (storageIssue) return NextResponse.json({ error: storageIssue }, { status: 503 });

    const body = (await req.json().catch(() => ({}))) as { email?: unknown; password?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!isValidEmail(email) || !password) {
      return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }

    const session = await createSession(user.id);
    const res = NextResponse.json({ user: { email: user.email } });
    res.cookies.set(SESSION_COOKIE, session.token, {
      ...SESSION_COOKIE_OPTIONS,
      maxAge: session.maxAge,
    });
    return res;
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "Could not sign in." }, { status: 500 });
  }
}
