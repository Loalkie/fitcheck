import { NextRequest, NextResponse } from "next/server";
import { parseResume } from "@/lib/parse";
import { requireUser } from "@/lib/auth";
import { enforceRateLimit, UPLOAD_RATE_LIMIT } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const limited = await enforceRateLimit(request, UPLOAD_RATE_LIMIT, user);
    if (limited) return limited;

    const form = await request.formData();
    const file = form.get("resume");
    if (!file || typeof file === "string" || !(file instanceof File)) {
      return NextResponse.json({ error: "Please upload a resume file." }, { status: 400 });
    }
    const parsed = await parseResume(file);
    if (parsed.text.trim().length < 40) {
      return NextResponse.json(
        { error: "Could not read enough text. Use a PDF/DOCX with selectable text, or a .txt/.md file." },
        { status: 422 },
      );
    }
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[api/parse]", err);
    const message = err instanceof Error ? err.message : "Could not read that file.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
