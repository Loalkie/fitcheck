import { getDb } from "./db";

function isAiDisabled(mode: string): boolean {
  return mode === "none" || mode === "off" || mode === "heuristic";
}

export function getSetting(key: string): string {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? "";
}

export function setSetting(key: string, value: string): void {
  process.env[key] = value;
  getDb()
    .prepare(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .run(key, value, Date.now());
  if (key === "AI_MODE" && isAiDisabled(value)) {
    delete process.env.AI_API_KEY;
    delete process.env.AI_API_URL;
    delete process.env.AI_MODEL;
  }
}

export function allSettings(keys: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of keys) result[key] = getSetting(key);
  return result;
}

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

export function loadSettingsIntoEnv(): void {
  for (const key of SETTING_KEYS) {
    const value = getSetting(key);
    if (value) process.env[key] = value;
  }
  if (isAiDisabled(getSetting("AI_MODE"))) {
    delete process.env.AI_API_KEY;
    delete process.env.AI_API_URL;
    delete process.env.AI_MODEL;
  }
}
