import Stripe from "stripe";
import { getSetting } from "./settings";
import type { Plan } from "./billing";

export async function getStripe(): Promise<Stripe | null> {
  const key = (await getSetting("STRIPE_SECRET_KEY")) || process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export async function planPriceId(plan: Plan, period: "monthly" | "yearly" = "monthly"): Promise<string> {
  const key = period === "yearly" ? `STRIPE_PRICE_${plan.toUpperCase()}_ANNUAL` : `STRIPE_PRICE_${plan.toUpperCase()}`;
  return (await getSetting(key)) || process.env[key] || "";
}

export async function stripeWebhookSecret(): Promise<string> {
  return (await getSetting("STRIPE_WEBHOOK_SECRET")) || process.env.STRIPE_WEBHOOK_SECRET || "";
}
