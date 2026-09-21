import { NextRequest, NextResponse } from "next/server";
import { improveResume } from "@/lib/improve";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const resumeText = typeof body.resumeText === "string" ? body.resumeText : "";
    const jobDescription = typeof body.jobDescription === "string" ? body.jobDescription : "";
    if (resumeText.trim().length < 40) {
      return NextResponse.json({ error: "Resume text is too short." }, { status: 400 });
    }
    return NextResponse.json(await improveResume(resumeText, jobDescription));
  } catch (err) {
    console.error("[api/improve-resume]", err);
    const message = err instanceof Error ? err.message : "Could not improve the resume.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
