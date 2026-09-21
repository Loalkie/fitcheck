import { NextRequest, NextResponse } from "next/server";
import { analyzeResume } from "@/lib/analyze";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("resume");
    const jobDescription = (form.get("jobDescription") as string | null) ?? "";

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Please upload a resume file." }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Unsupported file upload." }, { status: 400 });
    }
    if (jobDescription.trim().length < 40) {
      return NextResponse.json(
        { error: "Please paste a longer job description (at least a few sentences)." },
        { status: 400 },
      );
    }

    const result = await analyzeResume(file, jobDescription);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/analyze]", err);
    const message = err instanceof Error ? err.message : "Unexpected error while analyzing.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
