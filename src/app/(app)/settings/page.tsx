"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { useDialog } from "@/components/Dialogs";
import { deleteAccount, sendVerificationEmail } from "@/lib/client";

const FIELDS = [
  { id: "ADZUNA_APP_ID", label: "Adzuna App ID", placeholder: "Adzuna application id" },
  { id: "ADZUNA_APP_KEY", label: "Adzuna App Key", placeholder: "Adzuna application key" },
  { id: "USAJOBS_API_KEY", label: "USAJobs API Key", placeholder: "USAJobs API key" },
  { id: "USAJOBS_EMAIL", label: "USAJobs User-Agent Email", placeholder: "Your email for API requests" },
  { id: "STRIPE_SECRET_KEY", label: "Stripe Secret Key", placeholder: "sk_live_..." },
  { id: "STRIPE_PRICE_PRO", label: "Stripe Pro Price ID", placeholder: "price_..." },
  { id: "STRIPE_PRICE_CAREER", label: "Stripe Career Price ID", placeholder: "price_..." },
  { id: "STRIPE_PRICE_PRO_ANNUAL", label: "Stripe Pro Annual Price ID", placeholder: "price_..." },
  { id: "STRIPE_PRICE_CAREER_ANNUAL", label: "Stripe Career Annual Price ID", placeholder: "price_..." },
  { id: "STRIPE_WEBHOOK_SECRET", label: "Stripe Webhook Secret", placeholder: "whsec_..." },
];

