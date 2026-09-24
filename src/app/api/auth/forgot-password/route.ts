import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, isValidEmail } from "@/lib/auth";
import { invalidateAuthTokens, issueAuthToken, PASSWORD_RESET_TTL_MS } from "@/lib/authTokens";
import { appOrigin, mailConfigured, passwordResetEmail, sendMail } from "@/lib/mailer";
import { enforceRateLimit, RECOVERY_RATE_LIMIT } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const limited = await enforceRateLimit(req, RECOVERY_RATE_LIMIT, null);
    if (limited) return limited;

    // Checked before the account lookup so a "not configured" answer says
    // nothing about which addresses have accounts.
    if (!mailConfigured()) {
      return NextResponse.json(
        {
          error:
            "This deployment has no mail provider configured, so password reset is unavailable. Contact the site owner.",
        },
        { status: 503 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as { email?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    // The same answer for every address: this endpoint must not reveal which
    // emails are registered.
    const user = await getUserByEmail(email);
    if (!user) return NextResponse.json({ ok: true });

    await invalidateAuthTokens(user.id, "password_reset");
    const token = await issueAuthToken(user.id, "password_reset", PASSWORD_RESET_TTL_MS);
    const link = `${appOrigin(req)}/reset-password?token=${token}`;

    const sent = await sendMail({ to: email, subject: "Reset your FitCheck password", text: passwordResetEmail(link) });
    if (!sent.delivered) {
      console.error("[auth/forgot-password] mail failed:", sent.error);
      return NextResponse.json({ error: "Could not send the email right now. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/forgot-password]", err);
    return NextResponse.json({ error: "Could not start the reset." }, { status: 500 });
  }
}
