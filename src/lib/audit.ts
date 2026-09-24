import { SKILL_POOL as KEYWORD_POOL, WEAK_VERBS } from "./keywords";
import { hasDecorativeTail } from "./resumeQuality";

export interface WeakBullet {
  text: string;
  issues: string[];
  suggestion: string;
}

export interface ResumeAuditResult {
  score: number;
  grade: string;
  sectionsFound: string[];
  missingSections: string[];
  keywordCoverage: { term: string; found: boolean }[];
  weakBullets: WeakBullet[];
  strengths: string[];
  suggestions: string[];
}

const SECTION_KEYS = [
  { id: "summary", labels: ["summary", "profile", "objective"] },
  { id: "skills", labels: ["skills", "core skills", "technical skills"] },
  { id: "experience", labels: ["experience", "work experience", "employment"] },
  { id: "projects", labels: ["projects", "project"] },
  { id: "education", labels: ["education"] },
];

const SECTION_NAMES: Record<string, string> = {
  summary: "Summary",
  skills: "Skills",
  experience: "Experience",
  projects: "Projects",
  education: "Education",
};

function hasNumber(value: string): boolean {
  return /\d/.test(value);
}

function sectionFound(text: string, id: string): boolean {
  const labels = SECTION_KEYS.find((s) => s.id === id)?.labels ?? [];
  return labels.some((label) => text.toLowerCase().includes(label));
}

function extractBullets(text: string): string[] {
  const lines = text.split(/\n+/);
  let inBulletSection = false;
  const bullets: string[] = [];
  for (const raw of lines) {
    const lower = raw.trim().toLowerCase();
    if (/^(work experience|experience|projects?)$/i.test(lower)) {
      inBulletSection = true;
      continue;
    }
    if (/^(summary|profile|objective|skills|core skills|technical skills|education|internships?)$/i.test(lower)) {
      inBulletSection = false;
      continue;
    }
    if (!inBulletSection) continue;
    const line = raw.replace(/^[-•*]\s*/, "").trim();
    if (line.length >= 18 && line.length <= 220) bullets.push(line);
  }
  return bullets;
}

function auditBullet(bullet: string): { issues: string[]; suggestion: string } | null {
  const lower = bullet.toLowerCase();
  const issues: string[] = [];
  const weakVerb = WEAK_VERBS.find((verb) => lower.includes(verb));
  if (weakVerb) issues.push(`Weak verb: "${weakVerb}"`);
  if (!hasNumber(bullet)) issues.push("No measurable result");
  if (bullet.split(/\s+/).length > 38) issues.push("Too long");
  if (/very|really|a lot|etc\.?/i.test(bullet)) issues.push("Vague filler");
  // "..., streamlining workflows" tells a reader nothing; the fact should be
  // the end of the sentence instead.
  if (hasDecorativeTail(bullet)) issues.push("Ends with a decorative '-ing' clause");
  if (issues.length === 0) return null;

  let suggestion = "Rewrite as: [Strong verb] + [what you did] + [how] + [result/number].";
  if (!hasNumber(bullet)) suggestion += " Add a metric, percentage, time saved, users served, or revenue impact.";
  if (weakVerb) suggestion = `Replace "${weakVerb}" with a strong action verb: Built, Led, Shipped, Reduced, Increased, Designed. ` + suggestion;
  return { issues, suggestion };
}

export function auditResume(resumeText: string, jobDescription = ""): ResumeAuditResult {
  const text = resumeText.trim();
  const jdLower = jobDescription.toLowerCase();
  const sectionsFound = SECTION_KEYS.filter((s) => sectionFound(text, s.id)).map((s) => SECTION_NAMES[s.id]);
  const missingSections = SECTION_KEYS.filter((s) => !sectionFound(text, s.id)).map((s) => SECTION_NAMES[s.id]);

  const bullets = extractBullets(text);
  const weakBullets: WeakBullet[] = [];
  for (const bullet of bullets.slice(0, 12)) {
    const audit = auditBullet(bullet);
    if (audit) weakBullets.push({ text: bullet, issues: audit.issues, suggestion: audit.suggestion });
  }

  const keywordCoverage = KEYWORD_POOL.filter((term) => {
    const lower = term.toLowerCase();
    return jdLower.includes(lower) || text.toLowerCase().includes(lower);
  })
    .slice(0, 16)
    .map((term) => ({ term, found: text.toLowerCase().includes(term.toLowerCase()) }));

  let score = 38;
  score += sectionsFound.length * 8;
  score += weakBullets.length === 0 ? 18 : Math.max(0, 12 - weakBullets.length * 4);
  const covered = keywordCoverage.filter((k) => k.found).length;
  score += Math.min(12, covered * 2);
  if (text.length < 250) score -= 8;
  if (text.length > 1200) score += 3;
  score = Math.max(5, Math.min(95, score));

  const strengths: string[] = [];
  if (sectionFound(text, "experience")) strengths.push("Experience section detected");
  if (sectionFound(text, "skills")) strengths.push("Skills section detected");
  if (sectionFound(text, "projects")) strengths.push("Projects section detected");
  if (sectionFound(text, "education")) strengths.push("Education section detected");
  if (bullets.some(hasNumber)) strengths.push("At least one quantified bullet");
  if (strengths.length === 0) strengths.push("Resume text is present");

  const suggestions: string[] = [];
  if (missingSections.length) suggestions.push(`Add: ${missingSections.join(", ")}`);
  if (weakBullets.length) suggestions.push(`Fix ${weakBullets.length} weak bullet${weakBullets.length === 1 ? "" : "s"}`);
  if (keywordCoverage.some((k) => !k.found)) {
    const missing = keywordCoverage.filter((k) => !k.found).map((k) => k.term).slice(0, 6);
    suggestions.push(`Reflect these target terms where true: ${missing.join(", ")}`);
  }
  if (suggestions.length === 0) suggestions.push("Structure is solid; tighten metrics and remove filler.");

  const grade = score >= 80 ? "Strong" : score >= 60 ? "Good" : "Needs work";
  return {
    score,
    grade,
    sectionsFound,
    missingSections,
    keywordCoverage,
    weakBullets,
    strengths,
    suggestions,
  };
}
