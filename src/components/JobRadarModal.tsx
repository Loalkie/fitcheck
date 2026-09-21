"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Modal from "./Modal";
import { recommendCompanies, roleSummariesForCompany, type Company } from "@/lib/companies";
import { ROLES } from "@/lib/roles";
import type { SavedJob, UserProfile } from "@/lib/store";
import type { JobDraft } from "./AddJobModal";

interface RadarJob {
  key: string;
  company: Company;
  role: string;
  summary: string;
  skills: string[];
  score: number;
  salary: string;
}

function jdFor(company: Company, role: string, skills: string[]): string {
  return [
    `Role: ${role}`,
    `Company: ${company.name}`,
    `Industry: ${company.industry}`,
    `Key skills: ${skills.join(", ")}.`,
    `We are hiring a ${role} at ${company.name}. In this role you will apply ${skills.slice(0, 3).join(", ")}, and related tools, to deliver measurable results. You should be able to explain your past projects, the problem you solved, and the impact you created.`,
    `This posting is a suggested role profile for discovery and tracking, not a live employer posting.`,
  ].join("\n\n");
}

function draftFor(r: RadarJob, profile: UserProfile | null): JobDraft {
  return {
    title: r.role,
    company: r.company.name,
    url: r.company.careersUrl,
    location: profile?.remotePreference || "Remote",
    salary: r.salary,
    notes: `Radar suggestion · ${r.company.industry}`,
    contacts: [],
    jdText: jdFor(r.company, r.role, r.skills),
  };
}

export default function JobRadarModal({
  open,
  profile,
  resumeText,
  jobs,
  onClose,
  onAdd,
}: {
  open: boolean;
  profile: UserProfile | null;
  resumeText: string;
  jobs: SavedJob[];
  onClose: () => void;
  onAdd: (draft: JobDraft, status: "saved") => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Job Radar · suggested roles" wide>
      <JobRadarBody profile={profile} resumeText={resumeText} jobs={jobs} onAdd={onAdd} />
    </Modal>
  );
}

