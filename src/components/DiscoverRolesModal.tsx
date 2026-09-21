"use client";

import { useMemo, useState } from "react";
import Modal from "./Modal";
import { ROLES, roleById, type RoleInfo } from "@/lib/roles";
import type { UserProfile } from "@/lib/store";
import type { JobDraft } from "./AddJobModal";

function fmtMoney(n: number): string {
  return `$${Math.round(n / 1000)}k`;
}

function roleJd(role: RoleInfo, remote: string | undefined): string {
  const location = remote && remote !== "Flexible" ? `${remote}` : "Remote or hybrid";
  return [
    `Role: ${role.title}`,
    `Location: ${location}`,
    `Typical education: ${role.typicalEducation}`,
    `Key skills: ${role.topSkills.join(", ")}.`,
    `We are hiring a ${role.title} to join a US team. In this role you will apply ${role.topSkills.slice(0, 3).join(", ")}, and related tools, to deliver measurable results. You should be able to explain your past projects, the problem you solved, and the impact you created.`,
    `This posting is a suggested role profile for discovery and tracking, not a live employer posting.`,
  ].join("\n\n");
}

function matchScore(profile: UserProfile | null, role: RoleInfo): number {
  if (!profile) return 0;
  let score = 0;
  if (profile.targetRoles.includes(role.id)) score += 4;
  const skills = new Set(profile.skills.map((s) => s.toLowerCase()));
  role.topSkills.forEach((s) => {
    if (skills.has(s.toLowerCase())) score += 1;
  });
  return score;
}

export default function DiscoverRolesModal({
  open,
  profile,
  onClose,
  onAdd,
}: {
  open: boolean;
  profile: UserProfile | null;
  onClose: () => void;
  onAdd: (draft: JobDraft, status: "saved") => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Discover US roles" wide>
      <DiscoverRolesBody profile={profile} onAdd={onAdd} />
    </Modal>
  );
}

export function DiscoverRolesBody({
  profile,
  onAdd,
}: {
  profile: UserProfile | null;
  onAdd: (draft: JobDraft, status: "saved") => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [education, setEducation] = useState("all");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [minSalary, setMinSalary] = useState("");
  const [sort, setSort] = useState<"recommended" | "salary-high" | "salary-low" | "outlook">("recommended");

  const REMOTE_IDS = new Set([
    "swe", "frontend", "backend", "ai-ml", "ai-research", "ds", "de", "da", "devops", "security",
    "pm", "design", "uxr", "tpm", "em", "se", "marketing", "sales", "csm", "hr", "finance", "tw",
    "ba", "fa", "quant", "risk", "healthcare-analyst", "supply-chain", "operations", "network", "consultant",
    "sdr", "recruiter", "content", "compliance", "project-manager", "bdm", "accountant", "social-media",
    "support", "qa", "pmm", "logistics", "rn",
  ]);

  const CATEGORIES = [
    { id: "all", label: "All roles", ids: null as string[] | null },
    { id: "tech", label: "Tech & AI", ids: ["swe", "frontend", "backend", "ai-ml", "ai-research", "devops", "security", "se", "network", "qa"] },
    { id: "data", label: "Data & Analytics", ids: ["ds", "de", "da", "ba", "fa", "quant", "risk", "healthcare-analyst", "supply-chain"] },
    { id: "product", label: "Product & Design", ids: ["pm", "design", "uxr", "tpm", "em"] },
    { id: "engineering", label: "Engineering", ids: ["mechanical", "electrical", "chemical", "biomedical"] },
    { id: "business", label: "Business & Operations", ids: ["marketing", "sales", "csm", "hr", "finance", "tw", "operations", "consultant", "sdr", "recruiter", "content", "compliance", "project-manager", "bdm", "accountant", "social-media", "support", "pmm", "logistics"] },
    { id: "healthcare", label: "Healthcare", ids: ["rn", "healthcare-analyst", "biomedical"] },
  ];

  const sorted = useMemo(() => {
    const scored = ROLES.map((r) => ({ r, s: matchScore(profile, r) }));
    scored.sort((a, b) => b.s - a.s || a.r.title.localeCompare(b.r.title));
    return scored.map((x) => x.r);
  }, [profile]);

  const categoryIds = CATEGORIES.find((c) => c.id === category)?.ids ?? null;
  const filtered = sorted
    .filter((r) => !categoryIds || categoryIds.includes(r.id))
    .filter((r) => education === "all" || r.typicalEducation === education)
    .filter((r) => !remoteOnly || REMOTE_IDS.has(r.id))
    .filter((r) => !minSalary || r.salaryMax >= Number(minSalary) * 1000)
    .filter((r) => query.trim() ? (() => {
        const q = query.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.topSkills.some((s) => s.toLowerCase().includes(q))
        );
      })() : true);

  const displayed = (() => {
    if (sort === "salary-high") return [...filtered].sort((a, b) => b.salaryMax - a.salaryMax);
    if (sort === "salary-low") return [...filtered].sort((a, b) => a.salaryMin - b.salaryMin);
    if (sort === "outlook") return [...filtered].sort((a, b) => a.outlook.localeCompare(b.outlook));
    return filtered;
  })();

  return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`chip ${category === c.id ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["all", "Bachelor's", "Master's", "PhD", "Associate's"] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setEducation(level)}
              className={`chip ${education === level ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {level === "all" ? "All education levels" : level}
            </button>
          ))}
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
          Remote-friendly roles only
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Min salary</span>
          <input
            value={minSalary}
            onChange={(e) => setMinSalary(e.target.value)}
            type="number"
            min="0"
            step="5"
            placeholder="100"
            className="w-28 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
          <span className="text-xs text-slate-400">$k / year</span>
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="recommended">Sort: Recommended for you</option>
          <option value="salary-high">Sort: Highest salary</option>
          <option value="salary-low">Sort: Lowest salary</option>
          <option value="outlook">Sort: Growth outlook</option>
        </select>
        <div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by role or skill, e.g. AI, Python, Product"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Median US salary ranges are directional and vary by city, level, and company.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {displayed.map((r) => {
            const score = matchScore(profile, r);
            return (
              <div key={r.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{r.title}</p>
                    <p className="text-xs text-slate-500">
                      {fmtMoney(r.salaryMin)}–{fmtMoney(r.salaryMax)} · {r.outlook}
                    </p>
                  </div>
                  {profile && score > 0 && (
                    <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                      {score} match
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[11px] text-slate-400">Typical education: {r.typicalEducation}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.topSkills.map((s) => (
                    <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                      {s}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onAdd(
                      {
                        title: r.title,
                        company: "",
                        url: "",
                        location: profile?.remotePreference || "Remote",
                        salary: `${fmtMoney(r.salaryMin)}–${fmtMoney(r.salaryMax)}`,
                        notes: "Suggested role from Discover",
                        contacts: [],
                        jdText: roleJd(r, profile?.remotePreference),
                      },
                      "saved",
                    )
                  }
                  className="mt-3 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                >
                  + Track this role
                </button>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            No roles match your search. Try a broader keyword or category.
          </p>
        )}
      </div>
  );
}
