import { NextRequest, NextResponse } from "next/server";
import { tailorResume } from "@/lib/tailor";
import type { UserProfile } from "@/lib/store";
import { requireUser } from "@/lib/auth";
import { recordUsage } from "@/lib/billing";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const user = requireUser(request);
    if (user) {
      const usage = recordUsage(user.id, "ai_resume");
      if (!usage.allowed) {
        return NextResponse.json(
          {
            error: `Free plan limit reached (${usage.used - 1}/${usage.limit}). Upgrade to Pro for unlimited AI resume versions.`,
            planRequired: true,
          },
          { status: 402 },
        );
      }
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const resumeText = typeof body.resumeText === "string" ? body.resumeText : "";
    const jobDescription = typeof body.jobDescription === "string" ? body.jobDescription : "";

    if (resumeText.trim().length < 40) {
      return NextResponse.json({ error: "Add your existing resume first." }, { status: 400 });
    }
    if (jobDescription.trim().length < 20) {
      return NextResponse.json(
        { error: "Add the target role, company, or a short job description." },
        { status: 400 },
      );
    }

    const result = await tailorResume({
      resumeText,
      jobDescription,
      company: typeof body.company === "string" ? body.company : undefined,
      role: typeof body.role === "string" ? body.role : undefined,
      profile: (body.profile as UserProfile | null) ?? null,
      style: ["executive", "modern", "classic", "ats"].includes(String(body.style))
        ? (body.style as "executive" | "modern" | "classic" | "ats")
        : "executive",
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/tailor-resume]", err);
    const message = err instanceof Error ? err.message : "Could not tailor the resume.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
