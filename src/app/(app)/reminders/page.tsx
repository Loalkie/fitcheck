"use client";

import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import Reminders from "@/components/Reminders";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function RemindersPage() {
  const { jobs, openJob, setFollowUp } = useApp();
  const [jobId, setJobId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");

  const scheduled = jobs.filter((j) => j.followUp?.date);
  const untouched = jobs.filter((j) => !j.followUp?.date);
  const interviews = jobs
    .filter((j) => j.interviewDate)
    .sort((a, b) => new Date(a.interviewDate!).getTime() - new Date(b.interviewDate!).getTime());

  function schedule() {
    const target = jobId || untouched[0]?.id;
    if (!target || !date) return;
    setFollowUp(target, { date, note: note.trim() });
    setNote("");
  }

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="text-sm font-bold text-slate-900">Schedule a follow-up</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Recruiters reply to a timely nudge. Pick a role, a date, and the single action you owe.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr_2fr_auto]">
          <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="field">
            <option value="">Select a role…</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title || "Untitled role"} · {j.company || "Company"}
              </option>
            ))}
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field" />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Email recruiter, check portal"
            className="field"
          />
          <button
            type="button"
            onClick={schedule}
            disabled={jobs.length === 0}
            className="btn-primary disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Schedule
          </button>
        </div>
      </section>

      {jobs.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
          <p className="text-sm font-semibold text-slate-800">Nothing to follow up on yet</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
            Track a job first — reminders live on the roles in your pipeline.
          </p>
        </section>
      ) : (
        <>
          {interviews.length > 0 && (
            <section className="card p-5">
              <h3 className="text-sm font-bold text-slate-900">📅 Interview schedule</h3>
              <ul className="mt-3 divide-y divide-slate-100">
                {interviews.map((job) => (
                  <li key={job.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {job.title || "Role"} <span className="font-normal text-slate-500">· {job.company || "Company"}</span>
                      </p>
                      <p className="text-xs text-indigo-600">
                        {new Date(job.interviewDate!).toLocaleString()}
                        {job.interviewLocation ? ` · ${job.interviewLocation}` : ""}
                      </p>
                      {job.interviewNote && <p className="text-xs text-slate-500">{job.interviewNote}</p>}
                    </div>
                    <button type="button" onClick={() => openJob(job.id)} className="btn-secondary btn-sm">
                      Open
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {scheduled.length > 0 ? (
            <Reminders jobs={jobs} onOpen={openJob} onDone={(id) => setFollowUp(id, null)} />
          ) : (
            <section className="card p-5">
              <p className="text-sm text-slate-500">No follow-ups scheduled yet.</p>
            </section>
          )}

          {untouched.length > 0 && (
            <section className="card p-5">
              <h3 className="text-sm font-bold text-slate-900">Roles without a reminder</h3>
              <ul className="mt-3 divide-y divide-slate-100">
                {untouched.map((job) => (
                  <li key={job.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {job.title || "Untitled role"}{" "}
                        <span className="font-normal text-slate-500">· {job.company || "Company"}</span>
                      </p>
                      <p className="text-xs capitalize text-slate-400">{job.status}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setJobId(job.id);
                          setNote(job.status === "applied" ? "Nudge recruiter about application status" : "");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="btn-secondary btn-sm"
                      >
                        Pick a date
                      </button>
                      <button type="button" onClick={() => openJob(job.id)} className="btn-ghost btn-sm">
                        Open
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
