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

export function getPlan(userId: string): Plan {
  const row = getDb().prepare("SELECT plan FROM user_plans WHERE user_id = ?").get(userId) as
    | { plan: string }
    | undefined;
  if (row?.plan === "pro" || row?.plan === "career") return row.plan;
  return "free";
}

export function setPlan(userId: string, plan: Plan): void {
  getDb()
    .prepare(
      `INSERT INTO user_plans (user_id, plan, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET plan = excluded.plan, updated_at = excluded.updated_at`,
    )
    .run(userId, plan, Date.now());
}

export function getUsage(userId: string, metric: string): number {
  const row = getDb()
    .prepare("SELECT count FROM usage WHERE user_id = ? AND metric = ? AND period = ?")
    .get(userId, metric, currentPeriod()) as { count: number } | undefined;
  return row?.count ?? 0;
}

export function recordUsage(userId: string, metric: "fit_check" | "ai_resume"): {
  allowed: boolean;
  used: number;
  limit: number;
} {
  const plan = getPlan(userId);
  const limit = PLAN_LIMITS[plan][metric];
  const used = getUsage(userId, metric) + 1;
  const allowed = used <= limit;
  if (allowed) {
    getDb()
      .prepare(
        `INSERT INTO usage (user_id, metric, period, count) VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id, metric, period) DO UPDATE SET count = count + 1`,
      )
      .run(userId, metric, currentPeriod(), 1);
  }
  return { allowed, used, limit };
}

export function getBilling(userId: string) {
  const plan = getPlan(userId);
  return {
    plan,
    usage: {
      fit_check: getUsage(userId, "fit_check"),
      ai_resume: getUsage(userId, "ai_resume"),
    },
    limits: PLAN_LIMITS[plan],
  };
}
