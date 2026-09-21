"use client";

import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { useDialog } from "@/components/Dialogs";
import FileDropzone from "@/components/FileDropzone";
import { auditResume, exportResume, type ResumeAuditResult } from "@/lib/client";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
}

export default function ResumePage() {
  const {
    ws,
    hasResume,
    masterBusy,
    masterError,
    handleMasterFile,
    removeMaster,
    saveCurrentResumeVersion,
    useResumeVersion,
    deleteResumeVersion,
    renameResumeVersion,
    duplicateResumeVersion,
    openAddJob,
  } = useApp();
  const [audit, setAudit] = useState<ResumeAuditResult | null>(null);
  const [auditBusy, setAuditBusy] = useState(false);
  const { prompt, notify } = useDialog();

  const master = ws.masterResume;
  const wordCount = master ? master.text.trim().split(/\s+/).filter(Boolean).length : 0;
  const updatedLabel = master ? fmtDate(master.updatedAt) : "—";

  async function runAudit() {
    if (!master) return;
    setAuditBusy(true);
    try {
      setAudit(await auditResume(master.text));
    } finally {
      setAuditBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Master resume</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              The base document everything else is measured against. Swap it in and out with versions below.
            </p>
          </div>
          {hasResume && (
            <div className="flex gap-2">
              <label className="btn-secondary btn-sm cursor-pointer">
                Replace file
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  className="hidden"
                  onChange={(e) => void handleMasterFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <button
                type="button"
                onClick={() => void exportResume(master?.text ?? "", master?.fileName || "Resume").catch((e) => notify(e.message))}
                className="btn-primary btn-sm"
              >
                Export PDF
              </button>
              <button type="button" onClick={() => void runAudit()} disabled={auditBusy} className="btn-secondary btn-sm disabled:bg-slate-300">
                {auditBusy ? "Auditing…" : "Audit resume"}
              </button>
              <button type="button" onClick={removeMaster} className="btn-ghost btn-sm hover:text-rose-600">
                Remove
              </button>
            </div>
          )}
        </div>

        {hasResume ? (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <p className="label">File</p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-800">{master?.fileName}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <p className="label">Extracted text</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{wordCount.toLocaleString()} words</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <p className="label">Last updated</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{updatedLabel}</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 max-w-md">
            <FileDropzone file={null} onFile={(file) => void handleMasterFile(file)} />
            <p className="mt-2 text-xs text-slate-500">PDF, DOCX, TXT, or MD.</p>
          </div>
        )}

        {masterBusy && <p className="mt-3 text-xs text-slate-500">Reading your resume…</p>}
        {masterError && <p className="mt-3 text-xs font-medium text-rose-600">{masterError}</p>}
      </section>

      {audit && (
        <section className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Resume audit</h3>
              <p className="mt-0.5 text-xs text-slate-500">Structure, keywords, and bullet quality — no target JD required.</p>
            </div>
            <span className={`text-2xl font-bold ${audit.score >= 80 ? "text-emerald-600" : audit.score >= 60 ? "text-amber-600" : "text-rose-600"}`}>
              {audit.score}/100
            </span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <p className="label">Sections</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {audit.sectionsFound.map((s) => <span key={s} className="chip bg-emerald-50 text-emerald-700">✓ {s}</span>)}
                {audit.missingSections.map((s) => <span key={s} className="chip bg-rose-50 text-rose-700">+ {s}</span>)}
              </div>
            </div>
            <div>
              <p className="label">Bullet fixes</p>
              <ul className="mt-2 space-y-1.5">
                {audit.weakBullets.slice(0, 3).map((bullet, i) => (
                  <li key={i} className="text-xs text-slate-600">
                    <span className="font-semibold text-rose-600">{bullet.issues[0]}</span> — {bullet.text}
                  </li>
                ))}
                {audit.weakBullets.length === 0 && <li className="text-xs text-slate-500">No weak bullets found.</li>}
              </ul>
            </div>
          </div>
        </section>
      )}

      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Tailored versions</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Save role-specific edits, then switch before running a fit check or writing outreach.
            </p>
          </div>
          <button
            type="button"
            onClick={saveCurrentResumeVersion}
            disabled={!hasResume}
            className="btn-primary btn-sm disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Save current as version
          </button>
        </div>

        {ws.resumeVersions.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No versions yet. Save the current resume to keep a snapshot once you start tailoring.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {ws.resumeVersions.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{v.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {v.fileName || "Resume"} · {fmtDate(v.updatedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button type="button" onClick={() => useResumeVersion(v)} className="btn-primary btn-sm">
                    Use this version
                  </button>
                  <button
                    type="button"
                    onClick={() => void exportResume(v.text, v.name).catch((e) => notify(e.message))}
                    className="btn-secondary btn-sm"
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void (async () => {
                        const next = await prompt({
                          title: "Rename version",
                          label: "Version name",
                          defaultValue: v.name,
                          confirmLabel: "Rename",
                        });
                        if (next?.trim()) renameResumeVersion(v.id, next.trim());
                      })();
                    }}
                    className="btn-ghost btn-sm"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateResumeVersion(v.id)}
                    className="btn-ghost btn-sm"
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteResumeVersion(v.id)}
                    className="btn-ghost btn-sm hover:text-rose-600"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <h2 className="text-sm font-bold text-slate-900">Next step</h2>
        <p className="mt-1 text-xs text-slate-500">
          Score this resume against a posting, or check which companies it already matches.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => openAddJob()} className="btn-primary btn-sm">
            Track a new job
          </button>
        </div>
      </section>
    </div>
  );
}
