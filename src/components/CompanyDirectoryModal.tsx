"use client";

import { useMemo, useState } from "react";
import Modal from "./Modal";
import { allCompanies, companyMatchDetails, type Company } from "@/lib/companies";
import { sponsorshipFor, sponsorshipLabel } from "@/lib/sponsorship";
import { companyRemotePolicy } from "@/lib/companyCulture";
import type { UserProfile } from "@/lib/store";

function CompanyCard({ c, onOpen, matchScore }: { c: Company; onOpen: (c: Company) => void; matchScore?: number | null }) {
  return (
    <div className="group relative flex flex-col rounded-2xl bg-gradient-to-br from-white/10 to-transparent p-px transition-all duration-300 hover:from-cyan-500/50">
      <div className="flex h-full flex-col rounded-2xl border border-white/5 bg-[#0b0f19]/80 p-5 backdrop-blur-xl">
        <div className="mb-1 flex items-start justify-between">
          <h3 className="text-xl font-semibold tracking-wide text-white">{c.name}</h3>
          {matchScore !== null && matchScore !== undefined && matchScore > 0 && (
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]">
              {matchScore} match
            </span>
          )}
        </div>

        <p className="mb-4 text-sm text-slate-400">{c.industry}</p>
        <p className="mb-6 flex-grow text-sm leading-relaxed text-slate-400">{c.description}</p>

        <div className="mb-4 flex flex-col gap-1 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 text-red-400">📍</span> {c.city}, {c.state}
          </div>
          {c.phone && (
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 text-red-400">📞</span> {c.phone}
            </div>
          )}
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {c.keywords.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-slate-300">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onOpen(c)}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-sm text-white transition-colors hover:bg-white/10"
          >
            Details
          </button>
          <a
            href={c.careersUrl}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-600 py-2 text-sm text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all hover:bg-blue-500"
          >
            View careers ↗
          </a>
        </div>
      </div>
    </div>
  );
}

export default function CompanyDirectoryModal({
  open,
  onClose,
  onOpenCompany,
}: {
  open: boolean;
  onClose: () => void;
  onOpenCompany: (company: Company) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="US company directory" wide>
      <CompanyDirectoryBody onOpenCompany={onOpenCompany} />
    </Modal>
  );
}

export function CompanyDirectoryBody({
  onOpenCompany,
  profile,
  resumeText,
}: {
  onOpenCompany: (company: Company) => void;
  profile?: UserProfile | null;
  resumeText?: string;
}) {
  const [query, setQuery] = useState("");
  const [sponsor, setSponsor] = useState<"all" | "often" | "sometimes" | "unknown">("all");
  const [industry, setIndustry] = useState("all");
  const [sizeFilter, setSizeFilter] = useState<"all" | "startup" | "mid" | "enterprise">("all");
  const [sort, setSort] = useState<"name" | "industry" | "size">("name");
  const [visibleCount, setVisibleCount] = useState(12);
  const industries = useMemo(() => [...new Set(allCompanies().map((c) => c.industry))].sort(), []);
  function sizeCategory(size: string): "startup" | "mid" | "enterprise" {
    const n = Number(size.replace(/[^\d]/g, ""));
    if (!n) return "mid";
    if (n < 10000) return "startup";
    if (n < 100000) return "mid";
    return "enterprise";
  }
  const companies = useMemo(() => {
    let list = allCompanies();
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((c) =>
      [c.name, c.industry, c.address, c.city, c.state, ...c.topRoles, ...c.keywords]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
    if (sponsor !== "all") list = list.filter((c) => sponsorshipFor(c) === sponsor);
    if (industry !== "all") list = list.filter((c) => c.industry === industry);
    if (sizeFilter !== "all") list = list.filter((c) => sizeCategory(c.size) === sizeFilter);
    if (sort === "industry") list = [...list].sort((a, b) => a.industry.localeCompare(b.industry) || a.name.localeCompare(b.name));
    else if (sort === "size") list = [...list].sort((a, b) => {
      const order = { startup: 0, mid: 1, enterprise: 2 };
      return order[sizeCategory(a.size)] - order[sizeCategory(b.size)] || a.name.localeCompare(b.name);
    });
    else list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [query, sponsor, industry, sizeFilter, sort]);

  return (
    <div className="space-y-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search company, industry, role, or skill…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-1.5">
          <span className="filter-group-label">Sponsorship:</span>
          {(["all", "often", "sometimes", "unknown"] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setSponsor(level)}
              aria-pressed={sponsor === level}
              className={`filter-pill ${sponsor === level ? "filter-pill-active" : ""}`}
            >
              {level === "all" ? "All sponsorship" : level}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="filter-group-label">Industry:</span>
          <button
            type="button"
            onClick={() => setIndustry("all")}
            aria-pressed={industry === "all"}
            className={`filter-pill ${industry === "all" ? "filter-pill-active" : ""}`}
          >
            All industries
          </button>
          {industries.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndustry(i)}
              aria-pressed={industry === i}
              className={`filter-pill ${industry === i ? "filter-pill-active" : ""}`}
            >
              {i}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="filter-group-label">Size:</span>
          {(["all", "startup", "mid", "enterprise"] as const).map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setSizeFilter(size)}
              aria-pressed={sizeFilter === size}
              className={`filter-pill capitalize ${sizeFilter === size ? "filter-pill-active" : ""}`}
            >
              {size === "all" ? "All sizes" : size}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="filter-group-label">Sort:</span>
          {(
            [
              ["name", "Company A–Z"],
              ["industry", "Industry A–Z"],
              ["size", "Smallest first"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSort(value)}
              aria-pressed={sort === value}
              className={`filter-pill ${sort === value ? "filter-pill-active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            Showing <span className="font-semibold text-cyan-300">{companies.length}</span> companies
          </p>
          {(sponsor !== "all" || industry !== "all" || sizeFilter !== "all" || query.trim() !== "") && (
            <button
              type="button"
              onClick={() => {
                setSponsor("all");
                setIndustry("all");
                setSizeFilter("all");
                setSort("name");
                setQuery("");
              }}
              className="filter-pill"
            >
              Clear filters
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500">
          Publicly listed headquarters, main switchboard, and careers pages. Verify current openings and contact
          details on the employer's site before applying.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {companies.slice(0, visibleCount).map((c) => (
            <CompanyCard
              key={c.id}
              c={c}
              onOpen={onOpenCompany}
              matchScore={profile || (resumeText ?? "").trim().length > 40 ? companyMatchDetails(c, profile ?? null, resumeText ?? "").score : null}
            />
          ))}
        </div>
        {companies.length > visibleCount && (
          <div className="flex justify-center">
            <button type="button" onClick={() => setVisibleCount((count) => count + 12)} className="btn-secondary">
              Show more
            </button>
          </div>
        )}
        {companies.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            No companies match those filters. Try broadening the search.
          </p>
        )}
    </div>
  );
}
