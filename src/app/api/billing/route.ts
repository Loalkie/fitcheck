import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getBilling, setPlan, type Plan } from "@/lib/billing";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = requireUser(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  return NextResponse.json(getBilling(user.id));
}

export async function PUT(req: NextRequest) {
  const user = requireUser(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { plan?: unknown };
  const plan = body.plan as Plan | undefined;
  if (!plan || !["free", "pro", "career"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }
  setPlan(user.id, plan);
  return NextResponse.json(getBilling(user.id));
}
