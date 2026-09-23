import { NextResponse } from "next/server";
import { getDb, storageMode } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  let db = true;
  try {
    getDb().prepare("SELECT 1").get();
  } catch {
    db = false;
  }

  // This endpoint answers two questions: "is the app server up?" (the HTTP
  // status) and "which optional subsystems work?" (the payload). A missing
  // database is reported, not treated as a dead server.
  return NextResponse.json({
    ok: true,
    db,
    storage: storageMode(),
    time: new Date().toISOString(),
    version: "0.1.0",
  });
}
