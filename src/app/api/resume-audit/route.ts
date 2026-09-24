import { NextRequest, NextResponse } from "next/server";
import { auditResume } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { enforceRateLimit, AI_RATE_LIMIT } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const limited = await enforceRateLimit(request, AI_RATE_LIMIT, user);
    if (limited) return limited;

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const resumeText = typeof body.resumeText === "string" ? body.resumeText : "";
    const jobDescription = typeof body.jobDescription === "string" ? body.jobDescription : "";
    if (resumeText.trim().length < 20) {
      return NextResponse.json({ error: "Resume text is too short." }, { status: 400 });
    }
    return NextResponse.json(auditResume(resumeText, jobDescription));
  } catch (err) {
    console.error("[api/resume-audit]", err);
    const message = err instanceof Error ? err.message : "Could not audit the resume.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
