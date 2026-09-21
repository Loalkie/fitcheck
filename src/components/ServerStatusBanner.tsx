"use client";

import { useEffect, useState } from "react";

const POLL_MS = 20_000;

export default function ServerStatusBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function ping() {
      try {
        const res = await fetch("/api/health", { cache: "no-store", signal: AbortSignal.timeout(8_000) });
        if (!cancelled) setOffline(!res.ok);
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

  if (!offline) return null;

  return (
    <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 backdrop-blur-md">
      <p className="text-sm font-semibold text-rose-200">The app server is not responding</p>
      <p className="mt-0.5 text-xs text-rose-100/80">
        Uploads and analysis will fail until it is back. Restart the dev server, then reload this page.
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
