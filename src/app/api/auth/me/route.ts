import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  return NextResponse.json({
    user: user ? { email: user.email, emailVerified: Boolean(user.email_verified_at) } : null,
  });
}
