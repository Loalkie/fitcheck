"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { useDialog } from "@/components/Dialogs";
import ProfileCard from "@/components/ProfileCard";
import { extractProfileFromResume } from "@/lib/profileExtract";

export default function ProfilePage() {
  const { ws, openOnboarding, saveProfile, user } = useApp();
  const { notify } = useDialog();
  const profile = ws.profile;
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState(false);

  function autoFill() {
    if (!ws.masterResume?.text) return;
    saveProfile(extractProfileFromResume(ws.masterResume.text, ws.profile));
  }

  async function connectExtension() {
    try {
      const res = await fetch("/api/extension-token");
      const data = (await res.json().catch(() => ({}))) as { token?: string; error?: string };
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Sign in first.");
      setToken(data.token ?? "");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not create an extension token.");
    }
  }

  async function copyToken() {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Career profile</h2>
            <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-slate-500">
              This drives salary realism, role suggestions, company matching, and how personalized your outreach is.
              Answers take about two minutes and stay editable.
            </p>
          </div>
          <div className="flex gap-2">
            {ws.masterResume && (
              <button type="button" onClick={autoFill} className="btn-secondary btn-sm">
                ⚡ Auto-fill from resume
              </button>
            )}
            <button type="button" onClick={openOnboarding} className="btn-primary btn-sm">
              {profile ? "Edit profile" : "Start profile"}
            </button>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h3 className="text-sm font-bold text-slate-900">Connect Chrome extension</h3>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
          Generate a token once, paste it into the extension popup, and parsed jobs will import directly into your
          Applications.
        </p>
        {!user ? (
          <p className="mt-3 text-sm text-slate-500">Sign in first to sync with the extension.</p>
        ) : token ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <p className="label">Extension token</p>
            <p className="mt-1 break-all font-mono text-xs text-slate-700">{token}</p>
            <button type="button" onClick={() => void copyToken()} className="btn-primary btn-sm mt-2">
              {copied ? "Copied ✓" : "Copy token"}
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => void connectExtension()} className="btn-primary btn-sm mt-3">
            Generate extension token
          </button>
        )}
      </section>

      {profile ? (
        <ProfileCard profile={profile} onEdit={openOnboarding} />
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
          <p className="text-sm font-semibold text-slate-800">Your profile is empty</p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">
            Education, experience, skills, work authorization, and salary targets — used to score your fit and rank
            companies realistically.
          </p>
          <button type="button" onClick={openOnboarding} className="btn-primary btn-sm mt-4">
            Complete your profile
          </button>
        </section>
      )}

      <section className="card p-5">
        <h3 className="text-sm font-bold text-slate-900">What this unlocks</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              title: "Ranked companies",
              body: "Employers sorted by how your skills and target roles line up with theirs.",
              href: "/companies",
              cta: "See matches",
            },
            {
              title: "Job Radar",
              body: "Role suggestions you can track in one click, filtered against what you already saved.",
              href: "/radar",
              cta: "Open radar",
            },
            {
              title: "Salary sanity check",
              body: "Your target range compared against US median ranges for each role.",
              href: "/insights",
              cta: "View insights",
            },
          ].map((card) => (
            <div key={card.title} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-sm font-semibold text-slate-800">{card.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{card.body}</p>
              <Link href={card.href} className="mt-2 inline-block text-xs font-semibold text-brand-600 hover:underline">
                {card.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
