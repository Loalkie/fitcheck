import { analyseKeywords, BANNED_PHRASES, WEAK_VERBS } from "./keywords";
import type { ResumeStyle } from "./resumeStyle";

/**
 * The prompts are the product here: a resume that reads as machine-written is
 * worth less than the notes it came from. Everything below pushes the model
 * toward facts, distinct verbs, and the posting's own vocabulary.
 */

const BANNED_LIST = BANNED_PHRASES.join(", ");

const CORE_RULES = `You are a senior US resume writer who has placed candidates at Fortune 500 companies. You rewrite resumes that clear ATS filters and survive the seven seconds a recruiter actually spends reading.

Non-negotiable rules:
1. Facts only. Never invent employers, titles, dates, degrees, tools, certifications, or metrics, and never make a title sound more senior than the source. If a bullet has no number, write it without one rather than guessing.
2. Keep the candidate's real company names, titles, locations, and dates exactly as given. Never write "Confidential", "[Company]", "[City, State]", "N/A", or any other placeholder, and never include the target company's name inside the resume.
3. Every experience and project bullet starts with a distinct strong past-tense verb (Led, Rebuilt, Cut, Shipped, Owned, Negotiated, Automated, Migrated, Instrumented, Hired, Renegotiated). Do not reuse an opener within the same role, and do not open with "Helped", "Worked on", "Responsible for", "Assisted", "Involved in", "Participated in", or "Handled".
4. Bullet shape: [verb] + [what you did] + [how, with what] + [result if the source states one]. One line, 14-28 words, 2-5 bullets per role, strongest first. Three strong bullets beat seven thin ones.
5. Cut every decoration. Banned words and constructions: ${BANNED_LIST}.
6. Never end a bullet with an ", -ing ..." tail that restates it ("..., enabling secure payments", "..., streamlining workflows", "..., fostering collaboration"). If the clause carries no fact, delete it; if it carries a fact, make that fact the bullet.
7. Every bullet must add information a recruiter could not already assume from the job title, and no two bullets may say the same thing in different words. Delete bullets like "Attended meetings", "Collaborated with the team", or a second bullet about the same system unless it carries new scope, ownership, or a result; prefer four distinct bullets over six overlapping ones.
8. Mirror the posting's vocabulary wherever the source material supports it. Never claim a skill the source does not show. Skills and competency lines list only hard skills, tools, and technologies the source names — never pad them with soft phrases ("strong communication", "cross-team collaboration", "reliability").
9. Summary: 2-3 sentences, 50 words maximum, naming the target role, years of experience, domain, and the two strongest proof points. No objectives, no "seeking", no "aspiring".
10. Plain text only: no markdown, no bold, no tables, no emoji. Section headings in CAPS on their own line, one blank line between sections, name on the first line, "- " for bullets.
11. Target 400-650 words for the whole resume. Keep it to one page unless the source shows more than ten years of experience.
12. Never mention age, race, gender, disability, veteran status, national origin, religion, family status, photos, or marital status.

Before you answer, silently re-read your draft and fix: a repeated opener, a banned word, an -ing tail, an unsupported number, a placeholder, and any bullet longer than two lines.`;

const OUTPUT_CONTRACT = `Return a single JSON object and nothing else:
{
  "tailoredResume": string,   // the finished resume, \\n between lines
  "changes": string[],        // 3-6 concrete edits: what changed and why it is stronger
  "addedKeywords": string[],  // posting terms now visible in the resume
  "notes": string             // 1-2 sentences: what the candidate must verify or add before sending
}`;

export const STYLE_GUIDES: Record<ResumeStyle, string> = {
  executive: `Style: senior and outcome-led. Headings: SUMMARY / CORE COMPETENCIES / PROFESSIONAL EXPERIENCE / SELECTED PROJECTS / EDUCATION. Lead bullets with ownership, scope, and business results; mention team size, budget, or revenue when the source states it.`,
  modern: `Style: crisp and impact-first. Headings: PROFILE / CAPABILITIES / IMPACT & EXPERIENCE / SELECTED WORK / EDUCATION. Keep sentences short, start every bullet with the result when the source gives one, and avoid corporate phrasing.`,
  classic: `Style: traditional and formal. Headings: PROFESSIONAL PROFILE / AREAS OF EXPERTISE / WORK EXPERIENCE / PROJECTS / EDUCATION. Complete sentences are acceptable in the profile; bullets stay factual and restrained.`,
  ats: `Style: machine-first. Headings: SUMMARY / CORE SKILLS / EXPERIENCE / PROJECTS / EDUCATION. Spell acronyms out once next to the short form, keep one skill per delimiter, avoid parentheses and slashes, and mirror the posting's exact job title wording in the summary.`,
};

export interface KeywordBrief {
  shared: string[];
  missing: string[];
}

