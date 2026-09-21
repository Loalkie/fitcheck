"use client";

import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import Insights from "@/components/Insights";
import ShareStatCard from "@/components/ShareStatCard";
import { WeeklyReportBody } from "@/components/WeeklyReportModal";

export default function InsightsPage() {
  const { jobs } = useApp();
  const [tab, setTab] = useState<"weekly" | "pipeline">("weekly");

  if (jobs.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
        <p className="text-sm font-semibold text-slate-800">No data yet</p>
        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">
          Insights are built from your pipeline. Track a few roles, score them, and move them through the stages — then
          come back to see what is actually working.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl border border-slate-300 bg-white p-0.5">
          {(
            [
              { id: "weekly", label: "Weekly report" },
              { id: "pipeline", label: "Pipeline analytics" },
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
        <ShareStatCard jobs={jobs} />
      </section>

      {tab === "weekly" ? (
        <section className="card p-5">
          <WeeklyReportBody jobs={jobs} />
        </section>
      ) : (
        <Insights jobs={jobs} />
      )}
    </div>
  );
}
