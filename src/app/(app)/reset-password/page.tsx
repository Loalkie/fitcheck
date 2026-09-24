"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/client";

function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (password !== confirm) {
      setError("Both passwords must match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset the password.");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <section className="card mx-auto max-w-lg p-6 text-center">
        <h2 className="text-base font-bold text-slate-900">This reset link is incomplete</h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Open the link exactly as it arrived in your email, or request a new one.
        </p>
        <Link href="/dashboard?auth=1" className="btn-primary btn-sm mt-4 inline-flex">
          Request a new link
        </Link>
      </section>
    );
  }

  if (done) {
    return (
      <section className="card mx-auto max-w-lg p-6 text-center">
        <h2 className="text-base font-bold text-slate-900">Password updated</h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Every device that was signed in has been signed out. Sign in again with the new password.
        </p>
        <Link href="/dashboard?auth=1" className="btn-primary btn-sm mt-4 inline-flex">
          Sign in
        </Link>
      </section>
    );
  }

  return (
    <section className="card mx-auto max-w-lg p-6">
      <h2 className="text-base font-bold text-slate-900">Set a new password</h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        The link works once. Signing in again afterwards needs the new password on every device.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="label">New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="field mt-1.5"
          />
        </div>
        <div>
          <label className="label">Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void submit()}
            className="field mt-1.5"
          />
        </div>
        {error ? <p className="text-xs font-semibold text-rose-600">{error}</p> : null}
        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy || password.length < 8}
          className="btn-primary w-full disabled:bg-slate-300"
        >
          {busy ? "Saving…" : "Save new password"}
        </button>
      </div>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
