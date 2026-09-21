import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  let db = true;
  try {
    getDb().prepare("SELECT 1").get();
  } catch {
    db = false;
  }
  return NextResponse.json({
    ok: db,
    db,
    time: new Date().toISOString(),
    version: "0.1.0",
  });
}
