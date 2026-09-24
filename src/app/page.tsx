import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="dark-hero relative min-h-screen overflow-hidden text-slate-100">
      <div className="hero-image" aria-hidden="true" />
      <div className="starfield" aria-hidden="true">
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="star"
            style={{
              top: `${(i * 37) % 100}%`,
              left: `${(i * 53) % 100}%`,
              animationDelay: `${(i % 7) * 0.35}s`,
            }}
          />
        ))}
        <span className="meteor" style={{ top: "16%", left: "72%", animationDelay: "0.5s" }} />
        <span className="meteor" style={{ top: "38%", left: "88%", animationDelay: "2.2s" }} />
        <span className="meteor" style={{ top: "62%", left: "58%", animationDelay: "4s" }} />
      </div>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 text-sm font-bold text-white">
            F
          </span>
          <span className="text-base font-bold tracking-tight">FitCheck</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard?auth=1" className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
            Sign in
          </Link>
          <Link href="/dashboard" className="btn-primary btn-sm">
            Open workspace
          </Link>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-6xl gap-10 px-6 pb-20 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
            Job search workspace
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Know your fit before you apply.
            <br />
            Track everything after.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            FitCheck scores your resume against any job description, finds companies and live roles that match you,
            writes tailored resumes and outreach, and keeps every application organized.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/dashboard" className="btn-primary px-5 py-2.5 text-sm">
              Start free
            </Link>
            <Link href="/pricing" className="btn-secondary px-5 py-2.5 text-sm">
              See pricing
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            No credit card required. Your resume stays yours.
          </p>
        </div>

        <div className="card3d group relative rounded-3xl border border-white/10 bg-white/10 p-6 shadow-[0_30px_80px_-40px_rgba(37,99,235,0.95)] backdrop-blur-xl">
          <span className="float-slow absolute -right-4 -top-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-3xl shadow-xl backdrop-blur-xl">🐈‍⬛</span>
          <span className="float-slower absolute -left-5 top-16 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-2xl shadow-lg backdrop-blur-xl">🔮</span>
          <span className="float-fast absolute -bottom-4 right-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-2xl shadow-lg backdrop-blur-xl">💻</span>
          <span className="float-slower absolute -right-3 bottom-16 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-xl shadow-lg backdrop-blur-xl">🌙</span>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Example report</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-8 border-emerald-100 bg-white text-xl font-bold text-emerald-600">
              83
            </div>
            <div>
              <p className="text-sm font-bold">Senior AI Engineer · Acme</p>
              <p className="text-xs text-slate-500">Strong match · 3 gaps to close</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              ["Skills", "90"],
              ["Experience", "77"],
              ["Education", "75"],
            ].map(([label, score]) => (
              <div key={label} className="rounded-xl bg-white p-3 text-center shadow-sm">
                <p className="text-lg font-bold text-slate-900">{score}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-2">
            {["Matched: Python, LLMs, AI Agents", "Missing: MCP, RAG", "Next: quantify the evaluation pipeline"].map(
              (line) => (
                <div key={line} className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  {line}
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50/60">
        <div className="mx-auto grid max-w-6xl gap-4 px-6 py-16 md:grid-cols-3">
          {[
            {
              title: "Score before you apply",
              body: "Skills, experience, education, and ATS readability — scored against the exact JD.",
            },
            {
              title: "Find companies that fit",
              body: "Real US employers, live roles, salary bands, remote policy, sponsorship, and interview process.",
            },
            {
              title: "Draft everything faster",
              body: "AI resume versions, cover letters, recruiter emails, interview prep, and follow-up reminders.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Spend less time guessing. More time applying.
        </h2>
        <p className="mt-3 text-slate-600">
          One workspace for your resume, applications, companies, outreach, interviews, and follow-ups.
        </p>
        <Link href="/dashboard" className="btn-primary mt-6 px-6 py-3 text-sm">
          Open your workspace
        </Link>
      </section>

      <section className="border-t border-slate-100 bg-slate-50/60">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">How it works</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              ["01", "Upload or build a resume", "Start from a PDF, or fill a short structured form."],
              ["02", "Score it against real roles", "Paste a JD or let FitCheck find companies and live jobs for you."],
              ["03", "Apply with a full kit", "Get tailored resume versions, cover letters, emails, and interview prep."],
            ].map(([step, title, body]) => (
              <div key={step} className="rounded-2xl border border-slate-200 bg-white p-6">
                <span className="text-xs font-bold text-brand-600">{step}</span>
                <h3 className="mt-2 text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">Built for every job seeker</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {[
            ["New grads", "Community college, bootcamp, bachelor's, or grad school."],
            ["Career changers", "Turn transferable experience into a clear new story."],
            ["Active applicants", "Track dozens of roles without losing follow-ups."],
            ["Visa seekers", "Filter by sponsorship and remote-friendly companies."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-slate-200 p-5">
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">Frequently asked questions</h2>
          <div className="mt-8 space-y-3">
            {[
              ["Is it really free?", "Yes. You can score resumes, track jobs, and use the built-in AI engine for free. Paid plans unlock unlimited usage and automation."],
              ["Do I need to upload my resume first?", "No. You can explore the landing page and product first, then upload or build a resume whenever you are ready."],
              ["Will the AI invent experience?", "No. FitCheck only reorganizes and strengthens what you provide. It never fabricates employers, degrees, or metrics."],
              ["Does it work for non-tech jobs?", "Yes. It covers business, healthcare, finance, retail, logistics, government, and many more roles."],
            ].map(([q, a]) => (
              <details key={q} className="rounded-2xl border border-slate-200 p-4">
                <summary className="cursor-pointer text-sm font-bold text-slate-900">{q}</summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-20 text-center">
        <Link href="/dashboard" className="btn-primary px-6 py-3 text-sm">
          Open your workspace
        </Link>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-400">
        <p>FitCheck is an advisory tool, not a guarantee of interviews or offers. Never fabricate experience.</p>
        <p className="mt-3 flex items-center justify-center gap-3">
          <Link href="/privacy" className="hover:text-slate-200">
            Privacy policy
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/terms" className="hover:text-slate-200">
            Terms of service
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/pricing" className="hover:text-slate-200">
            Pricing
          </Link>
        </p>
      </footer>
    </main>
  );
}
