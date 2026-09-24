import { NextRequest, NextResponse } from "next/server";
import { generateCoverLetter } from "@/lib/cover";
import { requireUser } from "@/lib/auth";
import { enforceRateLimit, AI_RATE_LIMIT } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const limited = await enforceRateLimit(request, AI_RATE_LIMIT, user);
    if (limited) return limited;

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const jobDescription = typeof body.jobDescription === "string" ? body.jobDescription : "";
    const resumeText = typeof body.resumeText === "string" ? body.resumeText : "";
    if (jobDescription.trim().length < 40) {
      return NextResponse.json({ error: "Job description is too short." }, { status: 400 });
    }
    if (resumeText.trim().length < 40) {
      return NextResponse.json({ error: "Please add your resume first." }, { status: 400 });
    }

    const coverLetter = await generateCoverLetter({
      jobDescription,
      resumeText,
      company: typeof body.company === "string" ? body.company : undefined,
      role: typeof body.role === "string" ? body.role : undefined,
      profile: (body.profile as never) ?? null,
    });

    return NextResponse.json({ coverLetter });
  } catch (err) {
    console.error("[api/cover-letter]", err);
    const message = err instanceof Error ? err.message : "Could not generate a cover letter.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
