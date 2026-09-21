"use client";

import { useRef, useState } from "react";

const ACCEPTED = ".pdf,.docx,.txt,.md";
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

interface Props {
  file: File | null;
  onFile: (file: File | null) => void;
}

export default function FileDropzone({ file, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function accept(files: FileList | null) {
    setError(null);
    const candidate = files?.[0];
    // Reset so picking the same file again still fires onChange.
    if (inputRef.current) inputRef.current.value = "";
    if (!candidate) return;
    const ok =
      candidate.type === "application/pdf" ||
      /\.(pdf|docx|txt|md)$/i.test(candidate.name);
    if (!ok) {
      setError("Please upload a PDF, DOCX, TXT, or MD file.");
      return;
    }
    if (candidate.size > MAX_BYTES) {
      setError("File is larger than 15 MB.");
      return;
    }
    onFile(candidate);
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload resume"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          accept(e.dataTransfer.files);
        }}
        className={`flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
          dragging
            ? "border-brand-500 bg-brand-50"
            : "border-slate-300 bg-white hover:border-brand-500 hover:bg-brand-50/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => accept(e.target.files)}
        />

        {file ? (
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
            </span>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-800">{file.name}</p>
              <p className="text-xs text-slate-500">
                {(file.size / 1024).toFixed(1)} KB · click to replace
              </p>
            </div>
          </div>
        ) : (
          <>
            <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 16V4m0 0 4 4m-4-4-4 4" />
                <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
              </svg>
            </span>
            <p className="text-sm font-semibold text-slate-800">
              Drop your resume here, or <span className="text-brand-600 underline">browse</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">PDF, DOCX, TXT, or MD · up to 15 MB</p>
          </>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        {error ? (
          <p className="text-xs font-medium text-rose-600">{error}</p>
        ) : (
          <p className="text-xs text-slate-400">
            Your resume is only used for this analysis and is never stored.
          </p>
        )}
        {file && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="text-xs font-medium text-slate-400 hover:text-rose-600"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
