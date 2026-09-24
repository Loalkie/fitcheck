import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getBilling, setPlan, type Plan } from "@/lib/billing";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  return NextResponse.json(await getBilling(user.id));
}

/**
 * Paid plans are granted by the Stripe webhook, which checks a payment
 * signature. This endpoint exists so a signed-in user can drop back to Free —
 * letting it accept "pro" or "career" would hand out the paid tiers for free.
 */
export async function PUT(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { plan?: unknown };
  const plan = body.plan as Plan | undefined;
  if (plan !== "free") {
    return NextResponse.json(
      {
        error:
          "Paid plans are activated by Stripe once checkout completes. Use the upgrade button — if a payment did not apply, contact support.",
      },
      { status: 403 },
    );
  }
  await setPlan(user.id, "free");
  return NextResponse.json(await getBilling(user.id));
}
