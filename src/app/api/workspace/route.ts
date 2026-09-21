import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = requireUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const row = getDb().prepare("SELECT data FROM workspaces WHERE user_id = ?").get(user.id) as
    | { data: string }
    | undefined;
  let workspace = null;
  if (row) {
    try {
      workspace = JSON.parse(row.data);
    } catch {
      workspace = null;
    }
  }
  return NextResponse.json({ workspace });
}

export async function PUT(req: NextRequest) {
  const user = requireUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin) {
    return NextResponse.json({ error: "Blocked cross-origin request." }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { workspace?: unknown };
  if (body.workspace == null) return NextResponse.json({ error: "Missing workspace payload." }, { status: 400 });

  const json = JSON.stringify(body.workspace);
  if (json.length > 2_000_000) {
    return NextResponse.json({ error: "Workspace is too large to sync." }, { status: 413 });
  }

  getDb()
    .prepare(
      `INSERT INTO workspaces (user_id, data, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
    )
    .run(user.id, json, Date.now());

  return NextResponse.json({ ok: true });
}
