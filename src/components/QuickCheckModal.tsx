"use client";

import { useState } from "react";
import Modal from "./Modal";
import FileDropzone from "./FileDropzone";
import Results from "./Results";
import { analyzeText, parseFile } from "@/lib/client";
import type { AnalysisResult } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaveMaster: (fileName: string, text: string) => void;
  onSaveAsJob: (jdText: string) => void;
}

export default function QuickCheckModal({ open, onClose, onSaveMaster, onSaveAsJob }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [parsedText, setParsedText] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ master: boolean; job: boolean }>({ master: false, job: false });

  const canAnalyze = file !== null && jd.trim().length >= 40 && !loading;

  async function run() {
    if (!file) return;
    setError(null);
    setLoading(true);
    setResult(null);
    setParsedText(null);
    setSaved({ master: false, job: false });
    try {
      const parsed = await parseFile(file);
      setParsedText(parsed.text);
      const analysis = await analyzeText(parsed.text, jd);
      setResult(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Quick check" wide>
      {!result ? (
        <div className="space-y-4">
          <FileDropzone file={file} onFile={setFile} />
          <div>
            <label className="text-xs font-semibold text-slate-600">Job description</label>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              rows={7}
              placeholder="Paste the full posting…"
              className="mt-1 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
          <button
            type="button"
            onClick={run}
            disabled={!canAnalyze}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Analyzing…
              </>
            ) : (
              "Analyze"
            )}
          </button>
          <p className="text-xs text-slate-400">
            Want to track this role and your outcomes? Add it to your workspace instead.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap gap-2">
            {parsedText && !saved.master && (
              <button
                type="button"
                onClick={() => {
                  onSaveMaster(file?.name ?? "resume", parsedText);
                  setSaved((s) => ({ ...s, master: true }));
                }}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Use this resume as my master resume
              </button>
            )}
            {!saved.job && (
              <button
                type="button"
                onClick={() => {
                  onSaveAsJob(jd);
                  setSaved((s) => ({ ...s, job: true }));
                }}
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
              >
                Save this job to my workspace
              </button>
            )}
          </div>
          <Results result={result} />
        </div>
      )}
    </Modal>
  );
}
