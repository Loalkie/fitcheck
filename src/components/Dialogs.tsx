"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export interface PromptOptions {
  title: string;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface DialogValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
  notify: (message: string) => void;
}

type Request =
  | { kind: "confirm"; options: ConfirmOptions; resolve: (value: boolean) => void }
  | { kind: "prompt"; options: PromptOptions; resolve: (value: string | null) => void };

const DialogContext = createContext<DialogValue | null>(null);

/**
 * Native window.confirm / window.prompt / window.alert are unavailable in some
 * embedded browsers, where they throw "prompt() is not supported" at runtime.
 * These replacements are plain React state, so they work everywhere.
 */
export function useDialog(): DialogValue {
  const value = useContext(DialogContext);
  if (!value) throw new Error("useDialog must be used inside <DialogProvider>");
  return value;
}

export default function DialogProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<Request | null>(null);
  const [draft, setDraft] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const requestRef = useRef<Request | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<number | null>(null);

  requestRef.current = request;

  const settle = useCallback((value: boolean | string | null) => {
    const current = requestRef.current;
    if (!current) return;
    requestRef.current = null;
    if (current.kind === "confirm") current.resolve(value === true);
    else current.resolve(typeof value === "string" ? value : null);
    setRequest(null);
    setDraft("");
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setRequest({ kind: "confirm", options, resolve });
      }),
    [],
  );

  const prompt = useCallback(
    (options: PromptOptions) =>
      new Promise<string | null>((resolve) => {
        setDraft(options.defaultValue ?? "");
        setRequest({ kind: "prompt", options, resolve });
      }),
    [],
  );

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
  }, []);

  useEffect(() => {
    if (request?.kind === "prompt") inputRef.current?.focus();
  }, [request]);

  // Confirm dialogs have no focusable element by default, so bind keys globally.
  useEffect(() => {
    if (!request) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        settle(null);
      } else if (event.key === "Enter" && requestRef.current?.kind === "confirm") {
        event.preventDefault();
        settle(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [request, settle]);

  const value: DialogValue = useMemo(() => ({ confirm, prompt, notify }), [confirm, prompt, notify]);

  return (
    <DialogContext.Provider value={value}>
      {children}

      {request && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={request.options.title}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) settle(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0f19]/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <h2 className="text-sm font-bold text-white">{request.options.title}</h2>
            {"message" in request.options && request.options.message && (
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{request.options.message}</p>
            )}

            {request.kind === "prompt" && (
              <div className="mt-4">
                {request.options.label && <p className="label mb-1 text-slate-400">{request.options.label}</p>}
                <input
                  ref={inputRef}
                  value={draft}
                  placeholder={request.options.placeholder}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      settle(draft);
                    }
                  }}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                />
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => settle(null)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                {request.options.cancelLabel ?? "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => settle(request.kind === "prompt" ? draft : true)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white transition ${
                  "danger" in request.options && request.options.danger
                    ? "border border-rose-400/50 bg-rose-600/80 hover:bg-rose-500"
                    : "border border-blue-400/50 bg-blue-600/80 shadow-[0_0_15px_rgba(59,130,246,0.35)] hover:bg-blue-500"
                }`}
              >
                {request.options.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
          <div className="rounded-xl border border-cyan-500/30 bg-[#0b0f19]/95 px-4 py-2.5 text-sm text-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            {toast}
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
