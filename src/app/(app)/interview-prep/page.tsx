"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { generateInterviewPrep, type InterviewPrepResult } from "@/lib/client";

export default function InterviewPrepPage() {
  const { ws, jobs } = useApp();
  const sourceOptions = useMemo(() => {
    const items: { id: string; label: string; text: string }[] = [];
    if (ws.masterResume) items.push({ id: "master", label: `Master — ${ws.masterResume.fileName}`, text: ws.masterResume.text });
    ws.resumeVersions.forEach((v) => items.push({ id: v.id, label: v.name, text: v.text }));
    return items;
  }, [ws.masterResume, ws.resumeVersions]);

  const [sourceId, setSourceId] = useState("master");
  const [jobId, setJobId] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jd, setJd] = useState("");
  const [result, setResult] = useState<InterviewPrepResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(false);
  const [mockIndex, setMockIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [savedAnswer, setSavedAnswer] = useState(false);

  const source = sourceOptions.find((s) => s.id === sourceId) ?? sourceOptions[0];
  const selectedJob = jobs.find((j) => j.id === jobId) ?? jobs[0] ?? null;
  const targetCompany = selectedJob?.company || company;
  const targetRole = selectedJob?.title || role;
  const targetJd = selectedJob?.jdText || jd || `${role || "Target role"}${company ? ` at ${company}` : ""}`;
  const answerKey = `fitcheck-interview-answers-${targetRole || "role"}-${targetCompany || "company"}`;

  useEffect(() => {
    if (!result) return;
    try {
      const saved = localStorage.getItem(answerKey);
      if (saved) setAnswers(JSON.parse(saved) as Record<number, string>);
    } catch {
      // ignore
    }
  }, [answerKey, result]);

  async function generate() {
    if (!source?.text.trim()) {
      setError("Upload or select a resume first.");
      return;
    }
    if (targetJd.trim().length < 20) {
      setError("Choose a job or enter a role and short description.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const prep = await generateInterviewPrep({
        resumeText: source.text,
        jobDescription: targetJd,
        role: targetRole || undefined,
        company: targetCompany || undefined,
        profile: ws.profile,
      });
      setResult(prep);
      setMockIndex(0);
      setRevealed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate interview prep.");
    } finally {
      setBusy(false);
    }
  }

  if (sourceOptions.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
        <p className="text-sm font-semibold text-slate-800">Upload a resume to start interview prep</p>
        <Link href="/resume" className="btn-primary btn-sm mt-4">
          Go to Resume Studio
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="text-sm font-bold text-slate-900">Prepare for the conversation, not just the questions</h2>
        <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-slate-500">
          Uses your resume and the target JD to generate likely questions, why they ask each one, a response
          framework, and a sample you complete with your real story.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="label">Source resume</p>
            <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className="field mt-1.5">
              {sourceOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="label">Target role</p>
            {jobs.length > 0 ? (
              <select value={selectedJob?.id ?? ""} onChange={(e) => setJobId(e.target.value)} className="field mt-1.5">
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title || "Untitled role"} · {j.company || "Company"}
                  </option>
                ))}
              </select>
            ) : (
              <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Senior AI Engineer" className="field mt-1.5" />
            )}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company (optional)" className="field" />
          <textarea value={jd} onChange={(e) => setJd(e.target.value)} rows={2} placeholder="Paste a short job description (optional if using a tracked job)" className="field resize-y" />
        </div>
        {error && <p className="mt-3 text-xs font-medium text-rose-600">{error}</p>}
        <button type="button" onClick={generate} disabled={busy} className="btn-primary mt-4 disabled:cursor-not-allowed disabled:bg-slate-300">
          {busy ? "Building prep…" : "Generate interview prep"}
        </button>
      </section>

      {result && (
        <>
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setMockMode((v) => !v)} className="btn-secondary btn-sm">
              {mockMode ? "View all questions" : "Start mock interview"}
            </button>
            {mockMode && result.questions.length > 0 && (
              <span className="text-xs text-slate-500">{mockIndex + 1} / {result.questions.length}</span>
            )}
          </div>

          {mockMode && result.questions[mockIndex] ? (
            <section className="card p-5">
              <p className="text-sm font-semibold text-slate-900">{result.questions[mockIndex].question}</p>
              <p className="mt-2 text-xs text-slate-500">{result.questions[mockIndex].why}</p>
              <button type="button" onClick={() => setRevealed((v) => !v)} className="btn-primary btn-sm mt-3">
                {revealed ? "Hide answer scaffold" : "Show answer scaffold"}
              </button>
              {revealed && (
                <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                  <p><span className="font-semibold">Framework:</span> {result.questions[mockIndex].framework}</p>
                  <p className="mt-2"><span className="font-semibold">Sample:</span> {result.questions[mockIndex].sample}</p>
                </div>
              )}
              <div className="mt-3">
                <p className="label mb-1">Your answer</p>
                <textarea
                  value={answers[mockIndex] ?? ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [mockIndex]: e.target.value }))}
                  rows={4}
                  placeholder="Write your STAR answer…"
                  className="field resize-y leading-relaxed"
                />
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem(answerKey, JSON.stringify(answers));
                    setSavedAnswer(true);
                    setTimeout(() => setSavedAnswer(false), 1500);
                  }}
                  className="btn-secondary btn-sm mt-2"
                >
                  {savedAnswer ? "Saved ✓" : "Save answer"}
                </button>
              </div>
              <div className="mt-4 flex gap-2">
                <button type="button" disabled={mockIndex === 0} onClick={() => { setMockIndex((i) => i - 1); setRevealed(false); }} className="btn-secondary btn-sm disabled:bg-slate-300">
                  Previous
                </button>
                <button type="button" disabled={mockIndex >= result.questions.length - 1} onClick={() => { setMockIndex((i) => i + 1); setRevealed(false); }} className="btn-secondary btn-sm disabled:bg-slate-300">
                  Next
                </button>
              </div>
            </section>
          ) : (
          <section className="space-y-3">
            {result.questions.map((q, i) => (
              <details key={i} className="card p-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                  {i + 1}. {q.question}
                </summary>
                <div className="mt-3 space-y-2 text-xs leading-relaxed">
                  <p><span className="font-semibold text-slate-700">Why they ask:</span> {q.why}</p>
                  <p><span className="font-semibold text-slate-700">Framework:</span> {q.framework}</p>
                  <p className="rounded-lg bg-slate-50 p-3 text-slate-600">{q.sample}</p>
                </div>
              </details>
            ))}
          </section>
          )}

          {!mockMode && (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="card p-5">
              <p className="label">Strengths to emphasize</p>
              <ul className="mt-3 space-y-2">
                {result.strengthsToHighlight.map((s, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-600">
                    <span className="text-emerald-600">✓</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-5">
              <p className="label">Questions to ask them</p>
              <ul className="mt-3 space-y-2">
                {result.questionsToAsk.map((s, i) => (
                  <li key={i} className="flex gap-2 text-xs text-slate-600">
                    <span className="text-brand-600">?</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-5">
              <p className="label">Coach note</p>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">{result.notes}</p>
            </div>
          </section>
          )}
        </>
      )}
    </div>
  );
}
