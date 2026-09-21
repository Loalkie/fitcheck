"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import { allCompanies, companyMatchDetails, recruiterContact, roleSummariesForCompany, type Company } from "@/lib/companies";
import { getCompanyNews, getLiveJobs, type CompanyNewsItem, type LiveJob } from "@/lib/client";
import { sponsorshipLabel } from "@/lib/sponsorship";
import { useApp } from "./AppProvider";
import { companyInterviewProcess, companyRemotePolicy, companySalaryRange, companyWorkModel } from "@/lib/companyCulture";

export default function CompanyDetailModal({
  open,
  company,
  onClose,
}: {
  open: boolean;
  company: Company;
  onClose: () => void;
}) {
  const { ws, toggleFavoriteCompany, setFavoriteCompanyGroup, openCompany } = useApp();
  const favorite = ws.favoriteCompanyIds.includes(company.id);
  const group = ws.favoriteCompanyGroups[company.id] ?? "target";
  const match = companyMatchDetails(company, ws.profile, ws.masterResume?.text ?? "");
  const similar = allCompanies()
    .filter((c) => c.industry === company.industry && c.id !== company.id)
    .slice(0, 3);
  const [news, setNews] = useState<CompanyNewsItem[]>([]);
  const [newsBusy, setNewsBusy] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [liveJobs, setLiveJobs] = useState<LiveJob[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setNewsBusy(true);
    setNewsError(null);
    setNews([]);
    getCompanyNews(company.name)
      .then((items) => {
        if (!cancelled) setNews(items);
      })
      .catch(() => {
        if (!cancelled) setNewsError("News feed unavailable.");
      })
      .finally(() => {
        if (!cancelled) setNewsBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, company.name]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getLiveJobs({ company: company.name, limit: 3 })
      .then((jobs) => {
        if (!cancelled) setLiveJobs(jobs);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, company.name]);

  const roles = roleSummariesForCompany(company);
  const contacts = recruiterContact(company);

  return (
    <Modal open={open} onClose={onClose} title={company.name} wide>
      <div className="space-y-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5">{company.industry}</span>
            <span>{company.size}</span>
            <span>{company.city}, {company.state}</span>
            {company.phone && <span>☎️ {company.phone}</span>}
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 font-bold text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.35)]">
              {match.score} match
            </span>
            <span
              className={`rounded-full border px-2.5 py-0.5 ${
                sponsorshipLabel(company).includes("Often")
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : sponsorshipLabel(company).includes("varies")
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                    : "border-white/10 bg-white/[0.04] text-slate-400"
              }`}
            >
              {sponsorshipLabel(company)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => toggleFavoriteCompany(company.id)}
            className={`mt-3 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              favorite
                ? "border border-amber-500/40 bg-amber-500/10 text-amber-300"
                : "border border-white/10 bg-white/5 text-slate-200 hover:border-cyan-500/50 hover:bg-white/10"
            }`}
          >
            {favorite ? "★ Saved" : "☆ Save company"}
          </button>
          {favorite && (
            <select
              value={group}
              onChange={(e) => setFavoriteCompanyGroup(company.id, e.target.value)}
              className="ml-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200"
            >
              <option value="dream">Dream</option>
              <option value="target">Target</option>
              <option value="safety">Safety</option>
            </select>
          )}
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{company.description}</p>
          {(match.matchedRoles.length > 0 || match.matchedSkills.length > 0) && (
            <div className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.07] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-300">Why you fit</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                {match.matchedRoles.length > 0 && <>Roles: {match.matchedRoles.join(", ")}. </>}
                {match.matchedSkills.length > 0 && <>Skills: {match.matchedSkills.join(", ")}.</>}
              </p>
            </div>
          )}
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Work model</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-200">{companyWorkModel(company)}</p>
            </div>
            <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Salary band</p>
              <p className="mt-0.5 text-xs font-semibold text-cyan-200">{companySalaryRange(company)}</p>
            </div>
            <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Remote policy</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-200">{companyRemotePolicy(company)}</p>
            </div>
            <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Typical interview process</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-300">{companyInterviewProcess(company)}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={company.careersUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all hover:bg-blue-500"
            >
              Careers ↗
            </a>
            <a
              href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(company.name)}&location=United%20States`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-cyan-500/50 hover:bg-white/10"
            >
              LinkedIn Jobs ↗
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Roles & required skills</h3>
          <div className="mt-3 grid grid-cols-1 gap-3">
            {roles.map((role) => (
              <div key={role.title} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-white">{role.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{role.summary}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {role.requirements.map((skill) => (
                    <span key={skill} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-slate-300">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {liveJobs.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-white">Recent open roles</h3>
            <ul className="mt-3 space-y-2">
              {liveJobs.map((job) => (
                <li key={job.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-2.5 hover:bg-white/[0.05]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-200">{job.title}</p>
                    <p className="truncate text-xs text-slate-500">{job.location}</p>
                  </div>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:border-cyan-500/50 hover:bg-white/10"
                  >
                    View ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {company.benefits.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-white">Employee benefits</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {company.benefits.map((benefit) => (
                <span key={benefit} className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-300">
                  {benefit}
                </span>
              ))}
            </div>
          </div>
        )}

        {similar.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-white">Similar companies</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {similar.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => openCompany(c)}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs text-slate-300 transition hover:border-cyan-500/50 hover:bg-white/10 hover:text-white"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-white">Latest news</h3>
          <p className="mt-0.5 text-xs text-slate-500">Aggregated from public news headlines. Always verify on the source.</p>
          <div className="mt-3">
            {newsBusy ? (
              <p className="text-sm text-slate-500">Loading news…</p>
            ) : newsError ? (
              <p className="text-sm text-slate-500">{newsError}</p>
            ) : news.length > 0 ? (
              <ul className="space-y-2">
                {news.map((item, i) => (
                  <li key={i} className="flex flex-col gap-0.5 rounded-lg border border-white/5 bg-white/[0.02] p-2.5 hover:bg-white/[0.05]">
                    <a href={item.link} target="_blank" rel="noreferrer" className="text-sm font-medium text-slate-200 hover:text-cyan-300">
                      {item.title}
                    </a>
                    <p className="text-[11px] text-slate-500">
                      {[item.source, item.date].filter(Boolean).join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No recent headlines found.</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">HR / recruiter contact</h3>
          <div className="mt-3 space-y-2">
            {contacts.map((c) => (
              <div key={c.label} className="flex flex-col gap-0.5 rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.label}</p>
                {c.href ? (
                  <a href={c.href} target="_blank" rel="noreferrer" className="text-sm font-medium text-cyan-300 hover:underline">
                    {c.value} ↗
                  </a>
                ) : (
                  <p className="text-sm text-slate-300">{c.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
