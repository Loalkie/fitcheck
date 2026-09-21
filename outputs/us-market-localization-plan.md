# US-Market Localization Plan — Resume × JD Match Checker

Goal: take the Chinese "pre-submission resume–job fit check" and ship it for the US market without turning it into a resume inflater. The core product promise stays the same: show candidates what the job needs, what they've proven, and what's missing — *before* they apply.

## 1. Positioning

- **One-liner:** "Check your resume against a job description before you apply — see your match score, missing skills, and risk flags."
- **Angle:** "Fit check, not beautifier." Lead with honesty: evidence over keyword stuffing. This is the differentiator vs. Jobscan, Teal, Resume Worded, Rezi, Kickresume, and Huntr, which mostly optimize wording and ATS pass rates.
- **Audiences:**
  - Primary: US tech job seekers (SWE, AI/ML, product, data, design) applying on LinkedIn/Indeed/company portals.
  - Secondary: career coaches, bootcamps, and outplacement services (B2B license).
- **Free hook:** one free full report to prove value; paid tier for unlimited scans, revision history, and targeted-JD tracking.

## 2. Inputs & Parsing (US-specific)

- Accept PDF and DOCX (US candidates commonly export both). Optionally pull from a pasted LinkedIn profile URL.
- Handle common US resume layouts that break naive parsers: two-column layouts, headers/footers with contact info, tables, icons, and "ATS-unfriendly" designs.
- Parse English JDs from LinkedIn, Indeed, Greenhouse, Lever, Ashby, Workday, and Greenhouse/Ashby job pages. Normalize section headers: "Requirements", "Must-have", "Nice to have", "Preferred qualifications", "What you'll do", "About the role", "Compensation & benefits".

## 3. Scoring Model Localization

Keep the original three sub-scores, then add a fourth that is unique to the US market.

- **Skill match rate** — keyword + synonym + embedding similarity, weighted by "must-have vs. nice-to-have" and seniority level.
- **Experience match rate** — years of experience, scope (team size, ownership), quantified impact ("cut latency 40%", "led 5 engineers"), and domain overlap.
- **Education match rate** — degree type, field, and certifications. Treat degree *tier* as a soft signal only, never a hard filter.
- **ATS readability score (new, US-specific)** — detects layouts that break applicant tracking systems: columns, tables, images, headers/footers, unusual fonts. This is a common, concrete reason US candidates get filtered out before a human ever reads the resume.

Important: never score protected characteristics (age, race, gender, disability, veteran status, national origin, family status, etc.). Only job-related factors should drive the score.

## 4. US-Specific Risk Flags

- ATS parsing failures (tables, multi-column, header/footer contact info, embedded images).
- Keyword stuffing without supporting evidence (flag it explicitly — this is the anti-pattern we're trying to avoid).
- Employment gaps — neutral framing: "consider proactively explaining this period" rather than discouraging.
- Over- or under-qualification relative to seniority signals in the JD.
- Missing quantified outcomes ("improved X" without numbers).
- Resume length vs. role level (1 page for early-career, 2 pages for senior/10+ years).
- Work-authorization signals only when the JD explicitly mentions sponsorship; keep language neutral and factual. Never advise or imply discrimination.

## 5. Compliance & Legal (US)

- **EEOC / anti-discrimination:** the tool is candidate-facing and advisory, but keep scoring strictly job-related. Do not collect or score protected-class data. Add a clear disclaimer that output is not a hiring decision.
- **Automated employment decision tools:** be aware of NYC Local Law 144 and similar state laws. This tool currently targets candidates, not employers doing automated screening — keep that boundary explicit in the Terms of Service.
- **Privacy:** resumes contain PII. Encrypt at rest, allow instant deletion, and default to *not* training models on user resumes. Cover CCPA/CPRA and GDPR (EU applicants). Publish a privacy policy and consent flow.
- **Disclaimers:** "Reference only. Not a guarantee of interview, offer, or eligibility. Not affiliated with any employer or ATS."

## 6. Tech Stack

- Keep Next.js (App Router) as the framework.
- Model layer: pluggable (GPT-4o / Claude Sonnet); JSON-schema outputs for score, matched/unmatched keywords, strengths, risks, suggestions, and candidate profile.
- PDF/DOCX extraction: `unstructured` or `pdfplumber` + `mammoth`.
- Embeddings for keyword/semantic matching; store in Postgres + pgvector.
- Auth: Clerk or NextAuth; billing: Stripe (freemium); hosting: Vercel.
- Optional browser extension: scan a JD on LinkedIn/Indeed and run the match in one click.

## 7. Go-to-Market

- **Landing page:** English-first, US pricing ($0 free / ~$19–49/mo Pro), ROI framing ("know before you apply").
- **Channels:** Product Hunt launch, LinkedIn and X/Twitter content, Reddit (`r/resumes`, `r/jobs`, `r/cscareerquestions`), and YouTube Shorts/TikTok demo videos.
- **SEO:** target "resume vs job description checker", "ATS resume score", "why am I not getting interviews", "resume keyword match".
- **Content marketing:** "How to actually read a job description", "What ATS actually filters for", "Why your resume gets rejected before a human sees it".

## 8. Launch Checklist

1. English UI + US resume/JD parser coverage.
2. Four-score model (skills, experience, education, ATS readability).
3. Matched/unmatched keywords + strengths/risks/suggestions + candidate profile.
4. Compliance pass: disclaimers, privacy policy, no protected-class scoring, delete-on-request.
5. Stripe + auth + a single free full report.
6. Product Hunt + LinkedIn + Reddit launch, with one real US job posting used as the demo.
