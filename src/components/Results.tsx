"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/types";
import ResumeDiffView from "./ResumeDiffView";
import { useDialog } from "./Dialogs";

function ringColor(score: number): string {
  if (score >= 80) return "#22d3ee";
  if (score >= 60) return "#a855f7";
  return "#f43f5e";
}

function ScoreRing({ score }: { score: number }) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = ringColor(score);
  return (
    <div className="relative h-44 w-44">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="12" />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 10px ${color})`,
            transition: "stroke-dashoffset 700ms ease",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="bg-gradient-to-r from-white via-cyan-300 to-purple-300 bg-clip-text text-5xl font-bold text-transparent drop-shadow-[0_0_14px_rgba(6,182,212,0.45)]">
          {score}
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">/ 100</span>
      </div>
    </div>
  );
}

function Chip({
  term,
  tone,
  active,
  onClick,
}: {
  term: string;
  tone: "matched" | "missing";
  active?: boolean;
  onClick?: () => void;
}) {
  const cls =
    tone === "matched"
      ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
      : "border-rose-500/30 bg-rose-500/10 text-rose-400";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition hover:border-cyan-300/60 hover:bg-white/[0.05] ${
        active ? "border-cyan-300/70 bg-cyan-500/20" : ""
      } ${cls}`}
    >
      {tone === "matched" ? <span className="text-cyan-300">✔</span> : <span>⚠️</span>}
      {term}
    </button>
  );
}

export default function Results({ result }: { result?: AnalysisResult | null }) {
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const { notify } = useDialog();

  if (!result) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center backdrop-blur-md">
        <p className="text-2xl">⚠️</p>
        <p className="mt-2 text-sm font-semibold text-rose-200">API 拥挤，请稍后重试</p>
      </div>
    );
  }

  const matched = result?.matchedKeywords ?? [];
  const missing = result?.unmatchedKeywords ?? [];
  const suggestions = result?.suggestions ?? [];
  const optimizations = result?.optimizations ?? [];
  const strengths = result?.strengths ?? [];
  const risks = result?.risks ?? [];

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/10 bg-[#0b0f19]/80 p-6 backdrop-blur-xl">
        <div className="flex flex-col items-center gap-7 sm:flex-row">
          <ScoreRing score={result.overallScore ?? 0} />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Overall match</p>
            <h2 className="mt-1 text-2xl font-bold text-white">Resume vs Job Description</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Skills, experience, education, and keyword coverage are combined into one evidence-based score.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              {[
                ["Skills", result.skillsScore],
                ["Experience", result.experienceScore],
                ["Education", result.educationScore],
                ["ATS", result.atsScore],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent px-3 py-2 text-center">
                  <p className="bg-gradient-to-r from-white to-cyan-300 bg-clip-text text-lg font-bold text-transparent">{value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#0b0f19]/80 p-5 backdrop-blur-xl">
          <h3 className="text-sm font-bold text-white">Matched Skills</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {matched.length > 0 ? (
              matched.map((skill) => (
                <Chip
                  key={skill.term}
                  term={skill.term}
                  tone="matched"
                  active={selectedTerm === skill.term}
                  onClick={() => setSelectedTerm(skill.term)}
                />
              ))
            ) : (
              <p className="text-sm text-slate-500">No matched skills returned.</p>
            )}
          </div>
          {selectedTerm && matched.some((skill) => skill.term === selectedTerm) && (
            <p className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs leading-relaxed text-cyan-100">
              Evidence for <span className="font-semibold text-cyan-300">{selectedTerm}</span>: this skill appears in your resume.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0b0f19]/80 p-5 backdrop-blur-xl">
          <h3 className="text-sm font-bold text-white">Missing Skills</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {missing.length > 0 ? (
              missing.map((skill) => (
                <Chip
                  key={skill.term}
                  term={skill.term}
                  tone="missing"
                  active={selectedTerm === skill.term}
                  onClick={() => setSelectedTerm(skill.term)}
                />
              ))
            ) : (
              <p className="text-sm text-slate-500">No missing skills returned.</p>
            )}
          </div>
          {selectedTerm && missing.some((skill) => skill.term === selectedTerm) && (
            <p className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs leading-relaxed text-rose-200">
              <span className="font-semibold text-rose-300">{selectedTerm}</span> was not found in your resume. Add it only if you genuinely have the experience.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-purple-500/20 bg-[#0b0f19]/80 p-5 shadow-[0_0_15px_rgba(168,85,247,0.15)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-white">Actionable Suggestions</h3>
          <span className="h-4 w-4 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
        </div>
        <div className="mt-4 space-y-3">
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="rounded-r-xl border border-white/10 border-l-4 border-l-cyan-400 bg-white/[0.03] p-4"
              >
                <p className="text-sm leading-relaxed text-slate-200">
                  <span className="font-bold text-cyan-300">💡 建议：</span>
                  {suggestion}
                </p>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(suggestion);
                      notify("已复制到剪贴板");
                    }}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:border-cyan-500/50 hover:bg-white/10 hover:text-white"
                  >
                    应用到简历
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No actionable suggestions returned.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0b0f19]/80 p-5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-white">Resume Optimizations</h3>
          <span className="h-4 w-4 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
        </div>
        <ResumeDiffView optimizations={optimizations} />
      </section>

      {(strengths.length > 0 || risks.length > 0) && (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#0b0f19]/80 p-5 backdrop-blur-xl">
            <h3 className="text-sm font-bold text-white">Strengths</h3>
            <ul className="mt-3 space-y-2">
              {strengths.map((item, index) => (
                <li key={index} className="flex gap-2 text-sm text-slate-300">
                  <span className="text-emerald-300">✔</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b0f19]/80 p-5 backdrop-blur-xl">
            <h3 className="text-sm font-bold text-white">Risks</h3>
            <ul className="mt-3 space-y-2">
              {risks.map((risk, index) => (
                <li key={index} className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">
                  <span className="font-semibold text-rose-300">{risk.title}</span>
                  {risk.detail && <p className="mt-1 text-xs text-rose-100/80">{risk.detail}</p>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
