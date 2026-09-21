"use client";

import { useState } from "react";
import Modal from "./Modal";
import { generateEmail, type GeneratedEmail } from "@/lib/client";
import type { SavedJob } from "@/lib/store";

const PURPOSES = [
  { id: "outreach", label: "Cold outreach" },
  { id: "referral", label: "Ask for referral" },
  { id: "follow-up", label: "Application follow-up" },
  { id: "thank-you", label: "Post-interview thank-you" },
] as const;

export default function EmailModal({
  job,
  resumeText,
  onClose,
}: {
  job: SavedJob;
  resumeText: string;
  onClose: () => void;
}) {
  const contacts = job.contacts ?? [];
  const [contactIndex, setContactIndex] = useState(0);
  const [purpose, setPurpose] = useState<(typeof PURPOSES)[number]["id"]>("outreach");
  const [candidateName, setCandidateName] = useState("");
  const [result, setResult] = useState<GeneratedEmail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const contact = contacts[contactIndex] ?? null;

  async function make() {
    setBusy(true);
    setError(null);
    try {
      const email = await generateEmail({
        jobDescription: job.jdText,
        resumeText,
        purpose,
        company: job.company || undefined,
        role: job.title || undefined,
        contactName: contact?.name,
        contactTitle: contact?.title,
        candidateName: candidateName.trim() || undefined,
      });
      setResult(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(`Subject: ${result.subject}\n\n${result.body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  }

  return (
    <Modal open onClose={onClose} title={`Email · ${job.title || "Role"} @ ${job.company || "Company"}`} wide>
      <div className="space-y-4">
        {contacts.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-slate-600">Contact</label>
            <select
              value={contactIndex}
              onChange={(e) => setContactIndex(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {contacts.map((c, i) => (
                <option key={i} value={i}>
                  {c.name || "Unnamed"} {c.title ? `· ${c.title}` : ""} {c.email ? `· ${c.email}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {contacts.length === 0 && (
          <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
            No contact saved for this job. Add a recruiter or referral contact in the job details first, or generate a
            general hiring-manager email below.
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-slate-600">Purpose</label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as typeof purpose)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {PURPOSES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Your name</label>
            <input
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="e.g. Alex Chen"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={make}
          disabled={busy}
          className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {busy ? "Writing…" : result ? "Regenerate email" : "Generate email"}
        </button>

        {error && <p className="text-xs font-medium text-rose-600">{error}</p>}

        {result && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">Subject</label>
              <input
                value={result.subject}
                onChange={(e) => setResult({ ...result, subject: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Body</label>
              <textarea
                value={result.body}
                onChange={(e) => setResult({ ...result, body: e.target.value })}
                rows={10}
                className="mt-1 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm leading-relaxed"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={copy}
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
              >
                {copied ? "Copied ✓" : "Copy email"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
