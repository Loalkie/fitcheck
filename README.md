# Resume ↔ JD Fit Check

A US-market **job-search workspace**. Keep one master resume, score it against every job you're
chasing, track application status and outcomes, and see which roles actually lead to interviews —
before you apply.

Built with **Next.js 15 (App Router) + TypeScript + Tailwind CSS + SQLite (better-sqlite3)**.

## Features

- **Master resume** — upload once (PDF/DOCX/TXT/MD) and score it against unlimited jobs.
- **Per-job match reports** — overall score + skills / experience / education / ATS-readability,
  matched vs. missing keywords with evidence, strengths, risks, and suggestions.
- **Application tracking** — status per job (Saved / Applied / Interview / Offer / Rejected).
- **Profile onboarding** — multi-step questions for education, internships, skills, target roles,
  desired salary, and work preferences, with US median-salary references per target role.
- **Insights** — interview rate, average match, and score-vs-outcome attribution.
- **Shareable stat card** — one-click PNG download (Applied · Interviews · Offers) for social posts.
- **Accounts & sync** — email + password login; your workspace syncs across devices via SQLite.
- **Quick check** — one-off resume × JD analysis without saving anything.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000.

> No AI key required. Without one it uses a deterministic heuristic analyzer (labeled
> "Heuristic demo"). Set `AI_API_KEY` for real LLM analysis.

## Accounts & data

- Workspace data persists to `./.data/app.db` (SQLite, auto-created; git-ignored).
- Sessions use an httpOnly cookie (`fit_session`), passwords are hashed with `scrypt` + per-user salt.
- Until you sign in, the workspace lives in browser localStorage. Signing in syncs it to your account.
- Resumes/JDs are processed transiently for analysis and are not retained beyond what's in your workspace.

## Deploying

Everything except accounts and sync is stateless, so the app runs anywhere Next.js does. Two things are
worth knowing before you deploy to a serverless host such as Vercel:

- **The SQLite file needs a writable directory.** Vercel mounts the project directory read-only, so
  `./.data` cannot be created there. The app detects this and falls back to the system temp dir, which
  keeps uploads, analysis, the job feed and every browser-local feature working.
- **Accounts and sync are refused on temporary storage.** A database in the temp dir disappears when the
  host restarts, so `/api/auth/*` answers with an explanation instead of silently losing a synced
  workspace. To turn sync back on, point `FIT_DATA_DIR` at a durable volume (a mounted disk, or a
  container host with persistent storage). If you really want the temporary store, set
  `FIT_ALLOW_EPHEMERAL_STORAGE=1`.

Configure AI through project environment variables on the host (`AI_API_KEY`, `AI_API_URL`,
`AI_MODEL`) — the in-app integration settings live in the database and therefore need durable storage.

`/api/health` reports which mode the app is in:

```json
{ "ok": true, "db": true, "storage": "persistent" }
```

`storage` is `persistent`, `ephemeral` (temp dir) or `unavailable` (no writable directory or the
SQLite driver is missing). `ok` only tracks whether the server responded.

## Enable AI analysis

Copy `.env.example` to `.env.local`:

```bash
AI_API_KEY=sk-...
AI_API_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
```

Any OpenAI-compatible `/chat/completions` endpoint works. DeepSeek is the default provider when
`AI_API_URL` and `AI_MODEL` are not set. If the AI call fails, it falls back to the heuristic
analyzer instead of erroring.

## Project structure

```
src/
  app/
    page.tsx                     # Renders the workspace
    layout.tsx                   # Root layout + metadata
    globals.css                  # Tailwind + base styles
    api/
      analyze/route.ts           # File upload → analysis
      analyze-text/route.ts      # Text → analysis (workspace)
      parse/route.ts             # File → extracted text (master resume)
      auth/register|login|logout|me/route.ts
      workspace/route.ts         # GET/PUT synced workspace
  components/
    Workspace.tsx                # Main dashboard (client state + auth + sync)
    JobCard.tsx                  # Per-job card (score + status)
    Insights.tsx                 # Interview rate / attribution metrics
    AddJobModal.tsx              # Add-a-job form
    QuickCheckModal.tsx          # One-off analyzer
    ReportModal.tsx              # Full report + share summary
    AuthModal.tsx                # Sign in / create account
    ShareStatCard.tsx            # PNG stat-card download
    Results.tsx                  # Scores, keywords, risks, profile
    FileDropzone.tsx             # Drag-and-drop upload
    Modal.tsx                    # Shared modal shell
  lib/
    types.ts                     # Shared types
    store.ts                     # Workspace + profile types, localStorage persistence
    roles.ts                     # Curated US roles, salary ranges, skills, industries
    client.ts                    # Browser → API helpers (analysis + auth + sync)
    parse.ts                     # PDF/DOCX/TXT extraction (unpdf + mammoth)
    ai.ts                        # OpenAI-compatible client + JSON coercion
    mock.ts                      # Deterministic heuristic fallback
    analyze.ts                   # Orchestration (AI with fallback)
    db.ts                        # SQLite connection + schema
    auth.ts                      # Password hashing + sessions
    statCard.ts                  # Canvas stat-card renderer
```

## Compliance notes

- Output is advisory reference only — not a hiring decision.
- Never scores protected characteristics (age, race, gender, disability, veteran status, national
  origin, religion, family status).
- Candidates are never told to fabricate experience; missing keywords are framed as "write it
  clearly" or "close the capability gap".

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm start` — run production build
- `npm run typecheck` — TypeScript check
