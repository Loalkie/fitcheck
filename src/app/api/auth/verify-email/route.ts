import { NextRequest, NextResponse } from "next/server";
import { markEmailVerified } from "@/lib/auth";
import { consumeAuthToken } from "@/lib/authTokens";
import { enforceRateLimit, RECOVERY_RATE_LIMIT } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const limited = await enforceRateLimit(req, RECOVERY_RATE_LIMIT, null);
    if (limited) return limited;

    const body = (await req.json().catch(() => ({}))) as { token?: unknown };
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!token) return NextResponse.json({ error: "That link is incomplete." }, { status: 400 });

    const userId = await consumeAuthToken(token, "email_verify");
    if (!userId) {
      return NextResponse.json({ error: "That verification link is invalid or has expired." }, { status: 400 });
    }

    await markEmailVerified(userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/verify-email]", err);
    return NextResponse.json({ error: "Could not verify the address." }, { status: 500 });
  }
}
