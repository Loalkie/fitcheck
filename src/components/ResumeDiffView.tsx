"use client";

import type { ResumeOptimization } from "@/lib/types";
import { useDialog } from "./Dialogs";

export default function ResumeDiffView({
  optimizations,
}: {
  optimizations?: ResumeOptimization[];
}) {
  const items = optimizations ?? [];
  const { notify } = useDialog();

  if (items.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
        本次未发现需要优化的句子
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {items.map((opt, index) => (
        <div key={index} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          {opt.section && <p className="mb-3 text-sm font-bold text-white">{opt.section}</p>}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-rose-500/20 border-l-2 border-l-rose-500 bg-rose-500/5 p-3">
              <p className="text-sm leading-relaxed text-rose-100/90">{opt.before || "—"}</p>
            </div>
            <div className="flex flex-col rounded-lg border border-cyan-500/20 border-l-2 border-l-cyan-400 bg-cyan-500/5 p-3">
              <p className="flex-1 text-sm leading-relaxed text-cyan-50">{opt.after || "—"}</p>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(opt.after);
                    notify("已复制修改后的句子");
                  }}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:border-cyan-500/50 hover:bg-white/10 hover:text-white"
                >
                  覆盖原句
                </button>
              </div>
            </div>
          </div>
          {opt.reason && <p className="mt-3 text-xs text-slate-400">{opt.reason}</p>}
        </div>
      ))}
    </div>
  );
}
