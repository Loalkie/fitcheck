"use client";

import { useEffect, useState } from "react";

const POLL_MS = 20_000;
const DISMISS_KEY = "fit-storage-notice-dismissed";

export default function ServerStatusBanner() {
  const [offline, setOffline] = useState(false);
  const [temporaryStorage, setTemporaryStorage] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function ping() {
      try {
        const res = await fetch("/api/health", { cache: "no-store", signal: AbortSignal.timeout(8_000) });
        if (cancelled) return;
        setOffline(!res.ok);
        if (!res.ok) return;
        const data = (await res.json().catch(() => ({}))) as { storage?: string };
        setTemporaryStorage(Boolean(data.storage) && data.storage !== "persistent");
      } catch {
        if (!cancelled) setOffline(true);
      }
    }

    void ping();
    const timer = window.setInterval(() => void ping(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  if (offline) {
    return (
      <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 backdrop-blur-md">
        <p className="text-sm font-semibold text-rose-200">The app server is not responding</p>
        <p className="mt-0.5 text-xs text-rose-100/80">
          Uploads and analysis will fail until it is back. Retry in a moment, then reload this page.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 transition hover:border-cyan-500/50 hover:text-white"
        >
          Reload
        </button>
      </div>
    );
  }

  if (!temporaryStorage || dismissed) return null;

  return (
    <div className="mb-4 flex items-start justify-between gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 backdrop-blur-md">
      <div>
        <p className="text-sm font-semibold text-amber-200">Sign-in sync is unavailable on this host</p>
        <p className="mt-0.5 text-xs leading-relaxed text-amber-100/80">
          Accounts need a database that survives a restart, and this deployment only has temporary storage. Every other
          feature works, and your workspace is saved in this browser. Point <code>FIT_DATA_DIR</code> at a durable
          volume (or connect a hosted database) to turn sync back on.
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          window.localStorage.setItem(DISMISS_KEY, "1");
          setDismissed(true);
        }}
        className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 transition hover:border-amber-400/60 hover:text-white"
      >
        Dismiss
      </button>
    </div>
  );
}