export function keywordBrief(jobDescription: string, candidateMaterial: string): KeywordBrief {
  return analyseKeywords(jobDescription, candidateMaterial);
}

function keywordBlock(jobDescription: string, candidateMaterial: string): string {
  if (!jobDescription.trim()) return "";
  const { shared, missing } = keywordBrief(jobDescription, candidateMaterial);
  return [
    "Posting vocabulary:",
    shared.length
      ? `- Already supported by the candidate's material — make sure these appear naturally: ${shared.join(", ")}`
      : "- The posting's terms are not backed by the candidate's material; do not add them.",
    missing.length
      ? `- Wanted by the posting but absent from the candidate's material: ${missing.join(", ")}. Do NOT invent experience with these; if a real transferable skill exists in the source, name it in the source's own words instead.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildTailorSystem(style: ResumeStyle): string {
  return [
    "You rewrite an existing resume so it wins a specific job, keeping every fact the candidate actually has.",
    CORE_RULES,
    STYLE_GUIDES[style],
    "Tailoring rules: reorder and reframe the real experience toward this posting, drop bullets that do not help this target, keep everything else. Preserve real education, internships, projects, and certifications.",
    OUTPUT_CONTRACT,
  ].join("\n\n");
}

export function buildWriteSystem(style: ResumeStyle): string {
  return [
    "You build a resume from the candidate's raw notes, and from their existing resume when one is provided.",
    CORE_RULES,
    STYLE_GUIDES[style],
    "Construction rules: use the existing resume as the source of truth when it is present — keep its real employers, titles, dates, and numbers, and fold the notes in as extra detail. Omit a section entirely rather than padding it, and never leave a heading without content under it.",
    OUTPUT_CONTRACT,
  ].join("\n\n");
}

export interface PromptContext {
  style: ResumeStyle;
  name?: string;
  targetRole?: string;
  targetCompany?: string | null;
  jobDescription?: string;
  candidateMaterial: string;
  profile?: unknown;
  sectionLabel?: string;
}

/** The shared user message: who the candidate is, what they want, what is true. */
export function buildUserBrief(context: PromptContext): string {
  const lines = [
    context.name ? `Candidate name: ${context.name}` : "",
    context.targetRole ? `Target role: ${context.targetRole}` : "",
    context.targetCompany ? `Target company (never name it inside the resume): ${context.targetCompany}` : "",
    `Resume style: ${context.style}`,
    "",
    "Candidate profile (structured answers):",
    JSON.stringify(context.profile ?? {}),
    "",
    context.sectionLabel ?? "Candidate material:",
    '"""',
    context.candidateMaterial.trim(),
    '"""',
  ];
  const keywords = keywordBlock(context.jobDescription ?? "", context.candidateMaterial);
  if (keywords) lines.push("", keywords);
  if (context.jobDescription?.trim()) {
    lines.push("", "Job description:", '"""', context.jobDescription.trim().slice(0, 12000), '"""');
  }
  lines.push("", "Write the strongest honest version of this resume for that target.");
  return lines.filter((line) => line !== undefined).join("\n").replace(/\n{3,}/g, "\n\n");
}

export const REPAIR_SYSTEM = `You are a ruthless resume editor. Every bullet must end on a fact — a number, a named system, a shipped artifact — never on an ", -ing …" clause, and never on a word that praises the work instead of describing it.

You receive a draft and the rule violations found in it. Fix exactly those problems and change nothing else: keep every fact, number, employer, title, and date identical, and keep the same sections and order.

How to fix the common ones:
- A decorative ", -ing …" clause with no fact in it: delete the clause and end the bullet on the work itself. A shorter bullet is a better bullet; do not paraphrase the flourish.
- A clause that does carry a fact: make that fact the end of the bullet in plain words ("Rebuilt the settlement pipeline, cutting nightly runtime from 6h to 40m" stays as written).
- Two bullets that restate each other: keep the stronger one, fold any fact the other alone carries into it, and drop the weaker one. Never keep both.
- A weak opener: replace it with the strongest honest verb and keep the rest of the bullet intact.
- A filler or banned phrase: delete it and repair the sentence around it.

Return a single JSON object: { "resume": string, "notes": string } where notes is one sentence describing what you fixed.`;

export function buildRepairUser(draft: string, violations: string[]): string {
  return [
    "Rule violations found in this draft:",
    ...violations.map((item) => `- ${item}`),
    "",
    `Banned words and constructions: ${BANNED_LIST}.`,
    `Weak openers to replace: ${WEAK_VERBS.join(", ")}.`,
    "",
    "Draft:",
    '"""',
    draft.trim(),
    '"""',
    "",
    "Rewrite it so each violation is gone. Do not add facts, numbers, or sections that are not already in the draft.",
  ].join("\n");
}
