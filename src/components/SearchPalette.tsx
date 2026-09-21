"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { useApp } from "./AppProvider";
import { allCompanies, type Company } from "@/lib/companies";
import { ROLES } from "@/lib/roles";
import { NAV_ITEMS } from "@/lib/nav";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SearchPalette({ open, onClose }: Props) {
  const { jobs, openJob, openCompany } = useApp();
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const matchedJobs = jobs
      .filter((j) => `${j.title} ${j.company} ${j.location ?? ""}`.toLowerCase().includes(q))
      .slice(0, 4);
    const matchedCompanies = allCompanies()
      .filter((c) =>
        `${c.name} ${c.industry} ${c.topRoles.join(" ")} ${c.keywords.join(" ")}`.toLowerCase().includes(q),
      )
      .slice(0, 4);
    const matchedRoles = ROLES.filter((r) =>
      `${r.title} ${r.topSkills.join(" ")}`.toLowerCase().includes(q),
    ).slice(0, 4);
    const matchedPages = NAV_ITEMS.filter((item) =>
      `${item.label} ${item.description}`.toLowerCase().includes(q),
    ).slice(0, 4);

    return { jobs: matchedJobs, companies: matchedCompanies, roles: matchedRoles, pages: matchedPages };
  }, [query, jobs]);

  function go(href: string) {
    onClose();
    router.push(href);
  }

  function openJobResult(id: string) {
    onClose();
    openJob(id);
  }

  function openCompanyResult(company: Company) {
    onClose();
    openCompany(company);
  }

  return (
    <Modal open={open} onClose={onClose} title="Search everything" wide>
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search jobs, companies, roles, or pages…"
        className="field"
      />

      <div className="mt-4 max-h-[65vh] overflow-y-auto pr-1">
        {!results && (
          <p className="py-8 text-center text-sm text-slate-400">Type to search across your workspace.</p>
        )}

        {results?.jobs.length ? (
          <ResultGroup label="Your jobs">
            {results.jobs.map((job) => (
              <button key={job.id} type="button" onClick={() => openJobResult(job.id)} className="result-row">
                <span className="text-slate-400">💼</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-800">{job.title}</span>
                  <span className="block truncate text-xs text-slate-500">{job.company}</span>
                </span>
              </button>
            ))}
          </ResultGroup>
        ) : null}

        {results?.companies.length ? (
          <ResultGroup label="Companies">
            {results.companies.map((c) => (
              <button key={c.id} type="button" onClick={() => openCompanyResult(c)} className="result-row">
                <span className="text-slate-400">🏢</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-800">{c.name}</span>
                  <span className="block truncate text-xs text-slate-500">{c.industry}</span>
                </span>
              </button>
            ))}
          </ResultGroup>
        ) : null}

        {results?.roles.length ? (
          <ResultGroup label="US roles">
            {results.roles.map((r) => (
              <button key={r.id} type="button" onClick={() => go("/radar")} className="result-row">
                <span className="text-slate-400">🧭</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-800">{r.title}</span>
                  <span className="block truncate text-xs text-slate-500">{r.topSkills.slice(0, 4).join(" · ")}</span>
                </span>
              </button>
            ))}
          </ResultGroup>
        ) : null}

        {results?.pages.length ? (
          <ResultGroup label="Pages">
            {results.pages.map((p) => (
              <button key={p.id} type="button" onClick={() => go(p.href)} className="result-row">
                <span className="text-slate-400">→</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-800">{p.label}</span>
                  <span className="block truncate text-xs text-slate-500">{p.description}</span>
                </span>
              </button>
            ))}
          </ResultGroup>
        ) : null}

        {results &&
          !results.jobs.length &&
          !results.companies.length &&
          !results.roles.length &&
          !results.pages.length && (
            <p className="py-8 text-center text-sm text-slate-400">No results for “{query}”.</p>
          )}
      </div>
    </Modal>
  );
}

function ResultGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="label mb-1.5">{label}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
