import { NextRequest, NextResponse } from "next/server";
import { extractJobFromUrl } from "@/lib/urlExtract";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { url?: unknown };
    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "Enter a valid job posting URL." }, { status: 400 });
    }
    const job = await extractJobFromUrl(url);
    return NextResponse.json(job);
  } catch (err) {
    console.error("[api/extract-job]", err);
    const message = err instanceof Error ? err.message : "Could not extract the job posting.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
