"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import { generateCoverLetter } from "@/lib/client";
import type { SavedJob, UserProfile } from "@/lib/store";

interface Props {
  job: SavedJob;
  resumeText: string;
  profile: UserProfile | null;
  onClose: () => void;
}

export default function CoverLetterModal({ job, resumeText, profile, onClose }: Props) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBusy(true);
      setError(null);
      try {
        const result = await generateCoverLetter({
          jobDescription: job.jdText,
          resumeText,
          company: job.company || undefined,
          role: job.title || undefined,
          profile,
        });
        if (!cancelled) setText(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  }

  return (
    <Modal open onClose={onClose} title={`Cover letter · ${job.title || "Role"} @ ${job.company || "Company"}`} wide>
      {busy ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
          Writing your cover letter…
        </div>
      ) : error ? (
        <p className="py-6 text-center text-sm text-rose-600">{error}</p>
      ) : (
        <>
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={copy}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={16}
            className="w-full resize-y rounded-lg border border-slate-300 p-3 font-serif text-sm leading-relaxed"
          />
        </>
      )}
    </Modal>
  );
}
