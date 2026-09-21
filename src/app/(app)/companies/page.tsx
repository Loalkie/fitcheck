"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import CompanyMatches from "@/components/CompanyMatches";
import { CompanyDirectoryBody } from "@/components/CompanyDirectoryModal";
import { allCompanies, companyMatchDetails, type Company } from "@/lib/companies";
import { sponsorshipLabel } from "@/lib/sponsorship";
import { companyRemotePolicy, companySalaryRange } from "@/lib/companyCulture";
import { getLiveJobs, type LiveJob } from "@/lib/client";

export default function CompaniesPage() {
  const { ws, openCompany, openOnboarding, setFavoriteCompanyGroup } = useApp();
  const hasProfile = Boolean(ws.profile) || (ws.masterResume?.text ?? "").trim().length > 40;
  const favorites = allCompanies().filter((c) => ws.favoriteCompanyIds.includes(c.id));
  const [groupFilter, setGroupFilter] = useState<"all" | "dream" | "target" | "safety">("all");
  const [liveJobs, setLiveJobs] = useState<LiveJob[]>([]);
  const filteredFavorites = favorites.filter(
    (c) => groupFilter === "all" || (ws.favoriteCompanyGroups[c.id] ?? "target") === groupFilter,
  );

  useEffect(() => {
    let cancelled = false;
    getLiveJobs({ limit: 200 })
      .then((jobs) => {
        if (!cancelled) setLiveJobs(jobs);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function openRoleCount(companyName: string): number {
    return liveJobs.filter((job) => job.company.toLowerCase() === companyName.toLowerCase()).length;
  }

  function makeLiveCompany(companyName: string): Company {
    const job = liveJobs.find((j) => j.company === companyName) ?? liveJobs[0];
    return {
      id: `live-${companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name: companyName,
      industry: job?.industry || "US Jobs",
      description: `Hiring company found in the live job feed. Explore its current open roles and compare with your profile.`,
      address: job?.location || "United States",
      city: job?.location || "US",
      state: "",
      careersUrl: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(companyName)}&location=United%20States`,
      size: "Varies",
      topRoles: liveJobs.filter((j) => j.company === companyName).slice(0, 5).map((j) => j.title),
      keywords: [],
      benefits: [],
    };
  }

  const liveCompanies = useMemo(() => {
    const map = new Map<string, { count: number; location: string; source: string }>();
    liveJobs.forEach((job) => {
      const existing = map.get(job.company) ?? { count: 0, location: job.location, source: job.source };
      existing.count += 1;
      map.set(job.company, existing);
    });
    return [...map.entries()]
      .map(([company, info]) => ({ company, ...info }))
      .sort((a, b) => b.count - a.count || a.company.localeCompare(b.company));
  }, [liveJobs]);

  async function copyComparison() {
    const header = ["Company", "Group", "Match", "Open roles", "Industry", "HQ", "Size", "Sponsorship", "Salary band", "Remote policy", "Top roles", "Benefits"];
    const rows = filteredFavorites.map((c) => [
      c.name,
      ws.favoriteCompanyGroups[c.id] ?? "target",
      companyMatchDetails(c, ws.profile, ws.masterResume?.text ?? "").score,
      openRoleCount(c.name),
      c.industry,
      `${c.city}, ${c.state}`,
      c.size,
      sponsorshipLabel(c),
      companySalaryRange(c),
      companyRemotePolicy(c),
      c.topRoles.slice(0, 3).join(" | "),
      c.benefits.slice(0, 3).join(" | "),
    ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    try {
      await navigator.clipboard.writeText(csv);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div className="space-y-6">
      {hasProfile ? (
        <CompanyMatches
          profile={ws.profile}
          resumeText={ws.masterResume?.text ?? ""}
          onCompany={openCompany}
        />
      ) : (
        <section className="card p-6">
          <h2 className="text-sm font-bold text-slate-900">Match companies to your background</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
            Upload your resume or complete your profile and this page will rank US employers by how well your skills,
            target roles, and industry line up — with their open role profiles, public HQ contact details, and recent
            headlines.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/resume" className="btn-primary btn-sm">
              Upload resume
            </Link>
            <button type="button" onClick={openOnboarding} className="btn-secondary btn-sm">
              Complete profile
            </button>
          </div>
        </section>
      )}

      {favorites.length > 0 && (
        <section className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900">Saved companies</h3>
            <button type="button" onClick={() => void copyComparison()} className="btn-secondary btn-sm">
              Copy comparison CSV
            </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(["all", "dream", "target", "safety"] as const).map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => setGroupFilter(group)}
                  className={`chip capitalize ${groupFilter === group ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  {group === "all" ? "All groups" : group}
                </button>
              ))}
            </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[1160px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400">
                  <th className="pb-2 pr-4 font-semibold">Company</th>
                  <th className="pb-2 pr-4 font-semibold">Group</th>
                  <th className="pb-2 pr-4 font-semibold">Match</th>
                  <th className="pb-2 pr-4 font-semibold">Open roles</th>
                  <th className="pb-2 pr-4 font-semibold">Industry</th>
                  <th className="pb-2 pr-4 font-semibold">HQ</th>
                  <th className="pb-2 pr-4 font-semibold">Size</th>
                  <th className="pb-2 font-semibold">Sponsorship</th>
                  <th className="pb-2 pl-4 font-semibold">Salary band</th>
                  <th className="pb-2 pl-4 font-semibold">Remote policy</th>
                  <th className="pb-2 pl-4 font-semibold">Top roles</th>
                  <th className="pb-2 pl-4 font-semibold">Benefits</th>
                </tr>
              </thead>
              <tbody>
                {filteredFavorites.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100">
                    <td className="py-2.5 pr-4">
                      <button type="button" onClick={() => openCompany(c)} className="font-semibold text-brand-700 hover:underline">
                        {c.name}
                      </button>
                    </td>
                    <td className="py-2.5 pr-4 font-semibold text-brand-700">
                      {companyMatchDetails(c, ws.profile, ws.masterResume?.text ?? "").score}
                    </td>
                    <td className="py-2.5 pr-4 font-semibold text-slate-700">
                      {openRoleCount(c.name) > 0 ? (
                        <Link href={`/jobs-feed?company=${encodeURIComponent(c.name)}`} className="text-brand-700 hover:underline">
                          {openRoleCount(c.name)} open
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2.5 pr-4">
                      <select
                        value={ws.favoriteCompanyGroups[c.id] ?? "target"}
                        onChange={(e) => setFavoriteCompanyGroup(c.id, e.target.value)}
                        className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                      >
                        <option value="dream">Dream</option>
                        <option value="target">Target</option>
                        <option value="safety">Safety</option>
                      </select>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600">{c.industry}</td>
                    <td className="py-2.5 pr-4 text-slate-600">{c.city}, {c.state}</td>
                    <td className="py-2.5 pr-4 text-slate-600">{c.size}</td>
                    <td className="py-2.5 text-slate-600">{sponsorshipLabel(c)}</td>
                    <td className="py-2.5 pl-4 text-slate-600">{companySalaryRange(c)}</td>
                    <td className="py-2.5 pl-4 text-slate-600">{companyRemotePolicy(c)}</td>
                    <td className="py-2.5 pl-4 text-slate-600">{c.topRoles.slice(0, 3).join(" · ")}</td>
                    <td className="py-2.5 pl-4 text-slate-600">{c.benefits.slice(0, 3).join(" · ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {liveCompanies.length > 0 && (
        <section className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Companies hiring now</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Pulled from live job sources, not just the static company list.
              </p>
            </div>
            <span className="chip bg-brand-50 font-semibold text-brand-700">{liveCompanies.length} companies</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {liveCompanies.slice(0, 100).map((item) => (
              <span key={item.company} className="inline-flex items-center gap-1">
                <Link
                  href={`/jobs-feed?company=${encodeURIComponent(item.company)}`}
                  className="chip bg-slate-100 text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                >
                  {item.company} · {item.count}
                </Link>
                <button
                  type="button"
                  onClick={() => openCompany(makeLiveCompany(item.company))}
                  className="text-xs font-semibold text-brand-600 hover:underline"
                >
                  Analyze
                </button>
              </span>
            ))}
          </div>
        </section>
      )}

      <details className="card p-5">
        <summary className="cursor-pointer">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Browse full US company directory</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Optional research view. Your best next step is usually the matched companies above.
            </p>
          </div>
        </summary>
        <CompanyDirectoryBody
          onOpenCompany={openCompany}
          profile={ws.profile}
          resumeText={ws.masterResume?.text ?? ""}
        />
      </details>
    </div>
  );
}
