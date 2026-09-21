"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { useDialog } from "@/components/Dialogs";
import {
  auditResume,
  analyzeText,
  exportResume,
  improveResume,
  tailorResume,
  writeResume,
  type ResumeAuditResult,
  type TailoredResume,
} from "@/lib/client";
import { RESUME_STYLES, type ResumeStyle } from "@/lib/resumeStyle";

type Mode = "tailor" | "write";
type TargetMode = "job" | "manual";

interface ExperienceEntry {
  id: string;
  role: string;
  company: string;
  start: string;
  end: string;
  bullets: string;
}

interface ProjectEntry {
  id: string;
  name: string;
  bullets: string;
}

const SECTION_DEFS = [
  { id: "profile", label: "Profile / Summary", keys: ["profile", "summary", "targeted profile", "professional profile"] },
  { id: "skills", label: "Core Skills", keys: ["skills", "core competencies", "areas of expertise", "capabilities"] },
  { id: "experience", label: "Experience", keys: ["experience", "work experience", "professional experience", "impact & experience"] },
  { id: "projects", label: "Projects", keys: ["projects", "selected projects", "selected work"] },
  { id: "education", label: "Education", keys: ["education"] },
];

function splitResume(text: string): Record<string, string> {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const result: Record<string, string> = {};
  let current = "profile";
  const body: string[] = [];
  for (const line of lines) {
    const normalized = line.trim().toLowerCase();
    const match = SECTION_DEFS.find((s) => s.keys.includes(normalized));
    if (match && body.length > 0) {
      result[current] = body.join("\n").trim();
      current = match.id;
      body.length = 0;
    } else {
      body.push(line);
    }
  }
  result[current] = body.join("\n").trim();
  return result;
}

function buildFromSections(sections: Record<string, string>): string {
  const headings: Record<string, string> = {
    profile: "SUMMARY",
    skills: "CORE SKILLS",
    experience: "EXPERIENCE",
    projects: "PROJECTS",
    education: "EDUCATION",
  };
  return SECTION_DEFS.map((s) => {
    const body = (sections[s.id] ?? "").trim();
    if (!body) return "";
    return `${headings[s.id]}\n${body}`;
  })
    .filter(Boolean)
    .join("\n\n");
}

function ResumePreview({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const headings = new Set(["SUMMARY", "PROFILE", "TARGETED PROFILE", "PROFESSIONAL PROFILE", "CORE SKILLS", "CORE COMPETENCIES", "AREAS OF EXPERTISE", "CAPABILITIES", "EXPERIENCE", "PROFESSIONAL EXPERIENCE", "WORK EXPERIENCE", "IMPACT & EXPERIENCE", "PROJECTS", "SELECTED PROJECTS", "SELECTED WORK", "EDUCATION", "INTERNSHIPS"]);
  return (
    <div className="mt-4 max-h-[620px] overflow-y-auto rounded-xl border border-white/10 bg-[#0b0f19]/80 p-5 backdrop-blur-xl">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} className="h-2" />;
        if (headings.has(trimmed.toUpperCase())) {
          return (
            <p key={index} className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
              {trimmed}
            </p>
          );
        }
        return (
          <p key={index} className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {line}
          </p>
        );
      })}
    </div>
  );
}

