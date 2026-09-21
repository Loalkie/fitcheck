"use client";

import Modal from "./Modal";
import type { ResumeVersion } from "@/lib/store";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

export default function ResumeVersionsModal({
  open,
  versions,
  hasMaster,
  onClose,
  onSave,
  onUse,
  onDelete,
}: {
  open: boolean;
  versions: ResumeVersion[];
  hasMaster: boolean;
  onClose: () => void;
  onSave: () => void;
  onUse: (v: ResumeVersion) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Resume versions">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50/50 p-3">
          <p className="text-xs text-slate-600">
            Keep tailored versions for different roles, then switch before analyzing.
          </p>
          <button
            type="button"
            onClick={onSave}
            disabled={!hasMaster}
            className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Save current
          </button>
        </div>

        {versions.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            No saved versions yet. Upload a resume, then click “Save current”.
          </p>
        ) : (
          <div className="space-y-2">
            {versions.map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{v.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {v.fileName || "Resume"} · {fmtDate(v.updatedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onUse(v)}
                    className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-700"
                  >
                    Use
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(v.id)}
                    className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
