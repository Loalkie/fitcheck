import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function CyberCard({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl bg-gradient-to-br from-cyan-500/30 via-white/5 to-purple-500/20 p-px transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(6,182,212,0.1)] ${className}`}
      {...props}
    >
      <div className="rounded-xl border border-white/5 bg-[#0b0f19]/80 p-5 backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}

export function GlowButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`rounded-lg border border-blue-400/50 bg-blue-600/80 px-4 py-2 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700/60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-slate-200 transition-all hover:border-cyan-500/50 hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:bg-white/[0.02] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function GradientNumber({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`bg-gradient-to-r from-white to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(6,182,212,0.4)] ${className}`}
    >
      {children}
    </span>
  );
}

export function CyberTag({
  children,
  tone = "cyan",
  className = "",
}: {
  children: ReactNode;
  tone?: "cyan" | "purple" | "pink" | "blue";
  className?: string;
}) {
  const tones = {
    cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
    purple: "border-purple-500/20 bg-purple-500/10 text-purple-300",
    pink: "border-pink-500/20 bg-pink-500/10 text-pink-300",
    blue: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export const cyberInputCls =
  "rounded-lg border border-white/10 bg-white/[0.03] text-white placeholder-slate-500 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30";