export default function AIResumePage() {
  const { ws, jobs, saveResumeAsVersion } = useApp();
  const { notify } = useDialog();

  const sourceOptions = useMemo(() => {
    const items: { id: string; label: string; text: string }[] = [];
    if (ws.masterResume) {
      items.push({ id: "master", label: `Master — ${ws.masterResume.fileName}`, text: ws.masterResume.text });
    }
    ws.resumeVersions.forEach((v) => {
      items.push({ id: v.id, label: v.name, text: v.text });
    });
    return items;
  }, [ws.masterResume, ws.resumeVersions]);

  const [mode, setMode] = useState<Mode>("write");
  const [style, setStyle] = useState<ResumeStyle>("executive");
  const [sourceId, setSourceId] = useState("master");
  const [targetMode, setTargetMode] = useState<TargetMode>("job");
  const [jobId, setJobId] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jd, setJd] = useState("");

  const [name, setName] = useState("");
  const [experienceEntries, setExperienceEntries] = useState<ExperienceEntry[]>([
    { id: "exp-1", role: "", company: "", start: "", end: "", bullets: "" },
  ]);
  const [projectEntries, setProjectEntries] = useState<ProjectEntry[]>([
    { id: "proj-1", name: "", bullets: "" },
  ]);
  const [eduLevel, setEduLevel] = useState(ws.profile?.educationLevel ?? "");
  const [eduField, setEduField] = useState(ws.profile?.fieldOfStudy ?? "");
  const [eduSchool, setEduSchool] = useState(ws.profile?.school ?? "");
  const [eduGrad, setEduGrad] = useState(ws.profile?.gradYear ?? "");
  const [skills, setSkills] = useState(ws.profile?.skills?.join(", ") ?? "");
  const educationText = [eduLevel, eduField ? `in ${eduField}` : "", eduSchool, eduGrad]
    .filter(Boolean)
    .join(" · ");

  const [busy, setBusy] = useState(false);
  const [improving, setImproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TailoredResume | null>(null);
  const [audit, setAudit] = useState<ResumeAuditResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [compare, setCompare] = useState(false);
  const [sectionMode, setSectionMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [batchJobIds, setBatchJobIds] = useState<Set<string>>(new Set());
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchProgress, setBatchProgress] = useState("");
  const [batchDone, setBatchDone] = useState<string[]>([]);
  const [batchPickerOpen, setBatchPickerOpen] = useState(false);
  const [batchQuery, setBatchQuery] = useState("");

  useEffect(() => {
    if (!result) {
      setAudit(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      auditResume(result.tailoredResume, targetJd)
        .then((a) => {
          if (!cancelled) setAudit(a);
        })
        .catch(() => {
          if (!cancelled) setAudit(null);
        });
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const source = sourceOptions.find((s) => s.id === sourceId) ?? sourceOptions[0];
  const selectedJob = jobs.find((j) => j.id === jobId) ?? jobs[0] ?? null;

  const targetCompany = targetMode === "job" ? selectedJob?.company || "" : company;
  const targetRole = targetMode === "job" ? selectedJob?.title || "" : role;
  const targetJd =
    targetMode === "job"
      ? selectedJob?.jdText || ""
      : jd.trim() || `${role || "Target role"}${company ? ` at ${company}` : ""}`;

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setResult(null);
    setSaved(false);
  }

  function updateExperience(id: string, patch: Partial<ExperienceEntry>) {
    setExperienceEntries((entries) =>
      entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    );
  }

  function addExperience() {
    setExperienceEntries((entries) => [
      ...entries,
      { id: `exp-${Date.now().toString(36)}`, role: "", company: "", start: "", end: "", bullets: "" },
    ]);
  }

  function removeExperience(id: string) {
    setExperienceEntries((entries) => (entries.length > 1 ? entries.filter((e) => e.id !== id) : entries));
  }

  const experienceText = experienceEntries
    .filter((e) => e.role || e.company || e.bullets)
    .map((e) =>
      [
        e.role,
        e.company ? `· ${e.company}` : "",
        e.start || e.end ? `(${e.start || "?"} – ${e.end || "Present"})` : "",
        e.bullets ? `\n${e.bullets}` : "",
      ]
        .filter(Boolean)
        .join(" "),
    )
    .join("\n\n");

  function updateProject(id: string, patch: Partial<ProjectEntry>) {
    setProjectEntries((entries) =>
      entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    );
  }

  function addProject() {
    setProjectEntries((entries) => [
      ...entries,
      { id: `proj-${Date.now().toString(36)}`, name: "", bullets: "" },
    ]);
  }

  function removeProject(id: string) {
    setProjectEntries((entries) => (entries.length > 1 ? entries.filter((e) => e.id !== id) : entries));
  }

  const projectsText = projectEntries
    .filter((p) => p.name || p.bullets)
    .map((p) => `${p.name}${p.bullets ? `\n${p.bullets}` : ""}`)
    .join("\n\n");

  async function generate() {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      if (mode === "tailor") {
        if (!source?.text.trim()) {
          setError("Upload or select a resume first.");
          return;
        }
        if (targetJd.trim().length < 20) {
          setError("Choose a tracked job, or enter a role and a short job description.");
          return;
        }
        const tailored = await tailorResume({
          resumeText: source.text,
          jobDescription: targetJd,
          company: targetCompany || undefined,
          role: targetRole || undefined,
          profile: ws.profile,
          style,
        });
        setResult(tailored);
      } else {
        const written = await writeResume({
          name,
          role: targetRole || role,
          company: targetCompany || company,
          experience: experienceText,
          projects: projectsText,
          education: educationText,
          skills,
          profile: ws.profile,
          style,
        });
        setResult(written);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate the resume.");
    } finally {
      setBusy(false);
    }
  }

  async function copyResult() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.tailoredResume);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable
    }
  }

  async function improveDraft() {
    if (!result) return;
    setImproving(true);
    setError(null);
    try {
      const improved = await improveResume(result.tailoredResume, targetJd);
      setResult({ ...result, tailoredResume: improved.improvedResume, changes: improved.changes, notes: "Improved draft — verify every claim before sending." });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not improve the draft.");
    } finally {
      setImproving(false);
    }
  }

  function saveResult() {
    if (!result) return;
    const label = mode === "write" ? "Written" : "Tailored";
    const jobLabel = targetRole || role || label;
    saveResumeAsVersion(result.tailoredResume, `${label} · ${jobLabel} · ${style} · ${new Date().toLocaleDateString()}`);
    setSaved(true);
  }

  async function runBatch() {
    if (!ws.masterResume?.text || batchJobIds.size === 0) return;
    setBatchBusy(true);
    setBatchDone([]);
    setBatchProgress(`0/${batchJobIds.size}`);
    const done: string[] = [];
    let index = 0;
    for (const id of batchJobIds) {
      const job = jobs.find((j) => j.id === id);
      if (!job) continue;
      index += 1;
      setBatchProgress(`${index}/${batchJobIds.size}`);
      try {
        const tailored = await tailorResume({
          resumeText: ws.masterResume.text,
          jobDescription: job.jdText,
          company: job.company || undefined,
          role: job.title || undefined,
          profile: ws.profile,
          style,
        });
        saveResumeAsVersion(
          tailored.tailoredResume,
          `${job.title || "Role"} · ${style} · ${new Date().toLocaleDateString()}`,
        );
        const analysis = await analyzeText(tailored.tailoredResume, job.jdText).catch(() => null);
        done.push(`${job.title || "Role"} · ${analysis?.overallScore ?? "—"}/100`);
      } catch {
        // skip failed job
      }
    }
    setBatchDone(done);
    setBatchBusy(false);
    setBatchProgress("");
  }

  function toggleBatchJob(id: string) {
    setBatchJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const resultTitle = `${targetRole || role || "Resume"} · ${style}`;
  const sectionModel = useMemo(
    () => (result ? splitResume(result.tailoredResume) : {}),
    [result?.tailoredResume],
  );

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">AI Resume Studio</h2>
            <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-slate-500">
              Write a resume from rough notes, or tailor one you already have. No invented employers, degrees, or
              numbers — just a cleaner, stronger version of the truth.
            </p>
          </div>
          <Link href="/resume" className="btn-secondary btn-sm">
            Manage resumes
          </Link>
        </div>

        <div className="mt-4 flex rounded-xl border border-white/10 bg-white/[0.03] p-0.5">
          {(
            [
              { id: "write", label: "✍ Write from scratch" },
              { id: "tailor", label: "🎯 Tailor existing resume" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => switchMode(t.id)}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                mode === t.id ? "bg-brand-600 text-white" : "text-slate-600 hover:text-brand-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <p className="label">Resume style</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {RESUME_STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStyle(s.id)}
                className={`rounded-xl border p-3 text-left transition ${
                  style === s.id
                    ? "border-cyan-500/50 bg-cyan-500/10"
                    : "border-white/10 bg-white/[0.02] hover:border-cyan-500/30 hover:bg-white/[0.05]"
                }`}
              >
                <p className={`text-xs font-semibold ${style === s.id ? "text-brand-700" : "text-slate-800"}`}>{s.label}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{s.description}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Batch versions for tracked jobs</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Generate a tailored resume version for every selected company and role, then find them in Resume
              Studio.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void runBatch()}
            disabled={batchBusy || batchJobIds.size === 0 || !ws.masterResume}
            className="btn-primary btn-sm disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {batchBusy ? `Generating ${batchProgress}…` : `Generate ${batchJobIds.size || ""} version${batchJobIds.size === 1 ? "" : "s"}`}
          </button>
        </div>

        {jobs.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No tracked jobs yet. Add roles first, then batch-generate their tailored versions here.
          </p>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setBatchPickerOpen((v) => !v)} className="btn-secondary btn-sm">
                {batchPickerOpen ? "Close job picker" : "Select jobs"}
              </button>
              <span className="text-xs text-slate-500">
                {batchJobIds.size} selected · {jobs.length} tracked
              </span>
            </div>

            {batchPickerOpen && (
              <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <input
                  value={batchQuery}
                  onChange={(e) => setBatchQuery(e.target.value)}
                  placeholder="Search role, company, or skill…"
                  className="field"
                />
                <div className="mt-3 max-h-64 overflow-y-auto pr-1">
                  {jobs
                    .filter((job) =>
                      `${job.title} ${job.company} ${job.notes ?? ""}`
                        .toLowerCase()
                        .includes(batchQuery.trim().toLowerCase()),
                    )
                    .map((job) => (
                      <label
                        key={job.id}
                        className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 transition ${
                          batchJobIds.has(job.id)
                            ? "border-cyan-500/40 bg-cyan-500/10"
                            : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={batchJobIds.has(job.id)}
                          onChange={() => toggleBatchJob(job.id)}
                          className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-white">{job.title || "Untitled role"}</span>
                          <span className="block truncate text-xs text-slate-400">{job.company || "Company"}</span>
                        </span>
                      </label>
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        {batchDone.length > 0 && (
          <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-700">
            Saved {batchDone.length} version{batchDone.length === 1 ? "" : "s"}: {batchDone.join(", ")}
          </p>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          {mode === "tailor" ? (
            <>
              <p className="label">1 · Source resume</p>
              {sourceOptions.length === 0 ? (
                <div className="mt-2 rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-4 text-center">
                  <p className="text-xs text-slate-500">No resume uploaded yet.</p>
                  <Link href="/resume" className="btn-secondary btn-sm mt-2">
                    Upload resume
                  </Link>
                </div>
              ) : (
                <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className="field mt-2">
                  {sourceOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              )}

              <p className="label mt-5">2 · Target</p>
              <div className="mt-2 flex rounded-xl border border-white/10 bg-white/[0.03] p-0.5">
                {(
                  [
                    { id: "job", label: "Tracked job" },
                    { id: "manual", label: "Company / role" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTargetMode(t.id)}
                    className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      targetMode === t.id ? "bg-brand-600 text-white" : "text-slate-600 hover:text-brand-600"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {targetMode === "job" ? (
                jobs.length === 0 ? (
                  <div className="mt-3 rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-4 text-center">
                    <p className="text-xs text-slate-500">No tracked jobs yet.</p>
                    <Link href="/jobs" className="btn-secondary btn-sm mt-2">
                      Add a job
                    </Link>
                  </div>
                ) : (
                  <select value={selectedJob?.id ?? ""} onChange={(e) => setJobId(e.target.value)} className="field mt-2">
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title || "Untitled role"} · {j.company || "Company"}
                      </option>
                    ))}
                  </select>
                )
              ) : (
                <div className="mt-2 space-y-3">
                  <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" className="field" />
                  <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role title" className="field" />
                  <textarea
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                    rows={6}
                    placeholder="Paste the job description (recommended for stronger tailoring)"
                    className="field resize-y leading-relaxed"
                  />
                </div>
              )}

              <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Target preview</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {targetRole || "Role"} <span className="font-normal text-slate-400">@ {targetCompany || "Company"}</span>
                </p>
              </div>
            </>
          ) : previewMode ? (
            <ResumePreview text={result!.tailoredResume} />
          ) : sectionMode ? (
            <div className="mt-4 space-y-3">
              {SECTION_DEFS.map((section) => (
                <div key={section.id}>
                  <p className="label mb-1">{section.label}</p>
                  <textarea
                    value={sectionModel[section.id] ?? ""}
                    onChange={(e) => {
                      const next = { ...sectionModel, [section.id]: e.target.value };
                      setResult((prev) => (prev ? { ...prev, tailoredResume: buildFromSections(next) } : prev));
                    }}
                    rows={section.id === "experience" || section.id === "projects" ? 8 : 4}
                    className="field resize-y whitespace-pre-wrap font-mono text-xs leading-relaxed"
                  />
                </div>
              ))}
            </div>
          ) : (
            <>
              <p className="label">1 · Target</p>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Target role" className="field" />
                <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Target company (optional)" className="field" />
              </div>

              <p className="label mt-5">2 · Basic info</p>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="field mt-2" />

              <p className="label mt-5">3 · Your material</p>
              <div className="mt-2 space-y-3">
                <p className="text-xs font-semibold text-slate-700">Experience</p>
                {experienceEntries.map((entry) => (
                  <div key={entry.id} className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <input value={entry.role} onChange={(e) => updateExperience(entry.id, { role: e.target.value })} placeholder="Role title" className="field" />
                      <input value={entry.company} onChange={(e) => updateExperience(entry.id, { company: e.target.value })} placeholder="Company" className="field" />
                      <input value={entry.start} onChange={(e) => updateExperience(entry.id, { start: e.target.value })} placeholder="Start date" className="field" />
                      <input value={entry.end} onChange={(e) => updateExperience(entry.id, { end: e.target.value })} placeholder="End date / Present" className="field" />
                    </div>
                    <textarea
                      value={entry.bullets}
                      onChange={(e) => updateExperience(entry.id, { bullets: e.target.value })}
                      rows={4}
                      placeholder="2–4 outcome-focused bullets"
                      className="field resize-y leading-relaxed"
                    />
                    <div className="flex justify-end">
                      <button type="button" onClick={() => removeExperience(entry.id)} className="btn-ghost btn-sm text-rose-500">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addExperience} className="btn-secondary btn-sm">
                  + Add experience
                </button>
                <p className="text-xs font-semibold text-slate-700">Projects</p>
                {projectEntries.map((entry) => (
                  <div key={entry.id} className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <input
                      value={entry.name}
                      onChange={(e) => updateProject(entry.id, { name: e.target.value })}
                      placeholder="Project name"
                      className="field"
                    />
                    <textarea
                      value={entry.bullets}
                      onChange={(e) => updateProject(entry.id, { bullets: e.target.value })}
                      rows={3}
                      placeholder="What you built and the result"
                      className="field resize-y leading-relaxed"
                    />
                    <div className="flex justify-end">
                      <button type="button" onClick={() => removeProject(entry.id)} className="btn-ghost btn-sm text-rose-500">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addProject} className="btn-secondary btn-sm">
                  + Add project
                </button>
                <p className="text-xs font-semibold text-slate-700">Education</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input value={eduLevel} onChange={(e) => setEduLevel(e.target.value)} placeholder="Degree level" className="field" />
                  <input value={eduField} onChange={(e) => setEduField(e.target.value)} placeholder="Field of study" className="field" />
                  <input value={eduSchool} onChange={(e) => setEduSchool(e.target.value)} placeholder="School" className="field" />
                  <input value={eduGrad} onChange={(e) => setEduGrad(e.target.value)} placeholder="Graduation year" className="field" />
                </div>
                <textarea
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  rows={2}
                  placeholder="Skills — Python, React, SQL, AI Agents…"
                  className="field resize-y"
                />
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                You can leave a field blank; the writer will omit that section instead of making something up.
              </p>
            </>
          )}

          {error && <p className="mt-3 text-xs font-medium text-rose-600">{error}</p>}
          <button
            type="button"
            onClick={generate}
            disabled={busy}
            className="btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {busy ? "Writing…" : mode === "write" ? "Generate resume" : "Generate tailored resume"}
          </button>
        </div>

        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="label">Result</p>
            {result && (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setSectionMode((v) => !v)} className="btn-secondary btn-sm">
                  {sectionMode ? "Full text" : "Sections"}
                </button>
                <button type="button" onClick={() => setPreviewMode((v) => !v)} className="btn-secondary btn-sm">
                  {previewMode ? "Edit text" : "Preview"}
                </button>
                <button type="button" onClick={copyResult} className="btn-secondary btn-sm">
                  {copied ? "Copied ✓" : "Copy"}
                </button>
                {mode === "tailor" && source?.text && (
                  <button type="button" onClick={() => setCompare((v) => !v)} className="btn-secondary btn-sm">
                    {compare ? "Edit only" : "Before / after"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void improveDraft()}
                  disabled={improving}
                  className="btn-secondary btn-sm disabled:bg-slate-300"
                >
                  {improving ? "Improving…" : "⚡ Improve draft"}
                </button>
                <button
                  type="button"
                  onClick={() => void exportResume(result.tailoredResume, resultTitle).catch((e) => notify(e.message))}
                  className="btn-secondary btn-sm"
                >
                  Export PDF
                </button>
                <button type="button" onClick={saveResult} className="btn-primary btn-sm">
                  {saved ? "Saved ✓" : "Save as version"}
                </button>
              </div>
            )}
          </div>

          {!result ? (
            <div className="mt-4 flex min-h-72 items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-6 text-center">
              <div>
                <p className="text-sm font-semibold text-white">Your resume will appear here</p>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-400">
                  You will also see what was improved, which keywords are now clearer, and a note on what to verify
                  before sending.
                </p>
              </div>
            </div>
          ) : (
            <>
              {compare && mode === "tailor" && source?.text ? (
                <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
                  <div>
                    <p className="label mb-1">Before</p>
                    <textarea value={source.text} readOnly rows={20} className="field resize-y whitespace-pre-wrap font-mono text-xs leading-relaxed" />
                  </div>
                  <div>
                    <p className="label mb-1">After</p>
                    <textarea
                      value={result.tailoredResume}
                      onChange={(e) => setResult({ ...result, tailoredResume: e.target.value })}
                      rows={20}
                      className="field resize-y whitespace-pre-wrap font-mono text-xs leading-relaxed"
                    />
                  </div>
                </div>
              ) : (
                <textarea
                  value={result.tailoredResume}
                  onChange={(e) => setResult({ ...result, tailoredResume: e.target.value })}
                  rows={20}
                  className="field mt-4 resize-y whitespace-pre-wrap font-mono text-xs leading-relaxed"
                />
              )}
              {result.engine === "heuristic" && (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                  Heuristic demo — no AI key configured, so this structures your real notes without a model rewrite.
                </p>
              )}
            </>
          )}
        </div>
      </section>

      {result && (
        <section className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Resume audit</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Same engine used by Fit Check, applied directly to this draft — so you see the same signals a recruiter
                sees.
              </p>
            </div>
            {audit ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={`text-2xl font-bold ${audit.score >= 80 ? "text-emerald-600" : audit.score >= 60 ? "text-amber-600" : "text-rose-600"}`}>
                    {audit.score}
                  </p>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{audit.grade}</p>
                </div>
                <div className="h-14 w-14">
                  <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
                    <circle cx="32" cy="32" r="27" fill="none" stroke="#e2e8f0" strokeWidth="7" />
                    <circle
                      cx="32"
                      cy="32"
                      r="27"
                      fill="none"
                      stroke={audit.score >= 80 ? "#059669" : audit.score >= 60 ? "#d97706" : "#e11d48"}
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={`${(audit.score / 100) * 2 * Math.PI * 27} ${2 * Math.PI * 27}`}
                    />
                  </svg>
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-400">Analyzing…</span>
            )}
          </div>

          {audit && (
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div>
                <p className="label">Sections found</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {audit.sectionsFound.map((s) => (
                    <span key={s} className="chip bg-emerald-50 text-emerald-700">✓ {s}</span>
                  ))}
                  {audit.missingSections.map((s) => (
                    <span key={s} className="chip bg-rose-50 text-rose-700">+ {s}</span>
                  ))}
                </div>
              </div>

              <div>
                <p className="label">Target keyword coverage</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {audit.keywordCoverage.map((k) => (
                    <span
                      key={k.term}
                      className={`rounded-full border px-2.5 py-0.5 text-xs ${
                        k.found
                          ? "border-cyan-500/25 bg-cyan-500/10 text-cyan-300"
                          : "border-white/10 bg-white/[0.03] text-slate-500 line-through"
                      }`}
                    >
                      {k.term}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="label">Action items</p>
                <ul className="mt-2 space-y-1.5">
                  {audit.suggestions.slice(0, 4).map((s, i) => (
                    <li key={i} className="flex gap-2 text-xs leading-relaxed text-slate-600">
                      <span className="text-brand-600">→</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {audit && audit.weakBullets.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="label">Bullet-level fixes</p>
              <ul className="mt-2 space-y-2">
                {audit.weakBullets.map((bullet, i) => (
                  <li key={i} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-xs font-medium text-slate-200">{bullet.text}</p>
                    <p className="mt-1 text-[11px] text-rose-400">{bullet.issues.join(" · ")}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{bullet.suggestion}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {result && (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="card p-5">
            <p className="label">What changed</p>
            <ul className="mt-3 space-y-2">
              {result.changes.map((change, i) => (
                <li key={i} className="flex gap-2 text-xs leading-relaxed text-slate-600">
                  <span className="text-brand-600">✓</span>
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5">
            <p className="label">Keywords</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {result.addedKeywords.length > 0 ? (
                result.addedKeywords.map((k) => (
                  <span key={k} className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-0.5 text-xs text-cyan-300">
                    {k}
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-500">No extra keywords suggested.</p>
              )}
            </div>
          </div>

          <div className="card p-5">
            <p className="label">Verify before sending</p>
            <p className="mt-3 text-xs leading-relaxed text-slate-600">{result.notes || "Check names, dates, and numbers."}</p>
          </div>
        </section>
      )}
    </div>
  );
}
