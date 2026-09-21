"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import Results from "@/components/Results";
import { analyzeText, extractJobFromUrl } from "@/lib/client";
import type { AnalysisResult } from "@/lib/types";

const SAMPLE = `We are hiring an AI Engineer to build agentic products.

Responsibilities
- Design and ship LLM-powered features end to end
- Evaluate models, prompts, and retrieval quality
- Work with product and design to turn ambiguous problems into shipped tools

Requirements
- 3+ years building software, with Python or TypeScript
- Hands-on experience with LLMs, prompt engineering, and RAG
- Familiarity with agents, MCP, and evaluation workflows
- Strong written communication`;

export default function FitCheckPage() {
  const { ws, hasResume, openAddJob, openVersions } = useApp();
  const [jd, setJd] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobUrl, setJobUrl] = useState("");
  const [urlBusy, setUrlBusy] = useState(false);
  const [sourceId, setSourceId] = useState("master");
  const [versionScores, setVersionScores] = useState<{ label: string; score: number }[]>([]);
  const [compareBusy, setCompareBusy] = useState(false);

  const sourceOptions = useMemo(() => {
    const items: { id: string; label: string; text: string }[] = [];
    if (ws.masterResume) items.push({ id: "master", label: `Master — ${ws.masterResume.fileName}`, text: ws.masterResume.text });
    ws.resumeVersions.forEach((v) => items.push({ id: v.id, label: v.name, text: v.text }));
    return items;
  }, [ws.masterResume, ws.resumeVersions]);

  const source = sourceOptions.find((s) => s.id === sourceId) ?? sourceOptions[0];
  const resumeText = source?.text ?? ws.masterResume?.text ?? "";

  async function run() {
    if (jd.trim().length < 40) {
      setError("Paste at least a few sentences of the job description.");
      return;
    }
    setBusy(true);
    setScanning(true);
    setError(null);
    try {
      const startedAt = Date.now();
      const analysis = await analyzeText(resumeText, jd.trim());
      const remaining = 3500 - (Date.now() - startedAt);
      if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
      setResult(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
    } finally {
      setBusy(false);
      setScanning(false);
    }
  }

  async function fetchFromUrl() {
    if (!jobUrl.trim()) return;
    setUrlBusy(true);
    setError(null);
    try {
      const job = await extractJobFromUrl(jobUrl.trim());
      setJd(job.description || jd);
      setJobUrl(jobUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not fetch the job posting.");
    } finally {
      setUrlBusy(false);
    }
  }

  async function compareVersions() {
    if (jd.trim().length < 40 || sourceOptions.length < 2) return;
    setCompareBusy(true);
    const scores: { label: string; score: number }[] = [];
    for (const option of sourceOptions) {
      try {
        const analysis = await analyzeText(option.text, jd.trim());
        scores.push({ label: option.label, score: analysis.overallScore });
      } catch {
        scores.push({ label: option.label, score: 0 });
      }
    }
    scores.sort((a, b) => b.score - a.score);
    setVersionScores(scores);
    setCompareBusy(false);
  }

  return (
    <div className="space-y-6">
      {scanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0f19]/75 backdrop-blur-md">
          <div className="scan-radar">
            <div className="scan-grid" />
          </div>
          <div className="absolute mt-52 text-center">
            <p className="text-sm font-semibold tracking-wide text-cyan-200">Deep matching in progress…</p>
            <p className="mt-1 text-xs text-slate-400">Analyzing skills, experience, education, and keywords.</p>
          </div>
        </div>
      )}

      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Resume under test</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {hasResume ? ws.masterResume?.fileName : "No resume uploaded yet."}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/resume" className="btn-secondary btn-sm">
              {hasResume ? "Manage resume" : "Upload resume"}
            </Link>
            {hasResume && (
              <button type="button" onClick={openVersions} className="btn-ghost btn-sm">
                Versions ({ws.resumeVersions.length})
              </button>
            )}
          </div>
        </div>
        {sourceOptions.length > 0 && (
          <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className="field mt-3">
            {sourceOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900">Job description</h2>
          <div className="flex gap-2">
            <button type="button" onClick={() => setJd(SAMPLE)} className="btn-ghost btn-sm">
              Use sample
            </button>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <input value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} placeholder="Or paste a job posting URL…" className="field flex-1" />
          <button type="button" onClick={() => void fetchFromUrl()} disabled={urlBusy || !jobUrl.trim()} className="btn-secondary btn-sm disabled:bg-slate-300">
            {urlBusy ? "Fetching…" : "Fetch JD"}
          </button>
        </div>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          rows={10}
          placeholder="Paste the full posting — responsibilities, requirements, qualifications."
          className="field mt-3 resize-y leading-relaxed"
        />
        {error && <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={run}
            disabled={busy || !hasResume}
            className="btn-primary disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {busy ? "Analyzing…" : "Analyze fit"}
          </button>
          {result && (
            <button type="button" onClick={() => openAddJob({ jdText: jd.trim() })} className="btn-secondary">
              Save as a tracked job
            </button>
          )}
          {sourceOptions.length > 1 && (
            <button type="button" onClick={() => void compareVersions()} disabled={compareBusy || jd.trim().length < 40} className="btn-secondary disabled:bg-slate-300">
              {compareBusy ? "Comparing…" : "Compare all versions"}
            </button>
          )}
          {!hasResume && <span className="text-xs text-slate-500">Upload a resume first.</span>}
        </div>
      </section>

      {versionScores.length > 0 && (
        <section className="card p-5">
          <h2 className="text-sm font-bold text-slate-900">Version comparison</h2>
          <div className="mt-3 space-y-2">
            {versionScores.map((item, index) => (
              <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                  <span className="truncate text-sm font-semibold text-slate-800">{item.label}</span>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${item.score >= 75 ? "bg-emerald-100 text-emerald-700" : item.score >= 50 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                  {item.score}/100
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {result ? (
        <Results result={result} />
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
          <p className="text-sm font-semibold text-slate-800">You get three scores, not one</p>
          <p className="mx-auto mt-1 max-w-lg text-xs leading-relaxed text-slate-500">
            Skills, experience, and education are scored separately so you can see exactly where the gap is — plus
            matched keywords with evidence, risk flags, and concrete fixes.
          </p>
        </section>
      )}
    </div>
  );
}
