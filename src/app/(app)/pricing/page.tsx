"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For exploring and light job searching.",
    features: [
      "1 master resume",
      "5 fit checks / month",
      "5 AI resume versions / month",
      "Basic company directory",
      "Browser-only workspace",
    ],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    yearlyPrice: "$15",
    description: "For active applicants who want to apply faster.",
    features: [
      "Unlimited fit checks",
      "Unlimited AI resume tailoring",
      "All resume styles",
      "Batch versions for every company",
      "Live jobs + Adzuna + USAJobs",
      "Cloud sync across devices",
      "Priority AI quality",
    ],
    cta: "Go Pro",
    highlight: true,
  },
  {
    name: "Career",
    price: "$39",
    period: "/month",
    yearlyPrice: "$29",
    description: "For career changers and high-volume job seekers.",
    features: [
      "Everything in Pro",
      "Autopilot drafts",
      "Interview prep",
      "Salary negotiation scripts",
      "Chrome extension import",
      "Recruiter email sequences",
      "Weekly job-search report",
    ],
    cta: "Go Career",
    highlight: false,
  },
];

export default function PricingPage() {
  const { user, openAuth } = useApp();
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [billing, setBilling] = useState<{ plan: string; usage: { fit_check: number; ai_resume: number }; limits: { fit_check: number; ai_resume: number } } | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/billing")
      .then((res) => res.json())
      .then((data) => setBilling(data))
      .catch(() => {});
  }, [user]);

  async function choosePlan(plan: string) {
    if (!user) {
      openAuth();
      return;
    }
    setBusyPlan(plan);
    setMessage("");
    try {
      if (plan === "pro" || plan === "career") {
        const res = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        });
        const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
        if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not start checkout.");
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }
      const res = await fetch("/api/billing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, period }),
      });
      const data = (await res.json().catch(() => ({}))) as { plan?: string; error?: string };
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not update plan.");
      setMessage(`Plan activated: ${data.plan}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not update plan.");
    } finally {
      setBusyPlan(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Simple pricing</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Pay for speed, not for hope.
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
          FitCheck saves you time on every application. Start free, upgrade when your search gets serious.
        </p>
      </section>

      <section className="flex justify-center">
        <div className="flex rounded-xl border border-slate-300 bg-white p-0.5">
          {(["monthly", "yearly"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold capitalize transition ${
                period === p ? "bg-brand-600 text-white" : "text-slate-600 hover:text-brand-600"
              }`}
            >
              {p === "yearly" ? "Yearly · save ~25%" : "Monthly"}
            </button>
          ))}
        </div>
      </section>

      {message && (
        <p className="mx-auto max-w-xl rounded-lg bg-brand-50 p-3 text-center text-xs font-medium text-brand-700">
          {message}
        </p>
      )}

      {billing && (
        <section className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">Current plan</p>
              <p className="mt-1 text-lg font-bold capitalize text-slate-900">{billing.plan}</p>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="label">Fit checks</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {billing.usage.fit_check} / {Number.isFinite(billing.limits.fit_check) ? billing.limits.fit_check : "∞"}
                </p>
              </div>
              <div>
                <p className="label">AI resumes</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {billing.usage.ai_resume} / {Number.isFinite(billing.limits.ai_resume) ? billing.limits.ai_resume : "∞"}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`card relative flex flex-col p-6 ${plan.highlight ? "border-brand-500/50 shadow-[0_20px_50px_-24px_rgba(37,99,235,.8)]" : ""}`}
          >
            {plan.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-[11px] font-bold text-white">
                Most popular
              </span>
            )}
            <h3 className="text-sm font-bold text-slate-900">{plan.name}</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight text-slate-900">
                {plan.name === "Free" ? "$0" : period === "yearly" ? plan.yearlyPrice : plan.price}
              </span>
              <span className="text-xs text-slate-500">
                {plan.name === "Free" ? "forever" : period === "yearly" ? "/month · billed annually" : "/month"}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">{plan.description}</p>
            <ul className="mt-4 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2 text-xs leading-relaxed text-slate-600">
                  <span className="text-brand-600">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => void choosePlan(plan.name.toLowerCase())}
              className={`mt-auto pt-6 ${plan.highlight ? "" : "pt-8"}`}
            >
              <span className={`btn w-full ${plan.highlight ? "btn-primary" : "btn-secondary"} ${busyPlan === plan.name.toLowerCase() ? "cursor-wait opacity-70" : ""}`}>
                {busyPlan === plan.name.toLowerCase() ? "Activating…" : plan.cta}
              </span>
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
