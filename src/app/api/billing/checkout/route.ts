import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getStripe, planPriceId } from "@/lib/stripe";
import type { Plan } from "@/lib/billing";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = requireUser(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { plan?: unknown; period?: unknown };
  const plan = body.plan as Plan | undefined;
  const period = body.period === "yearly" ? "yearly" : "monthly";
  if (!plan || !["pro", "career"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const stripe = getStripe();
  const priceId = planPriceId(plan, period);
  if (!stripe || !priceId) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add Stripe keys and price IDs in Settings." },
      { status: 503 },
    );
  }

  const origin = req.nextUrl.origin;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { trial_period_days: 7 },
    metadata: { userId: user.id, plan, period },
    success_url: `${origin}/pricing?checkout=success&plan=${plan}`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
