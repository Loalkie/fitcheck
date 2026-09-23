import { NextRequest, NextResponse } from "next/server";
import { createExtensionToken, requireUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const token = await createExtensionToken(user.id);
  return NextResponse.json({ token });
}
