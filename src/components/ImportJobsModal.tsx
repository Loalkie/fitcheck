"use client";

import { useRef, useState } from "react";
import Modal from "./Modal";
import { parseCsv, type CsvJobRow } from "@/lib/csv";
import { useApp } from "./AppProvider";
import type { JobStatus } from "@/lib/store";

export default function ImportJobsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { importJobs } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<CsvJobRow[]>([]);
  const [status, setStatus] = useState<JobStatus>("saved");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(0);

  function reset() {
    setRows([]);
    setFileName("");
    setError(null);
    setDone(0);
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    setError(null);
    setDone(0);
    setFileName(file.name);
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        setRows([]);
        setError("Could not find a title/role and company column. Check your CSV headers.");
        return;
      }
      setRows(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that CSV.");
    }
  }

  function submit() {
    if (rows.length === 0) return;
    const count = importJobs(
      rows.map((r) => ({
        title: r.title,
        company: r.company,
        url: r.url,
        location: r.location,
        salary: r.salary,
        notes: r.notes,
        contacts: [],
        jdText:
          r.jdText ||
          `Role: ${r.title}\nCompany: ${r.company}\nLocation: ${r.location || "United States"}\n\nPaste the full job description after import.`,
      })),
      status,
    );
    setDone(count);
    setRows([]);
    setFileName("");
  }

  function close() {
    reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={close} title="Import jobs from CSV" wide>
      <div className="space-y-4">
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-5 text-center">
          <p className="text-sm font-semibold text-slate-800">Upload a CSV export</p>
          <p className="mx-auto mt-1 max-w-lg text-xs leading-relaxed text-slate-500">
            We auto-detect common headers like <code>Title/Role</code>, <code>Company</code>, <code>Location</code>,
            <code>Salary</code>, <code>URL</code>, <code>Status</code>, and <code>Job Description</code>.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
          />
          <button type="button" onClick={() => inputRef.current?.click()} className="btn-primary btn-sm mt-4">
            Choose CSV file
          </button>
        </div>

        {fileName && <p className="text-xs text-slate-500">File: {fileName}</p>}

        {rows.length > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">{rows.length} rows detected</p>
                <p className="text-xs text-slate-500">First row preview below.</p>
              </div>
              <select value={status} onChange={(e) => setStatus(e.target.value as JobStatus)} className="field max-w-48">
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Role</th>
                    <th className="px-3 py-2 font-semibold">Company</th>
                    <th className="px-3 py-2 font-semibold">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 20).map((r, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-700">{r.title}</td>
                      <td className="px-3 py-2 text-slate-700">{r.company}</td>
                      <td className="px-3 py-2 text-slate-500">{r.location || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button type="button" onClick={submit} className="btn-primary w-full">
              Import {rows.length} job{rows.length === 1 ? "" : "s"}
            </button>
          </>
        )}

        {done > 0 && (
          <p className="rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-700">
            Imported {done} job{done === 1 ? "" : "s"} into your pipeline.
          </p>
        )}
        {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
      </div>
    </Modal>
  );
}
