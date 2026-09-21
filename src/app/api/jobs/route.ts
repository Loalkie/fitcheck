import { NextRequest, NextResponse } from "next/server";
import { getLiveJobs } from "@/lib/jobfeed";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    const company = request.nextUrl.searchParams.get("company")?.trim() ?? "";
    const remote = request.nextUrl.searchParams.get("remote") === "1";
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? "100");

    const jobs = await getLiveJobs({
      query,
      company,
      remote,
      limit: Number.isFinite(limit) ? Math.max(1, Math.min(limit, 200)) : 100,
    });

    return NextResponse.json({ jobs, count: jobs.length });
  } catch (err) {
    console.error("[api/jobs]", err);
    const message = err instanceof Error ? err.message : "Could not load jobs.";
    return NextResponse.json({ error: message, jobs: [] }, { status: 502 });
  }
}
