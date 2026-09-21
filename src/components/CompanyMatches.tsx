"use client";

import Link from "next/link";
import { recommendCompanies } from "@/lib/companies";
import type { Company } from "@/lib/companies";
import type { UserProfile } from "@/lib/store";

export default function CompanyMatches({
  profile,
  resumeText,
  onBrowseAll,
  onCompany,
  compact = false,
}: {
  profile: UserProfile | null;
  resumeText: string;
  onBrowseAll?: () => void;
  onCompany: (company: Company) => void;
  compact?: boolean;
}) {
  const hasSignal = Boolean(profile) || resumeText.trim().length > 40;
  if (!hasSignal) return null;

  const matches = recommendCompanies(profile, resumeText, compact ? 3 : 6);

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Companies that fit you</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Matched by your profile, skills, resume, and target roles. Contact details are public HQ information.
          </p>
        </div>
        {onBrowseAll ? (
          <button type="button" onClick={onBrowseAll} className="btn-secondary btn-sm shrink-0">
            Browse all
          </button>
        ) : (
          <Link href="/companies" className="btn-secondary btn-sm shrink-0">
            Browse all
          </Link>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {matches.map((c) => (
          <div key={c.id} className="group relative flex flex-col rounded-2xl bg-gradient-to-br from-white/10 to-transparent p-px transition-all duration-300 hover:-translate-y-1 hover:from-cyan-500/50">
            <div className="flex h-full flex-col rounded-2xl border border-white/5 bg-[#0b0f19]/80 p-4 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">{c.name}</p>
                <p className="text-xs text-slate-400">{c.industry}</p>
              </div>
              {c.score > 0 && (
                <span className="shrink-0 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-bold text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                  {c.score} match
                </span>
              )}
            </div>

            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-400">{c.description}</p>

            <div className="mt-3 space-y-1 text-[11px] text-slate-500">
              <p className="truncate">📍 {c.city}, {c.state}</p>
              {c.phone && <p className="truncate">☎️ {c.phone}</p>}
            </div>

            {c.matchedRoles.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {c.matchedRoles.slice(0, 3).map((r) => (
                  <span key={r} className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300">
                    {r}
                  </span>
                ))}
              </div>
            )}
            {c.matchedSkills.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {c.matchedSkills.slice(0, 4).map((s) => (
                  <span key={s} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-slate-300">
                    {s}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-auto flex items-center gap-2 pt-3">
              <button
                type="button"
                onClick={() => onCompany(c)}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
              >
                Details
              </button>
              <a
                href={c.careersUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all hover:bg-blue-500"
              >
                View careers ↗
              </a>
            </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
