import { getDb } from "./db";

export type Plan = "free" | "pro" | "career";

export const PLAN_LIMITS: Record<Plan, { fit_check: number; ai_resume: number }> = {
  free: { fit_check: 5, ai_resume: 5 },
  pro: { fit_check: Infinity, ai_resume: Infinity },
  career: { fit_check: Infinity, ai_resume: Infinity },
};

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function getPlan(userId: string): Promise<Plan> {
  const row = await getDb()
    .prepare("SELECT plan FROM user_plans WHERE user_id = ?")
    .get<{ plan: string }>(userId);
  if (row?.plan === "pro" || row?.plan === "career") return row.plan;
  return "free";
}

export async function setPlan(userId: string, plan: Plan): Promise<void> {
  await getDb()
    .prepare(
      `INSERT INTO user_plans (user_id, plan, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET plan = excluded.plan, updated_at = excluded.updated_at`,
    )
    .run(userId, plan, Date.now());
}

export async function getUsage(userId: string, metric: string): Promise<number> {
  const row = await getDb()
    .prepare('SELECT "count" FROM "usage" WHERE user_id = ? AND metric = ? AND period = ?')
    .get<{ count: number }>(userId, metric, currentPeriod());
  return row?.count ?? 0;
}

export async function recordUsage(userId: string, metric: "fit_check" | "ai_resume"): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
}> {
  const plan = await getPlan(userId);
  const limit = PLAN_LIMITS[plan][metric];
  const used = (await getUsage(userId, metric)) + 1;
  const allowed = used <= limit;
  if (allowed) {
    await getDb()
      .prepare(
        `INSERT INTO "usage" (user_id, metric, period, "count") VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id, metric, period) DO UPDATE SET "count" = "usage"."count" + 1`,
      )
      .run(userId, metric, currentPeriod(), 1);
  }
  return { allowed, used, limit };
}

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "past_due"]);

/**
 * `past_due` deliberately keeps the paid tier while Stripe retries the card;
 * anything else (unpaid, canceled, incomplete_expired) drops back to Free.
 */
export function planFromSubscriptionStatus(status: string, paidPlan: Plan): Plan {
  return ACTIVE_SUBSCRIPTION_STATUSES.has(status) ? paidPlan : "free";
}

export interface SubscriptionState {
  plan: Plan;
  status: string;
  currentPeriodEnd: number | null;
}

export async function getSubscription(userId: string): Promise<SubscriptionState | null> {
  try {
    const row = await getDb()
      .prepare("SELECT plan, status, current_period_end FROM subscriptions WHERE user_id = ?")
      .get<{ plan: string; status: string; current_period_end: number | null }>(userId);
    if (!row) return null;
    return {
      plan: row.plan === "pro" || row.plan === "career" ? row.plan : "free",
      status: row.status,
      currentPeriodEnd: row.current_period_end ?? null,
    };
  } catch {
    return null;
  }
}

/** Mirrors what Stripe reports so a paying customer can be reconciled later. */
export async function saveSubscription(input: {
  userId: string;
  plan: Plan;
  status: string;
  customerId?: string | null;
  subscriptionId?: string | null;
  currentPeriodEnd?: number | null;
}): Promise<void> {
  await getDb()
    .prepare(
      `INSERT INTO subscriptions (user_id, plan, status, stripe_customer_id, stripe_subscription_id, current_period_end, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         plan = excluded.plan,
         status = excluded.status,
         stripe_customer_id = COALESCE(excluded.stripe_customer_id, subscriptions.stripe_customer_id),
         stripe_subscription_id = COALESCE(excluded.stripe_subscription_id, subscriptions.stripe_subscription_id),
         current_period_end = excluded.current_period_end,
         updated_at = excluded.updated_at`,
    )
    .run(
      input.userId,
      input.plan,
      input.status,
      input.customerId ?? null,
      input.subscriptionId ?? null,
      input.currentPeriodEnd ?? null,
      Date.now(),
    );
}

/** Needed to open Stripe's own portal for cancellations and invoices. */
export async function getStripeCustomerId(userId: string): Promise<string | null> {
  try {
    const row = await getDb()
      .prepare("SELECT stripe_customer_id FROM subscriptions WHERE user_id = ?")
      .get<{ stripe_customer_id: string | null }>(userId);
    return row?.stripe_customer_id ?? null;
  } catch {
    return null;
  }
}

/** Events arrive without our metadata sometimes; the subscription id still maps back. */
export async function userIdForSubscription(subscriptionId: string): Promise<string | null> {
  const row = await getDb()
    .prepare("SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?")
    .get<{ user_id: string }>(subscriptionId);
  return row?.user_id ?? null;
}

export async function hasStripeEvent(eventId: string): Promise<boolean> {
  try {
    const row = await getDb().prepare("SELECT id FROM stripe_events WHERE id = ?").get<{ id: string }>(eventId);
    return Boolean(row);
  } catch {
    // Without storage every event looks new; re-applying an upsert is harmless.
    return false;
  }
}

export async function recordStripeEvent(eventId: string): Promise<void> {
  await getDb()
    .prepare("INSERT INTO stripe_events (id, processed_at) VALUES (?, ?) ON CONFLICT(id) DO NOTHING")
    .run(eventId, Date.now());
}

export async function getBilling(userId: string) {
  const plan = await getPlan(userId);
  const subscription = await getSubscription(userId);
  return {
    plan,
    usage: {
      fit_check: await getUsage(userId, "fit_check"),
      ai_resume: await getUsage(userId, "ai_resume"),
    },
    limits: PLAN_LIMITS[plan],
    status: subscription?.status ?? null,
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
  };
}
