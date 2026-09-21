"use client";

import { useState } from "react";
import type { SavedJob } from "@/lib/store";
import { drawStatCard } from "@/lib/statCard";

function reached(statuses: string[], jobs: SavedJob[]) {
  return jobs.filter((j) => statuses.includes(j.status));
}

export default function ShareStatCard({ jobs }: { jobs: SavedJob[] }) {
  const [done, setDone] = useState(false);

  if (jobs.length === 0) return null;

  function download() {
    const applied = reached(["applied", "interview", "offer", "rejected"], jobs).length;
    const interviews = reached(["interview", "offer"], jobs).length;
    const offers = reached(["offer"], jobs).length;
    const scored = jobs.filter((j) => j.result);
    const avgMatch = scored.length
      ? Math.round(scored.reduce((sum, j) => sum + (j.result?.overallScore ?? 0), 0) / scored.length)
      : null;

    const canvas = document.createElement("canvas");
    drawStatCard(canvas, { applied, interviews, offers, jobs: jobs.length, avgMatch });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-job-search.png";
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    }, "image/png");
  }

  return (
    <button
      type="button"
      onClick={download}
      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
    >
      {done ? "Saved ✓" : "⬇ Download stat card"}
    </button>
  );
}
