"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { JobRadarBody } from "@/components/JobRadarModal";
import { DiscoverRolesBody } from "@/components/DiscoverRolesModal";

export default function RadarPage() {
  const { ws, jobs, addJob, openOnboarding } = useApp();
  const [tab, setTab] = useState<"suggested" | "explore">("suggested");
  const hasSignal = Boolean(ws.profile) || (ws.masterResume?.text ?? "").trim().length > 40;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl border border-slate-300 bg-white p-0.5">
          {(
            [
              { id: "suggested", label: "Suggested for you" },
              { id: "explore", label: "Explore US roles" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                tab === t.id ? "bg-brand-600 text-white" : "text-slate-600 hover:text-brand-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Tracked roles appear on{" "}
          <Link href="/jobs" className="font-semibold text-brand-600 hover:underline">
            Applications
          </Link>
          .
        </p>
      </section>

      {!hasSignal && (
        <section className="card p-6">
          <h2 className="text-sm font-bold text-slate-900">Add your background to unlock suggestions</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
            Suggestions are ranked from your skills, target roles, industry, and resume. You can still browse the full
            US role explorer below.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/resume" className="btn-primary btn-sm">
              Upload resume
            </Link>
            <button type="button" onClick={openOnboarding} className="btn-secondary btn-sm">
              Complete profile
            </button>
          </div>
        </section>
      )}

      <section className="card p-5">
        {tab === "suggested" ? (
          <JobRadarBody
            profile={ws.profile}
            resumeText={ws.masterResume?.text ?? ""}
            jobs={jobs}
            onAdd={(draft) => addJob(draft)}
          />
        ) : (
          <DiscoverRolesBody profile={ws.profile} onAdd={(draft) => addJob(draft)} />
        )}
      </section>
    </div>
  );
}
