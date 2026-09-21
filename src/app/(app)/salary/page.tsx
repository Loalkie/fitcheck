"use client";

import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { ROLES, roleById } from "@/lib/roles";
import Link from "next/link";

function fmtMoney(n: number): string {
  return `$${Math.round(n / 1000)}k`;
}

export default function SalaryPage() {
  const { ws, openOnboarding } = useApp();
  const p = ws.profile;
  const [query, setQuery] = useState("");
  const [education, setEducation] = useState("all");
  const [sort, setSort] = useState<"salary-high" | "salary-low" | "outlook">("salary-high");

  const targetRoles = (p?.targetRoles ?? [])
    .map((id) => roleById(id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  const min = p?.desiredSalaryMin ?? null;
  const max = p?.desiredSalaryMax ?? null;
  const baseRoles = targetRoles.length > 0 ? targetRoles : ROLES;
  const filteredRoles = baseRoles.filter((r) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || r.title.toLowerCase().includes(q) || r.topSkills.some((s) => s.toLowerCase().includes(q));
    const matchesEducation = education === "all" || r.typicalEducation === education;
    return matchesQuery && matchesEducation;
  });
  const sortedRoles = [...filteredRoles].sort((a, b) => {
    if (sort === "salary-low") return a.salaryMin - b.salaryMin;
    if (sort === "outlook") return a.outlook.localeCompare(b.outlook);
    return b.salaryMax - a.salaryMax;
  });

  async function copySalaryCsv() {
    const header = ["Role", "Median min", "Median max", "Education", "Outlook"];
    const rows = filteredRoles.map((r) => [r.title, r.salaryMin, r.salaryMax, r.typicalEducation, r.outlook]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    try {
      await navigator.clipboard.writeText(csv);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Salary compass</h2>
            <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-slate-500">
              Compare your target range against US median ranges for each role. Ranges are directional and vary by
              city, level, and company.
            </p>
          </div>
          <button type="button" onClick={openOnboarding} className="btn-secondary btn-sm">
            {p ? "Edit salary target" : "Set salary target"}
          </button>
        </div>

        {min !== null || max !== null ? (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <p className="label">Your floor</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{min !== null ? fmtMoney(min) : "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <p className="label">Your ceiling</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{max !== null ? fmtMoney(max) : "—"}</p>
            </div>
            <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-3">
              <p className="label">Negotiation anchor</p>
              <p className="mt-1 text-xl font-bold text-brand-700">
                {max !== null ? `${fmtMoney(max)}–${fmtMoney(Math.round(max * 1.1))}` : "Set a ceiling first"}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            Set a desired salary range in your profile to see where you sit against the market.
          </p>
        )}
      </section>

      {targetRoles.length > 0 ? (
        <section className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900">Your target roles</h3>
            <button type="button" onClick={() => void copySalaryCsv()} className="btn-secondary btn-sm">
              Copy CSV
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search role or skill…" className="field max-w-64" />
            <select value={education} onChange={(e) => setEducation(e.target.value)} className="field max-w-44">
              <option value="all">All education levels</option>
              <option value="High school">High school</option>
              <option value="Associate's">Associate's</option>
              <option value="Bachelor's">Bachelor's</option>
              <option value="Master's">Master's</option>
              <option value="PhD">PhD</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="field max-w-44">
              <option value="salary-high">Highest salary</option>
              <option value="salary-low">Lowest salary</option>
              <option value="outlook">Growth outlook</option>
            </select>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-4 font-semibold">Role</th>
                  <th className="pb-2 pr-4 font-semibold">Median range</th>
                  <th className="pb-2 pr-4 font-semibold">Your target</th>
                  <th className="pb-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedRoles.map((r) => {
                  const below = min !== null && min > r.salaryMax;
                  const above = max !== null && max < r.salaryMin;
                  const within = !below && !above && (min !== null || max !== null);
                  const status = below ? "Above median" : above ? "Below median" : within ? "Within range" : "No target";
                  const tone = within ? "bg-emerald-50 text-emerald-700" : below ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700";
                  return (
                    <tr key={r.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4 font-semibold text-slate-800">{r.title}</td>
                      <td className="py-3 pr-4 text-slate-600">{fmtMoney(r.salaryMin)}–{fmtMoney(r.salaryMax)}</td>
                      <td className="py-3 pr-4 text-slate-600">
                        {min !== null || max !== null ? `${min !== null ? fmtMoney(min) : "—"}–${max !== null ? fmtMoney(max) : "—"}` : "—"}
                      </td>
                      <td className="py-3">
                        <span className={`chip ${tone}`}>{status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Set your target roles first</h3>
              <p className="mt-0.5 max-w-xl text-xs text-slate-500">
                Salary comparison is most useful when it compares your expected range against the roles you actually want.
              </p>
            </div>
            <button type="button" onClick={openOnboarding} className="btn-primary btn-sm">
              Set target roles
            </button>
          </div>
          <details className="mt-4 rounded-xl border border-slate-200 p-3">
            <summary className="cursor-pointer text-xs font-semibold text-slate-600">
              Browse all US role salary ranges
            </summary>
            <div className="mt-3 flex flex-wrap gap-2">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search role or skill…" className="field max-w-64" />
              <select value={education} onChange={(e) => setEducation(e.target.value)} className="field max-w-44">
                <option value="all">All education levels</option>
                <option value="High school">High school</option>
                <option value="Associate's">Associate's</option>
                <option value="Bachelor's">Bachelor's</option>
                <option value="Master's">Master's</option>
                <option value="PhD">PhD</option>
              </select>
              <button type="button" onClick={() => void copySalaryCsv()} className="btn-secondary btn-sm">Copy CSV</button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sortedRoles.slice(0, 24).map((r) => (
                <div key={r.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <p className="text-sm font-semibold text-slate-800">{r.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{fmtMoney(r.salaryMin)}–{fmtMoney(r.salaryMax)}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{r.outlook}</p>
                </div>
              ))}
            </div>
          </details>
        </section>
      )}

      <section className="card p-5">
        <h3 className="text-sm font-bold text-slate-900">Negotiation script</h3>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
          <p>1. Anchor from research, not from your current salary: “Based on the role scope and market data, I’m targeting {max !== null ? `${fmtMoney(max)}–${fmtMoney(Math.round(max * 1.1))}` : "a range in line with the market"}.”</p>
          <p>2. Defer when the number comes too early: “I’d love to first confirm scope and impact, then we can land on the right package.”</p>
          <p>3. Negotiate total comp, not just base: equity, sign-on, bonus, PTO, remote flexibility, and level.</p>
          <p>4. Close with evidence: “If we can get to [number], I’m ready to move.”</p>
        </div>
      </section>

      <p className="text-center text-xs text-slate-400">
        These are planning references, not guaranteed offers. Verify with employer-published pay data.{" "}
        <Link href="/profile" className="font-semibold text-brand-600 hover:underline">
          Update profile →
        </Link>
      </p>
    </div>
  );
}
