import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  createSession,
  createUser,
  getUserByEmail,
  hashPassword,
  isValidEmail,
} from "@/lib/auth";
import { durableStorageError } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const storageIssue = durableStorageError();
    if (storageIssue) return NextResponse.json({ error: storageIssue }, { status: 503 });

    const body = (await req.json().catch(() => ({}))) as { email?: unknown; password?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!isValidEmail(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    if (await getUserByEmail(email)) return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });

    const user = await createUser(email, hashPassword(password));
    const session = await createSession(user.id);
    const res = NextResponse.json({ user: { email: user.email } });
    res.cookies.set(SESSION_COOKIE, session.token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: session.maxAge,
    });
    return res;
  } catch (err) {
    console.error("[auth/register]", err);
    return NextResponse.json({ error: "Could not create account." }, { status: 500 });
  }
}
