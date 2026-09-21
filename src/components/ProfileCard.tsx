"use client";

import type { UserProfile } from "@/lib/store";
import { roleById } from "@/lib/roles";

function fmtMoney(n: number): string {
  return `$${Math.round(n / 1000)}k`;
}

function completeness(p: UserProfile): number {
  const fields = [
    p.educationLevel,
    p.fieldOfStudy,
    p.school,
    p.gradYear,
    p.yearsExperience !== null,
    p.internships.length > 0,
    p.skills.length > 0,
    p.targetRoles.length > 0,
    p.industries.length > 0,
    p.workAuthorization,
    p.desiredSalaryMin !== null || p.desiredSalaryMax !== null,
    p.remotePreference,
    p.location,
    p.targetCompanies.length > 0,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

function salaryHint(p: UserProfile, roleId: string): string | null {
  const role = roleById(roleId);
  if (!role) return null;
  const max = p.desiredSalaryMax;
  const min = p.desiredSalaryMin;
  if (max !== null && max < role.salaryMin) return "your target is below the median range";
  if (min !== null && min > role.salaryMax) return "your target is above the median range";
  if (min !== null && max !== null) return "within the median range";
  return null;
}

export default function ProfileCard({ profile, onEdit }: { profile: UserProfile | null; onEdit: () => void }) {
  if (!profile) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">Tell us about you</p>
          <p className="mt-0.5 max-w-xl text-xs text-slate-500">
            Education, internships, skills, target roles, and salary — so we can personalize your fit scores and give
            you a realistic salary range.
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
        >
          Complete your profile
        </button>
      </div>
    );
  }

  const pct = completeness(profile);
  const roles = profile.targetRoles.map((id) => roleById(id)).filter((r) => r !== undefined);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">Your profile</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {profile.educationLevel || "Education"}
            {profile.fieldOfStudy ? ` · ${profile.fieldOfStudy}` : ""}
            {profile.school ? ` · ${profile.school}` : ""}
            {profile.yearsExperience !== null ? ` · ${profile.yearsExperience} yr experience` : ""}
            {profile.workAuthorization ? ` · ${profile.workAuthorization}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-medium text-slate-500">{pct}% complete</p>
            <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Edit
          </button>
        </div>
      </div>

      {profile.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {profile.skills.slice(0, 12).map((s) => (
            <span key={s} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
              {s}
            </span>
          ))}
          {profile.skills.length > 12 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-400">+{profile.skills.length - 12}</span>
          )}
        </div>
      )}

      {profile.targetCompanies.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="text-xs font-semibold text-slate-500">Target companies:</span>
          {profile.targetCompanies.slice(0, 10).map((c) => (
            <span key={c} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs text-brand-700">
              {c}
            </span>
          ))}
        </div>
      )}

      {roles.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((r) => {
            const hint = salaryHint(profile, r.id);
            return (
              <div key={r.id} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                <p className="text-xs font-semibold text-slate-800">{r.title}</p>
                <p className="text-xs text-slate-500">
                  Median {fmtMoney(r.salaryMin)}–{fmtMoney(r.salaryMax)}
                </p>
                {hint && (
                  <p className={`mt-1 text-[11px] font-medium ${hint.includes("within") ? "text-emerald-600" : "text-amber-600"}`}>
                    {hint}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
