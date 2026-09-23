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

export async function getBilling(userId: string) {
  const plan = await getPlan(userId);
  return {
    plan,
    usage: {
      fit_check: await getUsage(userId, "fit_check"),
      ai_resume: await getUsage(userId, "ai_resume"),
    },
    limits: PLAN_LIMITS[plan],
  };
}
