"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyEmail } from "@/lib/client";

type State = "verifying" | "verified" | "failed";

function VerifyEmailResult() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<State>(token ? "verifying" : "failed");
  const [error, setError] = useState<string | null>(
    token ? null : "That verification link is incomplete.",
  );
  // React runs effects twice in development; the token is single use, so the
  // request must only fire once.
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    verifyEmail(token)
      .then(() => setState("verified"))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not verify the address.");
        setState("failed");
      });
  }, [token]);

  if (state === "verifying") {
    return <p className="text-sm text-slate-500">Verifying your email…</p>;
  }

  return (
    <section className="card mx-auto max-w-lg p-6 text-center">
      <h2 className="text-base font-bold text-slate-900">
        {state === "verified" ? "Email verified" : "This link did not work"}
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        {state === "verified"
          ? "Thanks — we can now reach you about your account and any billing issue."
          : `${error ?? ""} Open the newest link from your inbox, or ask for a fresh one from Settings.`}
      </p>
      <Link href={state === "verified" ? "/dashboard" : "/settings"} className="btn-primary btn-sm mt-4 inline-flex">
        {state === "verified" ? "Back to the workspace" : "Open settings"}
      </Link>
    </section>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
      <VerifyEmailResult />
    </Suspense>
  );
}
