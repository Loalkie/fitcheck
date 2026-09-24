"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Modal from "./Modal";
import { useDialog } from "./Dialogs";
import { login, register, requestPasswordReset, sendVerificationEmail, type AuthUser } from "@/lib/client";

interface Props {
  open: boolean;
  onClose: () => void;
  onAuthed: (user: AuthUser) => void;
}

/** `sent` is the confirmation screen after a reset link has been requested. */
type Mode = "login" | "register" | "forgot" | "sent";

const TITLES: Record<Mode, string> = {
  login: "Sign in",
  register: "Create account",
  forgot: "Reset your password",
  sent: "Check your email",
};

export default function AuthModal({ open, onClose, onAuthed }: Props) {
  const { notify } = useDialog();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reopening the dialog should start from the common case again.
  useEffect(() => {
    if (!open) {
      setMode("login");
      setPassword("");
      setError(null);
    }
  }, [open]);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      if (mode === "forgot") {
        await requestPasswordReset(email);
        setMode("sent");
        return;
      }
      if (mode === "register") {
        const user = await register(email, password);
        // Ask for the verification mail on the way out; a deployment without a
        // mail provider simply skips it instead of blocking the sign-up.
        void sendVerificationEmail()
          .then(() => notify(`Verification link sent to ${user.email}.`))
          .catch(() => {});
        onAuthed(user);
      } else {
        onAuthed(await login(email, password));
      }
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (mode === "sent") {
    return (
      <Modal open={open} onClose={onClose} title={TITLES.sent}>
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-300">
            If an account exists for <span className="font-semibold text-white">{email}</span>, a reset link is on its
            way. It works once and expires in an hour.
          </p>
          <p className="text-xs leading-relaxed text-slate-500">
            Nothing arrived? Check the spam folder, then try again — the newest link is the one that works.
          </p>
          <button type="button" onClick={() => setMode("login")} className="btn-secondary w-full text-sm">
            Back to sign in
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={TITLES[mode]}>
      <div className="space-y-4">
        {mode === "forgot" ? (
          <div className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
            Enter the email you signed up with and we will send a link to set a new password.
          </div>
        ) : (
          <div className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
            Sync your workspace across devices. Your resume is stored under your account and only leaves this app when
            you run an AI feature — those requests go to the AI provider configured for this deployment.{" "}
            <Link href="/privacy" className="font-semibold text-brand-600 hover:underline">
              Privacy policy
            </Link>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-slate-600">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        {mode !== "forgot" && (
          <div>
            <label className="text-xs font-semibold text-slate-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            {mode === "login" && (
              <button
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setError(null);
                }}
                className="mt-2 text-xs font-medium text-brand-600 hover:underline"
              >
                Forgot password?
              </button>
            )}
          </div>
        )}

        {error && <p className="text-xs font-medium text-rose-600">{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:bg-slate-300"
        >
          {busy
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : mode === "register"
                ? "Create account"
                : "Send reset link"}
        </button>

        {mode === "register" && (
          <p className="text-[11px] leading-relaxed text-slate-500">
            We email a one-time link so you can confirm the address — no action is needed to start using the app.
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
          }}
          className="w-full text-center text-xs font-medium text-brand-600 hover:underline"
        >
          {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </Modal>
  );
}
