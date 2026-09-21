"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import EmailModal from "@/components/EmailModal";

export default function ContactsPage() {
  const { jobs, ws, openJob } = useApp();
  const [emailJobId, setEmailJobId] = useState<string | null>(null);

  const withContacts = jobs.filter((j) => (j.contacts?.length ?? 0) > 0);
  const total = withContacts.reduce((sum, j) => sum + (j.contacts?.length ?? 0), 0);
  const emailJob = jobs.find((j) => j.id === emailJobId) ?? null;
  const interviews = jobs
    .filter((j) => j.interviewDate)
    .sort((a, b) => new Date(a.interviewDate!).getTime() - new Date(b.interviewDate!).getTime());

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Contacts & networking</h2>
            <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-slate-500">
              Recruiters, referrals, and interviewers saved on your tracked jobs — with a direct route to email them.
            </p>
          </div>
          <div className="rounded-xl bg-brand-50 px-4 py-2 text-center">
            <p className="text-2xl font-bold text-brand-700">{total}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">Contacts</p>
          </div>
        </div>
      </section>

      {withContacts.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
          <p className="text-sm font-semibold text-slate-800">No contacts saved yet</p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">
            Add a recruiter, referral, or interview contact to any tracked job, then come back here to manage the
            relationship and send tailored follow-ups.
          </p>
          <Link href="/jobs" className="btn-primary btn-sm mt-4">
            Open applications
          </Link>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {withContacts.map((job) => (
            <section key={job.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <button type="button" onClick={() => openJob(job.id)} className="min-w-0 text-left">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {job.title || "Untitled role"}{" "}
                    <span className="font-normal text-slate-500">· {job.company || "Company"}</span>
                  </p>
                  <p className="text-xs capitalize text-slate-400">{job.status}</p>
                </button>
                <button type="button" onClick={() => setEmailJobId(job.id)} className="btn-primary btn-sm">
                  ✉ Email
                </button>
              </div>

              <ul className="mt-3 divide-y divide-slate-100">
                {job.contacts!.map((c, i) => (
                  <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{c.name || "Unnamed contact"}</p>
                      <p className="truncate text-xs text-slate-500">{[c.title, c.email].filter(Boolean).join(" · ")}</p>
                    </div>
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="btn-secondary btn-sm">
                        Mail ↗
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {interviews.length > 0 && (
        <section className="card p-5">
          <h3 className="text-sm font-bold text-slate-900">Upcoming interviews</h3>
          <ul className="mt-3 divide-y divide-slate-100">
            {interviews.map((job) => (
              <li key={job.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {job.title || "Role"} <span className="font-normal text-slate-500">· {job.company || "Company"}</span>
                  </p>
                  <p className="text-xs text-indigo-600">
                    📅 {new Date(job.interviewDate!).toLocaleString()}
                    {job.interviewLocation ? ` · ${job.interviewLocation}` : ""}
                  </p>
                  {job.interviewNote && <p className="text-xs text-slate-500">{job.interviewNote}</p>}
                </div>
                <button type="button" onClick={() => openJob(job.id)} className="btn-secondary btn-sm">
                  Open job
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {emailJob && (
        <EmailModal
          job={emailJob}
          resumeText={ws.masterResume?.text ?? ""}
          onClose={() => setEmailJobId(null)}
        />
      )}
    </div>
  );
}
