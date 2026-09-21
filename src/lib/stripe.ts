import Stripe from "stripe";
import { getSetting } from "./settings";
import type { Plan } from "./billing";

export function getStripe(): Stripe | null {
  const key = getSetting("STRIPE_SECRET_KEY") || process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export function planPriceId(plan: Plan, period: "monthly" | "yearly" = "monthly"): string {
  const key = period === "yearly" ? `STRIPE_PRICE_${plan.toUpperCase()}_ANNUAL` : `STRIPE_PRICE_${plan.toUpperCase()}`;
  return getSetting(key) || process.env[key] || "";
}

export function stripeWebhookSecret(): string {
  return getSetting("STRIPE_WEBHOOK_SECRET") || process.env.STRIPE_WEBHOOK_SECRET || "";
}