export default function SettingsPage() {
  const { user, openAuth, signOut } = useApp();
  const { confirm, notify } = useDialog();
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [health, setHealth] = useState<{ ok: boolean; db: boolean } | null>(null);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState("");
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function sendVerification() {
    setVerifyBusy(true);
    try {
      const result = await sendVerificationEmail();
      notify(
        result.alreadyVerified
          ? "That address is already verified."
          : "Verification email sent — check your inbox.",
      );
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not send the verification email.");
    } finally {
      setVerifyBusy(false);
    }
  }

  async function removeAccount() {
    const ok = await confirm({
      title: "Delete this account?",
      message:
        "The account, its saved workspace, sessions, and billing link are removed for good. This cannot be undone.",
      confirmLabel: "Delete account",
      danger: true,
    });
    if (!ok) return;
    setDeleteBusy(true);
    try {
      await deleteAccount(deletePassword);
      await signOut();
      notify("Your account was deleted.");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not delete the account.");
    } finally {
      setDeleteBusy(false);
      setDeletePassword("");
      setDeleteOpen(false);
    }
  }

  function refreshHealth() {
    setHealth(null);
    fetch("/api/health")
      .then((res) => res.json())
      .then((data: { ok?: boolean; db?: boolean }) => {
        setHealth({ ok: Boolean(data.ok), db: Boolean(data.db) });
      })
      .catch(() => setHealth({ ok: false, db: false }));
  }

  useEffect(() => {
    refreshHealth();

    if (!user) return;
    fetch("/api/settings")
      .then(async (res) => {
        if (res.status === 403) {
          setDenied(true);
          return;
        }
        const data = (await res.json()) as { settings?: Record<string, string> };
        setValues(data.settings ?? {});
      })
      .catch(() => {});
  }, [user]);

  async function save() {
    setBusy(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Could not save these keys.");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save these keys.");
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
        <p className="text-sm font-semibold text-slate-800">Sign in to manage integrations</p>
        <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
          Integration keys apply to the whole site, so only the owner account can edit them.
        </p>
        <button type="button" onClick={openAuth} className="btn-primary btn-sm mt-4">
          Sign in / Sync
        </button>
      </section>
    );
  }

  const ownerOnly = (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
      <p className="text-sm font-semibold text-slate-800">Owner-only settings</p>
      <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
        These keys decide which AI provider every visitor&apos;s resume is sent to and which Stripe account takes
        payments, so they are limited to the deployment owner. The rest of the app works normally.
      </p>
    </section>
  );

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="text-sm font-bold text-slate-900">Account</h2>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="label">Signed in as</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{user.email}</p>
          </div>
          <div>
            <p className="label">Email status</p>
            <p className={`mt-1 text-sm font-semibold ${user.emailVerified ? "text-emerald-700" : "text-amber-700"}`}>
              {user.emailVerified ? "Verified" : "Not verified yet"}
            </p>
          </div>
          {!user.emailVerified && (
            <button
              type="button"
              onClick={() => void sendVerification()}
              disabled={verifyBusy}
              className="btn-secondary btn-sm disabled:bg-slate-200"
            >
              {verifyBusy ? "Sending…" : "Send verification email"}
            </button>
          )}
        </div>
        <p className="mt-3 max-w-2xl text-xs leading-relaxed text-slate-500">
          Verification is optional. It exists so password resets and billing notices reach an address you control.
        </p>
      </section>

      <section className="card p-5">
        <h2 className="text-sm font-bold text-rose-700">Danger zone</h2>
        <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-slate-500">
          Deleting the account removes your sign-in, synced workspace, and the link to any subscription. Cancel the
          subscription first from the pricing page if you are still being billed.
        </p>
        {deleteOpen ? (
          <div className="mt-3 max-w-sm space-y-3">
            <div>
              <label className="label">Confirm your password</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="field mt-1.5"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void removeAccount()}
                disabled={deleteBusy || !deletePassword}
                className="btn-danger btn-sm disabled:bg-slate-200"
              >
                {deleteBusy ? "Deleting…" : "Delete account"}
              </button>
              <button type="button" onClick={() => setDeleteOpen(false)} className="btn-secondary btn-sm">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setDeleteOpen(true)} className="btn-secondary btn-sm mt-3">
            Delete account
          </button>
        )}
      </section>

      {denied && ownerOnly}

      {!denied && (
        <>
      <section className="card p-5">
        <h2 className="text-sm font-bold text-slate-900">Integrations & AI</h2>
        <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-slate-500">
          Connect external job sources and your own OpenAI-compatible model. Leave fields blank to keep the built-in
          free job sources and heuristic fallback.
        </p>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">System health</h3>
          <button type="button" onClick={refreshHealth} className="btn-secondary btn-sm">Refresh</button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className={`rounded-xl border p-3 ${health?.ok ? "border-emerald-200 bg-emerald-50/60" : "border-rose-200 bg-rose-50/60"}`}>
            <p className="label">Server</p>
            <p className={`mt-1 text-sm font-bold ${health?.ok ? "text-emerald-700" : "text-rose-700"}`}>
              {health ? (health.ok ? "Operational" : "Unavailable") : "Checking…"}
            </p>
          </div>
          <div className={`rounded-xl border p-3 ${health?.db ? "border-emerald-200 bg-emerald-50/60" : "border-rose-200 bg-rose-50/60"}`}>
            <p className="label">Database</p>
            <p className={`mt-1 text-sm font-bold ${health?.db ? "text-emerald-700" : "text-rose-700"}`}>
              {health ? (health.db ? "Connected" : "Error") : "Checking…"}
            </p>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <div className="grid grid-cols-1 gap-4">
          {FIELDS.map((field) => (
            <div key={field.id}>
              <label className="label">{field.label}</label>
              <input
                type={field.id.includes("KEY") ? "password" : "text"}
                value={values[field.id] ?? ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                placeholder={field.placeholder}
                className="field mt-1.5"
              />
            </div>
          ))}
        </div>

        <button type="button" onClick={() => void save()} disabled={busy} className="btn-primary mt-4 disabled:bg-slate-300">
          {busy ? "Saving…" : saved ? "Saved ✓" : "Save settings"}
        </button>
        {error ? <p className="mt-3 text-xs font-semibold text-rose-600">{error}</p> : null}
      </section>
        </>
      )}
    </div>
  );
}
