"use client";

import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import Insights from "@/components/Insights";
import Reminders from "@/components/Reminders";
import CompanyMatches from "@/components/CompanyMatches";

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-4">
      <p className="label">{label}</p>
      <p className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export default function OverviewPage() {
  const { ws, jobs, hasResume, openVersions, openOnboarding, openCompany, openJob, setFollowUp } = useApp();

  const scored = jobs.filter((j) => j.result);
  const avg = scored.length
    ? Math.round(scored.reduce((sum, j) => sum + (j.result?.overallScore ?? 0), 0) / scored.length)
    : null;
  const applied = jobs.filter((j) => ["applied", "interview", "offer", "rejected"].includes(j.status));
  const interviews = jobs.filter((j) => ["interview", "offer"].includes(j.status));
  const dueFollowUps = jobs.filter((j) => j.followUp?.date);

  const steps = [
    { done: hasResume, label: "Upload your resume", href: "/resume" },
    { done: Boolean(ws.profile), label: "Complete your profile", href: "/profile" },
    { done: jobs.length > 0, label: "Add a job you want", href: "/jobs" },
    { done: scored.length > 0, label: "Run a fit check", href: "/fit-check" },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f19]/55 p-6 sm:p-8 backdrop-blur-xl">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-brand-500/20 to-indigo-500/10 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Job search workspace</p>
          <h2 className="mt-2 max-w-2xl text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Know your fit before you apply. Track everything after.
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            One resume, every application, scored and organized — with the outreach and follow-ups that actually move
            you forward.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/fit-check" className="btn-primary">
              Run a fit check
            </Link>
            <Link href="/radar" className="btn-secondary">
              Browse Job Radar
            </Link>
            <Link href="/ai-resume" className="btn-secondary">
              Write AI resume
            </Link>
            <Link href="/jobs-feed" className="btn-secondary">
              Live Jobs
            </Link>
            <Link href="/autopilot" className="btn-secondary">
              Run Autopilot
            </Link>
            <Link href="/interview-prep" className="btn-secondary">
              Interview Prep
            </Link>
            {hasResume ? (
              <button type="button" onClick={openVersions} className="btn-ghost">
                Resume versions ({ws.resumeVersions.length})
              </button>
            ) : (
              <Link href="/resume" className="btn-ghost">
                Upload resume
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Avg match"
          value={avg !== null ? String(avg) : "—"}
          sub={avg !== null ? `${scored.length} scored roles` : "Run a fit check"}
        />
        <StatTile label="Tracked" value={String(jobs.length)} sub={`${applied.length} applied`} />
        <StatTile
          label="Interviews"
          value={String(interviews.length)}
          sub={applied.length ? `${Math.round((interviews.length / applied.length) * 100)}% response rate` : "No applications yet"}
        />
        <StatTile label="Follow-ups" value={String(dueFollowUps.length)} sub="scheduled or overdue" />
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Getting started</h3>
            <p className="text-xs text-slate-500">{doneCount} of {steps.length} steps complete</p>
          </div>
          <span className="chip bg-brand-50 font-semibold text-brand-700">
            {Math.round((doneCount / steps.length) * 100)}%
          </span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <Link
              key={step.label}
              href={step.href}
              className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-medium transition ${
                step.done
                  ? "border-emerald-200 bg-emerald-50/60 text-emerald-800"
                  : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  step.done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                }`}
              >
                {step.done ? "✓" : "•"}
              </span>
              {step.label}
            </Link>
          ))}
        </div>
        {!ws.profile && (
          <button type="button" onClick={openOnboarding} className="btn-secondary btn-sm mt-4">
            Complete your profile
          </button>
        )}
      </section>

      <Reminders jobs={jobs} onOpen={openJob} onDone={(id) => setFollowUp(id, null)} />

      <Insights jobs={jobs} />

      <CompanyMatches
        profile={ws.profile}
        resumeText={ws.masterResume?.text ?? ""}
        onCompany={openCompany}
        compact
      />

      <section className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900">Recent activity</h3>
          <Link href="/jobs" className="text-xs font-semibold text-brand-600 hover:underline">
            View all applications →
          </Link>
        </div>
        {jobs.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No roles yet. Add the first job you are chasing, or start from a suggestion in Job Radar.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {[...jobs]
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .slice(0, 5)
              .map((job) => (
                <li key={job.id} className="flex items-center justify-between gap-3 py-2.5">
                  <button type="button" onClick={() => openJob(job.id)} className="min-w-0 text-left">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {job.title || "Untitled role"}{" "}
                      <span className="font-normal text-slate-500">· {job.company || "Company"}</span>
                    </p>
                    <p className="truncate text-xs capitalize text-slate-400">{job.status}</p>
                  </button>
                  {job.result ? (
                    <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700">
                      {job.result.overallScore}
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs text-slate-400">Not scored</span>
                  )}
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}
