"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/components/AppProvider";
import Board from "@/components/Board";
import JobCard from "@/components/JobCard";
import Insights from "@/components/Insights";
import ImportJobsModal from "@/components/ImportJobsModal";

export default function JobsPage() {
  const {
    jobs,
    hasResume,
    analyzingId,
    setStatus,
    deleteJob,
    analyzeJob,
    openAddJob,
    promptFollowUp,
    openJob,
  } = useApp();
  const [view, setView] = useState<"board" | "list">("board");
  const [importOpen, setImportOpen] = useState(false);
  const [batchBusy, setBatchBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | string>("all");
  const [sort, setSort] = useState<"updated" | "score" | "company">("updated");

  const unscored = jobs.filter((j) => !j.result);
  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = jobs.filter((j) => {
      const matchesSearch =
        !q ||
        `${j.title} ${j.company} ${j.location ?? ""} ${j.salary ?? ""}`.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || j.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    if (sort === "score") {
      list = [...list].sort((a, b) => (b.result?.overallScore ?? -1) - (a.result?.overallScore ?? -1));
    } else if (sort === "company") {
      list = [...list].sort((a, b) => (a.company || "").localeCompare(b.company || ""));
    } else {
      list = [...list].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    return list;
  }, [jobs, search, statusFilter, sort]);

  async function scoreAll() {
    if (!hasResume || unscored.length === 0) return;
    setBatchBusy(true);
    for (const job of unscored) {
      await analyzeJob(job.id);
    }
    setBatchBusy(false);
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl border border-slate-300 bg-white p-0.5">
          {(["board", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold capitalize transition ${
                view === v ? "bg-brand-600 text-white" : "text-slate-600 hover:text-brand-600"
              }`}
            >
              {v === "board" ? "Board" : "List"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setImportOpen(true)} className="btn-secondary btn-sm">
            Import CSV
          </button>
          {hasResume && unscored.length > 0 && (
            <button type="button" onClick={() => void scoreAll()} disabled={batchBusy} className="btn-secondary btn-sm disabled:bg-slate-300">
              {batchBusy ? "Scoring…" : `Score all (${unscored.length})`}
            </button>
          )}
          <button type="button" onClick={() => openAddJob()} className="btn-primary btn-sm">
            + Add job
          </button>
        </div>
      </section>

      {jobs.length > 0 && (
        <section className="card flex flex-wrap items-center gap-3 p-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search role, company, location…"
            className="field min-w-52 flex-1"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="field max-w-36">
            <option value="all">All statuses</option>
            <option value="saved">Saved</option>
            <option value="applied">Applied</option>
            <option value="interview">Interview</option>
            <option value="offer">Offer</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="field max-w-40">
            <option value="updated">Recently updated</option>
            <option value="score">Highest match</option>
            <option value="company">Company A–Z</option>
          </select>
        </section>
      )}

      {jobs.length === 0 ? (
        <section className="card p-10 text-center">
          <p className="text-sm font-semibold text-slate-800">No roles tracked yet</p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">
            Add the roles you are considering. Each one gets its own match score, status, contacts, and follow-up
            reminder.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button type="button" onClick={() => openAddJob()} className="btn-primary btn-sm">
              Add your first job
            </button>
          </div>
        </section>
      ) : view === "board" ? (
        <Board
          jobs={filteredJobs}
          hasResume={hasResume}
          analyzingId={analyzingId}
          onStatus={setStatus}
          onOpen={openJob}
          onAdd={(status) => openAddJob(undefined, status)}
          onAnalyze={(id) => void analyzeJob(id)}
          onRemind={promptFollowUp}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              hasResume={hasResume}
              analyzing={analyzingId === job.id}
              onView={() => openJob(job.id)}
              onStatus={(s) => setStatus(job.id, s)}
              onDelete={() => deleteJob(job.id)}
              onAnalyze={() => void analyzeJob(job.id)}
              onRemind={() => promptFollowUp(job.id)}
            />
          ))}
          <button
            type="button"
            onClick={() => openAddJob()}
            className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/40 p-4 text-slate-400 transition hover:border-brand-500 hover:text-brand-600"
          >
            <span className="text-2xl">+</span>
            <span className="text-xs font-medium">Add job</span>
          </button>
        </div>
      )}

      <Insights jobs={jobs} />

      <ImportJobsModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
