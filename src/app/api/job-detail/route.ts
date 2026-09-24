import { NextRequest, NextResponse } from "next/server";
import { getLiveJobDescription } from "@/lib/jobfeed";
import { requireUser } from "@/lib/auth";
import { enforceRateLimit, FEED_RATE_LIMIT } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const limited = await enforceRateLimit(request, FEED_RATE_LIMIT, user);
    if (limited) return limited;

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const job = body.job as Record<string, unknown> | undefined;
    if (!job || typeof job.title !== "string" || typeof job.company !== "string") {
      return NextResponse.json({ error: "Missing job." }, { status: 400 });
    }
    const description = await getLiveJobDescription({
      id: typeof job.id === "string" ? job.id : "",
      title: job.title,
      company: job.company,
      location: typeof job.location === "string" ? job.location : "",
      url: typeof job.url === "string" ? job.url : "",
      source: typeof job.source === "string" ? job.source : "",
      postedAt: typeof job.postedAt === "string" ? job.postedAt : "",
      remote: Boolean(job.remote),
      boardId: typeof job.boardId === "string" ? job.boardId : undefined,
      jobId: typeof job.jobId === "number" ? job.jobId : undefined,
      size: job.size === "startup" || job.size === "enterprise" || job.size === "mid" ? job.size : "mid",
      level: job.level === "entry" || job.level === "mid" || job.level === "senior" || job.level === "manager" ? job.level : "mid",
      industry: typeof job.industry === "string" ? job.industry : "US Jobs",
    });
    return NextResponse.json({ description });
  } catch (err) {
    console.error("[api/job-detail]", err);
    const message = err instanceof Error ? err.message : "Could not load the job description.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
