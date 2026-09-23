import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { allSettings, setSetting } from "@/lib/settings";

export const runtime = "nodejs";

const SETTING_KEYS = [
  "ADZUNA_APP_ID",
  "ADZUNA_APP_KEY",
  "USAJOBS_API_KEY",
  "USAJOBS_EMAIL",
  "AI_API_KEY",
  "AI_API_URL",
  "AI_MODEL",
  "AI_MODE",
  "STRIPE_SECRET_KEY",
  "STRIPE_PRICE_PRO",
  "STRIPE_PRICE_CAREER",
  "STRIPE_PRICE_PRO_ANNUAL",
  "STRIPE_PRICE_CAREER_ANNUAL",
  "STRIPE_WEBHOOK_SECRET",
];

function mask(value: string): string {
  if (!value) return "";
  if (value.length <= 8) return "••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

export async function GET(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const values = await allSettings(SETTING_KEYS);
  const masked = Object.fromEntries(SETTING_KEYS.map((key) => [key, mask(values[key])]));
  return NextResponse.json({ settings: masked, configured: SETTING_KEYS.map((key) => Boolean(values[key])) });
}

export async function PUT(req: NextRequest) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  for (const key of SETTING_KEYS) {
    if (typeof body[key] === "string" && body[key].trim()) {
      await setSetting(key, body[key].trim());
    }
  }
  return NextResponse.json({ ok: true });
}
