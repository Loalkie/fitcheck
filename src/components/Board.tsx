"use client";

import { useState } from "react";
import type { JobStatus, SavedJob } from "@/lib/store";

const COLUMNS: { status: JobStatus; label: string; dot: string }[] = [
  { status: "saved", label: "Wishlist", dot: "bg-slate-400" },
  { status: "applied", label: "Applied", dot: "bg-blue-500" },
  { status: "interview", label: "Interview", dot: "bg-amber-500" },
  { status: "offer", label: "Offer", dot: "bg-emerald-500" },
  { status: "rejected", label: "Rejected", dot: "bg-rose-500" },
];

function scoreTone(score: number) {
  if (score >= 75) return "bg-emerald-100 text-emerald-700";
  if (score >= 50) return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

interface Props {
  jobs: SavedJob[];
  hasResume: boolean;
  analyzingId: string | null;
  onStatus: (jobId: string, status: JobStatus) => void;
  onOpen: (jobId: string) => void;
  onAdd: (status: JobStatus) => void;
  onAnalyze: (jobId: string) => void;
  onRemind: (jobId: string) => void;
}

export default function Board({ jobs, hasResume, analyzingId, onStatus, onOpen, onAdd, onAnalyze, onRemind }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<JobStatus | null>(null);

  return (
    <div className="mt-4 flex gap-3 overflow-x-auto pb-3">
      {COLUMNS.map((col) => {
        const items = jobs.filter((j) => j.status === col.status);
        return (
          <div
            key={col.status}
            onDragOver={(e) => {
              e.preventDefault();
              setOverStatus(col.status);
            }}
            onDragLeave={() => setOverStatus((s) => (s === col.status ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain") || dragId;
              if (id) onStatus(id, col.status);
              setDragId(null);
              setOverStatus(null);
            }}
            className={`flex w-64 shrink-0 flex-col rounded-xl border bg-slate-50/70 transition ${
              overStatus === col.status ? "border-brand-400 bg-brand-50/60" : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                <span className="text-xs font-bold uppercase tracking-wide text-slate-600">{col.label}</span>
                <span className="rounded-full bg-slate-200 px-1.5 text-[11px] font-semibold text-slate-500">{items.length}</span>
              </div>
              <button
                type="button"
                onClick={() => onAdd(col.status)}
                className="text-lg leading-none text-slate-400 hover:text-brand-600"
                aria-label={`Add to ${col.label}`}
              >
                +
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-2 px-2 pb-2">
              {items.map((job) => (
                <div
                  key={job.id}
                  draggable
                  onDragStart={(e) => {
                    setDragId(job.id);
                    e.dataTransfer.setData("text/plain", job.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverStatus(null);
                  }}
                  className="group cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-800">{job.company || "Company"}</p>
                      <p className="truncate text-xs text-slate-500">{job.title || "Role"}</p>
                    </div>
                    {job.result && (
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${scoreTone(job.result.overallScore)}`}>
                        {job.result.overallScore}
                      </span>
                    )}
                  </div>

                  {(job.location || job.salary) && (
                    <p className="mt-1 truncate text-[11px] text-slate-400">
                      {[job.location, job.salary].filter(Boolean).join(" · ")}
                    </p>
                  )}

                  {job.followUp?.date && (
                    <p className="mt-1 truncate text-[11px] font-medium text-amber-600">
                      🔔 {job.followUp.date}
                    </p>
                  )}

                  {job.interviewDate && (
                    <p className="mt-1 truncate text-[11px] font-medium text-indigo-600">
                      📅 {new Date(job.interviewDate).toLocaleString()}
                    </p>
                  )}

                  {job.notes && <p className="mt-1 truncate text-[11px] italic text-slate-400">{job.notes}</p>}

                  <div className="mt-2 flex items-center gap-2">
                    {job.result ? (
                      <button
                        type="button"
                        onClick={() => onOpen(job.id)}
                        className="rounded-md bg-brand-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-brand-700"
                      >
                        View report
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAnalyze(job.id)}
                        disabled={!hasResume || analyzingId === job.id}
                        className="rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {analyzingId === job.id ? "…" : "Analyze"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemind(job.id)}
                      className="rounded-md px-1 text-[11px] font-semibold text-slate-400 hover:text-brand-600"
                      title={job.followUp ? "Edit reminder" : "Add reminder"}
                    >
                      🔔
                    </button>
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-[11px] text-slate-400">
                  Drop jobs here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
