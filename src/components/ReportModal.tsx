"use client";

import { useState } from "react";
import Modal from "./Modal";
import Results from "./Results";
import CoverLetterModal from "./CoverLetterModal";
import EmailModal from "./EmailModal";
import type { SavedJob, UserProfile } from "@/lib/store";

function buildSummary(job: SavedJob): string {
  const r = job.result;
  if (!r) return "";
  const skills = r.matchedKeywords.slice(0, 5).map((k) => k.term).join(", ");
  return [
    `${job.title || "Role"} @ ${job.company || "Company"} — match ${r.overallScore}/100`,
    `Skills ${r.skillsScore} · Experience ${r.experienceScore} · Education ${r.educationScore} · ATS ${r.atsScore}`,
    skills ? `Matched: ${skills}` : "",
    `via Resume ↔ JD Fit Check`,
  ]
    .filter(Boolean)
    .join("\n");
}

export default function ReportModal({
  job,
  resumeText,
  profile,
  onClose,
  onReanalyze,
}: {
  job: SavedJob | null;
  resumeText: string;
  profile: UserProfile | null;
  onClose: () => void;
  onReanalyze: (job: SavedJob) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  if (!job?.result) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(buildSummary(job!));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <Modal open onClose={onClose} title={`${job.title || "Role"} · ${job.company || "Company"}`} wide>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copy}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
        >
          {copied ? "Copied ✓" : "Copy score summary"}
        </button>
        <button
          type="button"
          onClick={() => onReanalyze(job)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Re-analyze
        </button>
        <button
          type="button"
          onClick={() => setCoverOpen(true)}
          className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
        >
          ✍ Cover letter
        </button>
        <button
          type="button"
          onClick={() => setEmailOpen(true)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          ✉ Email contact
        </button>
        <span className="text-xs text-slate-400">Paste the summary into a post to share your fit publicly.</span>
      </div>
      <Results result={job.result} />

      {coverOpen && (
        <CoverLetterModal
          job={job}
          resumeText={resumeText}
          profile={profile}
          onClose={() => setCoverOpen(false)}
        />
      )}
      {emailOpen && (
        <EmailModal job={job} resumeText={resumeText} onClose={() => setEmailOpen(false)} />
      )}
    </Modal>
  );
}
