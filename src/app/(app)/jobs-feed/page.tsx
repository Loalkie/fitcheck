"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { getLiveJobDescription, getLiveJobs, type LiveJob } from "@/lib/client";

function timeAgo(iso: string): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const days = Math.floor((Date.now() - t) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function LiveJobsPage() {
  const { openAddJob, jobs, ws, saveSearch, removeSearch } = useApp();
  const [q, setQ] = useState("");
  const [remote, setRemote] = useState(false);
  const [company, setCompany] = useState("");
  const [list, setList] = useState<LiveJob[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracked, setTracked] = useState<Set<string>>(new Set());
  const [fetchingId, setFetchingId] = useState<string | null>(null);
  const [sort, setSort] = useState<"newest" | "company">("newest");
  const [sizeFilter, setSizeFilter] = useState<"all" | "startup" | "mid" | "enterprise">("all");
  const [levelFilter, setLevelFilter] = useState<"all" | "entry" | "mid" | "senior" | "manager">("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [searchName, setSearchName] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);

  async function load(opts?: { q?: string; remote?: boolean; company?: string }) {
    setBusy(true);
    setError(null);
    setVisibleCount(20);
    try {
      const data = await getLiveJobs({
        q: opts?.q ?? q,
        remote: opts?.remote ?? remote,
        company: opts?.company ?? company,
        limit: 120,
      });
      setList(data);
      setTracked(
        new Set(
          data
            .filter((j) =>
              jobs.some(
                (saved) =>
                  saved.title?.toLowerCase() === j.title.toLowerCase() &&
                  saved.company?.toLowerCase() === j.company.toLowerCase(),
              ),
            )
            .map((j) => j.id),
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load jobs.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialCompany = params.get("company") ?? "";
    if (initialCompany) setCompany(initialCompany);
    void load(initialCompany ? { company: initialCompany } : {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const companies = useMemo(() => {
    const set = new Set<string>();
    list.forEach((j) => j.company && set.add(j.company));
    return [...set].sort().slice(0, 12);
  }, [list]);

  const industries = useMemo(() => {
    const set = new Set<string>();
    list.forEach((j) => j.industry && set.add(j.industry));
    return [...set].sort();
  }, [list]);

  function countForSearch(search: typeof ws.savedSearches[number]): number {
    return list.filter((job) => {
      if (search.remote && !job.remote) return false;
      if (search.size !== "mid" && job.size !== search.size) return false;
      if (search.level !== "mid" && job.level !== search.level) return false;
      if (search.industry !== "all" && job.industry !== search.industry) return false;
      if (search.q) {
        const q = search.q.toLowerCase();
        if (!`${job.title} ${job.company} ${job.location}`.toLowerCase().includes(q)) return false;
      }
      return true;
    }).length;
  }

  const displayList = useMemo(() => {
    const copy = list.filter(
      (job) =>
        (sizeFilter === "all" || job.size === sizeFilter) &&
        (levelFilter === "all" || job.level === levelFilter) &&
        (industryFilter === "all" || job.industry === industryFilter),
    );
    if (sort === "company") copy.sort((a, b) => a.company.localeCompare(b.company));
    else copy.sort((a, b) => (b.postedAt || "").localeCompare(a.postedAt || ""));
    return copy;
  }, [list, sort, sizeFilter, levelFilter, industryFilter]);

  async function track(job: LiveJob) {
    setFetchingId(job.id);
    try {
      const description = await getLiveJobDescription(job);
      openAddJob({
        title: job.title,
        company: job.company,
        url: job.url,
        location: job.location,
        jdText: description,
      });
      setTracked((prev) => new Set(prev).add(job.id));
    } catch {
      openAddJob({
        title: job.title,
        company: job.company,
        url: job.url,
        location: job.location,
        jdText: `Role: ${job.title}\nCompany: ${job.company}\nLocation: ${job.location}\nSource: ${job.url}\n\nOpen the posting for full requirements.`,
      });
    } finally {
      setFetchingId(null);
    }
  }

  async function trackTop() {
    const top = displayList.filter((job) => !tracked.has(job.id)).slice(0, 5);
    for (const job of top) {
      await track(job);
    }
  }

  function applySearch(search: typeof ws.savedSearches[number]) {
    setQ(search.q);
    setRemote(search.remote);
    setSizeFilter(search.size);
    setLevelFilter(search.level);
    setIndustryFilter(search.industry);
    void load({
      q: search.q,
      remote: search.remote,
      company: "",
    });
  }

  function persistSearch() {
    if (!searchName.trim()) return;
    saveSearch({
      id: `${Date.now().toString(36)}`,
      name: searchName.trim(),
      q,
      remote,
      size: sizeFilter === "all" ? "mid" : sizeFilter,
      level: levelFilter === "all" ? "mid" : levelFilter,
      industry: industryFilter,
    });
    setSearchName("");
  }

  function resetVisible() {
    setVisibleCount(20);
  }

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Live US job feed</h2>
            <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-slate-500">
              Real openings pulled from Greenhouse boards for 10 companies, plus Adzuna when API keys are configured.
              Results are cached for five minutes.
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void trackTop()} disabled={busy || fetchingId !== null} className="btn-secondary btn-sm disabled:bg-slate-300">
              Track top 5
            </button>
            <Link href="/jobs" className="btn-secondary btn-sm">
              View tracked jobs
            </Link>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr_auto]">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or location…" className="field" />
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company (optional)" className="field" />
          <button type="button" onClick={() => void load()} disabled={busy} className="btn-primary disabled:cursor-not-allowed disabled:bg-slate-300">
            {busy ? "Loading…" : "Search"}
          </button>
        </div>
        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={remote} onChange={(e) => setRemote(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
          Remote only
        </label>
        <div className="mt-3 flex gap-2">
          <input
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Name this search…"
            className="field flex-1"
          />
          <button type="button" onClick={persistSearch} disabled={!searchName.trim()} className="btn-secondary btn-sm disabled:bg-slate-300">
            Save search
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {(["all", "startup", "mid", "enterprise"] as const).map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setSizeFilter(size)}
              className={`chip capitalize ${sizeFilter === size ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {size === "all" ? "All sizes" : size}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIndustryFilter("all")}
            className={`chip ${industryFilter === "all" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            All industries
          </button>
          {industries.map((industry) => (
            <button
              key={industry}
              type="button"
              onClick={() => setIndustryFilter(industry)}
              className={`chip ${industryFilter === industry ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {industry}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {(["all", "entry", "mid", "senior", "manager"] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setLevelFilter(level)}
              className={`chip capitalize ${levelFilter === level ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {level === "all" ? "All levels" : level}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {companies.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCompany(company === c ? "" : c);
                void load({ company: company === c ? "" : c });
              }}
              className={`chip ${company === c ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-end">
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="field max-w-40">
            <option value="newest">Newest first</option>
            <option value="company">Company A–Z</option>
          </select>
        </div>
      </section>

      {ws.savedSearches.length > 0 && (
        <section className="card p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Saved searches:</span>
            {ws.savedSearches.map((search) => (
              <span key={search.id} className="inline-flex items-center gap-1 rounded-full bg-brand-50 text-brand-700">
                <button type="button" onClick={() => applySearch(search)} className="px-2.5 py-0.5 text-xs font-medium hover:bg-brand-100">
                  {search.name}
                  <span className="rounded-full bg-brand-100 px-1.5 text-[10px] font-bold text-brand-700">
                    {countForSearch(search)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => removeSearch(search.id)}
                  className="pr-2 text-[11px] text-brand-400 hover:text-rose-600"
                  aria-label="Delete saved search"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </section>
      )}

      {error && <p className="text-xs font-medium text-rose-600">{error}</p>}

      <section className="grid grid-cols-1 gap-3">
        {list.length === 0 && !busy ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
            <p className="text-sm font-semibold text-slate-800">No jobs found</p>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">Try a broader search or disable the remote filter.</p>
          </div>
        ) : (
          displayList.slice(0, visibleCount).map((job) => (
            <div key={job.id} className="card card-hover flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-slate-900">{job.title}</p>
                  {job.remote && <span className="chip bg-emerald-50 text-emerald-700">Remote</span>}
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {job.company} · {job.location}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {job.source} {job.postedAt ? `· ${timeAgo(job.postedAt)}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a href={job.url} target="_blank" rel="noreferrer" className="btn-secondary btn-sm">
                  View ↗
                </a>
                <button
                  type="button"
                  onClick={() => void track(job)}
                  disabled={tracked.has(job.id) || fetchingId === job.id}
                  className="btn-primary btn-sm disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {tracked.has(job.id) ? "Tracked ✓" : fetchingId === job.id ? "Fetching JD…" : "+ Track"}
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {displayList.length > visibleCount && (
        <div className="flex justify-center">
          <button type="button" onClick={() => setVisibleCount((count) => count + 30)} className="btn-secondary">
            Show more
          </button>
        </div>
      )}
    </div>
  );
}
