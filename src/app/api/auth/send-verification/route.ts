import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { EMAIL_VERIFY_TTL_MS, invalidateAuthTokens, issueAuthToken } from "@/lib/authTokens";
import { appOrigin, mailConfigured, sendMail, verifyEmailText } from "@/lib/mailer";
import { enforceRateLimit, RECOVERY_RATE_LIMIT } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

    const limited = await enforceRateLimit(req, RECOVERY_RATE_LIMIT, user);
    if (limited) return limited;

    if (user.email_verified_at) return NextResponse.json({ ok: true, alreadyVerified: true });

    if (!mailConfigured()) {
      return NextResponse.json(
        { error: "This deployment has no mail provider configured, so verification is unavailable." },
        { status: 503 },
      );
    }

    await invalidateAuthTokens(user.id, "email_verify");
    const token = await issueAuthToken(user.id, "email_verify", EMAIL_VERIFY_TTL_MS);
    const sent = await sendMail({
      to: user.email,
      subject: "Verify your FitCheck email",
      text: verifyEmailText(`${appOrigin(req)}/verify-email?token=${token}`),
    });
    if (!sent.delivered) {
      console.error("[auth/send-verification] mail failed:", sent.error);
      return NextResponse.json({ error: "Could not send the email right now." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/send-verification]", err);
    return NextResponse.json({ error: "Could not send the verification email." }, { status: 500 });
  }
}