export function JobRadarBody({
  profile,
  resumeText,
  jobs,
  onAdd,
}: {
  profile: UserProfile | null;
  resumeText: string;
  jobs: SavedJob[];
  onAdd: (draft: JobDraft, status: "saved") => void;
}) {
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [minSalary, setMinSalary] = useState("");
  const [sort, setSort] = useState<"score" | "salary" | "company">("score");
  const REMOTE_IDS = new Set([
    "swe", "frontend", "backend", "ai-ml", "ai-research", "ds", "de", "da", "devops", "security",
    "pm", "design", "uxr", "tpm", "em", "se", "marketing", "sales", "csm", "hr", "finance", "tw",
    "ba", "fa", "quant", "risk", "healthcare-analyst", "supply-chain", "operations", "network", "consultant",
    "sdr", "recruiter", "content", "compliance", "project-manager", "bdm", "accountant", "social-media",
    "support", "qa", "pmm", "logistics", "rn",
  ]);

  const radarJobs = useMemo<RadarJob[]>(() => {
    const companies = recommendCompanies(profile, resumeText, 12);
    const existing = new Set(jobs.map((j) => `${j.company?.toLowerCase()}|${j.title?.toLowerCase()}`));
    const out: RadarJob[] = [];
    for (const company of companies) {
      const roles = roleSummariesForCompany(company);
      const roleTitles = roles.length ? roles.map((r) => r.title) : company.topRoles.slice(0, 2);
      const picked = roleTitles.slice(0, 3);
      for (const role of picked) {
        const info = ROLES.find((r) => r.title === role);
        const key = `${company.id}|${role.toLowerCase()}`;
        if (existing.has(`${company.name.toLowerCase()}|${role.toLowerCase()}`)) continue;
        const summary = roles.find((r) => r.title === role)?.summary ?? `A ${role} role at ${company.name}.`;
        out.push({
          key,
          company,
          role,
          summary,
          skills: roles.find((r) => r.title === role)?.requirements ?? company.keywords.slice(0, 4),
          score: Math.max(0, company.score + (profile?.targetRoles.some((id) => id.toLowerCase() === role.toLowerCase()) ? 5 : 0)),
          salary: info ? `$${Math.round(info.salaryMin / 1000)}k–$${Math.round(info.salaryMax / 1000)}k` : "Salary varies",
        });
      }
    }
    out.sort((a, b) => b.score - a.score || a.company.name.localeCompare(b.company.name));
    return out.slice(0, 15);
  }, [profile, resumeText, jobs]);

  function addOne(r: RadarJob) {
    onAdd(draftFor(r, profile), "saved");
    setAdded((prev) => new Set(prev).add(r.key));
  }

  function addTop() {
    const top = radarJobs.filter((r) => !added.has(r.key)).slice(0, 8);
    top.forEach((r) => onAdd(draftFor(r, profile), "saved"));
    setAdded((prev) => {
      const next = new Set(prev);
      top.forEach((r) => next.add(r.key));
      return next;
    });
  }

  const remaining = radarJobs.filter((r) => !added.has(r.key)).length;
  const salaryFloor = (salary: string) => Number(salary.match(/\d+/)?.[0] ?? 0);
  const displayJobs = useMemo(() => {
    let list = radarJobs.filter((r) => !minSalary || salaryFloor(r.salary) >= Number(minSalary) * 1000);
    if (sort === "salary") list = [...list].sort((a, b) => salaryFloor(b.salary) - salaryFloor(a.salary));
    else if (sort === "company") list = [...list].sort((a, b) => a.company.name.localeCompare(b.company.name));
    else list = [...list].sort((a, b) => b.score - a.score);
    return list;
  }, [radarJobs, minSalary, sort]);

  return (
    <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Autopilot suggestions</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Generated from your profile + resume. Review and track the ones you want; skip the rest.
            </p>
          </div>
          <button
            type="button"
            onClick={addTop}
            disabled={remaining === 0}
            className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-white/10"
          >
            Track top 8 matches
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input value={minSalary} onChange={(e) => setMinSalary(e.target.value)} type="number" min="0" step="5" placeholder="Min salary ($k)" className="field" />
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="field">
            <option value="score">Sort: Best match</option>
            <option value="salary">Sort: Highest salary</option>
            <option value="company">Sort: Company A–Z</option>
          </select>
        </div>

        {radarJobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <p className="text-sm font-semibold text-slate-800">No personalized suggestions yet</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
              Add your resume or complete your profile to generate role and company suggestions.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Link href="/resume" className="btn-primary btn-sm">Upload resume</Link>
              <Link href="/profile" className="btn-secondary btn-sm">Complete profile</Link>
            </div>
          </div>
        ) : (
          <div className="grid max-h-[65vh] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
            {displayJobs.map((r) => (
              <div key={r.key} className="flex flex-col rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{r.role}</p>
                    <p className="text-xs text-slate-500">
                      {r.company.name} · {r.salary} · {ROLES.find((role) => role.title === r.role)?.typicalEducation || "Any education"}
                    </p>
                    {REMOTE_IDS.has(ROLES.find((role) => role.title === r.role)?.id ?? "") && (
                      <span className="chip mt-1 bg-emerald-50 text-emerald-700">Remote-friendly</span>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-brand-700">
                    {r.score}
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600">{r.summary}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.skills.slice(0, 5).map((s) => (
                    <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{s}</span>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  Matches: {r.skills.slice(0, 4).join(", ") || r.company.industry}
                </p>
                <button
                  type="button"
                  onClick={() => addOne(r)}
                  disabled={added.has(r.key)}
                  className="mt-3 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  {added.has(r.key) ? "Tracked ✓" : "+ Track role"}
                </button>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
