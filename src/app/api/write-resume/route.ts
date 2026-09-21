import { NextRequest, NextResponse } from "next/server";
import { writeResume } from "@/lib/write";
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
    const experience = typeof body.experience === "string" ? body.experience : "";
    const education = typeof body.education === "string" ? body.education : "";
    const skills = typeof body.skills === "string" ? body.skills : "";

    const hasAnyContent =
      experience.trim().length > 10 ||
      education.trim().length > 3 ||
      skills.trim().length > 2 ||
      (body.profile as UserProfile | null)?.skills?.length;

    if (!hasAnyContent) {
      return NextResponse.json(
        { error: "Add at least a few skills, experience notes, or complete your profile." },
        { status: 400 },
      );
    }

    const result = await writeResume({
      name: typeof body.name === "string" ? body.name : "",
      targetRole: typeof body.role === "string" ? body.role : "",
      targetCompany: typeof body.company === "string" ? body.company : undefined,
      experience,
      projects: typeof body.projects === "string" ? body.projects : "",
      education,
      skills,
      profile: (body.profile as UserProfile | null) ?? null,
      style: ["executive", "modern", "classic", "ats"].includes(String(body.style))
        ? (body.style as "executive" | "modern" | "classic" | "ats")
        : "executive",
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/write-resume]", err);
    const message = err instanceof Error ? err.message : "Could not write the resume.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
