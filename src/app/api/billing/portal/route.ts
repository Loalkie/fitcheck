import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { getStripeCustomerId } from "@/lib/billing";

export const runtime = "nodejs";

/**
 * Where a customer cancels, changes card, or downloads invoices. Without it the
 * only way to stop a subscription is to email the owner.
 */
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const stripe = await getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });

  const customerId = await getStripeCustomerId(user.id);
  if (!customerId) {
    return NextResponse.json({ error: "No subscription is linked to this account yet." }, { status: 400 });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.nextUrl.origin}/pricing`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[billing/portal]", err);
    return NextResponse.json(
      { error: "Could not open the billing portal. Enable the customer portal in your Stripe settings first." },
      { status: 502 },
    );
  }
}
