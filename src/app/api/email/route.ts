import { NextRequest, NextResponse } from "next/server";
import { generateEmail, type EmailPurpose } from "@/lib/email";
import { requireUser } from "@/lib/auth";
import { enforceRateLimit, AI_RATE_LIMIT } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

const PURPOSES: EmailPurpose[] = ["outreach", "referral", "follow-up", "thank-you"];

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const limited = await enforceRateLimit(request, AI_RATE_LIMIT, user);
    if (limited) return limited;

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const jobDescription = typeof body.jobDescription === "string" ? body.jobDescription : "";
    const resumeText = typeof body.resumeText === "string" ? body.resumeText : "";
    const purpose = (body.purpose as EmailPurpose) || "outreach";

    if (!PURPOSES.includes(purpose)) {
      return NextResponse.json({ error: "Unknown email purpose." }, { status: 400 });
    }
    if (jobDescription.trim().length < 20) {
      return NextResponse.json({ error: "Add a job description first." }, { status: 400 });
    }

    const result = await generateEmail({
      jobDescription,
      resumeText,
      purpose,
      company: typeof body.company === "string" ? body.company : undefined,
      role: typeof body.role === "string" ? body.role : undefined,
      contactName: typeof body.contactName === "string" ? body.contactName : undefined,
      contactTitle: typeof body.contactTitle === "string" ? body.contactTitle : undefined,
      candidateName: typeof body.candidateName === "string" ? body.candidateName : undefined,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/email]", err);
    const message = err instanceof Error ? err.message : "Could not generate the email.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
