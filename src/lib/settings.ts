import { getDb } from "./db";

function isAiDisabled(mode: string): boolean {
  return mode === "none" || mode === "off" || mode === "heuristic";
}

export async function getSetting(key: string): Promise<string> {
  try {
    const row = await getDb()
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get<{ value: string }>(key);
    return row?.value ?? "";
  } catch {
    // No database on this host: fall back to environment variables only.
    return "";
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  process.env[key] = value;
  await getDb()
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

export async function allSettings(keys: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const key of keys) result[key] = await getSetting(key);
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

export async function loadSettingsIntoEnv(): Promise<void> {
  for (const key of SETTING_KEYS) {
    const value = await getSetting(key);
    if (value) process.env[key] = value;
  }
  if (isAiDisabled(await getSetting("AI_MODE"))) {
    delete process.env.AI_API_KEY;
    delete process.env.AI_API_URL;
    delete process.env.AI_MODEL;
  }
}
