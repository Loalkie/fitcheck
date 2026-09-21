import { NextRequest, NextResponse } from "next/server";
import { getUserByExtensionToken, requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { analyzeFromText } from "@/lib/analyze";
import { generateCoverLetter } from "@/lib/cover";
import { generateEmail } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;

function cors(response: NextResponse): NextResponse {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }));
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : undefined;
  const user = getUserByExtensionToken(bearer) ?? requireUser(req);
  if (!user) return cors(NextResponse.json({ error: "Not authenticated." }, { status: 401 }));

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const company = typeof body.company === "string" ? body.company.trim() : "";
  if (!title || !company) {
    return cors(NextResponse.json({ error: "Missing job title or company." }, { status: 400 }));
  }

  const jdText =
    typeof body.jdText === "string" && body.jdText.trim()
      ? body.jdText.trim()
      : `Role: ${title}\nCompany: ${company}\nLocation: ${typeof body.location === "string" ? body.location : ""}\nSource: ${typeof body.url === "string" ? body.url : ""}\n\nOpen the posting for full requirements.`;

  const job: Record<string, unknown> = {
    id: newId(),
    title,
    company,
    url: typeof body.url === "string" ? body.url : "",
    location: typeof body.location === "string" ? body.location : "",
    salary: typeof body.salary === "string" ? body.salary : "",
    notes: "Imported from Chrome extension",
    contacts: [],
    jdText,
    status: "saved",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    result: null,
  };

  const db = getDb();
  const row = db.prepare("SELECT data FROM workspaces WHERE user_id = ?").get(user.id) as
    | { data: string }
    | undefined;
  let workspace: Record<string, unknown> = { masterResume: null, jobs: [], profile: null, resumeVersions: [] };
  if (row) {
    try {
      workspace = JSON.parse(row.data) as Record<string, unknown>;
    } catch {
      workspace = { masterResume: null, jobs: [], profile: null, resumeVersions: [] };
    }
  }

  const jobs = Array.isArray(workspace.jobs) ? workspace.jobs : [];
  const masterResume =
    workspace.masterResume && typeof workspace.masterResume === "object"
      ? (workspace.masterResume as { text?: unknown }).text
      : "";
  if (typeof masterResume === "string" && masterResume.trim().length >= 40 && jdText.length >= 40) {
    try {
      job.result = await analyzeFromText(masterResume, jdText);
    } catch (err) {
      console.error("[import-job] auto-analysis failed:", err);
    }
  }

  let coverLetter = "";
  let email: { subject: string; body: string } | null = null;
  if (typeof masterResume === "string" && masterResume.trim().length >= 40 && jdText.length >= 40) {
    try {
      coverLetter = await generateCoverLetter({
        jobDescription: jdText,
        resumeText: masterResume,
        company,
        role: title,
      });
    } catch (err) {
      console.error("[import-job] cover generation failed:", err);
    }
    try {
      email = await generateEmail({
        jobDescription: jdText,
        resumeText: masterResume,
        purpose: "outreach",
        company,
        role: title,
      });
    } catch (err) {
      console.error("[import-job] email generation failed:", err);
    }
  }

  const next = { ...workspace, jobs: [job, ...jobs] };
  const json = JSON.stringify(next);
  if (json.length > 2_000_000) {
    return cors(NextResponse.json({ error: "Workspace is too large to sync." }, { status: 413 }));
  }

  db.prepare(
    `INSERT INTO workspaces (user_id, data, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
  ).run(user.id, json, Date.now());

  const score = job.result && typeof job.result === "object" ? (job.result as { overallScore?: number }).overallScore : null;
  return cors(
    NextResponse.json({
      ok: true,
      jobId: job.id,
      score,
      coverLetter,
      email,
    }),
  );
}
