"use client";

import type { JobStatus, SavedJob } from "@/lib/store";

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function reached(level: Set<string>, jobs: SavedJob[]) {
  return jobs.filter((j) => level.has(j.status));
}

const STATUS_LABELS: Record<JobStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

const STATUS_ORDER: JobStatus[] = ["saved", "applied", "interview", "offer", "rejected"];
const STATUS_COLORS: Record<JobStatus, string> = {
  saved: "bg-slate-400",
  applied: "bg-brand-500",
  interview: "bg-amber-500",
  offer: "bg-emerald-500",
  rejected: "bg-rose-400",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function Insights({ jobs }: { jobs: SavedJob[] }) {
  if (jobs.length === 0) return null;

  const applied = reached(new Set(["applied", "interview", "offer", "rejected"]), jobs);
  const interviews = reached(new Set(["interview", "offer"]), jobs);
  const offers = reached(new Set(["offer"]), jobs);

  const scored = jobs.filter((j) => j.result);
  const avg = scored.length
    ? Math.round(scored.reduce((sum, j) => sum + (j.result?.overallScore ?? 0), 0) / scored.length)
    : null;

  const interviewScored = interviews.filter((j) => j.result);
  const interviewAvg = interviewScored.length
    ? Math.round(interviewScored.reduce((sum, j) => sum + (j.result?.overallScore ?? 0), 0) / interviewScored.length)
    : null;
  const rejectedScored = reached(new Set(["rejected"]), jobs).filter((j) => j.result);
  const rejectedAvg = rejectedScored.length
    ? Math.round(rejectedScored.reduce((sum, j) => sum + (j.result?.overallScore ?? 0), 0) / rejectedScored.length)
    : null;

  const responseRate = applied.length ? Math.round((interviews.length / applied.length) * 100) : 0;

  const counts = STATUS_ORDER.map((s) => jobs.filter((j) => j.status === s).length);
  const maxCount = Math.max(1, ...counts);

  const companyCounts = new Map<string, number>();
  jobs.forEach((j) => {
    const name = j.company?.trim() || "Unknown";
    companyCounts.set(name, (companyCounts.get(name) ?? 0) + 1);
  });
  const topCompanies = [...companyCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const recent = [...jobs].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-700">Your search at a glance</h2>
        {avg !== null && (
          <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700">
            Avg match {avg}/100
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Jobs tracked" value={String(jobs.length)} />
        <Metric label="Applications" value={String(applied.length)} />
        <Metric label="Interviews" value={String(interviews.length)} sub={`${offers.length} offer${offers.length === 1 ? "" : "s"}`} />
        <Metric label="Response rate" value={`${responseRate}%`} sub="interviews ÷ applications" />
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pipeline</p>
        <div className="mt-2 flex gap-1.5">
          {STATUS_ORDER.map((s, i) => (
            <div key={s} className="flex-1">
              <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className={STATUS_COLORS[s]} style={{ width: `${(counts[i] / maxCount) * 100}%` }} />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">
                {STATUS_LABELS[s]} <span className="font-semibold text-slate-700">{counts[i]}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {interviewAvg !== null && rejectedAvg !== null && interviewAvg > rejectedAvg && (
        <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-700">
          Insight: jobs you reached an interview on averaged <strong>{interviewAvg}</strong>, vs{" "}
          <strong>{rejectedAvg}</strong> for rejections. Prioritize roles where your match is{" "}
          <strong>{interviewAvg}+</strong>.
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {topCompanies.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Top companies</p>
            <div className="mt-2 space-y-2">
              {topCompanies.map(([company, count]) => (
                <div key={company} className="flex items-center justify-between text-sm">
                  <span className="truncate text-slate-700">{company}</span>
                  <span className="ml-2 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    {count} role{count === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {recent.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recent activity</p>
            <div className="mt-2 space-y-2">
              {recent.map((j) => (
                <div key={j.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-slate-700">
                      {j.title || "Role"} <span className="text-slate-400">· {j.company || "Company"}</span>
                    </p>
                    <p className="text-[11px] text-slate-400">{STATUS_LABELS[j.status]}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(j.updatedAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
