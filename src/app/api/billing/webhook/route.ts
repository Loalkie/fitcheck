import { NextRequest, NextResponse } from "next/server";
import { getStripe, stripeWebhookSecret } from "@/lib/stripe";
import {
  hasStripeEvent,
  planFromSubscriptionStatus,
  recordStripeEvent,
  saveSubscription,
  setPlan,
  userIdForSubscription,
  type Plan,
} from "@/lib/billing";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Stripe changes the shape of these payloads between API versions, so the
 * pieces this handler needs are read defensively rather than typed against the
 * installed SDK version.
 */
interface SubscriptionLike {
  id?: string;
  status?: string;
  customer?: unknown;
  current_period_end?: number;
  items?: { data?: { current_period_end?: number }[] };
  metadata?: { userId?: string; plan?: string };
}

function idOf(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value) return String((value as { id: unknown }).id);
  return null;
}

function invoiceSubscriptionId(invoice: unknown): string | null {
  const value = invoice as {
    subscription?: unknown;
    parent?: { subscription_details?: { subscription?: unknown } };
  };
  return idOf(value.subscription ?? value.parent?.subscription_details?.subscription);
}

function periodEnd(subscription: SubscriptionLike): number | null {
  const seconds = subscription.current_period_end ?? subscription.items?.data?.[0]?.current_period_end;
  return typeof seconds === "number" ? seconds * 1000 : null;
}

async function applySubscription(userId: string, subscription: SubscriptionLike, customerId?: string | null) {
  const requested: Plan = subscription.metadata?.plan === "career" ? "career" : "pro";
  const status = subscription.status ?? "active";
  const plan = planFromSubscriptionStatus(status, requested);

  await saveSubscription({
    userId,
    plan,
    status,
    customerId: customerId ?? idOf(subscription.customer),
    subscriptionId: subscription.id ?? null,
    currentPeriodEnd: periodEnd(subscription),
  });
  // user_plans stays the single source of truth for quota checks.
  await setPlan(userId, plan);
}

export async function POST(req: NextRequest) {
  const stripe = await getStripe();
  const secret = await stripeWebhookSecret();
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe webhook not configured." }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  const payload = await req.text();

  let event: { id: string; type: string; data: { object: unknown } };
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret) as unknown as typeof event;
  } catch (err) {
    // A bad signature is the caller's problem; retrying will never help.
    console.error("[stripe-webhook] signature check failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  // Stripe retries deliveries for days; a replay must not re-apply anything.
  if (await hasStripeEvent(event.id)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as { customer?: unknown; subscription?: unknown; metadata?: Record<string, string> };
        const userId = session.metadata?.userId;
        const subscriptionId = idOf(session.subscription);
        if (!userId || !subscriptionId) break;
        const subscription = (await stripe.subscriptions.retrieve(subscriptionId)) as unknown as SubscriptionLike;
        // Metadata set on checkout is copied onto the subscription, but trust it
        // either way so an older subscription still resolves its owner.
        subscription.metadata = { ...(session.metadata ?? {}), ...(subscription.metadata ?? {}) };
        await applySubscription(userId, subscription, idOf(session.customer));
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as SubscriptionLike;
        const userId =
          subscription.metadata?.userId ?? (subscription.id ? await userIdForSubscription(subscription.id) : null);
        if (!userId) break;
        if (event.type === "customer.subscription.deleted" && !subscription.status) {
          subscription.status = "canceled";
        }
        await applySubscription(userId, subscription);
        break;
      }

      // A failed charge keeps the plan during Stripe's retry window; a
      // successful one re-syncs, which restores access after a recovery.
      case "invoice.payment_failed":
      case "invoice.paid": {
        const subscriptionId = invoiceSubscriptionId(event.data.object);
        if (!subscriptionId) break;
        const subscription = (await stripe.subscriptions.retrieve(subscriptionId)) as unknown as SubscriptionLike;
        const userId = subscription.metadata?.userId ?? (await userIdForSubscription(subscriptionId));
        if (!userId) break;
        await applySubscription(userId, subscription);
        break;
      }

      default:
        break;
    }

    await recordStripeEvent(event.id);
    return NextResponse.json({ received: true });
  } catch (err) {
    // Return 5xx so Stripe retries rather than swallowing the event.
    console.error("[stripe-webhook] could not apply event", event.type, err);
    return NextResponse.json({ error: "Could not apply the event." }, { status: 500 });
  }
}
