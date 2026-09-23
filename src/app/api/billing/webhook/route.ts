import { NextRequest, NextResponse } from "next/server";
import { getStripe, stripeWebhookSecret } from "@/lib/stripe";
import { setPlan, type Plan } from "@/lib/billing";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const stripe = await getStripe();
  const secret = await stripeWebhookSecret();
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe webhook not configured." }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  const payload = await req.text();
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, secret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as {
        metadata?: { userId?: string; plan?: string };
      };
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan as Plan | undefined;
      if (userId && (plan === "pro" || plan === "career")) {
        await setPlan(userId, plan);
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as { metadata?: { userId?: string } };
      const userId = subscription.metadata?.userId;
      if (userId) await setPlan(userId, "free");
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe-webhook]", err);
    const message = err instanceof Error ? err.message : "Invalid webhook.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
