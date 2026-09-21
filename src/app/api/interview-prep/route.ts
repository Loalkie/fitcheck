import { NextRequest, NextResponse } from "next/server";
import { generateInterviewPrep } from "@/lib/interview";
import type { UserProfile } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const resumeText = typeof body.resumeText === "string" ? body.resumeText : "";
    const jobDescription = typeof body.jobDescription === "string" ? body.jobDescription : "";

    if (resumeText.trim().length < 40) {
      return NextResponse.json({ error: "Add your resume first." }, { status: 400 });
    }
    if (jobDescription.trim().length < 20) {
      return NextResponse.json({ error: "Add the target role or job description." }, { status: 400 });
    }

    const result = await generateInterviewPrep({
      resumeText,
      jobDescription,
      role: typeof body.role === "string" ? body.role : undefined,
      company: typeof body.company === "string" ? body.company : undefined,
      profile: (body.profile as UserProfile | null) ?? null,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/interview-prep]", err);
    const message = err instanceof Error ? err.message : "Could not generate interview prep.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
