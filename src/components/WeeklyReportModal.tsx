"use client";

import Modal from "./Modal";
import type { SavedJob } from "@/lib/store";

function inLastDays(iso: string | undefined, days: number): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= days * 86400000;
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export default function WeeklyReportModal({
  open,
  jobs,
  onClose,
}: {
  open: boolean;
  jobs: SavedJob[];
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Your weekly job-search report" wide>
      <WeeklyReportBody jobs={jobs} />
    </Modal>
  );
}

export function WeeklyReportBody({ jobs }: { jobs: SavedJob[] }) {
  const activeThisWeek = jobs.filter((j) => inLastDays(j.updatedAt, 7));
  const applied = jobs.filter((j) => ["applied", "interview", "offer", "rejected"].includes(j.status));
  const interviews = jobs.filter((j) => ["interview", "offer"].includes(j.status));
  const offers = jobs.filter((j) => j.status === "offer");
  const followUps = jobs
    .filter((j) => j.followUp?.date)
    .sort((a, b) => (a.followUp!.date < b.followUp!.date ? -1 : 1))
    .slice(0, 5);

  const scored = jobs.filter((j) => j.result);
  const avg = scored.length
    ? Math.round(scored.reduce((sum, j) => sum + (j.result?.overallScore ?? 0), 0) / scored.length)
    : null;

  const responseRate = applied.length ? Math.round((interviews.length / applied.length) * 100) : 0;

  const companyCounts = new Map<string, number>();
  jobs.forEach((j) => {
    const name = j.company?.trim() || "Unknown";
    companyCounts.set(name, (companyCounts.get(name) ?? 0) + 1);
  });
  const topCompanies = [...companyCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-5">
        <p className="text-sm text-slate-600">
          A snapshot of your pipeline. Use it to decide where to spend time next week.
        </p>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="Active this week" value={String(activeThisWeek.length)} />
          <Metric label="Applications" value={String(applied.length)} />
          <Metric label="Interviews" value={String(interviews.length)} sub={`${offers.length} offer${offers.length === 1 ? "" : "s"}`} />
          <Metric label="Response rate" value={`${responseRate}%`} sub={avg !== null ? `Avg match ${avg}/100` : "No scores yet"} />
        </div>

        {followUps.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Next follow-ups</p>
            <ul className="mt-2 space-y-1.5">
              {followUps.map((j) => (
                <li key={j.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-slate-700">
                    {j.title || "Role"} <span className="text-slate-400">· {j.company || "Company"}</span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {j.followUp!.date}{j.followUp!.note ? ` · ${j.followUp!.note}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {topCompanies.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Top companies</p>
              <div className="mt-2 space-y-2">
                {topCompanies.map(([company, count]) => (
                  <div key={company} className="flex items-center justify-between text-sm">
                    <span className="truncate text-slate-700">{company}</span>
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Next-week focus</p>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
              <li>• Follow up on every application older than 5 days.</li>
              <li>• Prioritize roles with match score {avg !== null ? `${avg}+` : "above your average"}.</li>
              <li>• Update your resume with any missing “must-have” skills from recent reports.</li>
              <li>• Add 5–10 new target roles to the pipeline.</li>
            </ul>
          </div>
        </div>
    </div>
  );
}
