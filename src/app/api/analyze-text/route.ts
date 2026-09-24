import { NextRequest, NextResponse } from "next/server";
import { analyzeFromText } from "@/lib/analyze";
import { requireUser } from "@/lib/auth";
import { recordUsage } from "@/lib/billing";
import { enforceRateLimit, AI_RATE_LIMIT } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const limited = await enforceRateLimit(request, AI_RATE_LIMIT, user);
    if (limited) return limited;
    if (user) {
      const usage = await recordUsage(user.id, "fit_check");
      if (!usage.allowed) {
        return NextResponse.json(
          {
            error: `Free plan limit reached (${usage.used - 1}/${usage.limit}). Upgrade to Pro for unlimited fit checks.`,
            planRequired: true,
          },
          { status: 402 },
        );
      }
    }

    const body = (await request.json().catch(() => ({}))) as {
      resumeText?: unknown;
      jobDescription?: unknown;
    };
    const resumeText = typeof body.resumeText === "string" ? body.resumeText : "";
    const jobDescription = typeof body.jobDescription === "string" ? body.jobDescription : "";

    if (resumeText.trim().length < 40) {
      return NextResponse.json({ error: "Resume text is too short." }, { status: 400 });
    }
    if (jobDescription.trim().length < 40) {
      return NextResponse.json({ error: "Please paste a longer job description." }, { status: 400 });
    }

    const result = await analyzeFromText(resumeText, jobDescription);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/analyze-text]", err);
    const message = err instanceof Error ? err.message : "Unexpected error while analyzing.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
