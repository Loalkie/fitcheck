"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import CoverLetterModal from "@/components/CoverLetterModal";
import EmailModal from "@/components/EmailModal";
import { generateCoverLetter, generateEmail } from "@/lib/client";

interface BatchDraft {
  jobId: string;
  title: string;
  company: string;
  coverLetter: string;
  emailSubject: string;
  emailBody: string;
}

export default function OutreachPage() {
  const { jobs, ws, hasResume } = useApp();
  const [jobId, setJobId] = useState<string>("");
  const [coverOpen, setCoverOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [batch, setBatch] = useState<BatchDraft[]>([]);
  const [batchBusy, setBatchBusy] = useState(false);

  const job = jobs.find((j) => j.id === jobId) ?? jobs[0] ?? null;
  const contacts = job?.contacts ?? [];

  const appliedJobs = jobs.filter((j) => j.status === "applied");

  async function runBatch() {
    if (!hasResume || appliedJobs.length === 0) return;
    setBatchBusy(true);
    setBatch([]);
    const drafts: BatchDraft[] = [];
    for (const job of appliedJobs) {
      try {
        const cover = await generateCoverLetter({
          jobDescription: job.jdText,
          resumeText: ws.masterResume?.text ?? "",
          company: job.company || undefined,
          role: job.title || undefined,
          profile: ws.profile,
        });
        const email = await generateEmail({
          jobDescription: job.jdText,
          resumeText: ws.masterResume?.text ?? "",
          purpose: "follow-up",
          company: job.company || undefined,
          role: job.title || undefined,
        });
        drafts.push({
          jobId: job.id,
          title: job.title || "Role",
          company: job.company || "Company",
          coverLetter: cover,
          emailSubject: email.subject,
          emailBody: email.body,
        });
      } catch {
        // skip one failed draft and continue
      }
    }
    setBatch(drafts);
    setBatchBusy(false);
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Pick the role you are writing for</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Outreach uses that job&apos;s description plus your resume, so nothing is written generically.
            </p>
          </div>
          <Link href="/jobs" className="btn-secondary btn-sm">
            Manage applications
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-center">
            <p className="text-sm font-semibold text-slate-800">No tracked roles yet</p>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
              Add a job first, then generate a tailored cover letter or a recruiter email from here.
            </p>
            <Link href="/jobs" className="btn-primary btn-sm mt-3">
              Add a job
            </Link>
          </div>
        ) : (
          <>
            <select
              value={job?.id ?? ""}
              onChange={(e) => setJobId(e.target.value)}
              className="field mt-4"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title || "Untitled role"} · {j.company || "Company"}
                </option>
              ))}
            </select>

            {job && (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <p className="label">Role</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-800">{job.title || "Untitled role"}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <p className="label">Company</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-800">{job.company || "—"}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <p className="label">Contacts</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                    {contacts.length > 0 ? contacts.map((c) => c.name || c.email).join(", ") : "None saved"}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Batch drafts for applied jobs</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              One click drafts a cover letter and follow-up email for every job already marked Applied.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void runBatch()}
            disabled={!hasResume || appliedJobs.length === 0 || batchBusy}
            className="btn-primary btn-sm disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {batchBusy ? "Drafting…" : `Draft ${appliedJobs.length} applied job${appliedJobs.length === 1 ? "" : "s"}`}
          </button>
        </div>

        {appliedJobs.length === 0 && (
          <p className="mt-3 text-sm text-slate-500">No jobs marked Applied yet. Move roles to Applied to unlock this.</p>
        )}

        {batch.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3">
            {batch.map((draft) => (
              <div key={draft.jobId} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">
                    {draft.title} <span className="font-normal text-slate-500">· {draft.company}</span>
                  </p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => void copyText(draft.coverLetter)} className="btn-secondary btn-sm">
                      Copy cover letter
                    </button>
                    <button
                      type="button"
                      onClick={() => void copyText(`Subject: ${draft.emailSubject}\n\n${draft.emailBody}`)}
                      className="btn-secondary btn-sm"
                    >
                      Copy email
                    </button>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <textarea value={draft.coverLetter} readOnly rows={7} className="field resize-y whitespace-pre-wrap text-xs leading-relaxed" />
                  <textarea
                    value={`Subject: ${draft.emailSubject}\n\n${draft.emailBody}`}
                    readOnly
                    rows={7}
                    className="field resize-y whitespace-pre-wrap text-xs leading-relaxed"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {job && (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card card-hover flex flex-col p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-lg">✍️</span>
            <h3 className="mt-3 text-sm font-bold text-slate-900">Cover letter</h3>
            <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-500">
              A concise 3-paragraph letter that references the requirements this role actually lists and only uses
              experience you can support.
            </p>
            <button
              type="button"
              onClick={() => setCoverOpen(true)}
              disabled={!hasResume}
              className="btn-primary btn-sm mt-4 self-start disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Generate cover letter
            </button>
            {!hasResume && <p className="mt-2 text-[11px] text-slate-400">Upload a resume first.</p>}
          </div>

          <div className="card card-hover flex flex-col p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-lg">✉️</span>
            <h3 className="mt-3 text-sm font-bold text-slate-900">Recruiter email</h3>
            <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-500">
              Cold outreach, referral ask, application follow-up, or post-interview thank-you — addressed to a saved
              contact when you have one.
            </p>
            <button
              type="button"
              onClick={() => setEmailOpen(true)}
              disabled={!hasResume}
              className="btn-primary btn-sm mt-4 self-start disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Generate email
            </button>
            {!hasResume && <p className="mt-2 text-[11px] text-slate-400">Upload a resume first.</p>}
          </div>
        </section>
      )}

      {job && contacts.length > 0 && (
        <section className="card p-5">
          <h3 className="text-sm font-bold text-slate-900">Saved contacts</h3>
          <ul className="mt-3 divide-y divide-slate-100">
            {contacts.map((c, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{c.name || "Unnamed contact"}</p>
                  <p className="text-xs text-slate-500">{[c.title, c.email].filter(Boolean).join(" · ")}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
            Direct recruiter emails are rarely public. Apply through the careers page, then reach the hiring team on
            LinkedIn.
          </p>
        </section>
      )}

      {coverOpen && job && (
        <CoverLetterModal
          job={job}
          resumeText={ws.masterResume?.text ?? ""}
          profile={ws.profile}
          onClose={() => setCoverOpen(false)}
        />
      )}
      {emailOpen && job && (
        <EmailModal job={job} resumeText={ws.masterResume?.text ?? ""} onClose={() => setEmailOpen(false)} />
      )}
    </div>
  );
}
