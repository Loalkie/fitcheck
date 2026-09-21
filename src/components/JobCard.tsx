"use client";

import type { JobStatus, SavedJob } from "@/lib/store";

const STATUS_LABELS: Record<JobStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

function tone(score: number) {
  if (score >= 75) return "bg-emerald-100 text-emerald-700";
  if (score >= 50) return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

interface Props {
  job: SavedJob;
  hasResume: boolean;
  analyzing: boolean;
  onView: () => void;
  onStatus: (status: JobStatus) => void;
  onDelete: () => void;
  onAnalyze: () => void;
  onRemind: () => void;
}

export default function JobCard({ job, hasResume, analyzing, onView, onStatus, onDelete, onAnalyze, onRemind }: Props) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-900">{job.title || "Untitled role"}</h3>
          <p className="truncate text-xs text-slate-500">{job.company || "Company"}</p>
          {(job.location || job.salary) && (
            <p className="truncate text-[11px] text-slate-400">{[job.location, job.salary].filter(Boolean).join(" · ")}</p>
          )}
          {job.followUp?.date && (
            <p className="truncate text-[11px] font-medium text-amber-600">
              🔔 {job.followUp.date}{job.followUp.note ? ` · ${job.followUp.note}` : ""}
            </p>
          )}
          {job.interviewDate && (
            <p className="truncate text-[11px] font-medium text-indigo-600">
              📅 Interview: {new Date(job.interviewDate).toLocaleString()}
              {job.interviewLocation ? ` · ${job.interviewLocation}` : ""}
            </p>
          )}
        </div>
        {job.result ? (
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-sm font-bold ${tone(job.result.overallScore)}`}>
            {job.result.overallScore}
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-400">
            {analyzing ? "Analyzing…" : "No score"}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <select
          value={job.status}
          onChange={(e) => onStatus(e.target.value as JobStatus)}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700"
        >
          {(Object.keys(STATUS_LABELS) as JobStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        {job.result ? (
          <button
            type="button"
            onClick={onView}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
          >
            View report
          </button>
        ) : (
          <button
            type="button"
            onClick={onAnalyze}
            disabled={!hasResume || analyzing}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {analyzing ? "…" : "Analyze"}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="mt-2 self-start text-[11px] font-medium text-slate-400 hover:text-rose-600"
      >
        Remove
      </button>
      <button
        type="button"
        onClick={onRemind}
        className="mt-1 self-start text-[11px] font-medium text-brand-600 hover:text-brand-700"
      >
        {job.followUp ? "Edit reminder" : "Add reminder"}
      </button>
    </div>
  );
}
