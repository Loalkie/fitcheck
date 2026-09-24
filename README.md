# Resume ↔ JD Fit Check

A US-market **job-search workspace**. Keep one master resume, score it against every job you're
chasing, track application status and outcomes, and see which roles actually lead to interviews —
before you apply.

Built with **Next.js 15 (App Router) + TypeScript + Tailwind CSS + Postgres/SQLite**.

## Features

- **Master resume** — upload once (PDF/DOCX/TXT/MD) and score it against unlimited jobs.
- **Per-job match reports** — overall score + skills / experience / education / ATS-readability,
  matched vs. missing keywords with evidence, strengths, risks, and suggestions.
- **Application tracking** — status per job (Saved / Applied / Interview / Offer / Rejected).
- **Profile onboarding** — multi-step questions for education, internships, skills, target roles,
  desired salary, and work preferences, with US median-salary references per target role.
- **Insights** — interview rate, average match, and score-vs-outcome attribution.
- **Shareable stat card** — one-click PNG download (Applied · Interviews · Offers) for social posts.
- **Accounts & sync** — email + password login; your workspace syncs across devices via Postgres or SQLite.
- **Account recovery** — password reset by email, optional email verification, and account deletion from Settings.
- **Browser extension** — Chrome MV3 assistant in `extension/`; it points at any deployment from its popup.
- **Legal pages** — `/privacy` and `/terms` cover the AI provider, Stripe, cookies and account deletion.
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

- Workspace data persists to Postgres when `DATABASE_URL` (or the `POSTGRES_URL` a Vercel/Neon
  integration injects) is set, otherwise to `./.data/app.db` (SQLite, auto-created; git-ignored).
- Sessions use an httpOnly + `Secure` cookie (`fit_session`), passwords are hashed with `scrypt` + per-user salt.
- Only accounts listed in `ADMIN_EMAILS` can read or change the site-wide integration keys
  (AI provider, Stripe, job feeds). Everyone else can use the app, but not the key store.
- Anonymous AI requests are rate limited per IP; signed-in requests are limited per account. Counters live in the
  same database, so limits hold across serverless instances.
- Paid plans are only ever granted by the signed-in Stripe webhook; `/api/billing` can only drop a user to Free.
- Until you sign in, the workspace lives in browser localStorage. Signing in syncs it to your account.
- Resumes/JDs are processed transiently for analysis and are not retained beyond what's in your workspace.
- Session and extension tokens are stored as SHA-256 digests, and password-reset / verification links are
  single-use and hashed, so a database dump does not hand over working logins.
- The schema is applied by ordered migrations in `src/lib/migrations.ts`; an existing database is upgraded in
  place on the next request, with indexes on the columns the queries actually filter by.
- Password reset and email verification need an email provider (`MAIL_API_KEY`, Resend by default); without one
  those endpoints answer 503 instead of silently doing nothing.

## Search engines

`/robots.txt` and `/sitemap.xml` are generated from `src/lib/site.ts`. The landing page, `/pricing`, `/privacy`
and `/terms` are indexable; everything behind the app shell is listed in `WORKSPACE_ROUTES` and disallowed, and
those pages also carry `<meta name="robots" content="noindex">` through the `(app)` layout. Add a new workspace
page to `WORKSPACE_ROUTES` — a test fails if you forget.

## Tests and CI

```bash
npm run verify        # typecheck + build + tests
npm test              # integration tests only (needs a build first)
```

The suite in `tests/` boots the real production server (`.next`) against a throwaway SQLite directory and a
stub mail provider, then drives it over HTTP: the account lifecycle (register → verify → reset → delete),
access control on billing and the key store, rate limits, and the crawler-facing files. `.github/workflows/ci.yml`
runs typecheck, build and tests on every push to `main` and every pull request.

## Storage backends

One is picked at runtime, no configuration beyond the connection string:

- **Postgres** when `DATABASE_URL`, `POSTGRES_URL`, `POSTGRES_PRISMA_URL` or `POSTGRES_URL_NON_POOLING`
  is set — any Postgres (Vercel Postgres, Neon, Supabase, self-hosted). The schema is created on first query.
- **SQLite** (`better-sqlite3`) otherwise, at `FIT_DATA_DIR`, `./.data`, or the system temp dir —
  whichever is writable first.

## Deploying

Everything except accounts and sync is stateless, so the app runs anywhere Next.js does. On a
serverless host such as Vercel the project directory is read-only and the temp dir is wiped whenever
the instance restarts, so:

- Uploads, analysis, the job feed and everything the browser stores keep working with no database at
  all — the SQLite file simply falls back to the temp dir.
- **Accounts and workspace sync need Postgres.** Add one from the Vercel dashboard (Storage →
  Postgres/Neon) and the integration injects `POSTGRES_URL`/`DATABASE_URL`; nothing else to change.
  Without it, `/api/auth/*` explains that sync is off instead of storing an account somewhere it would
  disappear from.
- `FIT_ALLOW_EPHEMERAL_STORAGE=1` allows accounts on temporary storage anyway (data is lost when the
  host restarts).

`/api/health` reports what the app is using:

```json
{ "ok": true, "db": true, "storage": "persistent", "backend": "postgres" }
```

`storage` is `persistent`, `ephemeral` (temp dir) or `unavailable` (no writable directory or the
driver is missing); `backend` is `postgres`, `sqlite` or `none`. `ok` only tracks whether the server
responded.

Configure AI through project environment variables on the host (`AI_API_KEY`, `AI_API_URL`,
`AI_MODEL`) — the in-app integration settings live in the database and therefore need durable storage.

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
      auth/forgot-password|reset-password/route.ts   # reset by email
      auth/send-verification|verify-email/route.ts   # confirm the address
      auth/delete-account/route.ts                   # account deletion
      billing/webhook/route.ts                       # Stripe → plan changes
      billing/portal/route.ts                        # cancel / update card
      workspace/route.ts         # GET/PUT synced workspace
  components/
    Workspace.tsx                # Main dashboard (client state + auth + sync)
    JobCard.tsx                  # Per-job card (score + status)
    Insights.tsx                 # Interview rate / attribution metrics
    AddJobModal.tsx              # Add-a-job form
    QuickCheckModal.tsx          # One-off analyzer
    ReportModal.tsx              # Full report + share summary
    AuthModal.tsx                # Sign in / create account / reset link
    ShareStatCard.tsx            # PNG stat-card download
    Results.tsx                  # Scores, keywords, risks, profile
    FileDropzone.tsx             # Drag-and-drop upload
    Modal.tsx                    # Shared modal shell
  lib/
    types.ts                     # Shared types
    store.ts                     # Workspace + profile types, localStorage persistence
    roles.ts                     # Curated US roles, salary ranges, skills, industries
    client.ts                    # Browser → API helpers (analysis + auth + sync)
    migrations.ts                # Ordered schema migrations for both engines
    mailer.ts                    # Transactional email over an HTTP API
    site.ts                      # Public origin + indexable/workspace routes
    parse.ts                     # PDF/DOCX/TXT extraction (unpdf + mammoth)
    ai.ts                        # OpenAI-compatible client + JSON coercion
    mock.ts                      # Deterministic heuristic fallback
    analyze.ts                   # Orchestration (AI with fallback)
    db.ts                        # Storage: Postgres when configured, else SQLite
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
- `npm test` — integration tests against a built server
- `npm run verify` — typecheck, build and tests in one go
