"use client";

import type { SavedJob } from "@/lib/store";

function todayISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function Reminders({
  jobs,
  onOpen,
  onDone,
}: {
  jobs: SavedJob[];
  onOpen: (id: string) => void;
  onDone: (id: string) => void;
}) {
  const today = todayISO();
  const withFollowUp = jobs
    .filter((j) => j.followUp?.date)
    .sort((a, b) => (a.followUp!.date < b.followUp!.date ? -1 : 1));

  if (withFollowUp.length === 0) return null;

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">Follow-up reminders</h2>
        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
          {withFollowUp.length}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {withFollowUp.map((j) => {
          const overdue = j.followUp!.date < today;
          const todayFlag = j.followUp!.date === today;
          return (
            <div
              key={j.id}
              className={`flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between ${
                overdue ? "border-rose-200 bg-rose-50/60" : todayFlag ? "border-amber-200 bg-amber-50/60" : "border-slate-200 bg-slate-50/50"
              }`}
            >
              <button type="button" onClick={() => onOpen(j.id)} className="min-w-0 text-left">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {j.title || "Role"} <span className="font-normal text-slate-500">· {j.company || "Company"}</span>
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  {overdue ? "⚠️ " : todayFlag ? "⏰ " : "🔔 "}
                  {j.followUp!.date}
                  {j.followUp!.note ? ` — ${j.followUp!.note}` : ""}
                </p>
              </button>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpen(j.id)}
                  className="rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-slate-700"
                >
                  Open job
                </button>
                <button
                  type="button"
                  onClick={() => onDone(j.id)}
                  className="rounded-lg border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Done
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
