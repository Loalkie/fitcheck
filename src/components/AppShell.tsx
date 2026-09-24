"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { NAV_GROUPS, NAV_ITEMS, navItemFor } from "@/lib/nav";
import { useApp } from "./AppProvider";
import SearchPalette from "./SearchPalette";
import PwaManager from "./PwaManager";
import ServerStatusBanner from "./ServerStatusBanner";
import { GhostButton, GlowButton } from "./ui";

function NavIcon({ path }: { path: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 text-sm font-bold text-white"
        style={{ boxShadow: "0 10px 22px -12px rgba(37,99,235,0.95)" }}
      >
        F
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-bold tracking-tight text-slate-900">FitCheck</span>
        <span className="block text-[11px] text-slate-500">Job search workspace</span>
      </span>
    </Link>
  );
}

function SyncBadge() {
  const { user, signOut, openAuth } = useApp();
  if (user) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Synced</p>
        <p className="mt-0.5 truncate text-xs text-slate-600">{user.email}</p>
        <button type="button" onClick={() => void signOut()} className="mt-2 text-[11px] font-medium text-slate-400 hover:text-slate-700">
          Sign out
        </button>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-brand-100 bg-brand-50/70 p-3">
      <p className="text-xs font-semibold text-slate-800">Saved in this browser</p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
        Sign in to sync your pipeline across devices.
      </p>
      <button type="button" onClick={openAuth} className="btn-primary btn-sm mt-2 w-full">
        Sign in / Sync
      </button>
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const active = navItemFor(pathname);
  const { openQuickCheck, openAddJob, openAuth } = useApp();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const auth = new URLSearchParams(window.location.search).get("auth");
    if (auth === "1") openAuth();
  }, [openAuth]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="dark-app min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200/80 bg-white/70 backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="px-5 py-5">
          <Logo />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {NAV_GROUPS.map((group) => (
            <div key={group} className="mb-4">
              <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                {group}
              </p>
              <div className="space-y-0.5">
                {NAV_ITEMS.filter((item) => item.group === group).map((item) => {
                  const isActive = item.id === active.id;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? "bg-gradient-to-r from-brand-50 to-indigo-50 text-brand-700"
                          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                      }`}
                    >
                      <span className={isActive ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"}>
                        <NavIcon path={item.icon} />
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="px-3 pb-4">
          <SyncBadge />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="lg:hidden">
                <Logo />
              </span>
              <div className="hidden lg:block">
                <h1 className="text-lg font-bold tracking-tight text-slate-900">{active.label}</h1>
                <p className="text-xs text-slate-500">{active.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PwaManager />
              <button type="button" onClick={() => setSearchOpen(true)} className="btn-secondary btn-sm">
                <span className="text-slate-400">⌘K</span> Search
              </button>
              <GhostButton type="button" onClick={openQuickCheck} className="px-3 py-1.5 text-xs">
                Quick check
              </GhostButton>
              <GlowButton type="button" onClick={() => openAddJob()} className="px-3 py-1.5 text-xs">
                + Add job
              </GlowButton>
            </div>
          </div>

          <nav className="flex gap-1.5 overflow-x-auto px-4 pb-2.5 lg:hidden">
            {NAV_ITEMS.map((item) => {
              const isActive = item.id === active.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    isActive ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {item.short}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <ServerStatusBanner />
            {children}
          </div>
          <footer className="mx-auto mt-12 w-full max-w-6xl border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
            <p>Scores are advisory reference, not a hiring decision. Never fabricate experience to raise a score.</p>
            <p className="mt-2 flex items-center justify-center gap-3">
              <Link href="/privacy" className="hover:text-slate-600">
                Privacy
              </Link>
              <span aria-hidden="true">·</span>
              <Link href="/terms" className="hover:text-slate-600">
                Terms
              </Link>
            </p>
          </footer>
        </main>
      </div>

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
