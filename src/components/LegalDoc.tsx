import Link from "next/link";
import type { ReactNode } from "react";

interface DocProps {
  title: string;
  summary: string;
  updated: string;
  children: ReactNode;
}

/** Shared frame for the privacy policy and the terms of service. */
export function LegalDoc({ title, summary, updated, children }: DocProps) {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link href="/" className="text-sm font-semibold text-white/90 hover:text-white">
          ← FitCheck
        </Link>
        <span className="text-xs text-white/60">Last updated {updated}</span>
      </div>
      <article className="card p-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">{summary}</p>
        <div className="mt-6 space-y-6">{children}</div>
      </article>
      <p className="mt-6 text-center text-xs text-white/50">
        <Link href="/privacy" className="hover:text-white/80">
          Privacy policy
        </Link>
        {" · "}
        <Link href="/terms" className="hover:text-white/80">
          Terms of service
        </Link>
      </p>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
